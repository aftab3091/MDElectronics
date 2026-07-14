import os
import django

# Set up django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'electronicstore.settings')
django.setup()

from store.models import Product
from store.db import db
from django.contrib.auth.models import User
from django.conf import settings
from PIL import Image, ImageDraw

def seed():
    print("Starting database seeding...")

    # 1. Create superuser if it doesn't exist
    if not User.objects.filter(username='admin').exists():
        User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
        print("Superuser created successfully (username: admin, password: admin123)")
    else:
        print("Superuser 'admin' already exists.")

    # 2. Define media paths and create folders
    media_dir = os.path.join(settings.MEDIA_ROOT, 'products')
    os.makedirs(media_dir, exist_ok=True)
    
    # Helper to create abstract device illustrations using Pillow
    def create_dummy_image(filename, label, bg_color):
        img_path = os.path.join(media_dir, filename)
        db_path = 'products/' + filename
        
        if os.path.exists(img_path):
            return db_path
        
        # Create a new image
        img = Image.new('RGB', (600, 600), color=bg_color)
        draw = ImageDraw.Draw(img)
        
        # Draw techy design elements
        draw.ellipse([50, 50, 550, 550], outline=(255, 255, 255), width=2)
        draw.ellipse([100, 100, 500, 500], outline=(255, 255, 255), width=1)
        
        # Add basic outlines based on device labels
        if 'Refrigerator' in label:
            # Refrigerator
            draw.rectangle([200, 140, 400, 460], outline=(255, 255, 255), width=4)
            draw.line([200, 280, 400, 280], fill=(255, 255, 255), width=3)
            draw.rectangle([360, 200, 380, 240], fill=(255, 255, 255))
            draw.rectangle([360, 320, 380, 380], fill=(255, 255, 255))
        elif 'Smart TV' in label:
            # TV
            draw.rectangle([120, 160, 480, 360], outline=(255, 255, 255), width=4)
            draw.polygon([(280, 360), (320, 360), (300, 400)], fill=(255, 255, 255))
        elif 'Microwave' in label:
            # Microwave
            draw.rectangle([140, 180, 460, 380], outline=(255, 255, 255), width=4)
            draw.rectangle([360, 210, 430, 350], outline=(255, 255, 255), width=2)
            draw.ellipse([395, 240, 405, 250], fill=(255, 255, 255))
            draw.ellipse([395, 270, 405, 280], fill=(255, 255, 255))
        elif 'Split AC' in label:
            # AC
            draw.rectangle([120, 220, 480, 320], outline=(255, 255, 255), width=4)
            draw.line([140, 300, 460, 300], fill=(255, 255, 255), width=2)
            draw.rectangle([420, 240, 450, 280], outline=(255, 255, 255), width=1)
        elif 'Washing Machine' in label:
            # Washing Machine
            draw.rectangle([180, 160, 420, 440], outline=(255, 255, 255), width=4)
            draw.ellipse([240, 240, 360, 360], outline=(255, 255, 255), width=4)
            draw.line([200, 200, 400, 200], fill=(255, 255, 255), width=3)
        elif 'Cooktop' in label:
            # Induction Cooktop
            draw.rectangle([160, 200, 440, 400], outline=(255, 255, 255), width=4)
            draw.ellipse([230, 230, 370, 370], outline=(255, 255, 255), width=6)
            draw.ellipse([250, 250, 350, 350], outline=(255, 255, 255), width=2)
        else:
            # Abstract circle
            draw.ellipse([200, 200, 400, 400], fill=(255, 255, 255))

        img.save(img_path)
        print(f"Generated mock image at {img_path}")
        return db_path

    # Define products with real local specifications, category names, and brand tags
    products = [
        {
            'name': 'Haier 320L Double Door Refrigerator',
            'price': 28500.00,
            'category': 'Home Appliances',
            'brand': 'Haier',
            'description': 'Frost-free double door refrigerator with twin inverter technology, 5-in-1 convertible modes, 320 liters capacity, and premium steel finish.',
            'image': create_dummy_image('refrigerator.png', 'Haier Refrigerator', (15, 23, 42))
        },
        {
            'name': 'LG 65" Ultra Smart TV',
            'price': 72000.00,
            'category': 'Smart TVs & Electronics',
            'brand': 'LG',
            'description': 'Cinematic Smart TV featuring a gorgeous 65-inch 4K UHD OLED screen, Dolby Vision HDR, integrated Dolby Atmos surround speakers, and active voice search capabilities.',
            'image': create_dummy_image('tv.png', 'LG 65" Ultra Smart TV', (30, 41, 59))
        },
        {
            'name': 'Prestige Induction Cooktop',
            'price': 3200.00,
            'category': 'Kitchen Appliances',
            'brand': 'Prestige',
            'description': 'Highly efficient kitchen cooktop with multi-preset cooking menus, dynamic heat control, child safety lock, and touch sensing display.',
            'image': create_dummy_image('cooktop.png', 'Prestige Induction Cooktop', (219, 39, 119))
        },
        {
            'name': 'Bosch Inverter Washing Machine',
            'price': 38500.00,
            'category': 'Home Appliances',
            'brand': 'Bosch',
            'description': 'Premium 8kg front-load washing machine with EcoSilence Drive motor, dynamic anti-vibration sidewalls, and anti-tangle safety control.',
            'image': create_dummy_image('washing_machine.png', 'Bosch Inverter Washing Machine', (13, 148, 136))
        },
        {
            'name': 'IFB 30L Convection Microwave Oven',
            'price': 16500.00,
            'category': 'Kitchen Appliances',
            'brand': 'IFB',
            'description': 'Premium convection microwave oven with 30 liters capacity, multi-stage cooking options, auto-cook menus, and starter kit included.',
            'image': create_dummy_image('microwave.png', 'IFB Convection Microwave', (126, 34, 206))
        },
        {
            'name': 'Voltas 1.5 Ton 5-Star Split AC',
            'price': 37500.00,
            'category': 'Home Appliances',
            'brand': 'Voltas',
            'description': 'High-efficiency split air conditioner with adjustable inverter compressor, active humidifier, anti-dust filters, and 5-star energy rating.',
            'image': create_dummy_image('ac.png', 'Voltas Split AC', (79, 70, 229))
        }
    ]

    # Clear MongoDB if connected
    if db is not None:
        try:
            db.products.delete_many({})
            print("Cleared existing products from MongoDB collection.")
        except Exception as e:
            print(f"Error clearing MongoDB: {e}")

    # Clean existing products to refresh with the updated brand schema
    Product.objects.all().delete()
    print("Cleared existing products from SQLite database.")

    for p_data in products:
        p = Product.objects.create(
            name=p_data['name'],
            price=p_data['price'],
            category=p_data['category'],
            brand=p_data['brand'],
            description=p_data['description'],
            image=p_data['image']
        )
        p.save() # Force save to trigger MongoDB sync signals
        print(f"Product '{p.name}' created and synced.")
            
    print("Database seeding completed successfully!")

if __name__ == '__main__':
    seed()
