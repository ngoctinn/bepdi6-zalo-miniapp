from decimal import Decimal

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _


class ShopConfig(models.Model):
    """
    Shop configuration master model (Singleton Pattern).
    Stores store info, operational parameters, shipping tiers, and VietQR payment details.
    """

    DEFAULT_SHIPPING_TIERS = [
        {"from_km": 0.0, "to_km": 2.0, "fee": 10000.0},
        {"from_km": 2.0, "to_km": 5.0, "fee": 15000.0},
        {"from_km": 5.0, "to_km": 7.0, "fee": 20000.0},
    ]

    shop_name = models.CharField(
        max_length=255, default="Bếp Dì 6", verbose_name="Tên cửa hàng"
    )
    hotline = models.CharField(
        max_length=20, blank=True, default="0901234567", verbose_name="Hotline CSKH"
    )
    address_text = models.TextField(
        blank=True,
        default="123 Đường Số 1, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
        verbose_name="Địa chỉ cửa hàng",
    )
    announcement_banner = models.TextField(
        blank=True, default="", verbose_name="Thông báo banner quán"
    )

    # Geo location & Distance
    latitude = models.DecimalField(
        max_digits=10,
        decimal_places=8,
        default=Decimal(str(getattr(settings, "SHOP_LATITUDE", 10.7769))),
        verbose_name="Vĩ độ quán",
    )
    longitude = models.DecimalField(
        max_digits=11,
        decimal_places=8,
        default=Decimal(str(getattr(settings, "SHOP_LONGITUDE", 106.7009))),
        verbose_name="Kinh độ quán",
    )
    max_delivery_radius_km = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        default=Decimal(str(getattr(settings, "MAX_DELIVERY_RADIUS_KM", 7.0))),
        verbose_name="Bán kính giao tối đa (km)",
    )
    haversine_multiplier = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        default=Decimal(str(getattr(settings, "HAVERSINE_MULTIPLIER", 1.3))),
        verbose_name="Hệ số uốn lượn đường đi",
    )

    # Operational status & hours
    is_open = models.BooleanField(
        default=True,
        help_text="Bật / tắt nhận đơn hàng trực tuyến",
        verbose_name="Đang mở cửa nhận đơn",
    )
    open_time = models.TimeField(
        blank=True,
        null=True,
        help_text="Giờ mở cửa (VD: 07:00)",
        verbose_name="Giờ mở cửa",
    )
    close_time = models.TimeField(
        blank=True,
        null=True,
        help_text="Giờ đóng cửa (VD: 21:30)",
        verbose_name="Giờ đóng cửa",
    )
    prep_time_minutes = models.PositiveIntegerField(
        default=20,
        help_text="Thời gian chuẩn bị món ước tính mặc định của quán (phút)",
        verbose_name="Thời gian chuẩn bị món (phút)",
    )

    # Order & Shipping thresholds
    min_order_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
        help_text="Giá trị đơn hàng tối thiểu để được đặt giao hàng (0 = không giới hạn)",
        verbose_name="Đơn hàng tối thiểu",
    )
    min_order_for_freeship = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
        help_text="Ngưỡng giá trị đơn hàng được miễn phí giao hàng (0 = không áp dụng)",
        verbose_name="Ngưỡng Freeship",
    )
    shipping_tiers = models.JSONField(
        default=list,
        blank=True,
        help_text="Bảng bậc thang phí ship: [{from_km, to_km, fee}]",
        verbose_name="Bảng bậc thang phí ship",
    )

    # VietQR payment details
    vietqr_bank_id = models.CharField(
        max_length=20,
        default=getattr(settings, "VIETQR_BANK_ID", "MB"),
        help_text="Mã ngân hàng (VD: MB, VCB, TCB)",
        verbose_name="Ngân hàng VietQR",
    )
    vietqr_account_no = models.CharField(
        max_length=50,
        blank=True,
        default=getattr(settings, "VIETQR_ACCOUNT_NO", ""),
        help_text="Số tài khoản ngân hàng nhận tiền",
        verbose_name="Số tài khoản",
    )
    vietqr_account_name = models.CharField(
        max_length=255,
        default=getattr(settings, "VIETQR_ACCOUNT_NAME", "BEP DI 6"),
        help_text="Tên chủ tài khoản",
        verbose_name="Tên chủ tài khoản",
    )

    updated_at = models.DateTimeField(auto_now=True, verbose_name="Cập nhật lần cuối")

    class Meta:
        db_table = "shop_configs"
        verbose_name = _("Cấu hình Quán")
        verbose_name_plural = _("Cấu hình Quán")

    def __str__(self) -> str:
        return f"{self.shop_name} Configuration"

    def save(self, *args, **kwargs):
        # Enforce singleton pattern (id=1)
        self.pk = 1
        if not self.shipping_tiers:
            self.shipping_tiers = self.DEFAULT_SHIPPING_TIERS
        super().save(*args, **kwargs)

    @classmethod
    def get_solo(cls) -> "ShopConfig":
        """Gets or creates the singleton configuration instance."""
        config, created = cls.objects.get_or_create(
            pk=1,
            defaults={
                "shipping_tiers": cls.DEFAULT_SHIPPING_TIERS,
            },
        )
        if not config.shipping_tiers:
            config.shipping_tiers = cls.DEFAULT_SHIPPING_TIERS
            config.save(update_fields=["shipping_tiers"])
        return config
