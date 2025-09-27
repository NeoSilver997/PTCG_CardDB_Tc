'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SupportedLanguage, TranslationStrings } from './index';
import { translations } from './translations';

interface I18nContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: TranslationStrings;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

interface I18nProviderProps {
  children: ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [language, setLanguageState] = useState<SupportedLanguage>('zh');

  useEffect(() => {
    // Load language preference from localStorage
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('ptcg-language') as SupportedLanguage;
      if (savedLanguage && translations[savedLanguage]) {
        setLanguageState(savedLanguage);
      } else {
        // Detect browser language
        const browserLang = navigator.language.toLowerCase();
        if (browserLang.startsWith('zh-tw') || browserLang.startsWith('zh-hk')) {
          setLanguageState('zh-tw');
        } else if (browserLang.startsWith('zh')) {
          setLanguageState('zh');
        } else {
          setLanguageState('en');
        }
      }
    }
  }, []);

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ptcg-language', lang);
    }
  };

  const t = translations[language];

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

// Utility function for components that need translation without hooks
export function getTranslation(lang: SupportedLanguage): TranslationStrings {
  return translations[lang];
}