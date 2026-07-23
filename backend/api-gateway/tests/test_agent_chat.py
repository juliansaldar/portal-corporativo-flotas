import json
from datetime import datetime, timezone

from shared.models import VehicleState

from app.application.agent_chat import run_agent_chat
from app.application.ports import ModelTurn
from tests.fakes import FakeVehicleStateReader, ScriptedChatModel


def _state(vehicle_id: str, stopped_duration_seconds: int, zone_ids: list[str]) -> VehicleState:
    return VehicleState(
        vehicle_id=vehicle_id,
        lat=4.61,
        lon=-74.08,
        speed_kmh=0.0,
        updated_at=datetime.now(timezone.utc),
        stopped_since=datetime.now(timezone.utc),
        stopped_duration_seconds=stopped_duration_seconds,
        current_zone_ids=zone_ids,
    )


async def test_agent_answers_using_filtered_tool_result():
    reader = FakeVehicleStateReader(
        states=[
            _state("veh-1", 1500, ["zona-x"]),
            _state("veh-2", 500, ["zona-x"]),
        ]
    )
    model = ScriptedChatModel(
        turns=[
            ModelTurn(
                stop_reason="tool_use",
                content=[
                    {
                        "type": "tool_use",
                        "id": "call_1",
                        "name": "query_vehicle_state",
                        "input": {"zone_id": "zona-x", "min_stopped_seconds": 1200},
                    }
                ],
            ),
            ModelTurn(
                stop_reason="end_turn",
                content=[{"type": "text", "text": "veh-1 lleva mas de 20 minutos detenido en zona-x."}],
            ),
        ]
    )

    answer = await run_agent_chat("¿que vehiculos llevan detenidos +20 min en zonas criticas?", model, reader)

    assert answer == "veh-1 lleva mas de 20 minutos detenido en zona-x."
    assert len(model.calls) == 2

    tool_result_message = model.calls[1][-1]
    tool_result_content = json.loads(tool_result_message["content"][0]["content"])
    assert [v["vehicle_id"] for v in tool_result_content] == ["veh-1"]
