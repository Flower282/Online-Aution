# ============================================
# Multi-Stage Build for React + Vite Frontend
# ============================================
# Stage 1: Build the application
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build arguments for all environment variables (set by deployment platform)
ARG VITE_API_URL=http://localhost:8000
ARG VITE_AUCTION_API=http://localhost:8000/auction
ARG VITE_USER_API=http://localhost:8000/user
ARG VITE_API=http://localhost:8000
ARG VITE_CONTACT_API=http://localhost:8000/contact
ARG VITE_ADMIN_API=http://localhost:8000/admin

# Set environment variables for Vite build
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_AUCTION_API=${VITE_AUCTION_API}
ENV VITE_USER_API=${VITE_USER_API}
ENV VITE_API=${VITE_API}
ENV VITE_CONTACT_API=${VITE_CONTACT_API}
ENV VITE_ADMIN_API=${VITE_ADMIN_API}

# Build the application
RUN npm run build

# ============================================
# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 5173
EXPOSE 80

# Health check
HEALTHCHECK CMD wget --spider http://localhost || exit 1

CMD ["nginx", "-g", "daemon off;"]
