import { type RefObject, useCallback, useEffect, useRef, useState } from 'react';

/**
 * Position interface for x and y coordinates
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * Options for customizing draggable behavior
 */
export interface UseDraggableOptions {
  /**
   * Initial position of the element
   * @default { x: 0, y: 0 }
   */
  initialPosition?: Position;

  /**
   * Whether dragging is enabled
   * @default true
   */
  enabled?: boolean;

  /**
   * Constrain dragging within bounds
   */
  bounds?:
    | {
        left?: number;
        top?: number;
        right?: number;
        bottom?: number;
      }
    | undefined;

  /**
   * Snap to grid
   */
  grid?: {
    x: number;
    y: number;
  };

  /**
   * Callback when drag starts
   */
  onDragStart?: (position: Position) => void;

  /**
   * Callback during dragging
   */
  onDrag?: (position: Position) => void;

  /**
   * Callback when drag ends
   */
  onDragEnd?: (position: Position) => void;

  /**
   * Handle element selector (if dragging should only work from specific element)
   */
  handle?: string;

  /**
   * Prevent default behavior on drag
   * @default true
   */
  preventDefault?: boolean;

  /**
   * Enable touch support
   * @default true
   */
  touchEnabled?: boolean;
}

/**
 * Return type for useDraggable hook
 */
export interface UseDraggableReturn {
  /**
   * Current position of the element
   */
  position: Position;

  /**
   * Whether the element is currently being dragged
   */
  isDragging: boolean;

  /**
   * Mouse down handler to attach to the draggable element or handle
   */
  handleMouseDown: (e: React.MouseEvent) => void;

  /**
   * Touch start handler for touch support
   */
  handleTouchStart: (e: React.TouchEvent) => void;

  /**
   * Reset position to initial or specified position
   */
  reset: (newPosition?: Position) => void;

  /**
   * Set position programmatically
   */
  setPosition: (position: Position) => void;
}

/**
 * Hook for making elements draggable
 *
 * @param ref - Reference to the element to make draggable
 * @param options - Configuration options
 * @returns Draggable state and handlers
 *
 * @example
 * ```tsx
 * const ref = useRef<HTMLDivElement>(null);
 * const { position, isDragging, handleMouseDown } = useDraggable(ref);
 *
 * return (
 *   <div
 *     ref={ref}
 *     onMouseDown={handleMouseDown}
 *     style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
 *   >
 *     Drag me!
 *   </div>
 * );
 * ```
 *
 * @example With bounds and grid
 * ```tsx
 * const { position, handleMouseDown } = useDraggable(ref, {
 *   bounds: { left: 0, top: 0, right: 500, bottom: 500 },
 *   grid: { x: 20, y: 20 },
 *   onDragEnd: (pos) => logger.debug('Dropped at:', pos)
 * });
 * ```
 */
export function useDraggable<T extends HTMLElement>(
  ref: RefObject<T | null>,
  options: UseDraggableOptions = {},
): UseDraggableReturn {
  const {
    initialPosition = { x: 0, y: 0 },
    enabled = true,
    bounds,
    grid,
    onDragStart,
    onDrag,
    onDragEnd,
    handle,
    preventDefault = true,
    touchEnabled = true,
  } = options;

  const [position, setPosition] = useState<Position>(initialPosition);
  const [isDragging, setIsDragging] = useState(false);

  // Store drag start position to calculate delta
  const dragStartRef = useRef<{ x: number; y: number; posX: number; posY: number } | null>(null);

  /**
   * Apply constraints and grid snapping to position
   */
  const constrainPosition = useCallback(
    (pos: Position): Position => {
      let { x, y } = pos;

      // Apply grid snapping
      if (grid) {
        x = Math.round(x / grid.x) * grid.x;
        y = Math.round(y / grid.y) * grid.y;
      }

      // Apply bounds
      if (bounds) {
        if (bounds.left !== undefined) x = Math.max(bounds.left, x);
        if (bounds.right !== undefined) x = Math.min(bounds.right, x);
        if (bounds.top !== undefined) y = Math.max(bounds.top, y);
        if (bounds.bottom !== undefined) y = Math.min(bounds.bottom, y);
      }

      return { x, y };
    },
    [bounds, grid],
  );

  /**
   * Check if the drag started from a valid handle
   */
  const isValidHandle = useCallback(
    (target: EventTarget | null): boolean => {
      if (!handle || !ref.current) return true;

      const handleElement = ref.current.querySelector(handle);
      if (!handleElement) return true;

      return handleElement.contains(target as Node);
    },
    [handle, ref],
  );

  /**
   * Handle mouse move during drag
   */
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragStartRef.current) return;

      if (preventDefault) {
        e.preventDefault();
      }

      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;

      const newPosition = constrainPosition({
        x: dragStartRef.current.posX + deltaX,
        y: dragStartRef.current.posY + deltaY,
      });

      setPosition(newPosition);
      onDrag?.(newPosition);
    },
    [constrainPosition, onDrag, preventDefault],
  );

  /**
   * Handle mouse up (end drag)
   */
  const handleMouseUp = useCallback(() => {
    if (!dragStartRef.current) return;

    setIsDragging(false);
    onDragEnd?.(position);
    dragStartRef.current = null;

    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [position, onDragEnd, handleMouseMove]);

  /**
   * Handle mouse down (start drag)
   */
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!enabled || !isValidHandle(e.target)) return;

      if (preventDefault) {
        e.preventDefault();
      }

      dragStartRef.current = {
        posX: position.x,
        posY: position.y,
        x: e.clientX,
        y: e.clientY,
      };

      setIsDragging(true);
      onDragStart?.(position);

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [enabled, isValidHandle, preventDefault, position, onDragStart, handleMouseMove, handleMouseUp],
  );

  /**
   * Handle touch move during drag
   */
  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!dragStartRef.current || !touchEnabled) return;

      if (preventDefault) {
        e.preventDefault();
      }

      const touch = e.touches[0];
      if (!touch) return;
      const deltaX = touch.clientX - dragStartRef.current.x;
      const deltaY = touch.clientY - dragStartRef.current.y;

      const newPosition = constrainPosition({
        x: dragStartRef.current.posX + deltaX,
        y: dragStartRef.current.posY + deltaY,
      });

      setPosition(newPosition);
      onDrag?.(newPosition);
    },
    [constrainPosition, onDrag, preventDefault, touchEnabled],
  );

  /**
   * Handle touch end (end drag)
   */
  const handleTouchEnd = useCallback(() => {
    if (!dragStartRef.current) return;

    setIsDragging(false);
    onDragEnd?.(position);
    dragStartRef.current = null;

    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
  }, [position, onDragEnd, handleTouchMove]);

  /**
   * Handle touch start (start drag)
   */
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled || !touchEnabled || !isValidHandle(e.target)) return;

      if (preventDefault) {
        e.preventDefault();
      }

      const touch = e.touches[0];
      if (!touch) return;
      dragStartRef.current = {
        posX: position.x,
        posY: position.y,
        x: touch.clientX,
        y: touch.clientY,
      };

      setIsDragging(true);
      onDragStart?.(position);

      document.addEventListener('touchmove', handleTouchMove, { passive: !preventDefault });
      document.addEventListener('touchend', handleTouchEnd);
    },
    [
      enabled,
      touchEnabled,
      isValidHandle,
      preventDefault,
      position,
      onDragStart,
      handleTouchMove,
      handleTouchEnd,
    ],
  );

  /**
   * Reset to initial or specified position
   */
  const reset = useCallback(
    (newPosition?: Position) => {
      setPosition(newPosition ?? initialPosition);
      setIsDragging(false);
      dragStartRef.current = null;
    },
    [initialPosition],
  );

  /**
   * Cleanup event listeners on unmount
   */
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  return {
    handleMouseDown,
    handleTouchStart,
    isDragging,
    position,
    reset,
    setPosition,
  };
}

/**
 * Convenience hook for constrained dragging within a container
 *
 * @param ref - Reference to the draggable element
 * @param containerRef - Reference to the container element
 * @param options - Additional options
 *
 * @example
 * ```tsx
 * const ref = useRef<HTMLDivElement>(null);
 * const containerRef = useRef<HTMLDivElement>(null);
 * const { position, handleMouseDown } = useConstrainedDraggable(ref, containerRef);
 * ```
 */
export function useConstrainedDraggable<T extends HTMLElement, C extends HTMLElement>(
  ref: RefObject<T | null>,
  containerRef: RefObject<C | null>,
  options: Omit<UseDraggableOptions, 'bounds'> = {},
): UseDraggableReturn {
  const [bounds, setBounds] = useState<UseDraggableOptions['bounds']>();

  useEffect(() => {
    if (!containerRef.current || !ref.current) return;

    const container = containerRef.current.getBoundingClientRect();
    const element = ref.current.getBoundingClientRect();

    setBounds({
      bottom: container.height - element.height,
      left: 0,
      right: container.width - element.width,
      top: 0,
    });
  }, [containerRef, ref]);

  return useDraggable(ref, { ...options, bounds });
}
