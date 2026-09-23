import pytest
from rest_framework import status
from rest_framework.test import APIClient


@pytest.fixture
def api_client():
    return APIClient()


@pytest.mark.django_db
class TestApiEnvelopeStandardization:
    def test_healthz_endpoint_envelope(self, api_client):
        response = api_client.get("/healthz")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["success"] is True
        assert data["data"]["status"] == "ok"
        assert data["data"]["app"] == "bepdi6-backend"

    def test_custom_404_not_found_route(self, api_client):
        response = api_client.get("/api/v1/non-existent-endpoint-route-12345")
        assert response.status_code == status.HTTP_404_NOT_FOUND
        data = response.json()
        assert data["success"] is False
        assert data["error"]["code"] == "NOT_FOUND"
        assert "message" in data["error"]

    def test_categories_endpoint_envelope(self, api_client):
        response = api_client.get("/api/v1/categories")
        assert response.status_code == status.HTTP_200_OK
        # JSON renderer or dict wrapped
        data = response.data
        assert isinstance(data, list) or (
            isinstance(data, dict) and data.get("success") is True
        )
