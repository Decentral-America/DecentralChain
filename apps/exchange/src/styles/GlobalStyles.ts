/**
 * Global Styles
 * CSS reset and base styles using styled-components
 * Replaces Angular global LESS files
 */
import { createGlobalStyle } from 'styled-components';

export const GlobalStyles = createGlobalStyle`
  /* CSS Reset */
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  *::before,
  *::after {
    box-sizing: border-box;
  }

  /* Base Styles */
  html {
    font-size: 16px;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
  }

  html,
  body,
  #root {
    height: 100%;
    font-family: ${(props) => props.theme.fonts.main};
    color: ${(props) => props.theme.colors.text};
    background: ${(props) => props.theme.colors.background};
    line-height: 1.5;
  }

  /* Typography */
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    font-weight: ${(props) => props.theme.fontWeights.semibold};
    line-height: 1.2;
    margin-bottom: ${(props) => props.theme.spacing.md};
  }

  p {
    margin-bottom: ${(props) => props.theme.spacing.md};
  }

  /* Links */
  a {
    color: ${(props) => props.theme.colors.primary};
    text-decoration: none;
    transition: ${(props) => props.theme.transitions.fast};

    &:hover {
      opacity: 0.8;
    }
  }

  /* Buttons */
  button {
    font-family: inherit;
    cursor: pointer;
    border: none;
    background: none;
    font-size: inherit;
  }

  button:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  /* Form Elements */
  input,
  textarea,
  select {
    font-family: inherit;
    font-size: inherit;
    color: inherit;
  }

  /* Code */
  code,
  pre {
    font-family: ${(props) => props.theme.fonts.mono};
  }

  /* Scrollbar Styling (Webkit) */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: ${(props) => props.theme.colors.background};
  }

  ::-webkit-scrollbar-thumb {
    background: ${(props) => props.theme.colors.border};
    border-radius: ${(props) => props.theme.radii.sm};

    &:hover {
      background: ${(props) => props.theme.colors.primary}40;
    }
  }

  /* Selection */
  ::selection {
    background: ${(props) => props.theme.colors.primary}40;
    color: ${(props) => props.theme.colors.text};
  }
`;
