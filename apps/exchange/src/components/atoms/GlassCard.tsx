/**
 * Modern Glass Card Component
 * Enterprise-grade glassmorphism card with animations
 */
import styled from 'styled-components';

export const GlassCard = styled.div<{ $variant?: 'default' | 'elevated' | 'interactive' }>`
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 24px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  ${(props) =>
    props.$variant === 'elevated' &&
    `
    background: rgba(255, 255, 255, 0.08);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3), 0 0 40px rgba(102, 126, 234, 0.1);
  `}

  ${(props) =>
    props.$variant === 'interactive' &&
    `
    cursor: pointer;
    
    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15), 0 0 30px rgba(102, 126, 234, 0.15);
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(102, 126, 234, 0.3);
    }

    &:active {
      transform: translateY(-2px);
    }
  `}

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    transition: left 0.5s;
  }

  &:hover::before {
    left: 100%;
  }
`;

export const MetricCard = styled(GlassCard)`
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 140px;
  justify-content: space-between;
`;

export const MetricLabel = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const MetricValue = styled.div<{ $color?: string }>`
  font-size: 32px;
  font-weight: 700;
  color: ${(props) => props.$color || '#fff'};
  line-height: 1.2;
  background: ${(props) =>
    props.$color
      ? `linear-gradient(135deg, ${props.$color} 0%, ${props.$color}80 100%)`
      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-fill-color: transparent;
  display: flex;
  align-items: baseline;
  gap: 8px;
`;

export const MetricSubtext = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  display: flex;
  align-items: center;
  gap: 4px;
`;

export const TrendIndicator = styled.span<{ $trend: 'up' | 'down' | 'neutral' }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 6px;
  background: ${(props) => {
    if (props.$trend === 'up') return 'rgba(16, 185, 129, 0.1)';
    if (props.$trend === 'down') return 'rgba(239, 68, 68, 0.1)';
    return 'rgba(107, 114, 128, 0.1)';
  }};
  color: ${(props) => {
    if (props.$trend === 'up') return '#10b981';
    if (props.$trend === 'down') return '#ef4444';
    return '#6b7280';
  }};

  &::before {
    content: ${(props) => {
      if (props.$trend === 'up') return '"↑"';
      if (props.$trend === 'down') return '"↓"';
      return '"→"';
    }};
    font-size: 14px;
  }
`;

export const AnimatedBackground = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: 0.03;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  z-index: 0;
`;

export const CardContent = styled.div`
  position: relative;
  z-index: 1;
`;
