import { createContext, type ReactNode, useContext, useMemo } from 'react';

/**
 * Surface context.
 *
 * Marks a region that already provides its own surface, so nested cards render
 * without chrome instead of stacking a second panel inside the first.
 *
 * The mobile auth screens are the motivating case: the sheet is the surface, so
 * the shared login and wallet-creation forms should sit directly on it rather
 * than drawing their own bordered card within it. Expressing this as context
 * keeps the forms unchanged — they stay usable standalone on desktop, where the
 * card is the surface.
 */

interface SurfaceContextValue {
  /** Nested cards should render transparent, borderless and unpadded. */
  chromeless: boolean;
  /**
   * The surrounding screen already supplies the page header, so features must
   * not render their own hero block. Desktop heroes are a large icon plate, a
   * 2.5rem title and a subtitle — on a phone that consumes the entire first
   * screen before any actual content appears, and duplicates the title bar.
   */
  compact: boolean;
}

const SurfaceContext = createContext<SurfaceContextValue>({
  chromeless: false,
  compact: false,
});

export function SurfaceProvider({
  chromeless = false,
  compact = false,
  children,
}: {
  chromeless?: boolean;
  compact?: boolean;
  children: ReactNode;
}) {
  const value = useMemo(() => ({ chromeless, compact }), [chromeless, compact]);
  return <SurfaceContext.Provider value={value}>{children}</SurfaceContext.Provider>;
}

export function useSurface(): SurfaceContextValue {
  return useContext(SurfaceContext);
}
