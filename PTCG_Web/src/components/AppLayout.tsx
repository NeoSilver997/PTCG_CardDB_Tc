'use client';

import { I18nProvider } from '../i18n/context';
import LanguageSelector from '../components/LanguageSelector';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <I18nProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Language selector positioned at top-right */}
        <div className="fixed top-4 right-4 z-50">
          <LanguageSelector />
        </div>
        
        {/* Main content */}
        {children}
      </div>
    </I18nProvider>
  );
}