import { type ReactNode, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

/**
 * Virtual List Item Props
 */
export interface VirtualListItem {
  id: string | number;
  [key: string]: unknown;
}

/**
 * Virtual List Props
 */
export interface VirtualListProps<T extends VirtualListItem> {
  items: T[];
  height: number | string;
  itemHeight: number;
  renderItem: (item: T, index: number) => ReactNode;
  overscan?: number;
  className?: string;
  emptyMessage?: string;
  onScroll?: (scrollTop: number) => void;
}

const ListContainer = styled.div<{ $height: number | string }>`
  height: ${({ $height }) => (typeof $height === 'number' ? `${$height}px` : $height)};
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  background: ${({ theme }) => theme.colors.background};

  /* Custom scrollbar styling */
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.colors.background};
  }

  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.border};
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: ${({ theme }) => theme.colors.primary};
  }
`;

const ListContent = styled.div<{ $totalHeight: number }>`
  height: ${({ $totalHeight }) => $totalHeight}px;
  position: relative;
`;

const VirtualItem = styled.div<{ $offset: number; $height: number }>`
  position: absolute;
  top: ${({ $offset }) => $offset}px;
  left: 0;
  right: 0;
  height: ${({ $height }) => $height}px;
`;

const EmptyState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: ${({ theme }) => theme.colors.text};
  opacity: 0.6;
  font-size: 0.9375rem;
`;

/**
 * Calculate visible range based on scroll position
 */
const calculateVisibleRange = (
  scrollTop: number,
  containerHeight: number,
  itemHeight: number,
  totalItems: number,
  overscan: number = 3,
): { start: number; end: number } => {
  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.ceil((scrollTop + containerHeight) / itemHeight);

  const start = Math.max(0, visibleStart - overscan);
  const end = Math.min(totalItems, visibleEnd + overscan);

  return { end, start };
};

/**
 * Virtual List Component
 * Renders only visible items for optimal performance with large lists
 */
export function VirtualList<T extends VirtualListItem>({
  items,
  height,
  itemHeight,
  renderItem,
  overscan = 3,
  className,
  emptyMessage = 'No items to display',
  onScroll,
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  // Calculate total height
  const totalHeight = items.length * itemHeight;

  // Calculate visible range
  const { start, end } = calculateVisibleRange(
    scrollTop,
    containerHeight,
    itemHeight,
    items.length,
    overscan,
  );

  // Get visible items
  const visibleItems = items.slice(start, end);

  // Update container height on mount and resize
  useEffect(() => {
    if (!containerRef.current) return;

    const updateHeight = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
      }
    };

    updateHeight();

    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Throttled scroll handler
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let rafId: number | null = null;

    const handleScroll = () => {
      if (containerRef.current) {
        const newScrollTop = containerRef.current.scrollTop;
        setScrollTop(newScrollTop);
        onScroll?.(newScrollTop);
      }
    };

    const throttledScroll = () => {
      if (rafId) return;

      rafId = requestAnimationFrame(() => {
        handleScroll();
        rafId = null;
      });
    };

    container.addEventListener('scroll', throttledScroll);

    return () => {
      container.removeEventListener('scroll', throttledScroll);
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [onScroll]);

  // Empty state
  if (items.length === 0) {
    return (
      <ListContainer ref={containerRef} $height={height} className={className}>
        <EmptyState>{emptyMessage}</EmptyState>
      </ListContainer>
    );
  }

  return (
    <ListContainer ref={containerRef} $height={height} className={className}>
      <ListContent $totalHeight={totalHeight}>
        {visibleItems.map((item, index) => {
          const actualIndex = start + index;
          const offset = actualIndex * itemHeight;

          return (
            <VirtualItem key={item.id} $offset={offset} $height={itemHeight}>
              {renderItem(item, actualIndex)}
            </VirtualItem>
          );
        })}
      </ListContent>
    </ListContainer>
  );
}

/**
 * Variable Height Virtual List (for items with different heights)
 */
export interface VariableVirtualListProps<T extends VirtualListItem> {
  items: T[];
  height: number | string;
  estimatedItemHeight: number;
  renderItem: (item: T, index: number) => ReactNode;
  getItemHeight?: (item: T, index: number) => number;
  overscan?: number;
  className?: string;
  emptyMessage?: string;
}

export function VariableVirtualList<T extends VirtualListItem>({
  items,
  height,
  estimatedItemHeight,
  renderItem,
  getItemHeight,
  overscan = 3,
  className,
  emptyMessage = 'No items to display',
}: VariableVirtualListProps<T>) {
  const [itemHeights] = useState<Map<number, number>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  // Calculate offsets for each item
  const getItemOffset = (index: number): number => {
    let offset = 0;
    for (let i = 0; i < index; i++) {
      const item = items[i];
      offset +=
        itemHeights.get(i) || (item ? getItemHeight?.(item, i) : undefined) || estimatedItemHeight;
    }
    return offset;
  };

  // Calculate total height
  const totalHeight = items.reduce((sum, item, index) => {
    const itemHeight =
      itemHeights.get(index) || getItemHeight?.(item, index) || estimatedItemHeight;
    return sum + itemHeight;
  }, 0);

  // Determine visible items
  const getVisibleRange = (): { start: number; end: number } => {
    const containerHeight = containerRef.current?.clientHeight || 0;
    let start = 0;
    let end = items.length;

    // Find start index
    let currentOffset = 0;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const itemHeight =
        itemHeights.get(i) || (item ? getItemHeight?.(item, i) : undefined) || estimatedItemHeight;
      if (currentOffset + itemHeight > scrollTop) {
        start = Math.max(0, i - overscan);
        break;
      }
      currentOffset += itemHeight;
    }

    // Find end index
    currentOffset = getItemOffset(start);
    for (let i = start; i < items.length; i++) {
      const item = items[i];
      const itemHeight =
        itemHeights.get(i) || (item ? getItemHeight?.(item, i) : undefined) || estimatedItemHeight;
      if (currentOffset > scrollTop + containerHeight) {
        end = Math.min(items.length, i + overscan);
        break;
      }
      currentOffset += itemHeight;
    }

    return { end, start };
  };

  const { start, end } = getVisibleRange();
  const visibleItems = items.slice(start, end);

  // Throttled scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let rafId: number | null = null;

    const handleScroll = () => {
      if (containerRef.current) {
        setScrollTop(containerRef.current.scrollTop);
      }
    };

    const throttledScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        handleScroll();
        rafId = null;
      });
    };

    container.addEventListener('scroll', throttledScroll);

    return () => {
      container.removeEventListener('scroll', throttledScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  if (items.length === 0) {
    return (
      <ListContainer ref={containerRef} $height={height} className={className}>
        <EmptyState>{emptyMessage}</EmptyState>
      </ListContainer>
    );
  }

  return (
    <ListContainer ref={containerRef} $height={height} className={className}>
      <ListContent $totalHeight={totalHeight}>
        {visibleItems.map((item, index) => {
          const actualIndex = start + index;
          const offset = getItemOffset(actualIndex);
          const itemHeight =
            itemHeights.get(actualIndex) ||
            getItemHeight?.(item, actualIndex) ||
            estimatedItemHeight;

          return (
            <VirtualItem key={item.id} $offset={offset} $height={itemHeight}>
              {renderItem(item, actualIndex)}
            </VirtualItem>
          );
        })}
      </ListContent>
    </ListContainer>
  );
}
