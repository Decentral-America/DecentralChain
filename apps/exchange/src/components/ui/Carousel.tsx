import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

// Styled Components
const CarouselContainer = styled.div`
  position: relative;
  width: 100%;
  overflow: hidden;
`;

const CarouselWrapper = styled.div`
  position: relative;
  overflow: hidden;
  border-radius: 8px;
`;

const Track = styled.div<{ $offset: number; $isDragging: boolean }>`
  display: flex;
  transform: translateX(${({ $offset }) => $offset}%);
  transition: ${({ $isDragging }) =>
    $isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)'};
  will-change: transform;
`;

const Item = styled.div<{ $width: number }>`
  flex: 0 0 ${({ $width }) => $width}%;
  padding: 0 8px;
  box-sizing: border-box;
`;

const Controls = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 16px;
`;

const NavButton = styled.button<{ $disabled?: boolean }>`
  padding: 8px 16px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 6px;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  opacity: ${({ $disabled }) => ($disabled ? 0.5 : 1)};

  &:hover:not(:disabled) {
    background: ${({ theme }) => `${theme.colors.primary}20`};
    border-color: ${({ theme }) => theme.colors.primary};
  }

  &:disabled {
    cursor: not-allowed;
  }
`;

const Indicators = styled.div`
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-top: 12px;
`;

const Indicator = styled.button<{ $active: boolean }>`
  width: ${({ $active }) => ($active ? '24px' : '8px')};
  height: 8px;
  border: none;
  border-radius: 4px;
  background: ${({ theme, $active }) =>
    $active ? theme.colors.primary : `${theme.colors.border}`};
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 0;

  &:hover {
    background: ${({ theme, $active }) =>
      $active ? theme.colors.primary : `${theme.colors.primary}60`};
  }
`;

// Interfaces
export interface CarouselProps {
  /** Array of items to display */
  items: React.ReactNode[];
  /** Number of items visible at once */
  itemsPerView?: number;
  /** Auto-play interval in milliseconds (0 to disable) */
  autoPlayInterval?: number;
  /** Show navigation buttons */
  showControls?: boolean;
  /** Show indicator dots */
  showIndicators?: boolean;
  /** Loop back to start when reaching the end */
  loop?: boolean;
  /** Enable touch/drag navigation */
  enableDrag?: boolean;
  /** Callback when slide changes */
  onChange?: (index: number) => void;
  /** Class name */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
}

export const Carousel: React.FC<CarouselProps> = ({
  items,
  itemsPerView = 1,
  autoPlayInterval = 0,
  showControls = true,
  showIndicators = true,
  loop = true,
  enableDrag = true,
  onChange,
  className,
  style,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  const maxIndex = Math.ceil(items.length / itemsPerView) - 1;
  const itemWidth = 100 / itemsPerView;

  // Handle slide change
  const goToSlide = useCallback(
    (index: number) => {
      const newIndex = loop
        ? (index + maxIndex + 1) % (maxIndex + 1)
        : Math.max(0, Math.min(index, maxIndex));

      setCurrentIndex(newIndex);
      onChange?.(newIndex);
    },
    [maxIndex, loop, onChange],
  );

  // Navigation functions
  const next = useCallback(() => {
    if (loop || currentIndex < maxIndex) {
      goToSlide(currentIndex + 1);
    }
  }, [currentIndex, maxIndex, loop, goToSlide]);

  const prev = useCallback(() => {
    if (loop || currentIndex > 0) {
      goToSlide(currentIndex - 1);
    }
  }, [currentIndex, loop, goToSlide]);

  // Auto-play
  useEffect(() => {
    if (autoPlayInterval > 0) {
      autoPlayRef.current = setInterval(next, autoPlayInterval);
      return () => {
        if (autoPlayRef.current) {
          clearInterval(autoPlayRef.current);
        }
      };
    }
  }, [autoPlayInterval, next]);

  // Pause auto-play on interaction
  const pauseAutoPlay = useCallback(() => {
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
    }
  }, []);

  // Resume auto-play
  const resumeAutoPlay = useCallback(() => {
    if (autoPlayInterval > 0) {
      autoPlayRef.current = setInterval(next, autoPlayInterval);
    }
  }, [autoPlayInterval, next]);

  // Drag handlers
  const handleDragStart = useCallback(
    (clientX: number) => {
      if (!enableDrag) return;
      pauseAutoPlay();
      setIsDragging(true);
      setStartX(clientX);
    },
    [enableDrag, pauseAutoPlay],
  );

  const handleDragMove = useCallback(
    (clientX: number) => {
      if (!isDragging || !trackRef.current) return;
      const diff = clientX - startX;
      const trackWidth = trackRef.current.offsetWidth;
      setDragOffset((diff / trackWidth) * 100);
    },
    [isDragging, startX],
  );

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    const threshold = 20; // Percentage threshold for slide change
    if (dragOffset > threshold) {
      prev();
    } else if (dragOffset < -threshold) {
      next();
    }

    setDragOffset(0);
    resumeAutoPlay();
  }, [isDragging, dragOffset, prev, next, resumeAutoPlay]);

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleDragMove(e.clientX);
  };

  const handleMouseUp = () => {
    handleDragEnd();
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      handleDragEnd();
    }
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    handleDragStart(e.touches[0]?.clientX ?? 0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleDragMove(e.touches[0]?.clientX ?? 0);
  };

  const handleTouchEnd = () => {
    handleDragEnd();
  };

  // Calculate offset
  const offset = -(currentIndex * 100) + dragOffset;

  return (
    <CarouselContainer className={className} style={style}>
      <CarouselWrapper
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Track ref={trackRef} $offset={offset} $isDragging={isDragging}>
          {items.map((item, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: carousel items are ReactNodes without intrinsic keys
            <Item key={index} $width={itemWidth}>
              {item}
            </Item>
          ))}
        </Track>
      </CarouselWrapper>

      {showControls && items.length > itemsPerView && (
        <Controls>
          <NavButton onClick={prev} $disabled={!loop && currentIndex === 0}>
            ← Previous
          </NavButton>
          <NavButton onClick={next} $disabled={!loop && currentIndex === maxIndex}>
            Next →
          </NavButton>
        </Controls>
      )}

      {showIndicators && items.length > itemsPerView && (
        <Indicators>
          {Array.from({ length: maxIndex + 1 }, (_, i) => i).map((slideIndex) => (
            <Indicator
              key={`indicator-${slideIndex}`}
              $active={slideIndex === currentIndex}
              onClick={() => goToSlide(slideIndex)}
              aria-label={`Go to slide ${slideIndex + 1}`}
            />
          ))}
        </Indicators>
      )}
    </CarouselContainer>
  );
};

// Convenience exports
export const CarouselSingle = (props: Omit<CarouselProps, 'itemsPerView'>) => (
  <Carousel {...props} itemsPerView={1} />
);

export const CarouselDouble = (props: Omit<CarouselProps, 'itemsPerView'>) => (
  <Carousel {...props} itemsPerView={2} />
);

export const CarouselTriple = (props: Omit<CarouselProps, 'itemsPerView'>) => (
  <Carousel {...props} itemsPerView={3} />
);

export const CarouselAutoPlay = (props: Omit<CarouselProps, 'autoPlayInterval'>) => (
  <Carousel {...props} autoPlayInterval={3000} />
);
