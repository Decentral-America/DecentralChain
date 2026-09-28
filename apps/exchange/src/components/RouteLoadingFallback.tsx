import { Skeleton } from '@mui/material';
import styled, { keyframes } from 'styled-components';

/**
 * Loading fallback for lazy-loaded routes.
 *
 * Not a spinner in the middle of an empty screen: the shape of a page (a
 * title, a line under it, a lifted card with rows) in wave skeletons, so the
 * route arrives into a layout that was already there. It waits a beat before
 * appearing, after 21st.dev "Skeleton Swap" by @ddoemonn (demo 23557), because
 * most chunks load faster than a skeleton can be read and a flash of grey is
 * worse than a moment of nothing.
 */

const appear = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const Frame = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  max-width: 1320px;
  min-height: 60vh;
  margin: 0 auto;
  padding: 12px clamp(16px, 4vw, 24px) 24px;
  opacity: 0;
  animation: ${appear} 240ms cubic-bezier(0.32, 0.72, 0, 1) 160ms forwards;

  @media (prefers-reduced-motion: reduce) {
    animation-duration: 1ms;
  }
`;

const Head = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Surface = styled.div`
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  padding: 8px 0;
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) =>
    theme.mode === 'dark' ? `0 0 0 1px ${theme.colors.border}` : theme.shadows.md};
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
`;

const Lines = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 6px;
`;

const WIDTHS = [42, 36, 48, 30, 40];

export const RouteLoadingFallback = () => {
  return (
    <Frame role="status" aria-live="polite" aria-busy="true" aria-label="Loading">
      <Head>
        <Skeleton variant="rounded" width={220} height={30} />
        <Skeleton variant="rounded" width={320} height={14} sx={{ maxWidth: '80%' }} />
      </Head>
      <Surface>
        {WIDTHS.map((w) => (
          <Row key={w}>
            <Skeleton variant="circular" width={40} height={40} />
            <Lines>
              <Skeleton variant="rounded" width={`${w}%`} height={14} />
              <Skeleton variant="rounded" width={`${w - 14}%`} height={12} />
            </Lines>
            <Skeleton variant="rounded" width={72} height={14} />
          </Row>
        ))}
      </Surface>
    </Frame>
  );
};
