import { index, layout, type RouteConfig, route } from '@react-router/dev/routes';

/**
 * Route config — 7 top-level nav destinations.
 *
 * Deep-link aliases (BlockFeed, NetworkStatistics, NetworkMap, Peers, Node,
 * UnconfirmedTransactions, DistributionTool, TransactionMap, Sustainability)
 * are preserved so existing shared URLs continue to resolve.  The Network page
 * renders those experiences via its own sub-tabs.
 */
export default [
  layout('Layout.tsx', [
    // ── Primary nav (7 items) ────────────────────────────────────────────
    index('pages/Dashboard.tsx'),
    route('blocks', 'pages/Blocks.tsx'),
    route('blockdetail', 'pages/BlockDetail.tsx'),
    route('transaction', 'pages/Transaction.tsx'),
    route('address', 'pages/Address.tsx'),
    route('asset', 'pages/Asset.tsx'),
    route('dexpairs', 'pages/DexPairs.tsx'),
    route('network', 'pages/Network.tsx'),

    // ── Deep-link aliases (off-nav, routes still active) ─────────────────
    route('blockfeed', 'pages/BlockFeed.tsx'),
    route('unconfirmedtransactions', 'pages/UnconfirmedTransactions.tsx'),
    route('distributiontool', 'pages/DistributionTool.tsx'),
    route('transactionmap', 'pages/TransactionMap.tsx'),
    route('networkstatistics', 'pages/NetworkStatistics.tsx'),
    route('networkmap', 'pages/NetworkMap.tsx'),
    route('peers', 'pages/Peers.tsx'),
    route('sustainability', 'pages/Sustainability.tsx'),
    route('node', 'pages/Node.tsx'),
    route('home', 'pages/Home.tsx'),
  ]),

  // ── Resource routes (no layout wrapper) ──────────────────────────────────
  // DCC-158 — Sitemap XML for search engine crawlers
  route('sitemap.xml', 'routes/sitemap.xml.ts'),
] satisfies RouteConfig;
