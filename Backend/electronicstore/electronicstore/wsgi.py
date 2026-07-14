"""
WSGI config for electronicstore project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/6.0/howto/deployment/wsgi/
"""

import os
import sys
from pathlib import Path

# Add the project directory to sys.path
current_dir = Path(__file__).resolve().parent
project_dir = current_dir.parent
if str(project_dir) not in sys.path:
    sys.path.insert(0, str(project_dir))

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'electronicstore.settings')

application = get_wsgi_application()
app = application
