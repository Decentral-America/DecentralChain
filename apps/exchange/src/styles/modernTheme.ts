/**
 * Modern Enterprise-Grade Theme
 * High-tech, crypto-focused design system
 */

export const modernTheme = {
  // Glassmorphism and depth
  glass: {
    background: 'rgba(255, 255, 255, 0.05)',
    backgroundLight: 'rgba(255, 255, 255, 0.1)',
    backdropBlur: 'blur(20px)',
    border: 'rgba(255, 255, 255, 0.1)',
  },

  // Gradient overlays
  gradients: {
    primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    success: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    warning: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    info: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    dark: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
    glow: 'linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%)',
  },

  // Modern shadows with glow effects
  glowShadows: {
    primary: '0 0 20px rgba(102, 126, 234, 0.3), 0 8px 32px rgba(0, 0, 0, 0.2)',
    success: '0 0 20px rgba(56, 239, 125, 0.3), 0 8px 32px rgba(0, 0, 0, 0.2)',
    elevated: '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 40px rgba(102, 126, 234, 0.1)',
    card: '0 8px 32px rgba(0, 0, 0, 0.12)',
    hover: '0 12px 40px rgba(0, 0, 0, 0.15), 0 0 30px rgba(102, 126, 234, 0.15)',
  },

  // Animation timings
  animations: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    normal: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '500ms cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: '600ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },

  // Status indicators
  status: {
    online: '#10b981',
    offline: '#6b7280',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },

  // Chart colors for data visualization
  chartColors: {
    primary: ['#667eea', '#764ba2', '#f093fb', '#f5576c'],
    cool: ['#4facfe', '#00f2fe', '#43e97b', '#38f9d7'],
    warm: ['#fa709a', '#fee140', '#30cfd0', '#330867'],
  },
};
