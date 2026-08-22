from rest_framework import permissions

from apps.customers.models import User


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
