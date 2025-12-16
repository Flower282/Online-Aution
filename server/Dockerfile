# Node.js Dockerfile for Auction System Backend
# Stage 1: Build
FROM node:22-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including devDependencies for build)
RUN npm ci --only=production

# Stage 2: Production
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Install wget for health checks and dumb-init for signal handling
RUN apk add --no-cache dumb-init wget

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy dependencies from builder
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy application code
COPY --chown=nodejs:nodejs . .

# Build arguments for environment variables (set by deployment platform)
ARG PORT
ARG ORIGIN
ARG MONGO_URL
ARG REDIS_URL
ARG JWT_SECRET
ARG JWT_EXPIRES_IN
ARG JWT_REFRESH_EXPIRES_IN
ARG JWT_REFRESH_SECRET
ARG CLOUDINARY_CLOUD_NAME
ARG CLOUDINARY_API_KEY
ARG CLOUDINARY_API_SECRET
ARG CLOUDINARY_URL
ARG RESEND_API_KEY

# Set environment variables
ENV PORT=${PORT}
ENV ORIGIN=${ORIGIN}
ENV MONGO_URL=${MONGO_URL}
ENV REDIS_URL=${REDIS_URL}
ENV JWT_SECRET=${JWT_SECRET}
ENV JWT_EXPIRES_IN=${JWT_EXPIRES_IN}
ENV JWT_REFRESH_EXPIRES_IN=${JWT_REFRESH_EXPIRES_IN}
ENV JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
ENV CLOUDINARY_CLOUD_NAME=${CLOUDINARY_CLOUD_NAME}
ENV CLOUDINARY_API_KEY=${CLOUDINARY_API_KEY}
ENV CLOUDINARY_API_SECRET=${CLOUDINARY_API_SECRET}
ENV CLOUDINARY_URL=${CLOUDINARY_URL}
ENV RESEND_API_KEY=${RESEND_API_KEY}

# Set environment to production
ENV NODE_ENV=production

# Switch to non-root user
USER nodejs

# Expose port (from env variable, default 8000)
EXPOSE 8000

# Health check using wget (simpler and works with ES modules)
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8000/ || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "index.js"]
