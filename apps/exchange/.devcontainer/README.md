# Dev Container Development

## Overview

This project uses VS Code Dev Containers to provide a consistent development environment for the DecentralExchange React application.

## What's Included

### Services

- **App Container**: Node.js 24 LTS (Debian Trixie) with npm

### Pre-configured Tools

- Biome for code quality
- TypeScript language server
- Git + GitHub CLI
- styled-components syntax highlighting

### MCP Servers (AI Tools)

The following MCP servers are pre-installed and configured:

| Server              | Purpose                        | Type                | Special Requirements                |
| ------------------- | ------------------------------ | ------------------- | ----------------------------------- |
| smart-tree          | Directory tree with AI context | Container binary    | None                                |
| shrimp-task-manager | Task management with web GUI   | Container npm build | Data dir: `/workspace/.shrimp-data` |
| chrome-devtools     | Browser automation & testing   | NPX + Chromium      | Headless args + sandbox disable     |
| context7            | Library documentation lookup   | NPX                 | None                                |

### Automatic Setup

On first container build, the environment automatically:

1. Installs all npm dependencies
2. Creates MCP data directories

## Quick Start

### First Time Setup

1. **Install Prerequisites:**
   - [Docker Desktop](https://www.docker.com/products/docker-desktop)
   - [VS Code](https://code.visualstudio.com/)
   - [Dev Containers Extension](vscode:extension/ms-vscode-remote.remote-containers)

2. **Open Project:**

   ```bash
   git clone <repo-url>
   cd dcc-react
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

| Service          | URL                   | Purpose          | Forwarded by   |
| ---------------- | --------------------- | ---------------- | -------------- |
| Vite Dev Server  | http://localhost:3333 | Development UI   | VS Code (auto) |

> **Note:** If port 3333 is already in use on your host, VS Code will automatically assign an alternative port and notify you. Check the **Ports** tab in VS Code's terminal panel to see actual mappings.

## Environment Variables

Default environment variables are in `.devcontainer/.env.devcontainer`.

**For custom overrides:**

1. Create a `.env` file in the project root
2. Add your Vite environment variables (prefixed with `VITE_`)
3. Restart the Vite dev server

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

### Vite dev server not accessible

1. Ensure `server.host: true` is set in `vite.config.ts`
2. Check the **Ports** tab — VS Code may have assigned a different port
3. Try `npm run dev` again

### Port conflicts

Since VS Code handles port forwarding (not Docker), port conflicts are rare. If they occur:

1. Check the **Ports** tab in VS Code's terminal panel
2. Stop conflicting services on your host machine
3. VS Code will auto-assign an alternative port if 3333 is taken

### Slow performance

1. Increase Docker resources (Settings → Resources)
2. The `node_modules` named volume is already configured for better I/O performance
3. Disable unnecessary VS Code extensions
