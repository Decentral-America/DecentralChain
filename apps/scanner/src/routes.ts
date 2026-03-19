import { index, layout, type RouteConfig, route } from '@react-router/dev/routes';

export default [
  layout('Layout.tsx', [
    index('pages/Dashboard.tsx'),
    route('blocks', 'pages/Blocks.tsx'),
    route('blockfeed', 'pages/BlockFeed.tsx'),
    route('blockdetail', 'pages/BlockDetail.tsx'),
    route('transaction', 'pages/Transaction.tsx'),
    route('address', 'pages/Address.tsx'),
    route('asset', 'pages/Asset.tsx'),
    route('dexpairs', 'pages/DexPairs.tsx'),
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
] satisfies RouteConfig;
