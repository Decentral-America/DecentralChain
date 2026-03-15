/**
 * Modern Enterprise-Grade Theme
 * High-tech, crypto-focused design system
 */

export const modernTheme = {
  // Animation timings
  animations: {
    bounce: '600ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    normal: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '500ms cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // Chart colors for data visualization
  chartColors: {
    cool: ['#4facfe', '#00f2fe', '#43e97b', '#38f9d7'],
    primary: ['#667eea', '#764ba2', '#f093fb', '#f5576c'],
    warm: ['#fa709a', '#fee140', '#30cfd0', '#330867'],
  },
  // Glassmorphism and depth
  glass: {
    backdropBlur: 'blur(20px)',
    background: 'rgba(255, 255, 255, 0.05)',
    backgroundLight: 'rgba(255, 255, 255, 0.1)',
    border: 'rgba(255, 255, 255, 0.1)',
  },

  // Modern shadows with glow effects
  glowShadows: {
    card: '0 8px 32px rgba(0, 0, 0, 0.12)',
    elevated: '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 40px rgba(102, 126, 234, 0.1)',
    hover: '0 12px 40px rgba(0, 0, 0, 0.15), 0 0 30px rgba(102, 126, 234, 0.15)',
    primary: '0 0 20px rgba(102, 126, 234, 0.3), 0 8px 32px rgba(0, 0, 0, 0.2)',
    success: '0 0 20px rgba(56, 239, 125, 0.3), 0 8px 32px rgba(0, 0, 0, 0.2)',
  },

  // Gradient overlays
  gradients: {
    dark: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
    glow: 'linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%)',
    info: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    success: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    warning: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  },

  // Status indicators
  status: {
    error: '#ef4444',
    info: '#3b82f6',
    offline: '#6b7280',
    online: '#10b981',
    warning: '#f59e0b',
  },
};
