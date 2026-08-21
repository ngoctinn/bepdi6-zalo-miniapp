import math
from decimal import Decimal

from django.conf import settings


class ShippingCalculationError(Exception):
    """Base exception for shipping calculations."""

    pass


class OutOfDeliveryRadiusError(ShippingCalculationError):
    """Raised when destination is outside shop maximum delivery radius."""

    pass


class DistanceCalculator:
    """Calculates road distance estimation using Haversine formula and circuity multiplier."""

    EARTH_RADIUS_KM = 6371.0

    @classmethod
    def calculate_haversine_distance(
        cls,
        lat1: float | Decimal,
        lon1: float | Decimal,
        lat2: float | Decimal,
        lon2: float | Decimal,
    ) -> float:
        """Calculate straight-line (great-circle) distance in kilometers."""
        lat1_rad = math.radians(float(lat1))
        lon1_rad = math.radians(float(lon1))
        lat2_rad = math.radians(float(lat2))
        lon2_rad = math.radians(float(lon2))

        dlat = lat2_rad - lat1_rad
        dlon = lon2_rad - lon1_rad

        a = (
            math.sin(dlat / 2) ** 2
            + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2) ** 2
        )
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

        return cls.EARTH_RADIUS_KM * c

    @classmethod
    def calculate_estimated_distance(
        cls,
        destination_lat: float | Decimal,
        destination_lon: float | Decimal,
        shop_lat: float | Decimal | None = None,
        shop_lon: float | Decimal | None = None,
        multiplier: float | None = None,
    ) -> Decimal:
        """
        Calculate compensated road distance (Haversine * multiplier).
        Rounds to 2 decimal places.
        """
        if shop_lat is None:
            shop_lat = getattr(settings, "SHOP_LATITUDE", 10.7769)
        if shop_lon is None:
            shop_lon = getattr(settings, "SHOP_LONGITUDE", 106.7009)
        if multiplier is None:
            multiplier = getattr(settings, "HAVERSINE_MULTIPLIER", 1.3)

        straight_distance = cls.calculate_haversine_distance(
            lat1=shop_lat,
            lon1=shop_lon,
            lat2=destination_lat,
            lon2=destination_lon,
        )

        estimated_distance = straight_distance * float(multiplier)
        return Decimal(str(round(estimated_distance, 2)))


class ShippingFeeCalculator:
    """
    Calculates progressive shipping fee based on compensated distance.
    Standard Tier (ADR 006):
    - 0 <= distance <= 2 km: 10,000 VND
    - 2 < distance <= 5 km: 15,000 VND
    - 5 < distance <= 7 km: 20,000 VND
    - > 7 km: Out of delivery radius
    """

    @classmethod
    def calculate_fee(
        cls,
        distance_km: Decimal | float,
        max_radius_km: float | None = None,
    ) -> Decimal:
        if max_radius_km is None:
            max_radius_km = getattr(settings, "MAX_DELIVERY_RADIUS_KM", 7.0)

        distance = float(distance_km)

        if distance > float(max_radius_km):
            raise OutOfDeliveryRadiusError(
                f"Địa chỉ giao hàng cách quán {distance:.2f}km, vượt quá bán kính tối đa {max_radius_km}km."
            )

        if distance <= 2.0:
            return Decimal("10000.00")
        elif distance <= 5.0:
            return Decimal("15000.00")
        elif distance <= 7.0:
            return Decimal("20000.00")
        else:
            raise OutOfDeliveryRadiusError("Ngoài bán kính giao hàng")


class ShippingService:
    """Facade service for calculating distance and shipping fee for customer addresses."""

    @classmethod
    def calculate_shipping(
        cls,
        destination_lat: float | Decimal,
        destination_lon: float | Decimal,
    ) -> dict:
        """
        Returns:
            {
                "distance_km": Decimal,
                "shipping_fee": Decimal,
                "is_deliverable": bool,
            }
        """
        distance_km = DistanceCalculator.calculate_estimated_distance(
            destination_lat=destination_lat,
            destination_lon=destination_lon,
        )

        try:
            shipping_fee = ShippingFeeCalculator.calculate_fee(distance_km=distance_km)
            return {
                "distance_km": distance_km,
                "shipping_fee": shipping_fee,
                "is_deliverable": True,
            }
        except OutOfDeliveryRadiusError:
            return {
                "distance_km": distance_km,
                "shipping_fee": Decimal("0.00"),
                "is_deliverable": False,
            }
