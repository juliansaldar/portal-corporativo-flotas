from google.genai import types

from app.infrastructure.gemini_client import (
    _as_response_dict,
    _from_gemini_response,
    _to_gemini_contents,
    _to_gemini_tools,
)

QUERY_VEHICLE_STATE_TOOL = {
    "name": "query_vehicle_state",
    "description": "Consulta el estado actual de los vehiculos de la flota.",
    "input_schema": {
        "type": "object",
        "properties": {
            "zone_id": {"type": "string"},
            "min_stopped_seconds": {"type": "integer"},
        },
    },
}


def test_to_gemini_tools_translates_input_schema_to_parameters_json_schema():
    tools = _to_gemini_tools([QUERY_VEHICLE_STATE_TOOL])

    declaration = tools[0].function_declarations[0]
    assert declaration.name == "query_vehicle_state"
    assert declaration.parameters_json_schema == QUERY_VEHICLE_STATE_TOOL["input_schema"]


def test_to_gemini_contents_maps_assistant_role_to_model_and_preserves_user_text():
    messages = [
        {"role": "user", "content": "hola"},
        {"role": "assistant", "content": [{"type": "text", "text": "hola de vuelta"}]},
    ]

    contents = _to_gemini_contents(messages)

    assert [c.role for c in contents] == ["user", "model"]
    assert contents[0].parts[0].text == "hola"
    assert contents[1].parts[0].text == "hola de vuelta"


def test_to_gemini_contents_resolves_function_response_name_from_matching_tool_use():
    messages = [
        {"role": "user", "content": "¿que vehiculos estan detenidos?"},
        {
            "role": "assistant",
            "content": [
                {
                    "type": "tool_use",
                    "id": "call_1",
                    "name": "query_vehicle_state",
                    "input": {"zone_id": "zona-x"},
                }
            ],
        },
        {
            "role": "user",
            "content": [
                {
                    "type": "tool_result",
                    "tool_use_id": "call_1",
                    "content": '[{"vehicle_id": "veh-1"}]',
                }
            ],
        },
    ]

    contents = _to_gemini_contents(messages)

    tool_use_part = contents[1].parts[0]
    assert tool_use_part.function_call.name == "query_vehicle_state"
    assert tool_use_part.function_call.args == {"zone_id": "zona-x"}

    tool_result_part = contents[2].parts[0]
    assert tool_result_part.function_response.id == "call_1"
    assert tool_result_part.function_response.name == "query_vehicle_state"
    assert tool_result_part.function_response.response == {"result": [{"vehicle_id": "veh-1"}]}


def test_as_response_dict_wraps_non_dict_json_but_passes_dict_json_through():
    assert _as_response_dict('[{"vehicle_id": "veh-1"}]') == {"result": [{"vehicle_id": "veh-1"}]}
    assert _as_response_dict('{"already": "a dict"}') == {"already": "a dict"}
    assert _as_response_dict("not json") == {"result": "not json"}


def test_from_gemini_response_detects_tool_use_turn():
    response = types.GenerateContentResponse(
        candidates=[
            types.Candidate(
                content=types.Content(
                    role="model",
                    parts=[
                        types.Part(
                            function_call=types.FunctionCall(
                                id="call_1",
                                name="query_vehicle_state",
                                args={"min_stopped_seconds": 1200},
                            )
                        )
                    ],
                )
            )
        ]
    )

    turn = _from_gemini_response(response)

    assert turn.stop_reason == "tool_use"
    assert turn.content == [
        {
            "type": "tool_use",
            "id": "call_1",
            "name": "query_vehicle_state",
            "input": {"min_stopped_seconds": 1200},
        }
    ]


def test_from_gemini_response_detects_end_turn_with_text():
    response = types.GenerateContentResponse(
        candidates=[
            types.Candidate(content=types.Content(role="model", parts=[types.Part(text="listo")]))
        ]
    )

    turn = _from_gemini_response(response)

    assert turn.stop_reason == "end_turn"
    assert turn.content == [{"type": "text", "text": "listo"}]
