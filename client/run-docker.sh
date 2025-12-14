#!/bin/bash

# Script để build và chạy client container

echo "� Building React app first..."
npm run build

echo "�🔨 Building Docker image..."
docker build -t auction-client:latest .

echo "🗑️  Removing old container if exists..."
docker rm -f auction-client 2>/dev/null || true

echo "🚀 Starting client container..."
docker run -d \
  --name auction-client \
  -p 5173:5173 \
  --restart unless-stopped \
  auction-client:latest

echo "✅ Client is running at http://localhost:5173"
echo "📊 View logs: docker logs -f auction-client"
echo "🛑 Stop: docker stop auction-client"
