/**
 * The field material shared by every styled-components control, so a native
 * select, a floating-label field and the MUI OutlinedInput (themed in
 * src/theme/mui-theme.ts) read as one control family: white (graphite fill in
 * dark), a --border-strong hairline, 10px corners and a soft accent halo on
 * focus instead of an outline.
 */
import { css, type DefaultTheme } from 'styled-components';
import { chrome } from '@/styles/tokens';

export const EASE = 'cubic-bezier(0.32, 0.72, 0, 1)';

/** The accent halo drawn around a focused control. */
export const focusHalo = (theme: DefaultTheme) => `0 0 0 4px ${chrome[theme.mode].halo}`;

/** The error halo, for a focused control in an invalid state. */
export const errorHalo = (theme: DefaultTheme) => `0 0 0 4px ${chrome[theme.mode].dangerHalo}`;

export const fieldSurface = css<{ $invalid?: boolean | undefined }>`
  box-sizing: border-box;
  border-radius: 10px;
  border: 1px solid
    ${({ theme, $invalid }) => ($invalid ? theme.colors.error : 'var(--border-strong)')};
  background: ${({ theme }) => chrome[theme.mode].inputBg};
  color: ${({ theme }) => theme.colors.text};
  font-family: ${({ theme }) => theme.fonts.main};
  transition:
    border-color 160ms ${EASE},
    box-shadow 160ms ${EASE},
    background-color 160ms ${EASE};

  &:hover:not(:disabled):not(:focus):not(:focus-within) {
    border-color: ${({ theme, $invalid }) =>
      $invalid ? theme.colors.error : chrome[theme.mode].inputHoverBorder};
  }
`;

/** Focus treatment for a field: accent border plus the halo. */
export const fieldFocus = css<{ $invalid?: boolean | undefined }>`
  outline: none;
  border-color: ${({ theme, $invalid }) => ($invalid ? theme.colors.error : theme.colors.primary)};
  box-shadow: ${({ theme, $invalid }) => ($invalid ? errorHalo(theme) : focusHalo(theme))};
`;
