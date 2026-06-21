import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from 'next-themes';

type Props = ThemeProviderProps & { children?: React.ReactNode };

export function ThemeProvider({ children, ...props }: Props): React.ReactElement {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
