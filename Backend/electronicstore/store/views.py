from django.shortcuts import render, get_object_or_404, redirect
from .models import Product, Booking
from .db import db
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.contrib import messages
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.core.files.storage import default_storage
from django.conf import settings
import json
import os
from django.core.cache import cache

class MongoImage:
    """Wrapper to make MongoDB image URL compatible with Django's {{ product.image.url }} syntax"""
    def __init__(self, url):
        self.url = url

def get_shop_config():
    config = cache.get('shop_config')
    if not config:
        config = load_json_file('shop_config.json', default_val={
            'name': 'MD Electronics',
            'tagline': 'Serving Punganur region with premium electronics & smart home appliances',
            'description': 'Proprietor M.D. Aftab. Authorized partner for LG, Bosch, Voltas, IFB, Prestige.',
            'phone': '+91 98765 43210',
            'hours': 'Everyday: 9:00 AM - 9:00 PM',
            'address': 'D.No. 27-57/3, Gokul Circle, Chowdepalle Street, Punganur, Chittoor District, AP - 517247',
            'experience_years': 15,
            'customers_count': 10000,
            'awards': ['Authorized gold partner seal'],
            'owner_name': 'M.D. Aftab',
            'owner_bio': 'Welcome to MD Electronics. We have been serving the Punganur region for over 15 years with premium products, quick delivery, and dedicated customer support.',
            'owner_photo_url': None
        })
        cache.set('shop_config', config, 3600)
    return config

def home(request):
    shop = {
        "name": "MD Electronics Punganur",
        "tagline": "Trusted electronics store",
        "address": "Gokul Circle, Punganur",
        "owner_bio": "Serving customers for 15+ years"
    }
    config = get_shop_config()
    for key, val in config.items():
        if key not in shop:
            shop[key] = val

    products_list = cache.get('home_featured_products')
    if not products_list:
        products_list = list(Product.objects.all()[:3])
        cache.set('home_featured_products', products_list, 600)

    offers = load_json_file('offers.json', default_val=[])
    active_offers = [o for o in offers if o.get('active')]
    instagram_posts = load_json_file('instagram.json', default_val=[])
    
    # Process Instagram links into clean embed format
    import re
    processed_posts = []
    for post in instagram_posts:
        url = post.get('url', '')
        # Matches /p/code or /reel/code, allowing for optional trailing slashes and query strings
        match = re.search(r'instagram\.com/(p|reel)/([A-Za-z0-9_\-]+)', url)
        if match:
            code = match.group(2)
            embed_url = f"https://www.instagram.com/p/{code}/embed/"
        else:
            embed_url = url
        processed_posts.append({
            'id': post.get('id'),
            'url': url,
            'embed_url': embed_url,
            'added_on': post.get('added_on')
        })
        
    return render(request, 'home.html', {
        'products': products_list, 
        'shop': shop,
        'active_offers': active_offers,
        'instagram_posts': processed_posts
    })

def products(request):
    # Get parameters
    categories = request.GET.getlist('category')
    if not categories:
        single_cat = request.GET.get('category')
        if single_cat:
            categories = [single_cat]
            
    brands = request.GET.getlist('brand')
    
    try:
        min_price = float(request.GET.get('min_price', 1000))
        max_price = float(request.GET.get('max_price', 120000))
    except ValueError:
        min_price = 1000
        max_price = 120000
        
    sort_by = request.GET.get('sort_by', 'popularity')
    
    # Check if default query (no filters)
    min_price_str = request.GET.get('min_price')
    max_price_str = request.GET.get('max_price')
    is_default = not categories and not brands and min_price_str is None and max_price_str is None and sort_by in ['popularity', None]
    
    if is_default:
        all_products = cache.get('all_products_default')
        if not all_products:
            all_products = list(Product.objects.all())
            cache.set('all_products_default', all_products, 600)
    else:
        all_products = Product.objects.all()
        if categories:
            all_products = all_products.filter(category__in=categories)
        if brands:
            all_products = all_products.filter(brand__in=brands)
            
        all_products = all_products.filter(price__gte=min_price, price__lte=max_price)
        
        if sort_by == 'price_asc':
            all_products = all_products.order_by('price')
        elif sort_by == 'price_desc':
            all_products = all_products.order_by('-price')
        
    return render(request, 'products.html', {
        'products': all_products,
        'selected_categories': categories,
        'selected_brands': brands,
        'min_price': min_price,
        'max_price': max_price,
        'sort_by': sort_by,
        'shop': get_shop_config()
    })

def product_detail(request, id):
    product = get_object_or_404(Product, id=id)
    return render(request, 'product_detail.html', {'product': product, 'shop': get_shop_config()})

def contact(request):
    return render(request, 'contact.html', {'shop': get_shop_config()})

# JSON Persistence Helpers
def load_json_file(filename, default_val=[]):
    path = os.path.join(settings.BASE_DIR, filename)
    if not os.path.exists(path):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, 'w') as f:
            json.dump(default_val, f)
        return default_val
    try:
        with open(path, 'r') as f:
            return json.load(f)
    except:
        return default_val

def save_json_file(filename, data):
    path = os.path.join(settings.BASE_DIR, filename)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w') as f:
        json.dump(data, f, indent=4)

# Custom Admin Dashboard Panel
def admin_panel(request):
    return render(request, 'store/admin_panel.html')

@csrf_exempt
def api_admin_login(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            username = data.get('username')
            password = data.get('password')
            user = authenticate(request, username=username, password=password)
            if user is not None and user.is_superuser:
                login(request, user)
                return JsonResponse({'success': True})
            else:
                return JsonResponse({'success': False, 'message': 'Invalid username or password, or not an administrator.'})
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)})
    return JsonResponse({'success': False, 'message': 'POST request required.'})

@csrf_exempt
def api_admin_logout(request):
    logout(request)
    return JsonResponse({'success': True})

def is_admin(user):
    return user.is_authenticated and user.is_superuser

def api_admin_stats(request):
    if not is_admin(request.user):
        return JsonResponse({'error': 'Unauthorized'}, status=401)
    
    ledger = load_json_file('ledger.json', default_val=[])
    products_count = Product.objects.count()
    
    total_sales = sum(item.get('paid', 0) for item in ledger)
    total_dues = sum(item.get('due', 0) for item in ledger)
    
    recent_ledger = ledger[-5:] if len(ledger) > 5 else ledger
    
    return JsonResponse({
        'total_sales': total_sales,
        'total_dues': total_dues,
        'total_customers': len(ledger),
        'total_products': products_count,
        'recent_ledger': recent_ledger[::-1]
    })

def api_admin_products(request):
    if not is_admin(request.user):
        return JsonResponse({'error': 'Unauthorized'}, status=401)
        
    prod_id = request.GET.get('id')
    if prod_id:
        p = get_object_or_404(Product, id=prod_id)
        try:
            specs_json = json.loads(p.description.split('Specs: ')[1]) if 'Specs: ' in p.description else {}
        except:
            specs_json = {}
        return JsonResponse({
            'id': p.id,
            'name': p.name,
            'brand': p.brand,
            'category': p.category,
            'price': p.price,
            'original_price': p.price,
            'stock': 10,
            'badge': 'Special',
            'description': p.description,
            'image_url': p.image.url if p.image else None,
            'specs_json': specs_json
        })
        
    products_list = []
    for p in Product.objects.all():
        products_list.append({
            'id': p.id,
            'name': p.name,
            'brand': p.brand,
            'category': p.category,
            'price': p.price,
            'original_price': p.price,
            'stock': 10,
            'badge': 'Special',
            'description': p.description,
            'image_url': p.image.url if p.image else None
        })
    return JsonResponse(products_list, safe=False)

@csrf_exempt
def api_admin_products_save(request):
    if not is_admin(request.user):
        return JsonResponse({'error': 'Unauthorized'}, status=401)
        
    if request.method == 'POST':
        try:
            prod_id = request.POST.get('id')
            name = request.POST.get('name')
            brand = request.POST.get('brand')
            category = request.POST.get('category')
            price = float(request.POST.get('price'))
            description = request.POST.get('description', '')
            remove_image = request.POST.get('remove_image') == 'true'
            
            if prod_id and prod_id != 'null' and prod_id.strip() != '':
                p = get_object_or_404(Product, id=int(prod_id))
                p.name = name
                p.brand = brand
                p.category = category
                p.price = price
                p.description = description
            else:
                p = Product(
                    name=name,
                    brand=brand,
                    category=category,
                    price=price,
                    description=description
                )
                
            if remove_image:
                p.image = None
            elif 'image' in request.FILES:
                p.image = request.FILES['image']
                
            p.save()
            return JsonResponse({'success': True})
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)})
            
    return JsonResponse({'success': False, 'message': 'POST required.'})

@csrf_exempt
def api_admin_products_delete(request, id):
    if not is_admin(request.user):
        return JsonResponse({'error': 'Unauthorized'}, status=401)
        
    if request.method == 'POST':
        try:
            p = get_object_or_404(Product, id=id)
            p.delete()
            return JsonResponse({'success': True})
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)})
    return JsonResponse({'success': False, 'message': 'POST required.'})

@csrf_exempt
def api_admin_shop(request):
    if not is_admin(request.user):
        return JsonResponse({'error': 'Unauthorized'}, status=401)
        
    if request.method == 'GET':
        config = load_json_file('shop_config.json', default_val={
            'name': 'MD Electronics',
            'tagline': 'Serving Punganur region with premium electronics & smart home appliances',
            'description': 'Proprietor M.D. Aftab. Authorized partner for LG, Bosch, Voltas, IFB, Prestige.',
            'phone': '+91 98765 43210',
            'hours': 'Everyday: 9:00 AM - 9:00 PM',
            'address': 'D.No. 27-57/3, Gokul Circle, Chowdepalle Street, Punganur, Chittoor District, AP - 517247',
            'experience_years': 15,
            'customers_count': 10000,
            'awards': ['Authorized gold partner seal'],
            'owner_name': 'M.D. Aftab',
            'owner_bio': 'Welcome to MD Electronics. We have been serving the Punganur region for over 15 years with premium products, quick delivery, and dedicated customer support.',
            'owner_photo_url': None
        })
        return JsonResponse(config)
        
    elif request.method == 'POST':
        try:
            config = load_json_file('shop_config.json', default_val={})
            
            if request.content_type == 'application/json':
                data = json.loads(request.body)
                config_type = data.get('type')
                
                if config_type == 'identity':
                    config['name'] = data.get('name')
                    config['tagline'] = data.get('tagline')
                    config['description'] = data.get('description')
                    config['phone'] = data.get('phone')
                    config['hours'] = data.get('hours')
                    config['address'] = data.get('address')
                elif config_type == 'achievements':
                    config['experience_years'] = int(data.get('experience_years', 15))
                    config['customers_count'] = int(data.get('customers_count', 10000))
                    config['awards'] = [item.strip() for item in data.get('awards', '').split(',') if item.strip()]
            else:
                config_type = request.POST.get('type')
                if config_type == 'about':
                    config['owner_name'] = request.POST.get('owner_name')
                    config['owner_bio'] = request.POST.get('owner_bio')
                    
                    if 'owner_photo' in request.FILES:
                        photo = request.FILES['owner_photo']
                        path = default_storage.save('gallery/owner_photo.png', photo)
                        config['owner_photo_url'] = settings.MEDIA_URL + path
                        
            save_json_file('shop_config.json', config)
            cache.delete('shop_config')
            return JsonResponse({'success': True})
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)})

@csrf_exempt
def api_admin_gallery(request):
    if not is_admin(request.user):
        return JsonResponse({'error': 'Unauthorized'}, status=401)
        
    gallery_dir = os.path.join(settings.MEDIA_ROOT, 'gallery')
    os.makedirs(gallery_dir, exist_ok=True)
        
    if request.method == 'GET':
        photos = []
        for f in os.listdir(gallery_dir):
            if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
                photos.append({
                    'name': f,
                    'url': settings.MEDIA_URL + 'gallery/' + f
                })
        return JsonResponse(photos, safe=False)
        
    elif request.method == 'POST':
        try:
            if 'image' in request.FILES:
                image = request.FILES['image']
                filename = image.name
                save_path = os.path.join(gallery_dir, filename)
                with open(save_path, 'wb+') as destination:
                    for chunk in image.chunks():
                        destination.write(chunk)
                return JsonResponse({'success': True})
            return JsonResponse({'success': False, 'message': 'No image file.'})
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)})
            
    elif request.method == 'DELETE':
        try:
            name = request.GET.get('name')
            if name:
                file_path = os.path.join(gallery_dir, name)
                if os.path.exists(file_path):
                    os.remove(file_path)
                return JsonResponse({'success': True})
            return JsonResponse({'success': False, 'message': 'No filename provided.'})
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)})

@csrf_exempt
def api_admin_ledger(request):
    if not is_admin(request.user):
        return JsonResponse({'error': 'Unauthorized'}, status=401)
        
    ledger = load_json_file('ledger.json', default_val=[
        {
            "id": "1",
            "name": "M.D. Ali",
            "phone": "9876543211",
            "items": "LG 65\" Ultra Smart TV",
            "total": 75000,
            "paid": 70000,
            "due": 5000
        }
    ])
    
    if request.method == 'GET':
        ledger_id = request.GET.get('id')
        if ledger_id:
            item = next((x for x in ledger if x['id'] == ledger_id), None)
            if item:
                return JsonResponse(item)
            return JsonResponse({'error': 'Not found'}, status=404)
        return JsonResponse(ledger, safe=False)
        
    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            ledger_id = data.get('id')
            
            name = data.get('name')
            phone = data.get('phone')
            items = data.get('items')
            total = float(data.get('total'))
            paid = float(data.get('paid'))
            due = total - paid
            
            if ledger_id and ledger_id != 'null' and ledger_id.strip() != '':
                for x in ledger:
                    if x['id'] == ledger_id:
                        x.update({
                            'name': name,
                            'phone': phone,
                            'items': items,
                            'total': total,
                            'paid': paid,
                            'due': due
                        })
                        break
            else:
                new_id = str(len(ledger) + 1)
                ledger.append({
                    'id': new_id,
                    'name': name,
                    'phone': phone,
                    'items': items,
                    'total': total,
                    'paid': paid,
                    'due': due
                })
            save_json_file('ledger.json', ledger)
            return JsonResponse({'success': True})
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)})
            
    elif request.method == 'DELETE':
        try:
            ledger_id = request.GET.get('id')
            if ledger_id:
                ledger = [x for x in ledger if x['id'] != ledger_id]
                save_json_file('ledger.json', ledger)
                return JsonResponse({'success': True})
            return JsonResponse({'success': False, 'message': 'No ID provided.'})
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)})

@csrf_exempt
def api_admin_offers(request):
    if not is_admin(request.user):
        return JsonResponse({'error': 'Unauthorized'}, status=401)
        
    offers = load_json_file('offers.json', default_val=[
        {
            "id": "1",
            "title": "Festival Gold Mega Deals",
            "description": "Get instant discounts up to 40% on LG and Bosch Home Appliances. Valid this week.",
            "promocode": "FESTIVE40",
            "color": "#e11d48",
            "active": True
        }
    ])
    
    if request.method == 'GET':
        offer_id = request.GET.get('id')
        if offer_id:
            item = next((x for x in offers if x['id'] == offer_id), None)
            if item:
                return JsonResponse(item)
            return JsonResponse({'error': 'Not found'}, status=404)
        return JsonResponse(offers, safe=False)
        
    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            offer_id = data.get('id')
            
            title = data.get('title')
            description = data.get('description')
            promocode = data.get('promocode')
            color = data.get('color')
            active = data.get('active')
            
            if offer_id and offer_id != 'null' and offer_id.strip() != '':
                for x in offers:
                    if x['id'] == offer_id:
                        x.update({
                            'title': title,
                            'description': description,
                            'promocode': promocode,
                            'color': color,
                            'active': active
                        })
                        break
            else:
                new_id = str(len(offers) + 1)
                offers.append({
                    'id': new_id,
                    'title': title,
                    'description': description,
                    'promocode': promocode,
                    'color': color,
                    'active': active
                })
            save_json_file('offers.json', offers)
            return JsonResponse({'success': True})
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)})
            
    elif request.method == 'DELETE':
        try:
            offer_id = request.GET.get('id')
            if offer_id:
                offers = [x for x in offers if x['id'] != offer_id]
                save_json_file('offers.json', offers)
                return JsonResponse({'success': True})
            return JsonResponse({'success': False, 'message': 'No ID provided.'})
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)})

@csrf_exempt
def api_admin_instagram(request):
    if not is_admin(request.user):
        return JsonResponse({'error': 'Unauthorized'}, status=401)
        
    links = load_json_file('instagram.json', default_val=[
        {
            "id": "1",
            "url": "https://www.instagram.com/p/Cw9vP61Sg8t/",
            "added_on": "2026-07-10"
        }
    ])
    
    if request.method == 'GET':
        return JsonResponse(links, safe=False)
        
    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            url = data.get('url')
            link_id = data.get('id')
            
            if link_id:
                # Update existing
                found = False
                for item in links:
                    if item['id'] == str(link_id):
                        item['url'] = url
                        found = True
                        break
                if found:
                    save_json_file('instagram.json', links)
                    return JsonResponse({'success': True})
                return JsonResponse({'success': False, 'message': 'Instagram link not found.'})
            else:
                # Create new
                import datetime
                today = datetime.date.today().isoformat()
                new_id = str(max([int(x['id']) for x in links]) + 1) if links else "1"
                links.append({
                    'id': new_id,
                    'url': url,
                    'added_on': today
                })
                save_json_file('instagram.json', links)
                return JsonResponse({'success': True})
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)})
            
    elif request.method == 'DELETE':
        try:
            link_id = request.GET.get('id')
            if link_id:
                links = [x for x in links if x['id'] != link_id]
                save_json_file('instagram.json', links)
                return JsonResponse({'success': True})
            return JsonResponse({'success': False, 'message': 'No ID provided.'})
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)})

@csrf_exempt
def api_admin_orders(request):
    if not is_admin(request.user):
        return JsonResponse({'error': 'Unauthorized'}, status=401)
    
    # Load custom orders from JSON
    orders = load_json_file('orders.json', default_val=[])
    
    # Load database Bookings and convert them to the matching order format
    db_bookings = []
    for b in Booking.objects.select_related('user', 'product').all():
        db_bookings.append({
            'id': f"BKG-{b.id}",
            'customer_name': b.user.username,
            'customer_phone': 'N/A',
            'customer_address': 'Booked Online',
            'items': [{
                'id': b.product.id,
                'name': b.product.name,
                'price': float(b.product.price),
                'qty': b.quantity
            }],
            'total_amount': float(b.product.price * b.quantity),
            'payment_method': 'online_booking',
            'status': b.status,
            'date': b.date.strftime("%Y-%m-%d %H:%M")
        })
        
    merged_orders = db_bookings + orders
    try:
        merged_orders.sort(key=lambda x: x.get('date', ''), reverse=True)
    except:
        pass
        
    return JsonResponse(merged_orders, safe=False)

@csrf_exempt
def api_admin_orders_save(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            orders = load_json_file('orders.json', default_val=[])
            
            import random
            order_id = 'MDE-' + str(random.randint(100000, 999999))
            
            import datetime
            today = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
            
            new_order = {
                'id': order_id,
                'customer_name': data.get('customer_name'),
                'customer_phone': data.get('customer_phone'),
                'customer_address': data.get('customer_address'),
                'items': data.get('items', []),
                'total_amount': float(data.get('total_amount', 0)),
                'payment_method': data.get('payment_method', 'cod'),
                'status': 'Pending',
                'date': today
            }
            orders.append(new_order)
            save_json_file('orders.json', orders)
            return JsonResponse({'success': True, 'order_id': order_id})
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)})
    return JsonResponse({'success': False, 'message': 'POST required'})

@csrf_exempt
def api_admin_orders_update(request):
    if not is_admin(request.user):
        return JsonResponse({'error': 'Unauthorized'}, status=401)
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            order_id = data.get('id')
            new_status = data.get('status')
            
            if order_id and order_id.startswith('BKG-'):
                try:
                    booking_id = int(order_id.replace('BKG-', ''))
                    booking = Booking.objects.get(id=booking_id)
                    booking.status = new_status
                    booking.save()
                    return JsonResponse({'success': True})
                except Booking.DoesNotExist:
                    return JsonResponse({'success': False, 'message': 'Booking not found'})
            else:
                orders = load_json_file('orders.json', default_val=[])
                found = False
                for o in orders:
                    if o['id'] == order_id:
                        o['status'] = new_status
                        found = True
                        break
                if found:
                    save_json_file('orders.json', orders)
                    return JsonResponse({'success': True})
                return JsonResponse({'success': False, 'message': 'Order not found'})
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)})
    return JsonResponse({'success': False, 'message': 'POST required'})

def api_track_order(request):
    order_id = request.GET.get('id')
    if not order_id:
        return JsonResponse({'error': 'Missing ID'}, status=400)
    orders = load_json_file('orders.json', default_val=[])
    order = next((o for o in orders if o['id'] == order_id), None)
    if order:
        return JsonResponse({
            'id': order['id'],
            'status': order['status'],
            'customer_name': order['customer_name'],
            'date': order['date']
        })
    return JsonResponse({'error': 'Order not found'}, status=404)

def user_register(request):
    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            messages.success(request, "Registration successful. Welcome to MD Electronics!")
            return redirect('store:home')
    else:
        form = UserCreationForm()
    return render(request, 'register.html', {'form': form, 'shop': get_shop_config()})

def user_login(request):
    if request.method == 'POST':
        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            username = form.cleaned_data.get('username')
            password = form.cleaned_data.get('password')
            user = authenticate(username=username, password=password)
            if user is not None:
                login(request, user)
                next_url = request.GET.get('next') or request.POST.get('next')
                if next_url:
                    return redirect(next_url)
                return redirect('store:home')
        messages.error(request, "Invalid username or password.")
    else:
        form = AuthenticationForm()
    return render(request, 'login.html', {'form': form, 'shop': get_shop_config(), 'next': request.GET.get('next', '')})

def user_logout(request):
    logout(request)
    return redirect('store:home')

@login_required(login_url='store:login')
def book_product(request, product_id):
    product = get_object_or_404(Product, id=product_id)
    quantity = 1
    if request.method == 'POST':
        try:
            quantity = int(request.POST.get('quantity', 1))
        except ValueError:
            quantity = 1
            
    Booking.objects.create(
        user=request.user,
        product=product,
        quantity=quantity,
        status='Pending'
    )
    messages.success(request, f"Successfully booked {product.name}!")
    return redirect('store:my_bookings')

@login_required(login_url='store:login')
def my_bookings(request):
    bookings = Booking.objects.filter(user=request.user).select_related('product').order_by('-date')
    return render(request, 'dashboard.html', {
        'bookings': bookings,
        'shop': get_shop_config()
    })
