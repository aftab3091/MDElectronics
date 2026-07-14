from django.contrib import admin
from .models import Product, Booking

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'price', 'category', 'brand')
    search_fields = ('name', 'category', 'brand')

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('user', 'product', 'quantity', 'status', 'date')
    search_fields = ('user__username', 'product__name')
    list_filter = ('status',)
