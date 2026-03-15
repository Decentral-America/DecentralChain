# DCC React Wallet - Docker Deployment Guide

This guide explains how to build and deploy the DCC React Wallet using Docker, mirroring the Angular version's deployment process.

## Quick Start

### Simple Development Build
```bash
# Build for mainnet (default)
docker build -t dcc-exchange-react .

# Run locally
docker run -p 8080:80 dcc-exchange-react

# Access at http://localhost:8080
```

### Production Multi-Network Build
```bash
# Build with multi-network support
docker build -f Dockerfile.production -t dcc-exchange-react:prod .

# Run for specific network
docker run -p 8080:80 -e WEB_ENVIRONMENT=mainnet dcc-exchange-react:prod
docker run -p 8080:80 -e WEB_ENVIRONMENT=testnet dcc-exchange-react:prod
docker run -p 8080:80 -e WEB_ENVIRONMENT=stagenet dcc-exchange-react:prod
```

## Docker Files Overview

| File | Purpose |
|------|---------|
| `Dockerfile` | Simple single-network build for dev/testing |
| `Dockerfile.production` | Multi-network build (mainnet/testnet/stagenet) |
| `docker-compose.yml` | Run all three networks locally |
| `docker-build.sh` | Convenient build script |
| `docker/nginx/nginx.conf` | Main nginx configuration |
| `docker/nginx/default.conf` | Server configuration with env substitution |

## Build Options

### 1. Simple Development Build
Best for quick testing with a single network:

```bash
# Default (mainnet)
docker build -t dcc-exchange-react .

# With specific network
docker build \
  --build-arg VITE_NETWORK=testnet \
  --build-arg VITE_NODE_URL=https://testnet-node.decentralchain.io \
  --build-arg VITE_MATCHER_URL=https://testnet-matcher.decentralchain.io \
  -t dcc-exchange-react:testnet .
```

### 2. Production Build (Recommended)
Builds all three networks in one image:

```bash
# Using the build script
./docker-build.sh mainnet

# Or manually
docker build \
  -f Dockerfile.production \
  --build-arg web_environment=mainnet \
  -t dcc-exchange-react:latest .
```

### 3. Using Docker Compose
Run all networks simultaneously:

```bash
# Build and run all
docker-compose up -d

# Run specific network
docker-compose up -d dcc-exchange-mainnet

# View logs
docker-compose logs -f

# Stop all
docker-compose down
```

## Environment Variables

### Build-time Variables
| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_NETWORK` | Network name | `mainnet` |
| `VITE_NODE_URL` | Node API URL | `https://mainnet-node.decentralchain.io` |
| `VITE_MATCHER_URL` | Matcher URL | `https://mainnet-matcher.decentralchain.io` |
| `VITE_DATA_SERVICE_URL` | Data service URL | `https://data-service.decentralchain.io` |

### Runtime Variables (Production Dockerfile)
| Variable | Description | Default |
|----------|-------------|---------|
| `WEB_ENVIRONMENT` | Active network (mainnet/testnet/stagenet) | `mainnet` |

## Nginx Configuration

### Features Matching Angular Version
- ✅ Multi-network support via environment variable
- ✅ SPA routing (all routes → index.html)
- ✅ TradingView proxy (`/trading-view`)
- ✅ Security headers (X-Frame-Options, CSP, etc.)
- ✅ Gzip compression
- ✅ Static asset caching
- ✅ Health check endpoint (`/health`)
- ✅ Remove trailing slashes

### Ports
| Service | Port |
|---------|------|
| HTTP | 80 |
| Status (internal) | 8089 |

## Deployment Examples

### Deploy to Kubernetes
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: dcc-exchange-mainnet
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: dcc-exchange
        image: your-registry/dcc-exchange-react:latest
        env:
        - name: WEB_ENVIRONMENT
          value: "mainnet"
        ports:
        - containerPort: 80
        livenessProbe:
          httpGet:
            path: /health
            port: 80
```

### Deploy to AWS ECS
```json
{
  "containerDefinitions": [{
    "name": "dcc-exchange",
    "image": "your-registry/dcc-exchange-react:latest",
    "environment": [
      { "name": "WEB_ENVIRONMENT", "value": "mainnet" }
    ],
    "portMappings": [
      { "containerPort": 80 }
    ],
    "healthCheck": {
      "command": ["CMD-SHELL", "wget -q -O /dev/null http://localhost/health || exit 1"]
    }
  }]
}
```

### Deploy with Docker Swarm
```bash
docker service create \
  --name dcc-exchange \
  --replicas 3 \
  -p 80:80 \
  -e WEB_ENVIRONMENT=mainnet \
  dcc-exchange-react:latest
```

## Comparison with Angular Version

| Feature | Angular | React |
|---------|---------|-------|
| Build tool | Gulp | Vite |
| Config injection | `--config ./configs/{network}.json` | `VITE_*` env vars |
| Output directory | `dist/web/{network}/` | `dist/` or `{network}/` |
| Multi-network | Separate builds | Single image, runtime switch |
| TradingView proxy | ✅ | ✅ |
| SPA routing | ✅ | ✅ |
| Security headers | ✅ | ✅ |

## Troubleshooting

### Build fails with npm error
```bash
# Clear npm cache and retry
docker build --no-cache -t dcc-exchange-react .
```

### Network environment not changing
```bash
# Ensure WEB_ENVIRONMENT is set correctly
docker run -e WEB_ENVIRONMENT=testnet -p 8080:80 dcc-exchange-react:prod

# Verify inside container
docker exec <container_id> echo $WEB_ENVIRONMENT
```

### TradingView not loading
- Ensure `/trading-view` proxy is configured
- Check if charts.decentral.exchange is accessible
- Verify CSP headers allow TradingView domains

## CI/CD Integration

See `Jenkinsfile` for Jenkins pipeline configuration that mirrors the Angular version's deployment process.

```bash
# Jenkins parameters
# - ACTION: Build, Deploy to stage, Deploy PROD mainnet/testnet/stagenet
# - NETWORK: mainnet, testnet, stagenet
# - TAG: Docker image tag
```
