import logging

import requests
from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken

from apps.customers.models import Customer, User

logger = logging.getLogger(__name__)


class AuthService:
    """Authentication service handling Zalo Token Exchange and JWT generation."""

    @classmethod
    def exchange_zalo_tokens(
        cls,
        zalo_token: str,
        phone_token: str = "",
        name: str = "",
        avatar_url: str = "",
    ) -> dict:
        """
        Exchanges Zalo access token and phone token for profile info via Zalo OpenAPI.
        Provides seamless dev/mock fallback if Zalo App credentials are not configured.
        """
        zalo_app_id = getattr(settings, "ZALO_APP_ID", "")
        zalo_app_secret = getattr(settings, "ZALO_APP_SECRET", "")

        # Default fallback for testing & local development
        if (
            not zalo_app_id
            or not zalo_app_secret
            or zalo_token.startswith("mock_")
            or zalo_token.startswith("test_")
        ):
            zalo_user_id = (
                f"zalo_{zalo_token.replace('mock_', '').replace('test_', '')}"
            )
            phone = "0987654321" if phone_token else ""
            user_name = name or f"Khách {zalo_user_id[-6:]}"
            return {
                "zalo_user_id": zalo_user_id,
                "name": user_name,
                "phone": phone,
                "avatar_url": avatar_url,
            }

        # Real Zalo OpenAPI Token Exchange
        try:
            # 1. Get user profile
            profile_res = requests.get(
                "https://graph.zalo.me/v2.0/me",
                headers={"access_token": zalo_token},
                params={"fields": "id,name,picture"},
                timeout=5,
            )
            profile_data = profile_res.json()
            zalo_user_id = str(profile_data.get("id", ""))
            user_name = name or str(profile_data.get("name", "Khách Zalo"))
            avatar = avatar_url or str(
                profile_data.get("picture", {}).get("data", {}).get("url", "")
            )

            # 2. Get phone number if phone_token provided
            phone_number = ""
            if phone_token:
                phone_res = requests.get(
                    "https://graph.zalo.me/v2.0/me/info",
                    headers={
                        "access_token": zalo_token,
                        "code": phone_token,
                        "secret_key": zalo_app_secret,
                    },
                    timeout=5,
                )
                phone_data = phone_res.json()
                if "data" in phone_data and "number" in phone_data["data"]:
                    phone_number = str(phone_data["data"]["number"])
                    # Convert 84... to 0...
                    if phone_number.startswith("84"):
                        phone_number = "0" + phone_number[2:]

            return {
                "zalo_user_id": zalo_user_id or f"zalo_{zalo_token[:10]}",
                "name": user_name,
                "phone": phone_number,
                "avatar_url": avatar,
            }
        except Exception as e:
            logger.error("Error exchanging Zalo tokens: %s", e)
            zalo_user_id = f"zalo_{zalo_token[:10]}"
            return {
                "zalo_user_id": zalo_user_id,
                "name": name or "Khách Zalo",
                "phone": "",
                "avatar_url": avatar_url,
            }

    @classmethod
    def authenticate_or_register_zalo_customer(
        cls,
        zalo_token: str,
        phone_token: str = "",
        name: str = "",
        avatar_url: str = "",
    ) -> tuple[Customer, str, str]:
        """
        Creates or updates customer from Zalo exchange and returns (Customer, access_token, refresh_token).
        """
        info = cls.exchange_zalo_tokens(
            zalo_token=zalo_token,
            phone_token=phone_token,
            name=name,
            avatar_url=avatar_url,
        )

        customer, created = Customer.objects.get_or_create(
            zalo_user_id=info["zalo_user_id"],
            defaults={
                "name": info["name"],
                "phone": info["phone"],
                "avatar_url": info["avatar_url"],
            },
        )

        if not created:
            # Update latest profile info if changed
            updated_fields = []
            if info["name"] and customer.name != info["name"]:
                customer.name = info["name"]
                updated_fields.append("name")
            if info["phone"] and customer.phone != info["phone"]:
                customer.phone = info["phone"]
                updated_fields.append("phone")
            if info["avatar_url"] and customer.avatar_url != info["avatar_url"]:
                customer.avatar_url = info["avatar_url"]
                updated_fields.append("avatar_url")
            if updated_fields:
                customer.save(update_fields=updated_fields)

        # Create or link internal Django User for JWT token issuance
        user, _ = User.objects.get_or_create(
            username=f"zalo_{customer.zalo_user_id}",
            defaults={
                "zalo_user_id": customer.zalo_user_id,
                "role": User.Role.CUSTOMER,
            },
        )

        refresh = RefreshToken.for_user(user)
        refresh["customer_id"] = customer.id
        refresh["zalo_user_id"] = customer.zalo_user_id

        return customer, str(refresh.access_token), str(refresh)
