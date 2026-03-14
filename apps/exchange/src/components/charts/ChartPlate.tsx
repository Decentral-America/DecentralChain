import React from 'react';
import styled from 'styled-components';

/**
 * Main plate container
 */
const Plate = styled.div`
  padding: 16px;
  background: ${({ theme }) => theme.colors.background};
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.2s ease;

  &:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
`;

/**
 * Header section with title and controls
 */
const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  gap: 16px;
`;

/**
 * Title styling
 */
const Title = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
`;

/**
 * Subtitle styling
 */
const Subtitle = styled.p`
  margin: 0 0 16px 0;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.secondary};
`;

/**
 * Controls container
 */
const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

/**
 * Content area
 */
const Content = styled.div`
  width: 100%;
`;

/**
 * Footer section
 */
const Footer = styled.div`
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

/**
 * Props for ChartPlate component
 */
export interface ChartPlateProps {
  /**
   * Chart title
   */
  title: string;

  /**
   * Chart content (typically a chart component)
   */
  children: React.ReactNode;

  /**
   * Control elements (buttons, dropdowns, etc.)
   */
  controls?: React.ReactNode;

  /**
   * Optional subtitle/description
   */
  subtitle?: string;

  /**
   * Footer content (legends, summaries, etc.)
   */
  footer?: React.ReactNode;

  /**
   * Custom class name
   */
  className?: string;

  /**
   * Loading state
   */
  loading?: boolean;

  /**
   * Error state
   */
  error?: string | null;

  /**
   * Empty state message
   */
  emptyMessage?: string;

  /**
   * Show empty state when no data
   */
  isEmpty?: boolean;
}

/**
 * Chart container wrapper with title, controls, and optional footer
 *
 * Provides a consistent container for all chart components with
 * header section for title/controls and optional footer for legends.
 *
 * @example
 * ```tsx
 * <ChartPlate
 *   title="Asset Performance"
 *   controls={
 *     <>
 *       <button>1D</button>
 *       <button>1W</button>
 *       <button>1M</button>
 *     </>
 *   }
 * >
 *   <AssetRateChart data={data} />
 * </ChartPlate>
 * ```
 *
 * @example With subtitle and footer
 * ```tsx
 * <ChartPlate
 *   title="Portfolio Distribution"
 *   subtitle="Last 30 days"
 *   footer={<div>Total: $1,234.56</div>}
 * >
 *   <CircleChart value={75} />
 * </ChartPlate>
 * ```
 */
export const ChartPlate: React.FC<ChartPlateProps> = ({
  title,
  children,
  controls,
  subtitle,
  footer,
  className,
  loading = false,
  error = null,
  emptyMessage = 'No data available',
  isEmpty = false,
}) => {
  return (
    <Plate className={className}>
      <Header>
        <div>
          <Title>{title}</Title>
          {subtitle && <Subtitle>{subtitle}</Subtitle>}
        </div>
        {controls && <Controls>{controls}</Controls>}
      </Header>

      <Content>
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>Loading...</div>
        )}

        {error && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#f44336' }}>{error}</div>
        )}

        {!loading && !error && isEmpty && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
            {emptyMessage}
          </div>
        )}

        {!loading && !error && !isEmpty && children}
      </Content>

      {footer && <Footer>{footer}</Footer>}
    </Plate>
  );
};

/**
 * Compact variant with less padding
 */
export const ChartPlateCompact: React.FC<ChartPlateProps> = (props) => {
  const CompactPlate = styled(Plate)`
    padding: 12px;
  `;

  const CompactHeader = styled(Header)`
    margin-bottom: 12px;
  `;

  return (
    <CompactPlate className={props.className}>
      <CompactHeader>
        <div>
          <Title>{props.title}</Title>
          {props.subtitle && <Subtitle>{props.subtitle}</Subtitle>}
        </div>
        {props.controls && <Controls>{props.controls}</Controls>}
      </CompactHeader>

      <Content>{props.children}</Content>

      {props.footer && <Footer>{props.footer}</Footer>}
    </CompactPlate>
  );
};

/**
 * Bordered variant with visible border instead of shadow
 */
export const ChartPlateBordered: React.FC<ChartPlateProps> = (props) => {
  const BorderedPlate = styled(Plate)`
    box-shadow: none;
    border: 1px solid ${({ theme }) => theme.colors.border};

    &:hover {
      box-shadow: none;
      border-color: ${({ theme }) => theme.colors.primary};
    }
  `;

  return (
    <BorderedPlate className={props.className}>
      <Header>
        <div>
          <Title>{props.title}</Title>
          {props.subtitle && <Subtitle>{props.subtitle}</Subtitle>}
        </div>
        {props.controls && <Controls>{props.controls}</Controls>}
      </Header>

      <Content>{props.children}</Content>

      {props.footer && <Footer>{props.footer}</Footer>}
    </BorderedPlate>
  );
};

/**
 * Flat variant with no shadow or border
 */
export const ChartPlateFlat: React.FC<ChartPlateProps> = (props) => {
  const FlatPlate = styled(Plate)`
    box-shadow: none;
    background: transparent;
    padding: 0;

    &:hover {
      box-shadow: none;
    }
  `;

  return (
    <FlatPlate className={props.className}>
      <Header>
        <div>
          <Title>{props.title}</Title>
          {props.subtitle && <Subtitle>{props.subtitle}</Subtitle>}
        </div>
        {props.controls && <Controls>{props.controls}</Controls>}
      </Header>

      <Content>{props.children}</Content>

      {props.footer && <Footer>{props.footer}</Footer>}
    </FlatPlate>
  );
};
