# Performance Profiling & Optimization Plan

## Exchange App

### Architecture
- React 19 SPA, Vite 8 + Rolldown, React Router 7 (lazy routes)
- State: Zustand + TanStack Query + React Context
- CSS: **Dual runtime** — styled-components + @emotion (MUI)
- Real-time: WebSocket + REST polling (1s balance, 30s general)
- Perf infra: web-vitals, usePerformanceMetrics, PerformanceDashboard (dev)

### Critical Bottlenecks (Priority Order)

#### P0 — Dual CSS-in-JS Runtime
**Impact: ~40 kB bundle + 2× CSSOM mutations per render**

Both `styled-components` (89 files) and `@emotion` (MUI dependency, 33 files
using `styled()`) inject `<style>` tags at runtime. This doubles CSS
serialization cost on every dynamic style change.

**Fix**: Consolidate to ONE runtime. Since MUI requires @emotion, either:
1. Migrate 89 `styled-components` files → MUI `styled()` (preferred, aligns with MUI v9 plan)
2. OR configure MUI to use `styled-components` as its engine via `@mui/styled-engine-sc`

**Estimated gain**: -40 kB bundle, -15% style recalculation time, -2ms INP on interactive elements

#### P1 — 1-Second Balance Polling
**Impact: 60 re-renders/min on active account components**

`useBalanceWatcher` polls every 1000ms. If the balance hasn't changed, this
triggers unnecessary React re-renders via state updates.

**Fix**:
- Add structural equality check before setting state (only update if balance changed)
- Increase interval to 5s (block time is ~60s; 1s gains nothing)
- Use WebSocket subscription for balance updates instead of polling

**Estimated gain**: -95% unnecessary re-renders on home/wallet screens

#### P2 — Order Book / Trade List Re-rendering
**Impact: Full list re-render on every WebSocket tick (10-50×/sec)**

WebSocket pushes for order book and trade history likely re-render entire lists.
Without `React.memo` on row components + virtualization, scrolling performance
degrades under high-frequency updates.

**Fix**:
- `React.memo` on `OrderBookRow`, `TradeRow` components
- Virtual scrolling via `@tanstack/react-virtual` for order book (typically 50+ rows)
- Batch WebSocket updates (requestAnimationFrame throttle) → max 1 render/frame

**Estimated gain**: -80% DOM mutations during active trading, smooth 60fps scrolling

#### P3 — Ramda Bundle Weight
**Impact: ~50-80 kB in utils chunk (not fully tree-shakeable)**

Ramda's architecture resists tree-shaking in some bundlers.

**Fix**: Replace with native JS/TS equivalents or `remeda` (fully tree-shakeable).
Start with the most-imported functions.

**Estimated gain**: -50 kB from utils chunk

#### P4 — TradingView Loading Delay
**Impact: Chart area blank for 1-3s on first load**

External script loaded via dynamic `<script>` injection with no preconnect hint.

**Fix**:
```html
<link rel="preconnect" href="https://s3.tradingview.com" />
<link rel="dns-prefetch" href="https://s3.tradingview.com" />
```
Add to `index.html` `<head>`. Additionally, show a skeleton/shimmer placeholder
while the script loads.

**Estimated gain**: -500ms perceived chart load time

#### P5 — WebSocket + Polling Overlap
**Impact: Duplicate network requests for same data**

If WebSocket is connected AND polling is active for the same data (order book,
candles), requests are wasted.

**Fix**: Disable polling hooks when WebSocket is connected. Use a connection
status flag from the WebSocket client.

---

## Scanner App

### Architecture
- React 19 SSR, React Router 7 (framework mode), Vite 8
- State: TanStack Query (sole state manager)
- CSS: Tailwind 4.3 (zero-runtime) — excellent
- Data: REST polling (5s blocks), no WebSocket
- Perf infra: None

### Critical Bottlenecks (Priority Order)

#### P0 — No Route-Level Code Splitting
**Impact: ALL 20 pages + all dependencies in initial bundle**

Every page (including Cytoscape, Leaflet, Recharts) is eagerly imported in
`routes.ts`. A user viewing `/blocks` downloads the entire map/graph/chart code.

**Fix**: Convert routes to lazy imports:
```ts
// routes.ts — BEFORE (eager)
import NetworkMap from './pages/NetworkMap';

// AFTER (lazy, code-split)
const NetworkMap = lazy(() => import('./pages/NetworkMap'));
```

React Router 7 supports `lazy()` natively in route config.

**Estimated gain**: -400 kB initial bundle (Cytoscape 217 kB + Leaflet 180 kB + Recharts 100 kB deferred to when needed)

#### P1 — Cytoscape + Leaflet in Main Bundle
**Impact: ~400 kB total for 2 pages only (NetworkMap, dependency graph)**

These heavy visualization libraries should ONLY load when their pages are visited.

**Fix**: Route-level lazy loading (P0 fix covers this). Additionally:
- Dynamic `import()` for cytoscape inside the component
- Intersection Observer for map tiles (only load when visible)

#### P2 — No Default staleTime
**Impact: Unnecessary refetches on every mount**

Without a global `staleTime`, React Query refetches on every component mount.
Block data (height, latest block) changes every ~60s but is fetched every 5s.

**Fix**: Set default `staleTime: 10_000` (10s) on QueryClient. Block-specific
queries can override to match their polling interval.

**Estimated gain**: -60% network requests on page navigation

#### P3 — No Performance Monitoring
**Impact: Can't measure what you don't track**

Exchange has full web-vitals + custom hooks. Scanner has nothing.

**Fix**: Add `web-vitals` + Sentry performance tracing. Reuse the same
`performanceMonitoring.ts` pattern from exchange.

#### P4 — SSR Hydration Cost
**Impact: Full page re-render on hydration for data-heavy pages**

Pages that fetch data in SSR loaders and pass via `useLoaderData()` are fine.
But pages with client-only data (React Query) re-render on hydration.

**Fix**: Use React Router's `loader` functions for critical above-fold data.
Feed into React Query's `initialData` to avoid double-fetch.

---

## Profiling Methodology

### Phase 1: Measurement (1 day)
1. **Lighthouse CI** — Capture baseline scores (LCP, CLS, INP, TBT)
2. **Bundle analysis** — `npx vite-bundle-visualizer` for both apps
3. **React DevTools Profiler** — Record render flame graphs during:
   - Exchange: DEX order book updates (30s capture)
   - Exchange: Account switching
   - Scanner: Navigate between pages
4. **Network waterfall** — Chrome DevTools, throttled to 4G

### Phase 2: Implementation (2-3 days)
- Scanner P0 first (biggest ROI: one route config change)
- Exchange P1 second (simple interval change)
- Exchange P2 third (React.memo + virtualization)

### Phase 3: Validation (½ day)
- Re-run Lighthouse, compare scores
- Verify no visual regressions
- Check bundle sizes before/after

---

## Success Metrics

| Metric | Exchange Target | Scanner Target |
|--------|----------------|----------------|
| LCP | < 2.0s | < 1.5s (SSR advantage) |
| INP | < 100ms | < 50ms |
| CLS | < 0.05 | < 0.01 |
| Initial bundle | -40 kB (CSS runtime) | -400 kB (lazy routes) |
| TTI on DEX | < 3s (4G) | N/A |
| TTI on Block List | N/A | < 1.5s (4G) |
