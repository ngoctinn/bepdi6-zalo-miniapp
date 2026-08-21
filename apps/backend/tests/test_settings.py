from django.conf import settings


def test_django_settings_loaded():
    assert settings.SECRET_KEY is not None
    assert "rest_framework" in settings.INSTALLED_APPS
    assert "apps.customers.apps.CustomersConfig" in settings.INSTALLED_APPS
