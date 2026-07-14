from django.urls import path
from . import views

app_name = 'store'

urlpatterns = [
    path('', views.home, name='home'),
    path('products/', views.products, name='products'),
    path('product/<int:id>/', views.product_detail, name='product_detail'),
    path('contact/', views.contact, name='contact'),
    
    # User Authentication & Bookings
    path('register/', views.user_register, name='register'),
    path('login/', views.user_login, name='login'),
    path('logout/', views.user_logout, name='logout'),
    path('book/<int:product_id>/', views.book_product, name='book_product'),
    path('my-bookings/', views.my_bookings, name='my_bookings'),
    
    # Custom Admin Control Panel API Endpoints
    path('api/admin/login/', views.api_admin_login, name='api_admin_login'),
    path('api/admin/logout/', views.api_admin_logout, name='api_admin_logout'),
    path('api/admin/stats/', views.api_admin_stats, name='api_admin_stats'),
    path('api/admin/products/', views.api_admin_products, name='api_admin_products'),
    path('api/admin/products/save/', views.api_admin_products_save, name='api_admin_products_save'),
    path('api/admin/products/delete/<int:id>/', views.api_admin_products_delete, name='api_admin_products_delete'),
    path('api/admin/shop/', views.api_admin_shop, name='api_admin_shop'),
    path('api/admin/gallery/', views.api_admin_gallery, name='api_admin_gallery'),
    path('api/admin/ledger/', views.api_admin_ledger, name='api_admin_ledger'),
    path('api/admin/offers/', views.api_admin_offers, name='api_admin_offers'),
    path('api/admin/instagram/', views.api_admin_instagram, name='api_admin_instagram'),
    path('api/admin/orders/', views.api_admin_orders, name='api_admin_orders'),
    path('api/admin/orders/save/', views.api_admin_orders_save, name='api_admin_orders_save'),
    path('api/admin/orders/update/', views.api_admin_orders_update, name='api_admin_orders_update'),
    path('api/order/track/', views.api_track_order, name='api_track_order'),
]
