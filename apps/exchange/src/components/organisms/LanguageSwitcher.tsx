/**
 * LanguageSwitcher Component
 * Dropdown component for switching between 17 supported languages
 */
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiChevronDown, FiGlobe } from 'react-icons/fi';
import styled from 'styled-components';
import { SUPPORTED_LANGUAGES } from '@/i18n';

/**
 * Container
 */
const LanguageSwitcherContainer = styled.div`
  position: relative;
  display: inline-block;
`;

/**
 * Selected language button
 */
const SelectedLanguage = styled.button<{ $isOpen: boolean }>`
  display: flex;
  align-items: center;
  gap: ${(p) => p.theme.spacing.sm};
  padding: ${(p) => p.theme.spacing.sm} ${(p) => p.theme.spacing.md};
  background: ${(p) => p.theme.colors.secondary};
  border: 1px solid ${(p) => (p.$isOpen ? p.theme.colors.primary : p.theme.colors.border)};
  border-radius: ${(p) => p.theme.radii.md};
  color: ${(p) => p.theme.colors.text};
  font-size: ${(p) => p.theme.fontSizes.sm};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: ${(p) => p.theme.colors.primary};
    background: ${(p) => p.theme.colors.secondary}dd;
  }

  &:focus {
    outline: none;
    border-color: ${(p) => p.theme.colors.primary};
    box-shadow: 0 0 0 3px ${(p) => p.theme.colors.primary}20;
  }

  svg:last-child {
    transform: ${(p) => (p.$isOpen ? 'rotate(180deg)' : 'rotate(0deg)')};
    transition: transform 0.2s;
  }
`;

/**
 * Globe icon
 */
const GlobeIcon = styled(FiGlobe as React.ComponentType<Record<string, unknown>>)`
  font-size: ${(p) => p.theme.fontSizes.md};
  color: ${(p) => p.theme.colors.primary};
`;

/**
 * Chevron icon
 */
const ChevronIcon = styled(FiChevronDown as React.ComponentType<Record<string, unknown>>)`
  font-size: ${(p) => p.theme.fontSizes.md};
  color: ${(p) => p.theme.colors.text};
  opacity: 0.6;
`;

/**
 * Language code text
 */
const LanguageCode = styled.span`
  font-weight: ${(p) => p.theme.fontWeights.medium};
  text-transform: uppercase;
`;

/**
 * Dropdown menu
 */
const DropdownMenu = styled.div<{ $isOpen: boolean }>`
  position: absolute;
  top: calc(100% + ${(p) => p.theme.spacing.xs});
  right: 0;
  min-width: 200px;
  max-height: 400px;
  overflow-y: auto;
  background: ${(p) => p.theme.colors.background};
  border: 1px solid ${(p) => p.theme.colors.border};
  border-radius: ${(p) => p.theme.radii.md};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  opacity: ${(p) => (p.$isOpen ? 1 : 0)};
  visibility: ${(p) => (p.$isOpen ? 'visible' : 'hidden')};
  transform: ${(p) => (p.$isOpen ? 'translateY(0)' : 'translateY(-10px)')};
  transition: all 0.2s;
  z-index: 1000;

  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: ${(p) => p.theme.colors.background};
  }

  &::-webkit-scrollbar-thumb {
    background: ${(p) => p.theme.colors.border};
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: ${(p) => p.theme.colors.primary};
  }
`;

/**
 * Language option
 */
const LanguageOption = styled.button<{ $isSelected: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: ${(p) => p.theme.spacing.sm} ${(p) => p.theme.spacing.md};
  background: ${(p) => (p.$isSelected ? `${p.theme.colors.primary}20` : 'transparent')};
  border: none;
  color: ${(p) => p.theme.colors.text};
  font-size: ${(p) => p.theme.fontSizes.sm};
  text-align: left;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: ${(p) =>
      p.$isSelected ? `${p.theme.colors.primary}30` : p.theme.colors.secondary};
  }

  &:focus {
    outline: none;
    background: ${(p) => p.theme.colors.secondary};
  }
`;

/**
 * Language name
 */
const LanguageName = styled.span`
  font-weight: ${(p) => p.theme.fontWeights.regular};
`;

/**
 * Language code badge
 */
const CodeBadge = styled.span<{ $isSelected: boolean }>`
  padding: 2px 6px;
  background: ${(p) => (p.$isSelected ? p.theme.colors.primary : p.theme.colors.secondary)};
  color: ${(p) => (p.$isSelected ? p.theme.colors.background : p.theme.colors.text)};
  border-radius: ${(p) => p.theme.radii.sm};
  font-size: ${(p) => p.theme.fontSizes.xs};
  font-weight: ${(p) => p.theme.fontWeights.semibold};
  text-transform: uppercase;
  opacity: ${(p) => (p.$isSelected ? 1 : 0.7)};
`;

/**
 * LanguageSwitcher Component
 */
export const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  /**
   * Close dropdown when clicking outside
   */
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  /**
   * Close dropdown on escape key
   */
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  /**
   * Change language
   */
  const changeLanguage = (langCode: string) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem('language', langCode);
    setIsOpen(false);
  };

  /**
   * Get current language display code
   */
  const currentLanguageCode = i18n.language.split('-')[0]; // Handle variants like 'en-US' → 'en'

  return (
    <LanguageSwitcherContainer ref={containerRef}>
      {/* Selected Language Button */}
      <SelectedLanguage $isOpen={isOpen} onClick={() => setIsOpen(!isOpen)}>
        <GlobeIcon />
        <LanguageCode>{currentLanguageCode}</LanguageCode>
        <ChevronIcon />
      </SelectedLanguage>

      {/* Dropdown Menu */}
      <DropdownMenu $isOpen={isOpen}>
        {SUPPORTED_LANGUAGES.map((lang) => {
          const isSelected = i18n.language === lang.code || i18n.language.startsWith(lang.code);

          return (
            <LanguageOption
              key={lang.code}
              $isSelected={isSelected}
              onClick={() => changeLanguage(lang.code)}
            >
              <LanguageName>{lang.name}</LanguageName>
              <CodeBadge $isSelected={isSelected}>{lang.code}</CodeBadge>
            </LanguageOption>
          );
        })}
      </DropdownMenu>
    </LanguageSwitcherContainer>
  );
};
