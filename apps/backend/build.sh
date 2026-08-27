#!/usr/bin/env bash
# exit on error
set -o errexit

# Sync dependencies using native uv
if [ -f "../../pyproject.toml" ]; then
    (cd ../.. && uv sync)
else
    uv sync
fi

# Run collectstatic & migrate inside uv environment
uv run python manage.py collectstatic --no-input
uv run python manage.py migrate


