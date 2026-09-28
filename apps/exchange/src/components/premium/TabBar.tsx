/**
 * Tab bar — the iOS bottom bar. A translucent chrome material that content
 * scrolls beneath, labelled destinations, and one selection capsule that
 * springs between tabs instead of each tab lighting up on its own. The
 * active glyph takes the accent; the capsule is its tinted wash.
 *
 * Adapted from 21st.dev "Toolbar Dock" by @ruixen.ui (demo 14092): its single
 * rail that slides between icons becomes the shared selection capsule (a
 * motion `layoutId`), and its sparing `background/95 + backdrop-blur` glass is
 * the same material the desktop top bar uses. Tooltips are dropped; on a
 * phone the labels are always visible.
 */

import { type LucideIcon } from 'lucide-react';
import { LayoutGroup, motion, useReducedMotion } from 'motion/react';
import { Link } from 'react-router';
import styled, { css } from 'styled-components';
import { materials, spring } from '@/styles/tokens';

const Bar = styled.nav<{ $height: number }>`
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1200;
  padding-bottom: env(safe-area-inset-bottom);
  background: var(--material-chrome);
  -webkit-backdrop-filter: ${materials.filter};
  backdrop-filter: ${materials.filter};
  box-shadow: inset 0 0.5px 0 var(--border-strong);

  & > div {
    display: grid;
    grid-auto-columns: 1fr;
    grid-auto-flow: column;
    height: ${({ $height }) => $height}px;
    padding: 0 4px;
  }
`;

const itemStyles = css<{ $active: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  min-width: 44px;
  height: 100%;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  font: inherit;
  text-decoration: none;
  cursor: pointer;
  color: ${({ $active }) => ($active ? 'var(--color-indigo-ink)' : 'var(--text-secondary)')};
  transition: color 160ms var(--ease);
  -webkit-tap-highlight-color: transparent;
  outline: none;

  @media (hover: hover) {
    &:hover {
      color: ${({ $active }) => ($active ? 'var(--color-indigo-ink)' : 'var(--text-primary)')};
    }
  }

  &:focus-visible > span:first-child {
    box-shadow: 0 0 0 2px var(--color-indigo-ink);
  }
`;

const ItemLink = styled(Link)<{ $active: boolean }>`
  ${itemStyles}
`;
const ItemButton = styled.button<{ $active: boolean }>`
  ${itemStyles}
`;

/* The glyph well: the capsule slides in behind it. */
const Well = styled.span`
  position: relative;
  display: grid;
  place-items: center;
  width: 56px;
  height: 30px;
  border-radius: 16px;
`;

const Capsule = styled(motion.span)`
  position: absolute;
  inset: 0;
  border-radius: 16px;
  background: var(--surface-lavender);
`;

const Glyph = styled(motion.span)`
  position: relative;
  display: grid;
  place-items: center;
`;

const Label = styled.span<{ $active: boolean }>`
  font-size: 11px;
  line-height: 13px;
  font-weight: ${({ $active }) => ($active ? 600 : 500)};
  letter-spacing: 0.01em;
`;

export interface TabBarItem {
  key: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  /** Navigates when set; otherwise the tab is a button. */
  to?: string;
  onClick?: () => void;
  /** Accessible name when it should say more than the visible label. */
  'aria-label'?: string;
  /** Extra attributes for a tab that opens something, e.g. `aria-haspopup`. */
  'aria-haspopup'?: 'dialog' | 'menu';
  'aria-expanded'?: boolean;
}

export interface TabBarProps {
  items: TabBarItem[];
  /** Accessible name of the navigation landmark. */
  label?: string;
  /** Row height, excluding the home-indicator inset. */
  height?: number;
}

export function TabBar({ items, label = 'Primary', height = 56 }: TabBarProps) {
  const reduced = useReducedMotion();
  const transition = reduced ? { duration: 0 } : spring;

  return (
    <Bar aria-label={label} $height={height}>
      <LayoutGroup id="tab-bar">
        <div>
          {items.map((item) => {
            const TabIcon = item.icon;
            const inner = (
              <>
                <Well>
                  {item.active ? (
                    <Capsule layoutId="tab-bar-capsule" transition={transition} />
                  ) : null}
                  <Glyph
                    initial={false}
                    animate={{ scale: item.active && !reduced ? 1.06 : 1 }}
                    transition={transition}
                  >
                    <TabIcon size={22} strokeWidth={item.active ? 2.1 : 1.8} aria-hidden="true" />
                  </Glyph>
                </Well>
                <Label $active={item.active}>{item.label}</Label>
              </>
            );

            if (item.to) {
              return (
                <ItemLink
                  key={item.key}
                  to={item.to}
                  aria-label={item['aria-label'] ?? item.label}
                  aria-current={item.active ? 'page' : undefined}
                  $active={item.active}
                >
                  {inner}
                </ItemLink>
              );
            }
            return (
              <ItemButton
                key={item.key}
                type="button"
                onClick={item.onClick}
                aria-label={item['aria-label'] ?? item.label}
                aria-haspopup={item['aria-haspopup']}
                aria-expanded={item['aria-expanded']}
                $active={item.active}
              >
                {inner}
              </ItemButton>
            );
          })}
        </div>
      </LayoutGroup>
    </Bar>
  );
}
