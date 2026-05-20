import React, { useEffect, useRef, useState } from 'react';

interface Props {
  in?: boolean | undefined;
  classNames: string;
  timeout: number;
  unmountOnExit?: boolean | undefined;
  onExited?: (() => void) | undefined;
  children: React.ReactNode;
}

type Phase = 'enter' | 'enter-active' | 'entered' | 'exit' | 'exit-active';

/**
 * Drop-in replacement for react-transition-group's CSSTransition component.
 *
 * react-transition-group v4 has been abandoned (last release Aug 2022) and carries
 * the deprecated ReactDOM.findDOMNode API — which React 19 removed entirely (throws
 * TypeError on every in-prop change). This zero-dependency implementation avoids
 * that crash and replicates the CSS class sequence the existing :global Stylus
 * animations (.flash_modal-*, .flash_scale_modal-*) depend on:
 *
 *   entering:  `{classNames}-enter`  (1 frame)  →  `{classNames}-enter {classNames}-enter-active`  (timeout ms)
 *   exiting:   `{classNames}-exit`   (1 frame)  →  `{classNames}-exit  {classNames}-exit-active`   (timeout ms)
 *
 * Two nested requestAnimationFrame calls guarantee the browser paints the initial
 * (pre-transition) state before the active class is added and triggers the CSS
 * transition — matching react-transition-group's own internal rAF strategy.
 *
 * Classes are applied via React.cloneElement so they land directly on the child
 * element's DOM node rather than an extra wrapper, preserving the position:absolute
 * context required by the top-based flash_scale_modal animation.
 *
 * NOTE: React component children that do not accept/forward a `className` prop will
 * not receive the animation class and will appear/disappear without a transition.
 * This is a pre-existing limitation — react-transition-group v4 relied on the now-
 * removed ReactDOM.findDOMNode to bypass this. flash_scale_modal (plain <div>
 * children) and Pills (.animated-* children via <Pill className=…>) work correctly.
 */
export function CSSTransition({
  in: inProp = true,
  classNames,
  timeout,
  unmountOnExit = false,
  onExited,
  children,
}: Props) {
  const [mounted, setMounted] = useState(inProp);
  const [phase, setPhase] = useState<Phase | null>(inProp ? 'entered' : null);

  // Tracks whether we have completed the very first render so we skip the
  // initial effect run (the useState above already sets the correct initial state).
  const initDoneRef = useRef(false);
  const prevInPropRef = useRef(inProp);

  const rafRef = useRef<number>(undefined);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const clear = () => {
    if (rafRef.current !== undefined) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = undefined;
    }
    if (timerRef.current !== undefined) {
      clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: only re-run on inProp change; timeout/classNames/callbacks are stable
  useEffect(() => {
    // On first effect invocation (initial mount) — skip: state is already correct.
    // Also skip if inProp didn't actually change (React 19 StrictMode double-fire).
    if (!initDoneRef.current || prevInPropRef.current === inProp) {
      initDoneRef.current = true;
      prevInPropRef.current = inProp;
      return;
    }
    prevInPropRef.current = inProp;

    clear();

    if (inProp) {
      // --- enter sequence ---
      setMounted(true);
      setPhase('enter');
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = requestAnimationFrame(() => {
          setPhase('enter-active');
          timerRef.current = setTimeout(() => {
            setPhase('entered');
          }, timeout);
        });
      });
    } else {
      // --- exit sequence ---
      setPhase('exit');
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = requestAnimationFrame(() => {
          setPhase('exit-active');
          timerRef.current = setTimeout(() => {
            setPhase(null);
            onExited?.();
            if (unmountOnExit) setMounted(false);
          }, timeout);
        });
      });
    }

    return clear;
  }, [inProp]);

  if (!mounted) return null;

  // Map current phase to the CSS class string applied to the child element.
  const phaseClass: string | undefined =
    phase === 'enter'
      ? `${classNames}-enter`
      : phase === 'enter-active'
        ? `${classNames}-enter ${classNames}-enter-active`
        : phase === 'exit'
          ? `${classNames}-exit`
          : phase === 'exit-active'
            ? `${classNames}-exit ${classNames}-exit-active`
            : undefined;

  // Apply class names directly to the single child's root DOM element via
  // React.cloneElement — no wrapper div, preserving existing positioning context.
  const child = React.Children.only(children) as React.ReactElement<
    React.HTMLAttributes<HTMLElement>
  >;
  const existing = child.props.className;
  const merged: string | undefined =
    phaseClass != null ? (existing != null ? `${existing} ${phaseClass}` : phaseClass) : existing;

  return merged != null ? React.cloneElement(child, { className: merged }) : child;
}
