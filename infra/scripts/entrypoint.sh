#!/usr/bin/env bash
set -e

# Optional: wait for database if DATABASE_URL is defined
if [ -n "$DATABASE_URL" ]; then
    echo "Checking database connection..."
    python -c "
import sys, time
import psycopg

db_url = '${DATABASE_URL}'
for attempt in range(30):
    try:
        conn = psycopg.connect(db_url, connect_timeout=3)
        conn.close()
        print('Database connection established successfully.')
        sys.exit(0)
    except Exception as e:
        print(f'Waiting for database to accept connections... ({attempt+1}/30)')
        time.sleep(1)
print('Failed to connect to database after 30 attempts.')
sys.exit(1)
"
fi

# If starting web server (gunicorn), run migrations and collectstatic
if [ "$1" = "gunicorn" ]; then
    echo "Running database migrations..."
    python apps/backend/manage.py migrate --noinput

    echo "Collecting static files for WhiteNoise..."
    python apps/backend/manage.py collectstatic --noinput
fi

exec "$@"
