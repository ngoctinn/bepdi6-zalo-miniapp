from django.conf import settings
from rest_framework import permissions

from apps.customers.models import User


class IsAuthenticatedCustomer(permissions.BasePermission):
    """
    Ensures request has an authenticated user.
    In production (DEBUG=False), strictly requires request.user.is_authenticated.
    In development/testing (DEBUG=True), allows dev fallback via X-Customer-ID.
    """

    def has_permission(self, request, view):
        if request.user and request.user.is_authenticated:
            return True
        if getattr(settings, "DEBUG", False) and (
            request.headers.get("X-Customer-ID")
            or request.query_params.get("customer_id")
        ):
            return True
        return False


class IsStaffOrAdminUser(permissions.BasePermission):
    """
    Allows access only to staff or admin users (BR-SEC-002).
    """

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_staff or user.is_superuser:
            return True
        role = getattr(user, "role", None)
        return role in [User.Role.STAFF, User.Role.ADMIN, "STAFF", "ADMIN"]


class IsAdminOnlyUser(permissions.BasePermission):
    """
    Allows access only to admin users (BR-SEC-002, BR-SHOP-004).
    """

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser:
            return True
        role = getattr(user, "role", None)
        return role in [User.Role.ADMIN, "ADMIN"]
