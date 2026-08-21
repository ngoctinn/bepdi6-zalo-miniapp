from django.contrib import admin
from apps.customers.models import User, Customer, Address

admin.site.register(User)
admin.site.register(Customer)
admin.site.register(Address)
