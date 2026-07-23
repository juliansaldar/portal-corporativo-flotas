from fastapi.testclient import TestClient

from app.interface.http import app


def test_frontend_origin_is_allowed_by_cors():
    with TestClient(app) as client:
        response = client.get(
            "/healthz",
            headers={"Origin": "http://localhost:5173"},
        )

        assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"
