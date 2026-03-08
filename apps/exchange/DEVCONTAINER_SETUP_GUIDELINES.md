# DevContainer Setup Guidelines for AI Agents

## Overview

This document provides comprehensive guidelines for setting up a VS Code DevContainer in a new project while ensuring MCP (Model Context Protocol) servers continue to work. Some MCP servers are installed directly within the DevContainer, so proper configuration is critical.

**IMPORTANT:** All file contents below are complete and ready to create. Customize placeholder values like `YOUR_PROJECT_NAME` and `YOUR_DB_NAME` for your specific project.

**Package Manager:** This setup uses **npm only**. Do not use yarn, pnpm, or other package managers.

---

## Directory Structure to Create

```
.devcontainer/
├── devcontainer.json
├── docker-compose.yml
├── Dockerfile
├── .env.devcontainer
├── init-db.sh
├── README.md
└── scripts/
    └── post-create.sh
.vscode/
└── mcp.json
```

---

## COMPLETE FILE CONTENTS

---

### FILE 1: `.devcontainer/devcontainer.json`

```json
{
  "name": "YOUR_PROJECT_NAME Dev Environment",
  "dockerComposeFile": "docker-compose.yml",
  "service": "app",
  "workspaceFolder": "/workspace",

  "features": {
    "ghcr.io/devcontainers/features/git:1": {},
    "ghcr.io/devcontainers/features/github-cli:1": {}
  },

  "customizations": {
    "vscode": {
      "extensions": [
        "biomejs.biome",
        "biomejs.biome",
        "ms-vscode.vscode-typescript-next",
        "Prisma.prisma",
        "eamodio.gitlens",
        "github.vscode-pull-request-github",
        "ms-azuretools.vscode-docker",
        "editorconfig.editorconfig",
        "christian-kohler.path-intellisense",
        "humao.rest-client",
        "arcanis.vscode-zipfs"
      ],
      "settings": {
        "typescript.tsdk": "node_modules/typescript/lib",
        "typescript.enablePromptUseWorkspaceTsdk": true,
        "editor.formatOnSave": true,
        "editor.defaultFormatter": "biomejs.biome",
        "editor.codeActionsOnSave": {
        },
        "files.exclude": {
          "**/node_modules": true,
          "**/dist": true
        },
        "[prisma]": {
          "editor.defaultFormatter": "prisma.prisma"
        }
      }
    }
  },

  // Port forwarding is handled natively by VS Code — no Docker `ports` mapping needed.
  // VS Code forwards ports via its built-in tunnel, making them appear as localhost
  // to both the container app and your host machine. This avoids host port conflicts
  // that Docker's `ports` publishing can cause.
  // VS Code also auto-detects new listeners, but listing them here ensures they
  // are forwarded immediately on container start.
  "forwardPorts": [3100, 8777, 5432, 6379],

  "portsAttributes": {
    "3100": {
      "label": "API Server",
      "onAutoForward": "notify",
      "protocol": "http"
    },
    "8777": {
      "label": "Admin Dashboard",
      "onAutoForward": "openBrowser",
      "protocol": "http"
    },
    "5432": {
      "label": "PostgreSQL",
      "onAutoForward": "silent"
    },
    "6379": {
      "label": "Redis",
      "onAutoForward": "silent"
    }
  },

  "postCreateCommand": "bash .devcontainer/scripts/post-create.sh",

  "remoteEnv": {
    "DATABASE_URL": "postgresql://postgres:postgres@postgres:5432/YOUR_DB_NAME",
    "REDIS_URL": "redis://redis:6379"
  },

  "remoteUser": "node"
}
```

---

### FILE 2: `.devcontainer/Dockerfile`

```dockerfile
# Use Node.js 24 LTS on Debian Trixie (glibc 2.41 for smart-tree compatibility)
FROM node:24-trixie

# Install additional tools
RUN apt-get update && apt-get install -y \
    git \
    curl \
    vim \
    postgresql-client \
    sudo \
    && rm -rf /var/lib/apt/lists/*

# Allow node user to use sudo without password
RUN echo "node ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers.d/node

# Set working directory
WORKDIR /workspace

# Create node_modules directory with correct ownership
RUN mkdir -p /workspace/node_modules && chown -R node:node /workspace

# Configure git for safe directory (for both root and node user)
RUN git config --global --add safe.directory /workspace

# ===========================================
# MCP TOOLS INSTALLATION - CRITICAL SECTION
# ===========================================

# Install smart-tree (Rust-based tree tool with MCP support)
# The install script downloads pre-compiled binary to /usr/local/bin/st
RUN curl -sSL https://raw.githubusercontent.com/8b-is/smart-tree/main/scripts/install.sh | bash

# Install shrimp-task-manager (MCP task manager)
RUN mkdir -p /opt/mcp-tools \
    && git clone https://github.com/cjo4m06/mcp-shrimp-task-manager.git /opt/mcp-tools/mcp-shrimp-task-manager \
    && cd /opt/mcp-tools/mcp-shrimp-task-manager \
    && npm install \
    && npm run build \
    && chown -R node:node /opt/mcp-tools

# Install Chromium for chrome-devtools MCP (works on both amd64 and arm64)
RUN apt-get update && apt-get install -y chromium \
    && rm -rf /var/lib/apt/lists/*

# Set Chromium as the default Chrome for chrome-devtools MCP
# CHROME_PATH is used by some tools, PUPPETEER_EXECUTABLE_PATH is what Puppeteer actually uses
ENV CHROME_PATH=/usr/bin/chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Install Railway CLI for Railway MCP (using shell script, not npm - npm lacks ARM64 Linux binaries)
# Note: Use pipe syntax instead of process substitution `<(...)` for /bin/sh compatibility
RUN curl -fsSL https://railway.com/install.sh | bash

# ===========================================
# END MCP TOOLS
# ============================================

USER node
RUN git config --global --add safe.directory /workspace
```

---

### FILE 3: `.devcontainer/docker-compose.yml`

```yaml
services:
  app:
    build:
      context: ..
      dockerfile: .devcontainer/Dockerfile
    volumes:
      - ..:/workspace:cached
      - node_modules:/workspace/node_modules
    command: sleep infinity
    network_mode: service:postgres
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@localhost:5432/YOUR_DB_NAME
      - REDIS_URL=redis://localhost:6379
      - NODE_ENV=development
      - PORT=3100

  postgres:
    image: pgvector/pgvector:pg16
    restart: unless-stopped
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-db.sh:/docker-entrypoint-initdb.d/init-db.sh
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: YOUR_DB_NAME
    # NO `ports` section needed — VS Code DevContainers handle port forwarding
    # natively via `forwardPorts` in devcontainer.json. Docker port publishing
    # is unnecessary and can cause "port already in use" conflicts on the host.

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    volumes:
      - redis_data:/data
    network_mode: service:postgres
    command: redis-server --appendonly yes

volumes:
  postgres_data:
  redis_data:
  node_modules:
```

> **Why no `ports` in docker-compose.yml?**
>
> In a DevContainer setup, VS Code handles all port forwarding through its built-in tunnel mechanism (`forwardPorts` in `devcontainer.json`). This is fundamentally different from Docker's `ports` publishing:
>
> | Mechanism | How it works | App sees connections as | Host port conflicts? |
> |-----------|-------------|------------------------|---------------------|
> | **VS Code `forwardPorts`** (recommended) | VS Code tunnels ports from the container to your host | `localhost` | No — VS Code picks an available port if needed |
> | **Docker `ports` mapping** (not needed) | Docker binds container ports to host network interface | Network connection (not localhost) | Yes — fails if port is in use on host |
>
> Key benefits of relying on VS Code port forwarding only:
> - **No host port conflicts**: VS Code gracefully handles port collisions
> - **Apps that bind to localhost work correctly**: Forwarded ports appear as localhost, while Docker-published ports appear as network connections (some apps reject non-localhost connections)
> - **Auto-detection**: VS Code can automatically detect and forward new ports when a process starts listening
> - **Simpler config**: No need to maintain port mappings in two places

---

### FILE 4: `.devcontainer/scripts/post-create.sh`

```bash
#!/bin/bash
set -e

echo "🚀 Setting up development environment..."

# Fix permissions for mounted volumes (node_modules is a Docker volume)
echo "🔧 Fixing permissions..."
sudo chown -R node:node /workspace/node_modules 2>/dev/null || true

# Create shrimp-task-manager data directory (REQUIRED FOR MCP)
mkdir -p /workspace/.shrimp-data

# Install dependencies
echo "📦 Installing dependencies with npm..."
npm install

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL..."
until pg_isready -h postgres -p 5432 -U postgres; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 2
done

echo "✅ PostgreSQL is ready!"

# Export DATABASE_URL for Prisma commands
export DATABASE_URL="postgresql://postgres:postgres@postgres:5432/YOUR_DB_NAME"

# ===========================================
# PROJECT-SPECIFIC INITIALIZATION
# Add your project's setup commands here:
# ===========================================

# Example: Generate Prisma client
# echo "🔧 Generating Prisma client..."
# npx prisma generate

# Example: Run database migrations
# echo "🗄️  Running database migrations..."
# DATABASE_URL="$DATABASE_URL" npm run db:migrate

# Example: Seed database
# echo "🌱 Seeding database..."
# DATABASE_URL="$DATABASE_URL" npm run db:seed

# Example: Generate JWT keys
# if [ ! -f "apps/api/.keys/private.pem" ]; then
#   echo "🔑 Generating JWT keys..."
#   npm run generate-keys
# fi

# ===========================================
# END PROJECT-SPECIFIC
# ===========================================

echo ""
echo "✅ Development environment ready!"
echo ""
echo "📝 Quick commands:"
echo "  npm run dev      - Start development server"
echo "  npm run build    - Build project"
echo "  npm test         - Run tests"
echo ""
```

**IMPORTANT:** After creating this file, make it executable:

```bash
chmod +x .devcontainer/scripts/post-create.sh
```

---

### FILE 5: `.devcontainer/init-db.sh`

```bash
#!/bin/bash
set -e

# Enable pgvector extension
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE EXTENSION IF NOT EXISTS vector;
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
EOSQL

echo "PostgreSQL initialized with pgvector extension"
```

**IMPORTANT:** After creating this file, make it executable:

```bash
chmod +x .devcontainer/init-db.sh
```

---

### FILE 6: `.devcontainer/.env.devcontainer`

```dotenv
# ===========================================
# DEV CONTAINER ENVIRONMENT
# ===========================================
# This file is automatically loaded in the dev container
# DO NOT commit sensitive values - this is a template

# ===========================================
# CORE APPLICATION
# ===========================================
NODE_ENV=development
PORT=3100

# ===========================================
# DATABASE (Auto-configured by docker-compose)
# ===========================================
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/YOUR_DB_NAME

# ===========================================
# REDIS (Auto-configured by docker-compose)
# ===========================================
REDIS_URL=redis://localhost:6379

# ===========================================
# JWT CONFIGURATION (if needed)
# ===========================================
JWT_ISSUER=localhost
JWT_AUDIENCE=your-app
JWT_TTL=24h

# ===========================================
# ENCRYPTION & SECURITY (DEV ONLY)
# ===========================================
# Generate real values for production
DATA_ENCRYPTION_KEY=dev_key_32_bytes_base64_encoded_here_12345678901234567890
HASH_PEPPER=dev_pepper_hex_64_bytes_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef

# ===========================================
# RATE LIMITING
# ===========================================
RATE_LIMIT_PER_MIN=100

# ===========================================
# CORS CONFIGURATION
# ===========================================
CORS_ORIGINS=http://localhost:3000,http://localhost:8777

# ===========================================
# ADMIN CONFIGURATION (if needed)
# ===========================================
ADMIN_SECRET=admin-dev-secret-change-in-production
ADMIN_DEFAULT_PASSWORD=admin123

# ===========================================
# EXTERNAL APIS (Add as needed)
# ===========================================
# API_KEY=your_api_key_here

# ===========================================
# STORAGE (Optional for dev)
# ===========================================
# R2_ENDPOINT=
# R2_ACCESS_KEY_ID=
# R2_SECRET_ACCESS_KEY=
# R2_BUCKET=
```

---

### FILE 7: `.vscode/mcp.json` (CRITICAL FOR MCP SERVERS)

```json
{
  "servers": {
    "smart-tree": {
      "type": "stdio",
      "command": "st",
      "args": ["--mcp"],
      "env": {
        "AI_TOOLS": "1"
      }
    },
    "shrimp-task-manager": {
      "command": "node",
      "args": ["/opt/mcp-tools/mcp-shrimp-task-manager/dist/index.js"],
      "env": {
        "DATA_DIR": "/workspace/.shrimp-data",
        "TEMPLATES_USE": "en",
        "ENABLE_GUI": "true",
        "WEB_PORT": "3033"
      }
    },
    "Prisma-Local": {
      "command": "npx",
      "args": ["-y", "prisma", "mcp"],
      "type": "stdio"
    },
    "Railway": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@railway/mcp-server"]
    },
    "assistant-ui": {
      "command": "npx",
      "args": ["-y", "@assistant-ui/mcp-docs-server"],
      "type": "stdio"
    },
    "chrome-devtools": {
      "command": "npx",
      "args": [
        "chrome-devtools-mcp@latest",
        "--executablePath=/usr/lib/chromium/chromium",
        "--headless",
        "--chromeArg=--no-sandbox",
        "--chromeArg=--disable-setuid-sandbox"
      ]
    },
    "Docs by LangChain": {
      "url": "https://docs.langchain.com/mcp",
      "type": "http"
    }
  },
  "inputs": []
}
```

**IMPORTANT:** The chrome-devtools configuration includes container-specific arguments:

- `--executablePath` points to Debian's Chromium location
- `--headless` runs without display (required in containers)
- `--chromeArg=--no-sandbox` disables sandbox (required in containers)
- `--chromeArg=--disable-setuid-sandbox` additional sandbox disable

---

### FILE 8: `.devcontainer/README.md`

````markdown
# Dev Container Development

## Overview

This project uses VS Code Dev Containers to provide a consistent, production-like development environment for all team members.

## What's Included

### Services

- **App Container**: Node.js 24 LTS with npm
- **PostgreSQL 16**: Database with pgvector extension
- **Redis 7**: Cache and queue management

### Pre-configured Tools

- Biome + Biome for code quality
- TypeScript language server
- Git + GitHub CLI
- Prisma Studio for database management

### MCP Servers (AI Tools)

The following MCP servers are pre-installed and configured:

| Server              | Purpose                        | Type                | Special Requirements                |
| ------------------- | ------------------------------ | ------------------- | ----------------------------------- |
| smart-tree          | Directory tree with AI context | Container binary    | None                                |
| shrimp-task-manager | Task management with web GUI   | Container npm build | Data dir: `/workspace/.shrimp-data` |
| chrome-devtools     | Browser automation & testing   | NPX + Chromium      | Headless args + sandbox disable     |
| Prisma-Local        | Database operations            | NPX                 | DATABASE_URL set                    |
| Railway             | Deployment management          | NPX + CLI           | `railway login --browserless`       |
| assistant-ui        | UI documentation               | NPX                 | None                                |
| LangChain Docs      | Documentation search           | HTTP                | None                                |

### Automatic Setup

On first container build, the environment automatically:

1. Installs all npm dependencies
2. Creates MCP data directories
3. Waits for database availability
4. Runs project-specific initialization

## Quick Start

### First Time Setup

1. **Install Prerequisites:**
   - [Docker Desktop](https://www.docker.com/products/docker-desktop)
   - [VS Code](https://code.visualstudio.com/)
   - [Dev Containers Extension](vscode:extension/ms-vscode-remote.remote-containers)

2. **Open Project:**

   ```bash
   git clone <repo-url>
   cd <project>
   code .
   ```

3. **Start Dev Container:**
   - Click "Reopen in Container" notification
   - Or: Command Palette → `Dev Containers: Reopen in Container`
   - Wait 3-5 minutes for initial build

4. **Start Development:**
   ```bash
   npm run dev
   ```

### Daily Workflow

**Start Container:**

- VS Code will remember your choice
- Just open the project folder

**Stop Container:**

- Close VS Code window
- Or: Command Palette → `Dev Containers: Close Remote Connection`

**Rebuild Container:**

- After changing `.devcontainer/` files
- Command Palette → `Dev Containers: Rebuild Container`

## Accessing Services

VS Code automatically forwards ports from the container to your host via `forwardPorts` in `devcontainer.json` (no Docker `ports` mapping needed):

| Service    | URL                   | Purpose            | Forwarded by        |
| ---------- | --------------------- | ------------------ | ------------------- |
| API        | http://localhost:3100 | REST API endpoints | VS Code (auto)      |
| Admin      | http://localhost:8777 | Admin dashboard    | VS Code (auto)      |
| PostgreSQL | localhost:5432        | Database           | VS Code (silent)    |
| Redis      | localhost:6379        | Cache/Queue        | VS Code (silent)    |

> **Note:** If a port is already in use on your host, VS Code will automatically assign an alternative port and notify you. Check the **Ports** tab in VS Code's terminal panel to see actual mappings.

## Environment Variables

Default environment variables are in `.devcontainer/.env.devcontainer`.

**For custom overrides:**

1. Copy to project root or app folder as `.env`
2. Modify values as needed
3. Restart dev container

## Database Management

### Direct PostgreSQL Access

```bash
psql postgresql://postgres:postgres@localhost:5432/YOUR_DB_NAME
```

### Reset Database

```bash
# Drop and recreate
docker volume rm <project>_postgres_data
# Then rebuild container
```

## Troubleshooting

### Container won't start

1. Check Docker Desktop is running
2. Rebuild: `Dev Containers: Rebuild Container`
3. Check Docker logs: View → Output → Dev Containers

### MCP servers not working

1. Verify `.vscode/mcp.json` exists
2. Check MCP output panel in VS Code
3. Ensure `/workspace/.shrimp-data` directory exists
4. Rebuild container if paths don't match

### Database connection errors

1. Wait for PostgreSQL to fully start (check logs)
2. Verify `DATABASE_URL` in environment
3. Check `pg_isready` output in terminal

### Port conflicts

Since VS Code handles port forwarding (not Docker), port conflicts are rare. If they occur:

1. Check the **Ports** tab in VS Code's terminal panel — VS Code may have auto-assigned an alternative port
2. Stop conflicting services on your host machine
3. Use `portsAttributes` in `devcontainer.json` to configure specific port behavior

### Slow performance

1. Increase Docker resources (Settings → Resources)
2. Use named volumes (already configured)
3. Disable unnecessary VS Code extensions
````

---

## AI AGENT CHECKLIST

When setting up DevContainer in a new project, execute these steps in order:

### Step 1: Create Directory Structure

```bash
mkdir -p .devcontainer/scripts
mkdir -p .vscode
```

### Step 2: Create All Files

Create each of the 8 files above with their complete contents.

### Step 3: Make Scripts Executable

```bash
chmod +x .devcontainer/scripts/post-create.sh
chmod +x .devcontainer/init-db.sh
```

### Step 4: Customize Placeholders

Replace these placeholders in all files:

- `YOUR_PROJECT_NAME` → Actual project name
- `YOUR_DB_NAME` → Actual database name

### Step 5: Add to .gitignore (Optional)

```
# DevContainer data
.shrimp-data/
```

### Step 6: Test the Setup

1. Open project in VS Code
2. Run `Dev Containers: Rebuild Container`
3. Verify MCP servers in Output > MCP panel
4. Test database connection

---

## MCP SERVER DETAILS

This section provides extensive documentation on how each MCP server was configured to work within the DevContainer environment, including the specific challenges solved and configuration requirements.

---

### 1. smart-tree (Container-Installed)

**Purpose:** Rust-based directory tree tool with AI context awareness. Provides semantic search, file analysis, and intelligent code navigation.

**Installation (Dockerfile):**

```dockerfile
RUN curl -sSL https://raw.githubusercontent.com/8b-is/smart-tree/main/scripts/install.sh | bash
```

**mcp.json Configuration:**

```json
{
  "smart-tree": {
    "type": "stdio",
    "command": "st",
    "args": ["--mcp"],
    "env": {
      "AI_TOOLS": "1"
    }
  }
}
```

**How It Works:**

- Install script downloads pre-compiled binary to `/usr/local/bin/st`
- Binary is automatically in PATH, so command is just `st`
- `AI_TOOLS=1` enables enhanced AI-friendly output
- `--mcp` flag starts the MCP server mode

**No Issues:** This MCP works out of the box with no special configuration needed.

---

### 2. shrimp-task-manager (Container-Installed)

**Purpose:** Task management system with web GUI. Allows AI agents to create, track, and manage tasks persistently.

**Installation (Dockerfile):**

```dockerfile
RUN mkdir -p /opt/mcp-tools \
    && git clone https://github.com/cjo4m06/mcp-shrimp-task-manager.git /opt/mcp-tools/mcp-shrimp-task-manager \
    && cd /opt/mcp-tools/mcp-shrimp-task-manager \
    && npm install \
    && npm run build \
    && chown -R node:node /opt/mcp-tools
```

**mcp.json Configuration:**

```json
{
  "shrimp-task-manager": {
    "command": "node",
    "args": ["/opt/mcp-tools/mcp-shrimp-task-manager/dist/index.js"],
    "env": {
      "DATA_DIR": "/workspace/.shrimp-data",
      "TEMPLATES_USE": "en",
      "ENABLE_GUI": "true",
      "WEB_PORT": "3033"
    }
  }
}
```

**Critical Requirements:**

1. **Data Directory:** Must create `/workspace/.shrimp-data` in post-create.sh:
   ```bash
   mkdir -p /workspace/.shrimp-data
   ```
2. **Ownership:** Dockerfile must set `chown -R node:node /opt/mcp-tools` since container runs as `node` user
3. **Absolute Path:** mcp.json must use full path `/opt/mcp-tools/mcp-shrimp-task-manager/dist/index.js`

**Common Issues:**

- "Permission denied" → Missing `chown` command in Dockerfile
- "Cannot find module" → Path mismatch or build not completed
- "ENOENT data directory" → Missing `mkdir -p` in post-create.sh

---

### 3. chrome-devtools (NPX + Container Dependencies)

**Purpose:** Browser automation and debugging. Allows AI to control Chrome/Chromium for testing, screenshots, and web interactions.

**This MCP required the most configuration to work in a headless container environment.**

**Installation (Dockerfile):**

```dockerfile
# Install Chromium (works on both amd64 and arm64)
RUN apt-get update && apt-get install -y chromium \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables for Puppeteer
ENV CHROME_PATH=/usr/bin/chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
```

**mcp.json Configuration (CRITICAL - Container-Specific Args):**

```json
{
  "chrome-devtools": {
    "command": "npx",
    "args": [
      "chrome-devtools-mcp@latest",
      "--executablePath=/usr/lib/chromium/chromium",
      "--headless",
      "--chromeArg=--no-sandbox",
      "--chromeArg=--disable-setuid-sandbox"
    ]
  }
}
```

**Why These Args Are Required:**

| Argument                                      | Purpose                                                                  |
| --------------------------------------------- | ------------------------------------------------------------------------ |
| `--executablePath=/usr/lib/chromium/chromium` | Points to Debian's Chromium binary location (varies by distro)           |
| `--headless`                                  | Required for running without display (no X11 in container)               |
| `--chromeArg=--no-sandbox`                    | Disables Chrome sandbox (required when running as root or in containers) |
| `--chromeArg=--disable-setuid-sandbox`        | Additional sandbox disable for container compatibility                   |

**Finding the Chromium Path:**

```bash
# On Debian/Ubuntu containers:
which chromium
# Usually: /usr/bin/chromium (symlink to /usr/lib/chromium/chromium)

# Verify the actual binary:
ls -la /usr/lib/chromium/
```

**Common Issues:**

- "Failed to launch browser" → Missing `--no-sandbox` or wrong executable path
- "No usable sandbox" → Missing `--disable-setuid-sandbox`
- "Cannot find Chrome" → `PUPPETEER_EXECUTABLE_PATH` not set or wrong path
- "Protocol error" → Chromium not installed or crashed

**Testing chrome-devtools:**

```bash
# Verify Chromium works headless:
chromium --headless --no-sandbox --disable-setuid-sandbox --dump-dom https://example.com
```

---

### 4. Railway (NPX + CLI Authentication)

**Purpose:** Deploy and manage Railway projects directly from the AI agent.

**Installation (Dockerfile):**

```dockerfile
# Install Railway CLI (shell script method - works on ARM64 Linux)
# Note: Use pipe syntax, not process substitution `<(...)`, for /bin/sh compatibility
RUN curl -fsSL https://railway.com/install.sh | bash
```

**mcp.json Configuration:**

```json
{
  "Railway": {
    "type": "stdio",
    "command": "npx",
    "args": ["-y", "@railway/mcp-server"]
  }
}
```

**Critical: Post-Container Authentication Required!**

Railway MCP will fail with "Not logged in" until you authenticate. Since containers don't have browsers, use browserless login:

```bash
railway login --browserless
```

This displays a pairing code and URL. Visit the URL on any device, enter the code, and the container session is authenticated.

**Why Not Use npm for CLI?**
The npm package `@railway/cli` doesn't include ARM64 Linux binaries. The shell script installer (`https://railway.com/install.sh` / `cli.new`) properly detects architecture and downloads the correct binary.

**Why Use Pipe Syntax?**
Docker's RUN command uses `/bin/sh` by default, which does not support bash process substitution `<(...)`. Use the pipe syntax `curl ... | bash` instead.

**Common Issues:**

- "Not logged in to Railway CLI" → Run `railway login --browserless`
- "railway: command not found" → CLI not installed; verify with `which railway`
- "Token expired" → Re-run `railway login --browserless`

**Testing Railway MCP:**

```bash
# Check CLI status:
railway status

# List projects (after login):
railway list
```

---

### 5. Prisma-Local (NPX)

**Purpose:** Direct database operations via Prisma - migrations, schema inspection, studio.

**mcp.json Configuration:**

```json
{
  "Prisma-Local": {
    "command": "npx",
    "args": ["-y", "prisma", "mcp"],
    "type": "stdio"
  }
}
```

**How It Works:**

- NPX downloads latest Prisma CLI on first use
- MCP mode provides database introspection and query capabilities
- Automatically uses `DATABASE_URL` from environment

**Requirements:**

- Valid `DATABASE_URL` environment variable
- Database must be accessible (PostgreSQL running)
- Prisma schema present in project

**No Issues:** Works out of the box when database is available.

---

### 6. assistant-ui (NPX)

**Purpose:** Documentation search for assistant-ui React components.

**mcp.json Configuration:**

```json
{
  "assistant-ui": {
    "command": "npx",
    "args": ["-y", "@assistant-ui/mcp-docs-server"],
    "type": "stdio"
  }
}
```

**No Issues:** Pure documentation server, works immediately.

---

### 7. Docs by LangChain (HTTP)

**Purpose:** Search LangChain documentation.

**mcp.json Configuration:**

```json
{
  "Docs by LangChain": {
    "url": "https://docs.langchain.com/mcp",
    "type": "http"
  }
}
```

**No Issues:** External HTTP service, no local dependencies.

---

## MCP ARCHITECTURE SUMMARY

| MCP                 | Type                     | Install Location     | Auth Required               | Container Args Needed        |
| ------------------- | ------------------------ | -------------------- | --------------------------- | ---------------------------- |
| smart-tree          | Container binary         | `/usr/local/bin/st`  | No                          | No                           |
| shrimp-task-manager | Container npm build      | `/opt/mcp-tools/...` | No                          | Data dir required            |
| chrome-devtools     | NPX + container Chromium | System Chromium      | No                          | **Yes - headless + sandbox** |
| Railway             | NPX + container CLI      | `/root/.railway/bin` | **Yes - browserless login** | No                           |
| Prisma-Local        | NPX                      | Downloaded on use    | No                          | No                           |
| assistant-ui        | NPX                      | Downloaded on use    | No                          | No                           |
| LangChain Docs      | HTTP                     | External             | No                          | No                           |

---

## CRITICAL REQUIREMENTS FOR MCP TO WORK

### 1. File Ownership (shrimp-task-manager)

Dockerfile must set ownership since container runs as `node` user:

```dockerfile
RUN chown -R node:node /opt/mcp-tools
```

### 2. Data Directories (shrimp-task-manager)

post-create.sh must create required directories:

```bash
mkdir -p /workspace/.shrimp-data
```

### 3. Non-Root User (devcontainer.json)

Container must run as non-root for proper permissions:

```json
"remoteUser": "node"
```

### 4. Absolute Paths (mcp.json)

shrimp-task-manager requires full absolute path:

```json
"args": ["/opt/mcp-tools/mcp-shrimp-task-manager/dist/index.js"]
```

### 5. Chromium Headless Args (chrome-devtools)

**REQUIRED for containers without display:**

```json
"args": [
  "chrome-devtools-mcp@latest",
  "--executablePath=/usr/lib/chromium/chromium",
  "--headless",
  "--chromeArg=--no-sandbox",
  "--chromeArg=--disable-setuid-sandbox"
]
```

Without `--no-sandbox` and `--disable-setuid-sandbox`, Chrome will crash with "No usable sandbox".

### 6. Chromium Environment Variables (Dockerfile)

Required for Puppeteer-based tools:

```dockerfile
ENV CHROME_PATH=/usr/bin/chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
```

### 7. Railway Authentication (Post-Container)

Railway MCP requires login after container starts:

```bash
# Browser-based login won't work in containers, use:
railway login --browserless
```

This displays a pairing code - visit the URL on any device to authenticate.

### 8. Railway CLI Installation Method

Do NOT use npm for Railway CLI - it lacks ARM64 Linux binaries. Use shell script with pipe syntax (not process substitution `<(...)` which requires bash):

```dockerfile
RUN curl -fsSL https://railway.com/install.sh | bash
```

---

## COMMON ISSUES & FIXES

### smart-tree: "command not found"

```bash
# Verify binary exists:
which st
# Expected: /usr/local/bin/st

# If missing, reinstall:
curl -sSL https://raw.githubusercontent.com/8b-is/smart-tree/main/scripts/install.sh | sudo bash
```

**Fix:** Rebuild container if installation failed.

---

### shrimp-task-manager: "permission denied"

```bash
# Check ownership:
ls -la /opt/mcp-tools

# Fix ownership:
sudo chown -R node:node /opt/mcp-tools
```

**Fix:** Ensure `chown -R node:node /opt/mcp-tools` is in Dockerfile.

---

### shrimp-task-manager: "ENOENT data directory"

```bash
# Create the data directory:
mkdir -p /workspace/.shrimp-data
```

**Fix:** Add `mkdir -p /workspace/.shrimp-data` to post-create.sh.

---

### chrome-devtools: "Failed to launch browser"

**Symptoms:**

- "No usable sandbox"
- "Failed to launch chrome"
- "Protocol error"

**Fix:** Add container-specific args to mcp.json:

```json
"args": [
  "chrome-devtools-mcp@latest",
  "--executablePath=/usr/lib/chromium/chromium",
  "--headless",
  "--chromeArg=--no-sandbox",
  "--chromeArg=--disable-setuid-sandbox"
]
```

**Verify Chromium works:**

```bash
chromium --headless --no-sandbox --disable-setuid-sandbox --dump-dom https://example.com
```

---

### chrome-devtools: "Cannot find Chrome/Chromium"

```bash
# Check Chromium installation:
which chromium
ls -la /usr/lib/chromium/

# Check environment variables:
echo $PUPPETEER_EXECUTABLE_PATH
echo $CHROME_PATH
```

**Fix:** Ensure Dockerfile installs Chromium and sets env vars:

```dockerfile
RUN apt-get update && apt-get install -y chromium
ENV CHROME_PATH=/usr/bin/chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
```

---

### Railway: "Not logged in to Railway CLI"

**This is expected on fresh containers.** Railway requires authentication.

```bash
# Use browserless login (container-friendly):
railway login --browserless

# This shows a pairing code and URL
# Visit URL on any device, enter code to authenticate
```

**After login, verify:**

```bash
railway status
# Should show: Logged in as your@email.com
```

---

### Railway: "railway: command not found"

```bash
# Check if installed:
which railway
# Expected: /root/.railway/bin/railway or similar

# Reinstall if missing:
curl -fsSL https://railway.com/install.sh | bash
```

**Note:** Do NOT use `npm install -g @railway/cli` - it lacks ARM64 Linux binaries.

---

### Prisma-Local: "Cannot connect to database"

```bash
# Check PostgreSQL is running:
pg_isready -h postgres -p 5432 -U postgres

# Check DATABASE_URL:
echo $DATABASE_URL

# Test connection:
psql $DATABASE_URL -c "SELECT 1"
```

**Fix:** Wait for PostgreSQL to fully start (check docker-compose logs).

---

### Database connection fails

```bash
# Check PostgreSQL logs:
docker compose logs postgres

# Verify network connectivity:
# In container, use 'localhost' due to network_mode: service:postgres
psql postgresql://postgres:postgres@localhost:5432/YOUR_DB_NAME
```

---

### Port conflicts

Since VS Code handles port forwarding natively via `forwardPorts` in `devcontainer.json`, Docker `ports` mappings are not used. VS Code will auto-assign an alternative host port if a conflict is detected.

```bash
# Check which process is using a port on the host:
lsof -i :3100

# VS Code auto-reassigns ports, so check the Ports tab in the terminal panel
# to see the actual host → container port mappings.

# To permanently change the forwarded port behavior, edit devcontainer.json:
# "portsAttributes": { "3100": { "onAutoForward": "silent" } }
```

---

### MCP not appearing in VS Code

1. Check `.vscode/mcp.json` exists and is valid JSON
2. Reload VS Code window: `Developer: Reload Window`
3. Check MCP output panel: View → Output → select "MCP" from dropdown
4. Verify paths in mcp.json match actual installation paths

---

### General debugging steps

```bash
# 1. Check MCP tool exists:
which st                    # smart-tree
ls /opt/mcp-tools/          # shrimp
which chromium              # chrome-devtools
which railway               # railway

# 2. Test MCP manually:
st --mcp --help
node /opt/mcp-tools/mcp-shrimp-task-manager/dist/index.js --help

# 3. Check VS Code MCP output for errors:
# View → Output → MCP

# 4. Rebuild container if all else fails:
# Command Palette → Dev Containers: Rebuild Container
```
