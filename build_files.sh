#!/bin/bash
pip install -r requirements.txt
python3 Backend/electronicstore/manage.py collectstatic --noinput --clear
