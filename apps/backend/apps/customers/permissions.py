from django.conf import settings
from rest_framework import permissions

from apps.customers.models import User


class IsAuthenticatedCustomer(permissions.BasePermission):
    """
    Ensures request has an authenticated user (customer or staff/admin).
    Strictly requires request.user.is_authenticated without header spoofing.
    """

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)


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
        admin_zalo_ids = getattr(settings, "ADMIN_ZALO_IDS", [])
        zalo_id = getattr(user, "zalo_user_id", None)
        if zalo_id and str(zalo_id) in admin_zalo_ids:
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
