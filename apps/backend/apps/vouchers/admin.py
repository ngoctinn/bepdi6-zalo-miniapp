from django.contrib import admin

from apps.vouchers.models import Voucher, VoucherUsage

admin.site.register(Voucher)
admin.site.register(VoucherUsage)
