import { useState, useEffect, useRef, CSSProperties } from 'react';
import styled, { keyframes } from 'styled-components';

/**
 * Lazy Image Props
 */
export interface LazyImageProps {
  src: string;
  alt: string;
  placeholder?: string;
  width?: number | string;
  height?: number | string;
  objectFit?: CSSProperties['objectFit'];
  className?: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  threshold?: number;
  rootMargin?: string;
}

const shimmer = keyframes`
  0% {
    background-position: -468px 0;
  }
  100% {
    background-position: 468px 0;
  }
`;

const ImageContainer = styled.div<{
  $width?: number | string;
  $height?: number | string;
}>`
  position: relative;
  width: ${({ $width }) => (typeof $width === 'number' ? `${$width}px` : $width || '100%')};
  height: ${({ $height }) => (typeof $height === 'number' ? `${$height}px` : $height || 'auto')};
  overflow: hidden;
  background: ${({ theme }) => theme.colors.background};
`;

const StyledImage = styled.img<{
  $objectFit?: CSSProperties['objectFit'];
  $isLoaded: boolean;
}>`
  width: 100%;
  height: 100%;
  object-fit: ${({ $objectFit }) => $objectFit || 'cover'};
  opacity: ${({ $isLoaded }) => ($isLoaded ? 1 : 0)};
  transition: opacity 0.3s ease-in-out;
`;

const PlaceholderShimmer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: ${({ theme }) => theme.colors.background};
  background-image: linear-gradient(
    to right,
    ${({ theme }) => theme.colors.background} 0%,
    ${({ theme }) => theme.colors.border}40 20%,
    ${({ theme }) => theme.colors.background} 40%,
    ${({ theme }) => theme.colors.background} 100%
  );
  background-repeat: no-repeat;
  background-size: 800px 100%;
  animation: ${shimmer} 2s ease-in-out infinite;
`;

const ErrorContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.text};
  opacity: 0.6;
  font-size: 0.875rem;
`;

/**
 * Lazy Image Component with Intersection Observer
 * Loads images only when they enter the viewport
 */
export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  placeholder,
  width,
  height,
  objectFit = 'cover',
  className,
  onLoad,
  onError,
  threshold = 0.1,
  rootMargin = '50px',
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(placeholder || null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Return early if already loaded or has error
    if (isLoaded || hasError) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Start loading the image
          setImageSrc(src);
          observer.disconnect();
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [src, threshold, rootMargin, isLoaded, hasError]);

  const handleLoad = () => {
    setIsLoaded(true);
    setHasError(false);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(false);
    onError?.(new Error(`Failed to load image: ${src}`));
  };

  return (
    <ImageContainer ref={containerRef} $width={width} $height={height} className={className}>
      {/* Show shimmer while loading */}
      {!isLoaded && !hasError && <PlaceholderShimmer />}

      {/* Show error state */}
      {hasError && <ErrorContainer>Failed to load image</ErrorContainer>}

      {/* Actual image */}
      {imageSrc && (
        <StyledImage
          ref={imgRef}
          src={imageSrc}
          alt={alt}
          $objectFit={objectFit}
          $isLoaded={isLoaded}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
        />
      )}
    </ImageContainer>
  );
};

/**
 * Progressive Image Component
 * Loads a low-quality placeholder first, then the full image
 */
export interface ProgressiveImageProps extends LazyImageProps {
  placeholderSrc?: string;
  blur?: number;
}

const BlurredImage = styled.img<{ $blur: number }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: blur(${({ $blur }) => $blur}px);
  transform: scale(1.1);
`;

export const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  src,
  alt,
  placeholderSrc,
  blur = 10,
  width,
  height,
  objectFit = 'cover',
  className,
  onLoad,
  onError,
  threshold = 0.1,
  rootMargin = '50px',
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(placeholderSrc || null);
  const [fullImageSrc, setFullImageSrc] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isLoaded || hasError) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Load placeholder first
          if (placeholderSrc && !imageSrc) {
            setImageSrc(placeholderSrc);
          }

          // Then load full image
          const img = new Image();
          img.src = src;
          img.onload = () => {
            setFullImageSrc(src);
            setIsLoaded(true);
            onLoad?.();
          };
          img.onerror = () => {
            setHasError(true);
            onError?.(new Error(`Failed to load image: ${src}`));
          };

          observer.disconnect();
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [src, placeholderSrc, threshold, rootMargin, imageSrc, isLoaded, hasError, onLoad, onError]);

  return (
    <ImageContainer ref={containerRef} $width={width} $height={height} className={className}>
      {/* Show shimmer while loading placeholder */}
      {!imageSrc && !hasError && <PlaceholderShimmer />}

      {/* Show error state */}
      {hasError && <ErrorContainer>Failed to load image</ErrorContainer>}

      {/* Blurred placeholder */}
      {imageSrc && !fullImageSrc && (
        <BlurredImage src={imageSrc} alt={`${alt} placeholder`} $blur={blur} loading="lazy" />
      )}

      {/* Full resolution image */}
      {fullImageSrc && (
        <StyledImage
          src={fullImageSrc}
          alt={alt}
          $objectFit={objectFit}
          $isLoaded={isLoaded}
          loading="lazy"
        />
      )}
    </ImageContainer>
  );
};

/**
 * Hook for preloading images
 */
export const useImagePreload = (sources: string[]): boolean => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let loadedCount = 0;

    const images = sources.map((src) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        loadedCount++;
        if (loadedCount === sources.length) {
          setIsLoaded(true);
        }
      };
      return img;
    });

    return () => {
      images.forEach((img) => {
        img.onload = null;
        img.onerror = null;
      });
    };
  }, [sources]);

  return isLoaded;
};
