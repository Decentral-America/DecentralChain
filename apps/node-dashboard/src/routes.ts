import { index, layout, type RouteConfig, route } from '@react-router/dev/routes';

export default [
  route('healthz', 'routes/healthz.ts'),
  route('robots.txt', 'routes/robots.txt.ts'),
  layout('Layout.tsx', [
    index('pages/Nodes.tsx'),
    route('load-test', 'pages/LoadTest.tsx'),
    route('treasury', 'pages/Treasury.tsx'),
  ]),
  route('api/load-test/stream', 'routes/api.load-test.stream.ts'),
] satisfies RouteConfig;
