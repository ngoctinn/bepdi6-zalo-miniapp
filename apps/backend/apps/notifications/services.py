import logging
from datetime import timedelta
from typing import Any

import requests
from django.conf import settings
from django.core.cache import cache
from django.utils import timezone

from apps.notifications.models import ZaloOACredential

logger = logging.getLogger(__name__)

CACHE_KEY_OA_ACCESS_TOKEN = "zalo:oa:access_token:{oa_id}"
ZALO_OAUTH_TOKEN_URL = "https://oauth.zalo.me/v4/oa/access_token"
EXPIRY_BUFFER_SECONDS = 300  # Refresh 5 minutes before actual expiry


class ZaloOATokenService:
    """
    Manages Zalo Official Account (OA) OAuth 2.0 access and refresh tokens.
    Implements Token Rotation & Redis Caching following Zalo OpenAPI Best Practices.
    """

    @classmethod
    def get_valid_access_token(cls, oa_id: str | None = None) -> str:
        """
        Retrieves a valid access token.
        1. Checks Redis cache.
        2. Queries database (ZaloOACredential).
        3. If expired or close to expiry (within 5 mins), refreshes token via Zalo OAuth.
        4. Falls back to settings.ZALO_OA_ACCESS_TOKEN if configured.
        """
        target_oa_id = oa_id or getattr(settings, "ZALO_OA_ID", "")

        # 1. Check Redis Cache if OA ID is known
        if target_oa_id:
            cache_key = CACHE_KEY_OA_ACCESS_TOKEN.format(oa_id=target_oa_id)
            cached_token = cache.get(cache_key)
            if cached_token:
                return cached_token

        # 2. Check Database Credential
        cred = None
        if target_oa_id:
            cred = ZaloOACredential.objects.filter(oa_id=target_oa_id).first()
        else:
            cred = ZaloOACredential.objects.order_by("-updated_at").first()

        if cred:
            now = timezone.now()
            # If token still valid beyond buffer
            if cred.expires_at > now + timedelta(seconds=EXPIRY_BUFFER_SECONDS):
                cls._cache_token(cred.oa_id, cred.access_token, cred.expires_at)
                return cred.access_token

            # Token expired or about to expire -> Refresh
            try:
                refreshed_token = cls.refresh_access_token(cred)
                if refreshed_token:
                    return refreshed_token
            except Exception as e:
                logger.error("Failed to auto-refresh Zalo OA token: %s", e)

        # 3. Fallback to settings.ZALO_OA_ACCESS_TOKEN (Useful for dev/tests)
        fallback_token = getattr(settings, "ZALO_OA_ACCESS_TOKEN", "")
        return fallback_token

    @classmethod
    def refresh_access_token(cls, cred: ZaloOACredential) -> str | None:
        """
        Refreshes access token using Zalo's Rotating Refresh Token flow.
        Zalo invalidates old refresh_token and returns a new refresh_token + access_token.
        """
        app_id = getattr(settings, "ZALO_APP_ID", "")
        secret_key = getattr(settings, "ZALO_OA_SECRET", "")

        if not app_id or not secret_key:
            logger.warning(
                "ZALO_APP_ID or ZALO_OA_SECRET not configured. Cannot refresh Zalo OA token."
            )
            return None

        headers = {
            "secret_key": secret_key,
            "Content-Type": "application/x-www-form-urlencoded",
        }
        data = {
            "refresh_token": cred.refresh_token,
            "app_id": app_id,
            "grant_type": "refresh_token",
        }

        response = requests.post(
            ZALO_OAUTH_TOKEN_URL,
            headers=headers,
            data=data,
            timeout=10,
        )

        if response.status_code != 200:
            logger.error(
                "Zalo OAuth refresh token failed HTTP %s: %s",
                response.status_code,
                response.text,
            )
            return None

        res_data = response.json()
        error_code = res_data.get("error")
        if error_code:
            logger.error(
                "Zalo OAuth refresh token returned error %s: %s",
                error_code,
                res_data.get("message"),
            )
            return None

        new_access_token = res_data.get("access_token")
        new_refresh_token = res_data.get("refresh_token")
        expires_in = int(res_data.get("expires_in", 90000))

        if not new_access_token or not new_refresh_token:
            logger.error(
                "Zalo OAuth response missing tokens: %s",
                res_data,
            )
            return None

        # Update database with new tokens (Token Rotation)
        new_expires_at = timezone.now() + timedelta(seconds=expires_in)
        cred.access_token = new_access_token
        cred.refresh_token = new_refresh_token
        cred.expires_at = new_expires_at
        cred.save(
            update_fields=["access_token", "refresh_token", "expires_at", "updated_at"]
        )

        cls._cache_token(cred.oa_id, new_access_token, new_expires_at)
        logger.info("Successfully refreshed Zalo OA token for OA #%s", cred.oa_id)
        return new_access_token

    @classmethod
    def exchange_authorization_code(
        cls,
        code: str,
        code_verifier: str = "",
        oa_id: str | None = None,
    ) -> dict[str, Any]:
        """
        Exchanges authorization code from Admin OAuth consent for first-time tokens.
        """
        app_id = getattr(settings, "ZALO_APP_ID", "")
        secret_key = getattr(settings, "ZALO_OA_SECRET", "")
        target_oa_id = oa_id or getattr(settings, "ZALO_OA_ID", "")

        if not app_id or not secret_key:
            raise ValueError("ZALO_APP_ID and ZALO_OA_SECRET must be configured.")

        headers = {
            "secret_key": secret_key,
            "Content-Type": "application/x-www-form-urlencoded",
        }
        data = {
            "code": code,
            "app_id": app_id,
            "grant_type": "authorization_code",
        }
        if code_verifier:
            data["code_verifier"] = code_verifier

        response = requests.post(
            ZALO_OAUTH_TOKEN_URL,
            headers=headers,
            data=data,
            timeout=10,
        )
        res_data = response.json()
        if res_data.get("error"):
            logger.error("Zalo code exchange error: %s", res_data)
            return res_data

        access_token = res_data.get("access_token")
        refresh_token = res_data.get("refresh_token")
        expires_in = int(res_data.get("expires_in", 90000))
        oa_id_from_resp = str(res_data.get("oa_id") or target_oa_id)

        if access_token and refresh_token and oa_id_from_resp:
            expires_at = timezone.now() + timedelta(seconds=expires_in)
            cred, _ = ZaloOACredential.objects.update_or_create(
                oa_id=oa_id_from_resp,
                defaults={
                    "access_token": access_token,
                    "refresh_token": refresh_token,
                    "expires_at": expires_at,
                },
            )
            cls._cache_token(cred.oa_id, access_token, expires_at)

        return res_data

    @classmethod
    def _cache_token(cls, oa_id: str, access_token: str, expires_at: Any) -> None:
        """Caches access token in Redis with safety TTL buffer."""
        now = timezone.now()
        ttl = int((expires_at - now).total_seconds()) - EXPIRY_BUFFER_SECONDS
        if ttl > 0:
            cache_key = CACHE_KEY_OA_ACCESS_TOKEN.format(oa_id=oa_id)
            cache.set(cache_key, access_token, timeout=ttl)
