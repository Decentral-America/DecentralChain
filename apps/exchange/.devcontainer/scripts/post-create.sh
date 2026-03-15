#!/bin/bash
set -e

echo "🚀 Setting up DecentralExchange development environment..."

# Fix permissions for mounted volumes (node_modules is a Docker volume)
echo "🔧 Fixing permissions..."
sudo chown -R node:node /workspace/node_modules 2>/dev/null || true

# Create shrimp-task-manager data directory (REQUIRED FOR MCP)
mkdir -p /workspace/.shrimp-data

# Install system dependencies required by native modules (e.g., node-hid)
echo "🔧 Installing system dependencies (libusb, libudev)..."
sudo apt-get update -qq && sudo apt-get install -y -qq libusb-1.0-0-dev libudev-dev > /dev/null 2>&1

# Install dependencies
echo "📦 Installing dependencies with npm..."
npm install

echo ""
echo "✅ Development environment ready!"
echo ""
echo "📝 Quick commands:"
echo "  npm run dev       - Start Vite dev server (port 3333)"
echo "  npm run build     - Build for production"
echo "  npm run typecheck - TypeScript type checking"
echo "  npm run lint      - Run ESLint"
echo "  npm run format    - Format with Prettier"
echo ""
