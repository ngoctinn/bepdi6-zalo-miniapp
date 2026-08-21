from django.contrib import admin

from apps.customers.models import Address, Customer, User

admin.site.register(User)
admin.site.register(Customer)
admin.site.register(Address)
