# Contributing to Cubensis Connect

Thank you for considering contributing to Cubensis Connect! This guide will help you get started.

## Development Setup

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- **Docker** (for E2E tests only)

### Getting Started

```bash
# Install dependencies
npm install

# Start dev server with hot reload
npm run dev

# Build for all platforms
npm run build

# Type-check
npm run typecheck

# Lint
npm run lint
```

### Loading the Extension

1. Run `npm run build`
2. **Chrome**: Navigate to `chrome://extensions`, enable "Developer mode", click "Load unpacked", select `dist/chrome`
3. **Firefox**: Navigate to `about:debugging#/runtime/this-firefox`, click "Load Temporary Add-on", select `dist/firefox/manifest.json`
4. **Edge**: Navigate to `edge://extensions`, enable "Developer mode", click "Load unpacked", select `dist/edge`

### Running E2E Tests

```bash
docker compose up -d
npm run test:e2e
docker compose down
```

## Code Style

This project uses [Biome](https://biomejs.dev/) for linting and formatting. Run:

```bash
npx biome check --write .
```

## Pull Requests

1. Fork the repository
2. Create a feature branch from `main`
3. Make your changes with clear commit messages
4. Ensure all checks pass (`npm run bulletproof`)
5. Open a PR with a clear description

## Reporting Issues

Use [GitHub Issues](https://github.com/Decentral-America/cubensis-connect/issues) to report bugs or request features.

## License

By contributing, you agree that your contributions will be licensed under the project's MIT License.
