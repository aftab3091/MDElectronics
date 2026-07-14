#!/bin/bash
pip install -r requirements.txt
python Backend/electronicstore/manage.py collectstatic --noinput --clear
