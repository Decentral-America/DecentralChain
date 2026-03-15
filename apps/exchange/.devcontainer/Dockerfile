# Use Node.js 24 LTS on Debian Trixie (glibc 2.41 for smart-tree compatibility)
FROM node:24-trixie

# Install additional tools
RUN apt-get update && apt-get install -y \
    git \
    curl \
    vim \
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

# ===========================================
# END MCP TOOLS
# ===========================================

USER node
RUN git config --global --add safe.directory /workspace
