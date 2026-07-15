#!/bin/bash
pip install -r requirements.txt
python3 Backend/electronicstore/manage.py collectstatic --noinput --clear

# Copy media files into staticfiles directory so Vercel can deploy and serve them as static assets
cp -r media staticfiles/

