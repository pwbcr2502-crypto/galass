#!/bin/sh

# Set default environment variables if not provided
export VITE_API_BASE_URL=${VITE_API_BASE_URL:-"http://localhost:3000"}

# Replace environment variables in built files
if [ -f /usr/share/nginx/html/index.html ]; then
    # Find all JS files and replace environment variable placeholders
    for file in /usr/share/nginx/html/assets/*.js; do
        if [ -f "$file" ]; then
            sed -i "s|VITE_API_BASE_URL_PLACEHOLDER|${VITE_API_BASE_URL}|g" "$file" || true
        fi
    done
fi

# Start nginx
exec "$@"