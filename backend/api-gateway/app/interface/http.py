from __future__ import annotations

import asyncio
import json
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from shared.models import VehicleState
from shared.resilience import CircuitBreaker, CircuitBreakerOpenError

from app.application.agent_chat import run_agent_chat
from app.application.query_vehicle_state import query_vehicle_state
from app.infrastructure.anthropic_client import AnthropicChatModel
from app.infrastructure.config import settings
from app.infrastructure.ingestion_client import IngestionServiceClient


class AppState:
    ingestion_client: IngestionServiceClient
    chat_model: AnthropicChatModel


state = AppState()
logger = logging.getLogger("api-gateway")


@asynccontextmanager
async def lifespan(_: FastAPI):
    ingestion_breaker = CircuitBreaker(
        failure_threshold=settings.ingestion_breaker_failure_threshold,
        reset_timeout_seconds=settings.ingestion_breaker_reset_timeout_seconds,
    )
    anthropic_breaker = CircuitBreaker(
        failure_threshold=settings.anthropic_breaker_failure_threshold,
        reset_timeout_seconds=settings.anthropic_breaker_reset_timeout_seconds,
    )
    state.ingestion_client = IngestionServiceClient(settings.ingestion_service_url, ingestion_breaker)
    state.chat_model = AnthropicChatModel(settings.anthropic_api_key, settings.anthropic_model, anthropic_breaker)

    yield

    await state.ingestion_client.aclose()


app = FastAPI(title="api-gateway", lifespan=lifespan)


@app.get("/healthz")
async def healthz() -> dict:
    return {"status": "ok"}


@app.get("/v1/vehicles/state", response_model=list[VehicleState])
async def get_vehicles_state() -> list[VehicleState]:
    try:
        return await query_vehicle_state(state.ingestion_client)
    except CircuitBreakerOpenError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="ingestion-service no responde en este momento (circuit breaker abierto)",
        ) from exc


async def _vehicle_stream_tick() -> str:
    """Un unico evento SSE con el estado de la flota, o un evento de error legible."""
    try:
        states = await query_vehicle_state(state.ingestion_client)
        payload = [s.model_dump(mode="json") for s in states]
        return f"data: {json.dumps(payload)}\n\n"
    except CircuitBreakerOpenError:
        return (
            "event: stream-error\n"
            f"data: {json.dumps({'message': 'ingestion-service no responde (circuit breaker abierto)'})}\n\n"
        )
    except Exception:  # noqa: BLE001 - un tick fallido no debe cerrar la conexion SSE
        logger.exception("vehicle stream tick failed")
        return (
            "event: stream-error\n"
            f"data: {json.dumps({'message': 'error obteniendo el estado de la flota'})}\n\n"
        )


async def _vehicle_event_stream():
    while True:
        yield await _vehicle_stream_tick()
        await asyncio.sleep(settings.vehicle_stream_interval_seconds)


@app.get("/v1/vehicles/stream")
async def get_vehicles_stream() -> StreamingResponse:
    return StreamingResponse(_vehicle_event_stream(), media_type="text/event-stream")


class ChatRequest(BaseModel):
    message: str


def _sse_event(data: str) -> str:
    return f"data: {json.dumps({'text': data})}\n\n"


async def _chat_event_stream(message: str):
    try:
        answer = await run_agent_chat(message, state.chat_model, state.ingestion_client)
    except CircuitBreakerOpenError:
        yield _sse_event(
            "No puedo consultar el estado de la flota o al asistente de IA en este momento "
            "(circuit breaker abierto). Intenta de nuevo en unos segundos."
        )
        yield "event: done\ndata: {}\n\n"
        return
    except Exception:  # noqa: BLE001 - cualquier falla del modelo o de ingestion-service degrada a un mensaje, no un stream roto
        logger.exception("agent chat failed")
        yield _sse_event(
            "Ocurrio un error consultando al asistente de IA. Intenta de nuevo en unos momentos."
        )
        yield "event: done\ndata: {}\n\n"
        return

    for word in answer.split(" "):
        yield _sse_event(word + " ")
    yield "event: done\ndata: {}\n\n"


@app.post("/v1/agent/chat")
async def post_agent_chat(payload: ChatRequest) -> StreamingResponse:
    return StreamingResponse(_chat_event_stream(payload.message), media_type="text/event-stream")
