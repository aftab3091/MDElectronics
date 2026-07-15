import os
import sys
from pathlib import Path

# Insert the Django project folder into python search path
project_root = Path(__file__).resolve().parent.parent / "Backend" / "electronicstore"
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

# Set default settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'electronicstore.settings')

# Expose Django WSGI application for Vercel
from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
app = application
