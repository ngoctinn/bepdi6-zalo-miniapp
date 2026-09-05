from unittest.mock import MagicMock, patch

import pytest
from django.core.cache import cache
from rest_framework.test import APIClient

from apps.customers.models import User
from apps.customers.services import AuthService


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def customer_user():
    return User.objects.create_user(
        username="search_location_user",
        zalo_user_id="search_location_user",
        role=User.Role.CUSTOMER,
    )


@pytest.fixture(autouse=True)
def clear_cache():
    cache.clear()
    yield
    cache.clear()


@pytest.mark.django_db
class TestLocationSearchService:
    def test_search_places_success_and_caching(self):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "properties": {
                        "name": "Botanica Premier",
                        "street": "Hồng Hà",
                        "housenumber": "108-112",
                        "suburb": "Phường 2",
                        "district": "Quận Tân Bình",
                        "city": "Thành phố Hồ Chí Minh",
                    },
                    "geometry": {
                        "type": "Point",
                        "coordinates": [106.6695, 10.8115],
                    },
                }
            ],
        }

        with patch("apps.customers.services.get_zalo_http_session") as mock_get_session:
            mock_session = MagicMock()
            mock_session.get.return_value = mock_response
            mock_get_session.return_value = mock_session

            # First call: hits Photon API
            results = AuthService.search_places("Botanica", lat=10.7769, lng=106.7009)
            assert len(results) == 1
            assert results[0]["name"] == "Botanica Premier"
            assert "108-112 Hồng Hà" in results[0]["address_text"]
            assert results[0]["latitude"] == 10.8115
            assert results[0]["longitude"] == 106.6695
            assert mock_session.get.call_count == 1

            # Second call: hits Redis cache
            cached_results = AuthService.search_places(
                "Botanica", lat=10.7769, lng=106.7009
            )
            assert len(cached_results) == 1
            assert mock_session.get.call_count == 1

    def test_search_places_short_query_returns_empty(self):
        results = AuthService.search_places("a")
        assert results == []


@pytest.mark.django_db
class TestLocationSearchAPI:
    def test_search_api_requires_auth(self, api_client):
        res = api_client.get("/api/v1/customers/location/search?query=Botanica")
        assert res.status_code == 401

    def test_search_api_success(self, api_client, customer_user):
        api_client.force_authenticate(user=customer_user)

        with patch.object(
            AuthService,
            "search_places",
            return_value=[
                {
                    "name": "Botanica Premier",
                    "address_text": "108-112 Hồng Hà, Phường 2, Tân Bình",
                    "latitude": 10.8115,
                    "longitude": 106.6695,
                }
            ],
        ) as mock_search:
            res = api_client.get(
                "/api/v1/customers/location/search?query=Botanica&latitude=10.77&longitude=106.70"
            )
            assert res.status_code == 200
            data = res.json()
            assert data["success"] is True
            assert len(data["data"]) == 1
            assert data["data"][0]["name"] == "Botanica Premier"
            mock_search.assert_called_once_with(
                query="Botanica",
                lat="10.77",
                lng="106.70",
                limit=5,
            )

    def test_search_api_empty_for_short_query(self, api_client, customer_user):
        api_client.force_authenticate(user=customer_user)
        res = api_client.get("/api/v1/customers/location/search?query=b")
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        assert data["data"] == []
