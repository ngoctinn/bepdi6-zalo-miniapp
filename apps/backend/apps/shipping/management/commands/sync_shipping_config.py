from django.core.management.base import BaseCommand, CommandError

from apps.shipping.models import ShopConfig


class Command(BaseCommand):
    help = "Canonicalize shipping tiers and synchronize the compatibility radius."

    def handle(self, *args, **options):
        config = ShopConfig.get_solo()
        try:
            changed = config.synchronize_shipping_config()
        except ValueError as exc:
            raise CommandError(f"Không thể đồng bộ shipping config: {exc}") from exc

        message = "Đã đồng bộ" if changed else "Shipping config đã đồng bộ"
        self.stdout.write(self.style.SUCCESS(message))
