import math
from decimal import Decimal

from apps.shipping.models import ShopConfig


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
        multiplier: float | Decimal | None = None,
    ) -> Decimal:
        """
        Calculate compensated road distance (Haversine * multiplier).
        Rounds to 2 decimal places.
        """
        if shop_lat is None or shop_lon is None or multiplier is None:
            config = ShopConfig.get_solo()
            if shop_lat is None:
                shop_lat = config.latitude
            if shop_lon is None:
                shop_lon = config.longitude
            if multiplier is None:
                multiplier = config.haversine_multiplier

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
    Calculates progressive shipping fee based on compensated distance and shop shipping tiers.
    Supports free delivery threshold (BR-DELI-003).
    """

    @classmethod
    def calculate_fee(
        cls,
        distance_km: Decimal | float,
        order_subtotal: Decimal | float = Decimal("0.00"),
        max_radius_km: float | Decimal | None = None,
        tiers: list[dict] | None = None,
        min_order_for_freeship: Decimal | float | None = None,
    ) -> Decimal:
        config = ShopConfig.get_solo()
        if max_radius_km is None:
            max_radius_km = config.max_delivery_radius_km
        if tiers is None:
            tiers = config.shipping_tiers
        if min_order_for_freeship is None:
            min_order_for_freeship = config.min_order_for_freeship

        distance = float(distance_km)
        max_radius = float(max_radius_km)

        if distance > max_radius:
            raise OutOfDeliveryRadiusError(
                f"Địa chỉ giao hàng cách quán {distance:.2f}km, vượt quá bán kính tối đa {max_radius:.2f}km."
            )

        # Check Free delivery eligibility (BR-DELI-003)
        subtotal_dec = Decimal(str(order_subtotal))
        freeship_dec = Decimal(str(min_order_for_freeship))
        if freeship_dec > Decimal("0.00") and subtotal_dec >= freeship_dec:
            return Decimal("0.00")

        # Match against shipping tiers
        if tiers:
            for tier in tiers:
                from_km = float(tier.get("from_km", 0.0))
                to_km = float(tier.get("to_km", 0.0))
                fee = tier.get("fee", 0.0)
                if from_km <= distance <= to_km:
                    return Decimal(str(fee))

            # If distance <= max_radius but no tier directly matched, pick the highest tier fee
            sorted_tiers = sorted(tiers, key=lambda x: float(x.get("to_km", 0.0)))
            if sorted_tiers:
                return Decimal(str(sorted_tiers[-1].get("fee", 0.0)))

        # Fallback default calculation if no tiers configured
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
        order_subtotal: Decimal | float = Decimal("0.00"),
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
            shipping_fee = ShippingFeeCalculator.calculate_fee(
                distance_km=distance_km,
                order_subtotal=order_subtotal,
            )
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
