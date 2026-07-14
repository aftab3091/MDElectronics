#!/bin/bash
pip install -r Backend/electronicstore/requirements.txt
python Backend/electronicstore/manage.py collectstatic --noinput --clear
