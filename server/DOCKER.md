# Docker Build & Run Commands

## Build Docker Image
```bash
docker build -t auction-backend:latest .
```

## Run Container
```bash
docker run -d \
  --name auction-backend \
  -p 8000:8000 \
  --env-file .env \
  auction-backend:latest
```

