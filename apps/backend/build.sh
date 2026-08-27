#!/usr/bin/env bash
# exit on error
set -o errexit

pip install uv
uv pip install --system -r pyproject.toml

python manage.py collectstatic --no-input
python manage.py migrate
