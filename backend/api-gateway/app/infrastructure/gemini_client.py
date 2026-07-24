"""Adaptador del SDK oficial de Gemini (google-genai) para ChatModelPort.

Traduce en la frontera del adapter entre el formato normalizado de mensajes/
tools (bloques al estilo Anthropic: role/content con tipos text, tool_use,
tool_result) que usa app/application/agent_chat.py y las estructuras propias
de Gemini (Content/Part/FunctionCall/FunctionResponse). La capa de aplicacion
no conoce ni Anthropic ni Gemini: solo conoce ChatModelPort y ModelTurn.
"""

from __future__ import annotations

import json
from typing import Any

from google import genai
from google.genai import types
from shared.resilience import CircuitBreaker

from app.application.ports import ModelTurn


def _tool_names_by_call_id(messages: list[dict]) -> dict[str, str]:
    names: dict[str, str] = {}
    for message in messages:
        content = message.get("content")
        if not isinstance(content, list):
            continue
        for block in content:
            if block.get("type") == "tool_use":
                names[block["id"]] = block["name"]
    return names


def _to_gemini_contents(messages: list[dict]) -> list[types.Content]:
    call_names = _tool_names_by_call_id(messages)
    contents: list[types.Content] = []

    for message in messages:
        role = "model" if message["role"] == "assistant" else "user"
        content = message["content"]
        parts: list[types.Part] = []

        if isinstance(content, str):
            parts.append(types.Part(text=content))
        else:
            for block in content:
                block_type = block.get("type")
                if block_type == "text":
                    parts.append(types.Part(text=block.get("text", "")))
                elif block_type == "tool_use":
                    parts.append(
                        types.Part(
                            function_call=types.FunctionCall(
                                id=block["id"],
                                name=block["name"],
                                args=block.get("input") or {},
                            )
                        )
                    )
                elif block_type == "tool_result":
                    tool_use_id = block["tool_use_id"]
                    parts.append(
                        types.Part(
                            function_response=types.FunctionResponse(
                                id=tool_use_id,
                                name=call_names.get(tool_use_id, ""),
                                response=_as_response_dict(block.get("content", "")),
                            )
                        )
                    )

        contents.append(types.Content(role=role, parts=parts))

    return contents


def _as_response_dict(raw_content: str) -> dict[str, Any]:
    try:
        parsed = json.loads(raw_content)
    except (TypeError, ValueError):
        parsed = raw_content
    return parsed if isinstance(parsed, dict) else {"result": parsed}


def _to_gemini_tools(tools: list[dict]) -> list[types.Tool]:
    declarations = [
        types.FunctionDeclaration(
            name=tool["name"],
            description=tool.get("description", ""),
            parameters_json_schema=tool.get("input_schema"),
        )
        for tool in tools
    ]
    return [types.Tool(function_declarations=declarations)]


def _from_gemini_response(response: types.GenerateContentResponse) -> ModelTurn:
    candidate = response.candidates[0]
    blocks: list[dict] = []
    has_tool_call = False

    for index, part in enumerate(candidate.content.parts or []):
        if part.function_call is not None:
            has_tool_call = True
            blocks.append(
                {
                    "type": "tool_use",
                    "id": part.function_call.id or f"call_{index}",
                    "name": part.function_call.name,
                    "input": part.function_call.args or {},
                }
            )
        elif part.text:
            blocks.append({"type": "text", "text": part.text})

    return ModelTurn(stop_reason="tool_use" if has_tool_call else "end_turn", content=blocks)


class GeminiChatModel:
    """Construye `genai.Client` de forma perezosa.

    A diferencia de `AsyncAnthropic`, `genai.Client(api_key=...)` valida la
    api_key de forma sincronica en el constructor y lanza `ValueError` de
    inmediato si esta vacia. Si se construyera en `__init__` (llamado desde
    el lifespan de FastAPI al arrancar), la app fallaria al iniciar en
    cualquier entorno sin GEMINI_API_KEY configurada (tests, este entorno
    sin creditos). Se difiere la construccion al primer `send()` para que
    la falta de api_key se manifieste como un error de la llamada (ya
    manejado por el circuit breaker y por el endpoint de chat), no como un
    crash de arranque.
    """

    def __init__(self, api_key: str, model: str, breaker: CircuitBreaker) -> None:
        self._api_key = api_key
        self._model = model
        self._breaker = breaker
        self._client: genai.Client | None = None

    def _get_client(self) -> genai.Client:
        if self._client is None:
            self._client = genai.Client(api_key=self._api_key)
        return self._client

    async def send(self, messages: list[dict], tools: list[dict], system: str) -> ModelTurn:
        return await self._breaker.call(self._send, messages, tools, system)

    async def _send(self, messages: list[dict], tools: list[dict], system: str) -> ModelTurn:
        response = await self._get_client().aio.models.generate_content(
            model=self._model,
            contents=_to_gemini_contents(messages),
            config=types.GenerateContentConfig(
                system_instruction=system,
                tools=_to_gemini_tools(tools),
                max_output_tokens=1024,
            ),
        )
        return _from_gemini_response(response)
