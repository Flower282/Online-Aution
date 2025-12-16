#!/bin/sh
set -e

# Set default SERVER_NAME if not provided
export SERVER_NAME="${SERVER_NAME:-localhost}"

echo "🔧 Configuring Nginx with SERVER_NAME: ${SERVER_NAME}"

# Use envsubst to replace ${SERVER_NAME} in template
envsubst '${SERVER_NAME}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

echo "✅ Nginx configuration generated:"
cat /etc/nginx/conf.d/default.conf

echo "🚀 Starting Nginx..."
exec nginx -g 'daemon off;'
