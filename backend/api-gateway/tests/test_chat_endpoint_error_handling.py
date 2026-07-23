from fastapi.testclient import TestClient

from app.interface.http import app, state
from tests.fakes import FakeVehicleStateReader


class _BoomChatModel:
    async def send(self, messages, tools, system):
        raise RuntimeError("upstream provider exploded (e.g. billing/rate-limit/network)")


def test_chat_stream_degrades_gracefully_on_unexpected_model_error():
    with TestClient(app) as client:
        state.chat_model = _BoomChatModel()
        state.ingestion_client = FakeVehicleStateReader(states=[])

        response = client.post("/v1/agent/chat", json={"message": "hola"})

        assert response.status_code == 200
        assert "error consultando al asistente" in response.text
        assert "event: done" in response.text
