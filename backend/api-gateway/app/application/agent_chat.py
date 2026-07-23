"""Loop de tool-use directo contra Anthropic, sin framework de agentes.

Un unico tool deterministico (query_vehicle_state). Ver design.md de
fleet-ai-agent, decision 1, para la justificacion de no usar LangChain.
"""

from __future__ import annotations

import json

from app.application.ports import ChatModelPort, ModelTurn, VehicleStateReaderPort
from app.application.query_vehicle_state import query_vehicle_state

MAX_TOOL_ITERATIONS = 4

SYSTEM_PROMPT = (
    "Eres el asistente del Portal Corporativo de Monitoreo de Flotas. "
    "Solo respondes preguntas sobre el estado actual de los vehiculos (posicion, velocidad, "
    "tiempo detenido y zonas criticas), usando la tool query_vehicle_state para obtener datos "
    "reales. Nunca inventes datos de vehiculos. Si la pregunta no tiene relacion con el estado "
    "de la flota, responde que no tienes esa informacion."
)

QUERY_VEHICLE_STATE_TOOL = {
    "name": "query_vehicle_state",
    "description": (
        "Consulta el estado actual de los vehiculos de la flota. Permite filtrar por "
        "zona critica (zone_id) y/o por tiempo minimo detenido en segundos "
        "(min_stopped_seconds). Ambos filtros son opcionales; sin filtros retorna "
        "el estado de todos los vehiculos."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "zone_id": {
                "type": "string",
                "description": "Id de la CriticalZone para filtrar, ej. 'zona-franca-norte'",
            },
            "min_stopped_seconds": {
                "type": "integer",
                "description": "Tiempo minimo detenido en segundos, ej. 1200 para 20 minutos",
            },
        },
    },
}


def _extract_text(content: list[dict]) -> str:
    return "".join(block.get("text", "") for block in content if block.get("type") == "text")


async def run_agent_chat(
    user_message: str,
    model: ChatModelPort,
    reader: VehicleStateReaderPort,
) -> str:
    messages: list[dict] = [{"role": "user", "content": user_message}]

    for _ in range(MAX_TOOL_ITERATIONS):
        turn: ModelTurn = await model.send(messages, tools=[QUERY_VEHICLE_STATE_TOOL], system=SYSTEM_PROMPT)

        if turn.stop_reason != "tool_use":
            return _extract_text(turn.content)

        messages.append({"role": "assistant", "content": turn.content})

        tool_results = []
        for block in turn.content:
            if block.get("type") != "tool_use" or block.get("name") != "query_vehicle_state":
                continue
            tool_input = block.get("input", {})
            states = await query_vehicle_state(
                reader,
                zone_id=tool_input.get("zone_id"),
                min_stopped_seconds=tool_input.get("min_stopped_seconds"),
            )
            tool_results.append(
                {
                    "type": "tool_result",
                    "tool_use_id": block["id"],
                    "content": json.dumps([s.model_dump(mode="json") for s in states]),
                }
            )
        messages.append({"role": "user", "content": tool_results})

    return "No pude completar la consulta tras varios intentos con la tool. Intenta reformular la pregunta."
