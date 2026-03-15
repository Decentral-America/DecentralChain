/**
 * Language Settings Component
 * Allows users to select from 17 supported languages
 * Persists language choice via i18next localStorage integration
 */
import type React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { Card } from '@/components/atoms/Card';
import { Select, type SelectOption } from '@/components/atoms/Select';
import { SUPPORTED_LANGUAGES } from '@/i18n';

/**
 * Styled Components
 */
const SettingsCard = styled(Card as React.ComponentType<Record<string, unknown>>)`
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

const FormSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`;

const FormRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const InfoBox = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.info || theme.colors.primary}10;
  border: 1px solid ${({ theme }) => theme.colors.info || theme.colors.primary}30;
  border-radius: ${({ theme }) => theme.radii.md};
  margin-top: ${({ theme }) => theme.spacing.lg};
`;

const InfoText = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.text};
  line-height: 1.6;

  strong {
    font-weight: 600;
  }
`;

const LanguagePreview = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text};

  strong {
    font-weight: 600;
    color: ${({ theme }) => theme.colors.primary};
  }
`;

/**
 * LanguageSettings Component
 * Displays language selection interface with all 17 supported languages
 *
 * @example
 * ```tsx
 * <LanguageSettings />
 * ```
 */
export const LanguageSettings: React.FC = () => {
  const { i18n } = useTranslation();

  // Convert SUPPORTED_LANGUAGES to SelectOption format
  const languageOptions: SelectOption[] = SUPPORTED_LANGUAGES.map((lang) => ({
    label: lang.name,
    value: lang.code,
  }));

  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = event.target.value;
    i18n.changeLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
  };

  // Get current language name
  const currentLanguage = SUPPORTED_LANGUAGES.find((lang) => lang.code === i18n.language);
  const currentLanguageName = currentLanguage?.name || 'English';

  return (
    <SettingsCard elevation="md">
      <SectionTitle>Language Preferences</SectionTitle>
      <SectionDescription>
        Select your preferred language for the application interface. All labels, buttons, and
        messages will be displayed in the selected language.
      </SectionDescription>

      <FormSection>
        <FormRow>
          <Select
            label="Interface Language"
            value={i18n.language}
            onChange={handleLanguageChange}
            options={languageOptions}
            selectSize="large"
            fullWidth
            helperText="Choose your preferred language from 17 available options"
          />
        </FormRow>

        <LanguagePreview>
          <strong>Current Language:</strong> {currentLanguageName} ({i18n.language})
        </LanguagePreview>

        <InfoBox>
          <InfoText>
            <strong>🌍 17 Languages Supported:</strong>
            <br />
            Deutsch, English, Español, Eesti, Français, हिन्दी, Bahasa Indonesia, Italiano, 日本語,
            한국어, Nederlands, Polski, Português (Brasil), Português (Portugal), Русский, Türkçe,
            简体中文
          </InfoText>
        </InfoBox>

        <InfoBox>
          <InfoText>
            <strong>💡 Tip:</strong> Your language preference is saved automatically and will be
            remembered on your next visit. Some translations may be in progress and display in
            English until completed.
          </InfoText>
        </InfoBox>
      </FormSection>
    </SettingsCard>
  );
};
