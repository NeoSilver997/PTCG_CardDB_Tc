'use client';

import React from 'react';
import { I18nProvider } from '../i18n/context';
import LanguageSelector from './LanguageSelector';

interface AppWrapperProps {
  children: React.ReactNode;
}

export default function AppWrapper({ children }: AppWrapperProps) {
  return (
    <I18nProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Language selector in top-right corner */}
        <div className="absolute top-4 right-4 z-50">
          <LanguageSelector />
        </div>
        {children}
      </div>
    </I18nProvider>
  );
}