#!/bin/bash
gunicorn --bind 0.0.0.0:$PORT server:app --workers 1
