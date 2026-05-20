/**
 * Minimal TransitionGroup — manages the enter/exit lifecycle for CSSTransition
 * children as they are added to or removed from a list.
 *
 * Replaces react-transition-group's TransitionGroup (abandoned Aug 2022).
 *
 * Design:
 *   - Tracks all rendered children (entering + exiting) in a mutable ref.
 *   - The ref is updated synchronously during render so that removed elements
 *     stay in the DOM (as exiting) without a render gap — no flash of absence.
 *   - A counter state triggers a forced re-render only when an exiting child
 *     has fully animated out and must be purged from the map.
 *   - StrictMode safe: ref mutations are idempotent for the same incoming props.
 */
import React, { useRef, useState } from 'react';

interface TransitionGroupProps {
  className?: string | undefined;
  children: React.ReactNode;
}

type RK = string | number;

interface ChildEntry {
  el: React.ReactElement;
  exiting: boolean;
}

export function TransitionGroup({ className, children }: TransitionGroupProps) {
  // Drives forced re-renders when exiting children are fully removed.
  const [, forceRender] = useState(0);

  const mapRef = useRef<Map<RK, ChildEntry> | null>(null);

  // Initialise on first render.
  if (mapRef.current == null) {
    const initial = new Map<RK, ChildEntry>();
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child) && child.key != null) {
        initial.set(child.key, { el: child as React.ReactElement, exiting: false });
      }
    });
    mapRef.current = initial;
  }

  // Build incoming map for diffing.
  const incoming = new Map<RK, React.ReactElement>();
  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child) && child.key != null) {
      incoming.set(child.key, child as React.ReactElement);
    }
  });

  // Compute mutations without modifying the map while iterating it.
  const map = mapRef.current;
  const toMarkExiting: RK[] = [];
  const toAdd: Array<[RK, React.ReactElement]> = [];
  const toUpdate: Array<[RK, React.ReactElement]> = [];

  for (const [key, entry] of map) {
    if (!incoming.has(key) && !entry.exiting) toMarkExiting.push(key);
  }
  for (const [key, el] of incoming) {
    const existing = map.get(key);
    if (existing == null) toAdd.push([key, el]);
    else if (existing.el !== el) toUpdate.push([key, el]);
  }

  // Apply mutations.
  for (const key of toMarkExiting) {
    const entry = map.get(key);
    if (entry != null) map.set(key, { ...entry, exiting: true });
  }
  for (const [key, el] of toAdd) map.set(key, { el, exiting: false });
  for (const [key, el] of toUpdate) {
    const entry = map.get(key);
    if (entry != null) map.set(key, { ...entry, el });
  }

  // Render all tracked children, injecting in / unmountOnExit / onExited.
  const items: React.ReactElement[] = [];
  for (const [key, { el, exiting }] of map) {
    const stableKey = key;
    // Cast to open props type so TypeScript accepts the injected transition props.
    const typedEl = el as React.ReactElement<Record<string, unknown>>;
    items.push(
      React.cloneElement(typedEl, {
        in: !exiting,
        key: stableKey,
        onExited: () => {
          map.delete(stableKey);
          forceRender((n) => n + 1);
        },
        unmountOnExit: true,
      }),
    );
  }

  return <div className={className}>{items}</div>;
}
