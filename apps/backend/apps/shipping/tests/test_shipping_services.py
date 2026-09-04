from decimal import Decimal

import pytest

from apps.shipping.services import (
    DistanceCalculator,
    OutOfDeliveryRadiusError,
    ShippingFeeCalculator,
    ShippingService,
)


def test_haversine_distance_calculation():
    # Shop: 10.7769, 106.7009 (Bến Thành, Q1)
    # Target: 10.7721, 106.6983 (~0.6 km straight line)
    straight = DistanceCalculator.calculate_haversine_distance(
        lat1=10.7769,
        lon1=106.7009,
        lat2=10.7721,
        lon2=106.6983,
    )
    assert 0.5 < straight < 0.7


def test_estimated_distance_with_multiplier():
    # Target in Q1: straight ~0.6 km -> * 1.3 -> ~0.78 km
    estimated = DistanceCalculator.calculate_estimated_distance(
        destination_lat=10.7721,
        destination_lon=106.6983,
        shop_lat=10.7769,
        shop_lon=106.7009,
        multiplier=1.3,
    )
    assert isinstance(estimated, Decimal)
    assert Decimal("0.70") <= estimated <= Decimal("0.90")


@pytest.mark.django_db
def test_shipping_fee_tiers():
    # Half-open tiers: 0 <= distance < 2km -> 10,000 VND.
    assert ShippingFeeCalculator.calculate_fee(1.5) == Decimal("10000.00")
    assert ShippingFeeCalculator.calculate_fee(2.0) == Decimal("15000.00")

    # 2 <= distance < 5km -> 15,000 VND.
    assert ShippingFeeCalculator.calculate_fee(2.1) == Decimal("15000.00")
    assert ShippingFeeCalculator.calculate_fee(5.0) == Decimal("20000.00")

    # Tier 3: > 5km & <= 7km -> 20,000 VND
    assert ShippingFeeCalculator.calculate_fee(5.1) == Decimal("20000.00")
    assert ShippingFeeCalculator.calculate_fee(7.0) == Decimal("20000.00")

    # Outside radius: > 7km -> raises OutOfDeliveryRadiusError
    with pytest.raises(OutOfDeliveryRadiusError):
        ShippingFeeCalculator.calculate_fee(7.1)


@pytest.mark.django_db
def test_shipping_service_facade():
    # Near location (Deliverable)
    result = ShippingService.calculate_shipping(
        destination_lat=10.7721,
        destination_lon=106.6983,
    )
    assert result["is_deliverable"] is True
    assert result["shipping_fee"] == Decimal("10000.00")
    assert result["distance_km"] > Decimal("0.00")

    # Far location (Outside radius: Hanoi coordinates)
    far_result = ShippingService.calculate_shipping(
        destination_lat=21.0285,
        destination_lon=105.8542,
    )
    assert far_result["is_deliverable"] is False
    assert far_result["shipping_fee"] == Decimal("0.00")
    assert far_result["distance_km"] > Decimal("7.00")


@pytest.mark.django_db
def test_fee_uses_half_open_tier_boundaries_and_final_inclusive_endpoint():
    tiers = [
        {"from_km": 0, "to_km": 2, "fee": 10000},
        {"from_km": 2, "to_km": 5, "fee": 15000},
    ]

    assert ShippingFeeCalculator.calculate_fee(Decimal("1.99"), tiers=tiers) == Decimal(
        "10000"
    )
    assert ShippingFeeCalculator.calculate_fee(Decimal("2.00"), tiers=tiers) == Decimal(
        "15000"
    )
    assert ShippingFeeCalculator.calculate_fee(Decimal("5.00"), tiers=tiers) == Decimal(
        "15000"
    )


@pytest.mark.django_db
def test_fee_rejects_legacy_gapped_tiers_instead_of_using_last_tier_fee():
    gapped_tiers = [
        {"from_km": 0, "to_km": 2, "fee": 10000},
        {"from_km": 3, "to_km": 5, "fee": 15000},
    ]

    with pytest.raises(OutOfDeliveryRadiusError):
        ShippingFeeCalculator.calculate_fee(Decimal("2.50"), tiers=gapped_tiers)
