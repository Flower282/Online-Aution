#!/bin/bash

# Script để build và chạy backend container đơn giản

echo "🔨 Building Docker image..."
docker build -t auction-backend:latest .

echo "🗑️  Removing old container if exists..."
docker rm -f auction-backend 2>/dev/null || true

echo "🚀 Starting backend container..."
docker run -d \
  --name auction-backend \
  -p 8000:8000 \
  --env-file .env \
  --restart unless-stopped \
  auction-backend:latest

echo "✅ Backend is running!"
echo "📊 View logs: docker logs -f auction-backend"
echo "🛑 Stop: docker stop auction-backend"
