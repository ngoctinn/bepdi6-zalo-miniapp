#!/usr/bin/env bash
# exit on error
set -o errexit

# Identify project root
if [ -f "pyproject.toml" ]; then
    PYPROJECT_PATH="pyproject.toml"
elif [ -f "../../pyproject.toml" ]; then
    PYPROJECT_PATH="../../pyproject.toml"
else
    PYPROJECT_PATH="pyproject.toml"
fi

pip install -U uv
uv pip install --system -r "$PYPROJECT_PATH"

python manage.py collectstatic --no-input
python manage.py migrate

