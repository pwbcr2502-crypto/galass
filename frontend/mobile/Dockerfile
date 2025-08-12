# Multi-stage build for Vue.js mobile frontend
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage with Nginx
FROM nginx:alpine AS production

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy entrypoint script for environment variable substitution
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Create nginx user and set permissions
RUN addgroup -g 1001 nginx-group && \
    adduser -D -s /bin/sh -u 1001 -G nginx-group nginx-user && \
    chown -R nginx-user:nginx-group /usr/share/nginx/html && \
    mkdir -p /var/cache/nginx /tmp/nginx && \
    chown -R nginx-user:nginx-group /var/cache/nginx /tmp/nginx

# Use root to run nginx (required for binding to port 80)
USER root

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

# Start nginx
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]