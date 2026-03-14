/**
 * Theme Settings Component
 * Allows users to toggle between light and dark themes
 * Persists theme choice to localStorage
 */
import React from 'react';
import styled from 'styled-components';
import { useTheme } from '@/contexts/ThemeContext';
import { Card } from '@/components/atoms/Card';

/**
 * Styled Components
 */
const SettingsCard = styled(Card)`
  padding: ${({ theme }) => theme.spacing.xl};
`;

const SectionTitle = styled.h2`
  margin: 0 0 ${({ theme }) => theme.spacing.md};
  font-size: 20px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
`;

const SectionDescription = styled.p`
  margin: 0 0 ${({ theme }) => theme.spacing.lg};
  font-size: 14px;
  color: ${({ theme }) => theme.colors.disabled};
  line-height: 1.6;
`;

const ThemeOptions = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
`;

const ThemeOption = styled.button<{ isActive: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.lg};
  background: ${({ theme, isActive }) =>
    isActive ? `${theme.colors.primary}10` : theme.colors.background};
  border: 2px solid
    ${({ theme, isActive }) => (isActive ? theme.colors.primary : theme.colors.border)};
  border-radius: ${({ theme }) => theme.radii.lg};
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.md};
  }

  &:active {
    transform: translateY(0);
  }
`;

const ActiveBadge = styled.div`
  position: absolute;
  top: ${({ theme }) => theme.spacing.sm};
  right: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-radius: ${({ theme }) => theme.radii.full};
`;

const ThemeIcon = styled.div<{ isDark?: boolean }>`
  width: 64px;
  height: 64px;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ isDark }) => (isDark ? '#1a1a1a' : '#ffffff')};
  border: 2px solid ${({ isDark }) => (isDark ? '#2d2d2d' : '#e0e0e0')};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
`;

const ThemeName = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const ThemeDescription = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.disabled};
  text-align: center;
  line-height: 1.5;
`;

const InfoBox = styled.div`
  margin-top: ${({ theme }) => theme.spacing.xl};
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.info || theme.colors.primary}10;
  border: 1px solid ${({ theme }) => theme.colors.info || theme.colors.primary}30;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 13px;
  color: ${({ theme }) => theme.colors.text};
  line-height: 1.6;

  strong {
    font-weight: 600;
  }
`;

/**
 * Theme options configuration
 */
const themeOptions = [
  {
    value: 'light' as const,
    name: 'Light Theme',
    description: 'Bright and clean interface ideal for daytime use',
    icon: '☀️',
  },
  {
    value: 'dark' as const,
    name: 'Dark Theme',
    description: 'Reduced eye strain and better battery life',
    icon: '🌙',
  },
];

/**
 * ThemeSettings Component
 * Displays theme selection interface with light/dark options
 *
 * @example
 * ```tsx
 * <ThemeSettings />
 * ```
 */
export const ThemeSettings: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
  };

  return (
    <SettingsCard elevation="md">
      <SectionTitle>Theme Preferences</SectionTitle>
      <SectionDescription>
        Choose your preferred color scheme. Your selection will be saved automatically and applied
        across all pages.
      </SectionDescription>

      <ThemeOptions>
        {themeOptions.map((option) => (
          <ThemeOption
            key={option.value}
            isActive={theme === option.value}
            onClick={() => handleThemeChange(option.value)}
            type="button"
          >
            {theme === option.value && <ActiveBadge>Active</ActiveBadge>}

            <ThemeIcon isDark={option.value === 'dark'}>{option.icon}</ThemeIcon>

            <ThemeName>{option.name}</ThemeName>
            <ThemeDescription>{option.description}</ThemeDescription>
          </ThemeOption>
        ))}
      </ThemeOptions>

      <InfoBox>
        <strong>💡 Tip:</strong> Your theme preference is saved locally and will persist across
        browser sessions. The theme affects the entire application interface, including navigation,
        forms, and data displays.
      </InfoBox>
    </SettingsCard>
  );
};
