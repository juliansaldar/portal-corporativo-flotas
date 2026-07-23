"""Adaptador del SDK oficial de Anthropic para ChatModelPort."""

from __future__ import annotations

from anthropic import AsyncAnthropic
from shared.resilience import CircuitBreaker

from app.application.ports import ModelTurn


class AnthropicChatModel:
    def __init__(self, api_key: str, model: str, breaker: CircuitBreaker) -> None:
        self._client = AsyncAnthropic(api_key=api_key)
        self._model = model
        self._breaker = breaker

    async def send(self, messages: list[dict], tools: list[dict], system: str) -> ModelTurn:
        return await self._breaker.call(self._send, messages, tools, system)

    async def _send(self, messages: list[dict], tools: list[dict], system: str) -> ModelTurn:
        response = await self._client.messages.create(
            model=self._model,
            max_tokens=1024,
            system=system,
            tools=tools,
            messages=messages,
        )
        return ModelTurn(
            stop_reason=response.stop_reason or "end_turn",
            content=[block.model_dump() for block in response.content],
        )
