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
        username="test_location_user",
        zalo_user_id="test_location_user",
        role=User.Role.CUSTOMER,
    )


@pytest.fixture(autouse=True)
def clear_cache():
    cache.clear()
    yield
    cache.clear()


@pytest.mark.django_db
class TestReverseGeocodeService:
    def test_reverse_geocode_success_and_caching(self):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "address": {
                "house_number": "45",
                "road": "Đường Lê Lợi",
                "suburb": "Phường Bến Nghé",
                "city_district": "Quận 1",
                "city": "Thành phố Hồ Chí Minh",
            },
            "display_name": "45 Đường Lê Lợi, Phường Bến Nghé, Quận 1, Thành phố Hồ Chí Minh",
        }

        with patch("apps.customers.services.get_zalo_http_session") as mock_get_session:
            mock_session = MagicMock()
            mock_session.get.return_value = mock_response
            mock_get_session.return_value = mock_session

            # First call: cache miss, calls session.get
            result = AuthService.reverse_geocode(10.7769, 106.7009)
            assert "45 Đường Lê Lợi" in result["address_text"]
            assert result["ward"] == "Phường Bến Nghé"
            assert result["district"] == "Quận 1"
            assert result["city"] == "Thành phố Hồ Chí Minh"
            assert mock_session.get.call_count == 1

            # Second call with close coordinates (within ~11m precision): cache hit
            result_cached = AuthService.reverse_geocode(10.77691, 106.70091)
            assert result_cached["address_text"] == result["address_text"]
            assert mock_session.get.call_count == 1

    def test_reverse_geocode_graceful_degradation_on_timeout(self):
        with patch("apps.customers.services.get_zalo_http_session") as mock_get_session:
            mock_session = MagicMock()
            mock_session.get.side_effect = Exception("Nominatim timeout")
            mock_get_session.return_value = mock_session

            result = AuthService.reverse_geocode(10.7769, 106.7009)
            assert result["latitude"] == 10.7769
            assert result["longitude"] == 106.7009
            assert result["address_text"] == ""

    def test_reverse_geocode_invalid_coordinates(self):
        result = AuthService.reverse_geocode("invalid", "coords")  # type: ignore
        assert result["latitude"] == 0.0
        assert result["longitude"] == 0.0
        assert result["address_text"] == ""

    def test_decode_zalo_location_token_auto_reverse_geocodes(self):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "address": {
                "house_number": "123",
                "road": "Đường Số 1",
                "suburb": "Phường Bến Nghé",
                "city_district": "Quận 1",
                "city": "Thành phố Hồ Chí Minh",
            },
            "display_name": "123 Đường Số 1, Phường Bến Nghé, Quận 1, TP.HCM",
        }

        with patch("apps.customers.services.get_zalo_http_session") as mock_get_session:
            mock_session = MagicMock()
            mock_session.get.return_value = mock_response
            mock_get_session.return_value = mock_session

            # Token starting with test_raw_ triggers reverse geocoding fallback branch
            decoded = AuthService.decode_zalo_location_token("test_raw_token_xyz")
            assert decoded is not None
            assert decoded["latitude"] == 10.762622
            assert decoded["longitude"] == 106.660172
            assert decoded["address_text"] != ""
            assert "Đường Số 1" in decoded["address_text"]


@pytest.mark.django_db
class TestCustomerReverseGeocodeAPI:
    def test_reverse_geocode_api_requires_auth(self, api_client):
        response = api_client.get(
            "/api/v1/customers/location/reverse-geocode?latitude=10.7769&longitude=106.7009"
        )
        assert response.status_code == 401

    def test_reverse_geocode_api_success(self, api_client, customer_user):
        api_client.force_authenticate(user=customer_user)

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "address": {
                "road": "Đường Nguyễn Huệ",
                "suburb": "Phường Bến Nghé",
                "city_district": "Quận 1",
                "city": "Thành phố Hồ Chí Minh",
            },
            "display_name": "Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM",
        }

        with patch("apps.customers.services.get_zalo_http_session") as mock_get_session:
            mock_session = MagicMock()
            mock_session.get.return_value = mock_response
            mock_get_session.return_value = mock_session

            response = api_client.get(
                "/api/v1/customers/location/reverse-geocode?latitude=10.7769&longitude=106.7009"
            )
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert "Đường Nguyễn Huệ" in data["data"]["address_text"]
            assert data["data"]["ward"] == "Phường Bến Nghé"
            assert data["data"]["district"] == "Quận 1"

    def test_reverse_geocode_api_missing_coordinates(self, api_client, customer_user):
        api_client.force_authenticate(user=customer_user)
        response = api_client.get("/api/v1/customers/location/reverse-geocode")
        assert response.status_code == 400
        data = response.json()
        assert data["success"] is False
        assert data["error"]["code"] == "MISSING_COORDINATES"

    def test_reverse_geocode_api_invalid_coordinates(self, api_client, customer_user):
        api_client.force_authenticate(user=customer_user)
        # Coordinate out of range
        response = api_client.get(
            "/api/v1/customers/location/reverse-geocode?latitude=999&longitude=106.7009"
        )
        assert response.status_code == 400
        data = response.json()
        assert data["success"] is False
        assert data["error"]["code"] == "INVALID_COORDINATES"
