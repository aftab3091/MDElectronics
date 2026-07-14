import os
from django.db import models
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.contrib.auth.models import User
from .db import db

class Product(models.Model):
    name = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.CharField(max_length=100)
    brand = models.CharField(max_length=100, default='Generic')
    description = models.TextField()
    image = models.ImageField(upload_to='products/')

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        # Clear products query caches
        from django.core.cache import cache
        cache.delete('home_featured_products')
        cache.delete('all_products_default')
        
        super().save(*args, **kwargs)
        if self.image:
            try:
                from PIL import Image
                img_path = self.image.path
                if os.path.exists(img_path):
                    img = Image.open(img_path)
                    
                    # Convert transparent images to RGB format
                    if img.mode in ('RGBA', 'LA'):
                        background = Image.new('RGB', img.size, (255, 255, 255))
                        alpha = img.split()[3] if img.mode == 'RGBA' else img.split()[1]
                        background.paste(img, mask=alpha)
                        img = background
                    elif img.mode != 'RGB':
                        img = img.convert('RGB')
                        
                    # Resize to max 800px on either dimension
                    max_size = 800
                    if img.width > max_size or img.height > max_size:
                        img.thumbnail((max_size, max_size))
                        
                    # Save optimized image back
                    img.save(img_path, 'JPEG', quality=85, optimize=True)
            except Exception as e:
                print(f"Error optimizing product image: {e}")

@receiver(post_save, sender=Product)
def sync_to_mongodb(sender, instance, created, **kwargs):
    # Clear products query caches
    from django.core.cache import cache
    cache.delete('home_featured_products')
    cache.delete('all_products_default')

    if db is not None:
        try:
            image_url = instance.image.url if instance.image else None
            product_data = {
                "id": instance.id,
                "name": instance.name,
                "price": float(instance.price),
                "category": instance.category,
                "brand": instance.brand,
                "description": instance.description,
                "image_url": image_url
            }
            db.products.replace_one({"id": instance.id}, product_data, upsert=True)
            print(f"Synced Product '{instance.name}' (ID: {instance.id}) to MongoDB.")
        except Exception as e:
            print(f"Failed to sync Product to MongoDB: {e}")

@receiver(post_delete, sender=Product)
def delete_from_mongodb(sender, instance, **kwargs):
    # Clear products query caches
    from django.core.cache import cache
    cache.delete('home_featured_products')
    cache.delete('all_products_default')

    if db is not None:
        try:
            db.products.delete_one({"id": instance.id})
            print(f"Deleted Product '{instance.name}' (ID: {instance.id}) from MongoDB.")
        except Exception as e:
            print(f"Failed to delete Product from MongoDB: {e}")

class Booking(models.Model):
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Confirmed', 'Confirmed'),
        ('Accepted', 'Accepted'),
        ('Delivered', 'Delivered'),
        ('Cancelled', 'Cancelled'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookings')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='bookings')
    quantity = models.PositiveIntegerField(default=1)
    date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')

    def __str__(self):
        return f"{self.user.username} booked {self.product.name} ({self.quantity})"

@receiver(post_save, sender=Booking)
def sync_booking_to_mongodb(sender, instance, created, **kwargs):
    if db is not None:
        try:
            booking_data = {
                "id": instance.id,
                "user": {
                    "id": instance.user.id,
                    "username": instance.user.username,
                    "email": instance.user.email,
                },
                "product": {
                    "id": instance.product.id,
                    "name": instance.product.name,
                    "price": float(instance.product.price),
                },
                "quantity": instance.quantity,
                "date": instance.date.isoformat() if instance.date else None,
                "status": instance.status
            }
            db.bookings.replace_one({"id": instance.id}, booking_data, upsert=True)
            print(f"Synced Booking ID {instance.id} to MongoDB.")
        except Exception as e:
            print(f"Failed to sync Booking to MongoDB: {e}")

@receiver(post_delete, sender=Booking)
def delete_booking_from_mongodb(sender, instance, **kwargs):
    if db is not None:
        try:
            db.bookings.delete_one({"id": instance.id})
            print(f"Deleted Booking ID {instance.id} from MongoDB.")
        except Exception as e:
            print(f"Failed to delete Booking from MongoDB: {e}")

@receiver(post_save, sender=User)
def sync_user_to_mongodb(sender, instance, created, **kwargs):
    if db is not None:
        try:
            user_data = {
                "id": instance.id,
                "username": instance.username,
                "email": instance.email,
                "is_superuser": instance.is_superuser,
                "is_active": instance.is_active,
                "date_joined": instance.date_joined.isoformat() if instance.date_joined else None
            }
            db.users.replace_one({"id": instance.id}, user_data, upsert=True)
            print(f"Synced User '{instance.username}' (ID: {instance.id}) to MongoDB.")
        except Exception as e:
            print(f"Failed to sync User to MongoDB: {e}")

@receiver(post_delete, sender=User)
def delete_user_from_mongodb(sender, instance, **kwargs):
    if db is not None:
        try:
            db.users.delete_one({"id": instance.id})
            print(f"Deleted User '{instance.username}' (ID: {instance.id}) from MongoDB.")
        except Exception as e:
            print(f"Failed to delete User from MongoDB: {e}")
