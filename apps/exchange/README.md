# DecentralChain Wallet - React Edition

[![CI/CD](https://github.com/decentralchain/wallet/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/decentralchain/wallet/actions)
[![Docker](https://img.shields.io/docker/v/decentralchain/wallet?label=docker)](https://github.com/decentralchain/wallet/pkgs/container/wallet)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Modern, secure cryptocurrency wallet for DecentralChain blockchain, built with React + TypeScript + Vite.

## 📚 Documentation Canonical Sources

- **Project status and priorities:** `SINGLE_SOURCE_OF_TRUTH.md`
- **Documentation policy:** `docs/DOCUMENTATION_GOVERNANCE.md`
- **Enterprise governance docs:** `SECURITY.md`, `CODE_OF_CONDUCT.md`, `CONTRIBUTING.md`, `CHANGELOG.md`

Root migration/status/plan/report sprawl has been consolidated into `SINGLE_SOURCE_OF_TRUTH.md`.

## ✨ Features

## React Compiler

### Core Wallet Features

- 🔐 **Secure Key Management** - AES-GCM encrypted storage with PBKDF2 key derivationThe React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

- 🌍 **Multi-language Support** - 17 languages including English, Chinese, Japanese, Russian, German, French, Spanish

- 🎨 **Light/Dark Theme** - Beautiful UI with responsive design## Expanding the Biome configuration

- 📊 **Real-time Balance Tracking** - Live updates of assets and balances

- 🔄 **Transaction History** - Complete transaction history with filteringIf you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:



### Asset Management```js

- 💰 **Issue Assets** - Create custom tokens on DecentralChainexport default defineConfig([

- ♻️ **Reissue Assets** - Increase supply of existing assets  globalIgnores(['dist']),

- 🔥 **Burn Assets** - Permanently remove tokens from circulation  {

- 🎯 **Sponsor Assets** - Enable gasless transactions for your token    files: ['**/*.{ts,tsx}'],

- 📜 **Set Asset Script** - Add smart contract logic to assets    extends: [

      // Other configs...

### Trading & DEX

- 📈 **DEX Trading** - Built-in decentralized exchange integration      // Remove tsbiome.configs.recommended and replace with this

- 📖 **Real-time Orderbook** - Live order matching and execution      tsbiome.configs.recommendedTypeChecked,

- 💱 **Market/Limit Orders** - Flexible order types      // Alternatively, use this for stricter rules

- 🔁 **Trade History** - Track your trading activity      tsbiome.configs.strictTypeChecked,

      // Optionally, add this for stylistic rules

### Advanced Features      tsbiome.configs.stylisticTypeChecked,

- 🏦 **Leasing** - Stake DCC tokens and earn rewards

- 🎭 **Aliases** - Human-readable addresses      // Other configs...

- 📝 **Data Transactions** - Store data on blockchain    ],

- ⚙️ **Set Script** - Smart contract account management    languageOptions: {

- 🔗 **Mass Transfer** - Send to multiple recipients at once      parserOptions: {

        project: ['./tsconfig.node.json', './tsconfig.app.json'],

## 🚀 Tech Stack        tsconfigRootDir: import.meta.dirname,

      },

### Core      // other options...

- **React 19.1.1** - Latest React with concurrent features    },

- **TypeScript 5.x** - Type-safe development  },

- **Vite 7.1.10** - Lightning-fast build tool (3-10s builds)])

```

### State Management

- **Zustand** - Lightweight state managementYou can also install [biome-react-x](https://github.com/Rel1cx/biome-react/tree/main/packages/plugins/biome-react-x) and [biome-react-dom](https://github.com/Rel1cx/biome-react/tree/main/packages/plugins/biome-react-dom) for React-specific lint rules:

- **React Query** - Server state management and caching

```js

### UI/UX// biome.config.js

- **Styled Components** - CSS-in-JS stylingimport reactX from 'biome-react-x'

- **React Router v6** - Client-side routing with lazy loadingimport reactDom from 'biome-react-dom'

- **i18next** - Internationalization (17 languages)

export default defineConfig([

### Performance  globalIgnores(['dist']),

- **Code Splitting** - Route-based lazy loading  {

- **Virtual Scrolling** - Optimized list rendering (zero dependencies)    files: ['**/*.{ts,tsx}'],

- **Image Lazy Loading** - Progressive image loading with blur-up    extends: [

- **Memoization Utilities** - React performance optimization      // Other configs...

      // Enable lint rules for React

### Security      reactX.configs['recommended-typescript'],

- **Web Crypto API** - Native browser encryption (AES-GCM, PBKDF2)      // Enable lint rules for React DOM

- **CSP Headers** - Content Security Policy for XSS prevention      reactDom.configs.recommended,

- **Input Sanitization** - 11 specialized sanitizers (zero dependencies)    ],

- **HTTPS Enforcement** - Production-only HTTPS redirect    languageOptions: {

      parserOptions: {

### DevOps        project: ['./tsconfig.node.json', './tsconfig.app.json'],

- **Docker** - Multi-stage containerized deployment (~40-50 MB)        tsconfigRootDir: import.meta.dirname,

- **GitHub Actions** - CI/CD with multiple deployment strategies      },

- **Environment Separation** - Staging (stagenet) and Production (mainnet)      // other options...

    },

## 📋 Prerequisites  },

])

- Node.js 18.x or higher```

- npm 9.x or higher

## 🏃 Quick Start

### Development

```bash
# Clone the repository
git clone https://github.com/decentralchain/wallet.git
cd wallet/dcc-react

# Install dependencies
npm install --legacy-peer-deps

# Start development server (http://localhost:3000)
npm run dev
```

### Production Build

```bash
# Build for production
NODE_ENV=production npm run build

# Preview production build
npm run preview
```

### Docker Deployment

```bash
# Build Docker image
docker build -t dcc-exchange:latest .

# Run container
docker run -d -p 8080:80 --name dcc-exchange dcc-exchange:latest

# Health check
docker inspect --format='{{.State.Health.Status}}' dcc-exchange
```

## 📁 Project Structure

```
dcc-react/
├── src/
│   ├── components/        # Reusable React components
│   │   ├── ErrorBoundary.tsx
│   │   ├── LazyImage.tsx
│   │   ├── RouteLoadingFallback.tsx
│   │   └── VirtualList.tsx
│   ├── contexts/          # React Context providers
│   │   ├── ThemeContext.tsx
│   │   └── ToastContext.tsx
│   ├── features/          # Feature-based modules
│   │   ├── wallet/        # Wallet features (send, receive)
│   │   ├── dex/           # DEX trading features
│   │   ├── assets/        # Asset management
│   │   └── advanced/      # Advanced blockchain features
│   ├── hooks/             # Custom React hooks
│   ├── i18n/              # Internationalization
│   ├── lib/               # Utility libraries
│   │   ├── api.ts         # API client with retry logic
│   │   ├── errorHandler.ts # Centralized error handling
│   │   ├── memoUtils.ts    # Performance optimization
│   │   ├── sanitize.ts     # Input sanitization
│   │   └── secureStorage.ts # Encrypted storage
│   ├── routes/            # Application routing
│   ├── stores/            # Zustand state stores
│   ├── styles/            # Global styles and themes
│   └── types/             # TypeScript type definitions
├── public/                # Static assets
├── .github/workflows/     # CI/CD pipelines
├── dist/                  # Production build output
├── Dockerfile             # Docker configuration
├── nginx.conf             # Nginx server configuration
└── vite.config.ts         # Vite build configuration
```

## 🌍 Environment Variables

Create `.env.local` for local development:

```bash
# Development
VITE_APP_ENV=development
VITE_NETWORK=testnet

# Node Configuration
VITE_NODE_URL=https://nodes-testnet.decentralchain.io
VITE_MATCHER_URL=https://matcher-testnet.decentralchain.io/matcher
VITE_API_URL=https://data-service-testnet.decentralchain.io

# Explorer
VITE_EXPLORER_URL=https://testnet.decentralscan.com

# Debug
VITE_DEBUG=true
VITE_ENABLE_MOCKS=false
```

See `.env.example` for all available variables.

## 🏗️ Architecture

### Component Architecture

```
App (Theme + Toast Providers)
├── ErrorBoundary (Catch React errors)
├── Routes (React Router with lazy loading)
│   ├── Welcome (Landing page)
│   ├── Wallet (Send, Receive, Balance)
│   │   ├── SendForm
│   │   ├── ReceiveAddress
│   │   └── TransactionHistory (Virtual scrolling)
│   ├── DEX (Trading interface)
│   │   ├── Orderbook (Real-time updates)
│   │   ├── TradeForm
│   │   └── OrderHistory
│   ├── Assets (Asset management)
│   │   ├── IssueAssetForm
│   │   ├── ReissueAssetForm
│   │   └── BurnAssetForm
│   └── Advanced (Blockchain features)
│       ├── LeaseForm
│       ├── CreateAliasForm
│       └── SetScriptForm
└── Navigation
```

### Layout Structure

**Important:** The app uses `MainLayout.tsx` (`/src/layouts/MainLayout.tsx`) as the primary layout wrapper for all authenticated routes. This single component contains:

- **Integrated AppBar** (top navigation) - includes user menu, network badge, and clickable user address
- **Integrated Drawer** (sidebar navigation) - contains all navigation items grouped by sections
- **Main content area** - renders page content via `<Outlet />`

**Note:** Standalone `Header.tsx` and `Sidebar.tsx` components in `/src/components/layout/` are **NOT used**. All layout modifications should be made in `MainLayout.tsx`.

### State Management

- **Zustand Stores**: Wallet, Settings, DEX
- **React Query**: API data caching and synchronization
- **Context API**: Theme, Toast notifications

### Security Architecture

```
User Input
    ↓
Input Sanitization (sanitize.ts)
    ↓
Form Validation (Zod schemas)
    ↓
Encrypted Storage (secureStorage.ts - AES-GCM)
    ↓
HTTPS API Request (api.ts with retry)
    ↓
DecentralChain Node
```

## 🔒 Security Features

### Client-Side Security
- **Encryption**: AES-GCM 256-bit with PBKDF2 key derivation (100K iterations)
- **Secure Storage**: Web Crypto API (zero external dependencies)
- **Input Sanitization**: 11 specialized sanitizers
  - Text, HTML, URL, Email validation
  - Blockchain address/asset ID validation
  - SQL/XSS injection prevention
- **CSP Headers**: Content Security Policy prevents XSS attacks
- **HTTPS Enforcement**: Automatic HTTP → HTTPS redirect in production

### Build Security
- **No Sensitive Data**: Seeds/keys never committed to git
- **Secret Management**: GitHub Secrets for CI/CD
- **Security Audits**: Automated npm audit on every PR
- **Dependency Monitoring**: Weekly automated checks

## 🚢 Deployment

### Deployment Strategies

**1. AWS S3 + CloudFront**
```bash
# Configure AWS credentials
aws configure

# Deploy to staging
git push origin develop

# Deploy to production
git push origin main
```

**2. Docker + Kubernetes/ECS**
```bash
# Build and push
docker build -t dcc-exchange:v1.0.0 .
docker push ghcr.io/decentralchain/dcc-exchange:v1.0.0

# Deploy to Kubernetes
kubectl apply -f k8s/deployment.yml
```

**3. Vercel (One-click)**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**4. Netlify (Drag & Drop)**
- Build: `npm run build`
- Publish directory: `dist`
- Drag `dist` folder to Netlify dashboard

### Environment URLs

- **Production**: https://wallet.decentralchain.io
- **Staging**: https://staging.dcc-exchange.example.com
- **Docker**: `http://localhost:8080`

## 📊 Performance

### Build Performance
- **Development**: Hot reload <100ms
- **Production Build**: 4-10s for 215 modules
- **Bundle Size**: ~2.6 MB (780 KB gzipped)
- **Code Splitting**: Vendor (12 KB), UI (28 KB), Router (78 KB)

### Runtime Performance
- **First Contentful Paint**: <1s
- **Time to Interactive**: <2s
- **Lighthouse Score**: 90+
- **Virtual Scrolling**: Renders only visible items (1000+ items)

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run E2E tests (if configured)
npm run test:e2e
```

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Production build
- `npm run preview` - Preview production build
- `npm run lint` - Run Biome lint
- `npm run type-check` - TypeScript type checking

### Code Style

- Biome + TypeScript rules
- Biome for formatting
- Conventional Commits for commit messages

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push and create PR
git push origin feature/my-feature
```

## 🐛 Troubleshooting

### Common Issues

**Build fails with peer dependency errors**
```bash
npm install --legacy-peer-deps
```

**Port 3000 already in use**
```bash
# Change port in vite.config.ts
server: { port: 3001 }
```

**Docker build fails**
```bash
# Clear Docker cache
docker system prune -a
docker build --no-cache -t dcc-exchange .
```

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

### Development Guidelines

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'feat: Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

### Code Review Process

1. All PRs require at least one approval
2. CI/CD checks must pass
3. Code coverage should not decrease
4. Follow TypeScript best practices

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [DecentralChain](https://decentralchain.io) - Blockchain platform
- [React](https://react.dev) - UI framework
- [Vite](https://vitejs.dev) - Build tool
- [Styled Components](https://styled-components.com) - CSS-in-JS
- Open source community

## 📞 Support

- **Documentation**: https://docs.decentralchain.io
- **Discord**: https://discord.gg/decentralchain
- **Twitter**: https://twitter.com/decentralchain
- **GitHub Issues**: https://github.com/decentralchain/wallet/issues

## 🗺️ Roadmap

- [ ] Mobile app (React Native)
- [ ] Hardware wallet support (Ledger, Trezor)
- [ ] NFT marketplace integration
- [ ] Multi-chain support
- [ ] Advanced charting with TradingView
- [ ] Social recovery for accounts

---

**Built with ❤️ by the DecentralChain community**
