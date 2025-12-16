# Dockerfile for React + Vite Client (pre-built)
# Build locally first: npm run build

FROM nginx:alpine

# Install gettext for envsubst command
RUN apk add --no-cache gettext

# Copy pre-built dist folder
COPY dist /usr/share/nginx/html

# Copy nginx template (not the final config)
COPY nginx.conf.template /etc/nginx/conf.d/default.conf.template

# Copy entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Set default SERVER_NAME environment variable
ENV SERVER_NAME=localhost

# Expose port 5173
EXPOSE 5173

# Health check - now uses /health endpoint
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5173/health || exit 1

# Use custom entrypoint that runs envsubst before nginx
ENTRYPOINT ["/docker-entrypoint.sh"]
