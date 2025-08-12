#!/bin/sh

# Replace environment variables in JavaScript files
if [ -n "$VUE_APP_API_BASE_URL" ]; then
    find /usr/share/nginx/html -name "*.js" -exec sed -i "s|VUE_APP_API_BASE_URL_PLACEHOLDER|$VUE_APP_API_BASE_URL|g" {} \;
fi

if [ -n "$VUE_APP_WS_URL" ]; then
    find /usr/share/nginx/html -name "*.js" -exec sed -i "s|VUE_APP_WS_URL_PLACEHOLDER|$VUE_APP_WS_URL|g" {} \;
fi

# Execute the main container command
exec "$@"