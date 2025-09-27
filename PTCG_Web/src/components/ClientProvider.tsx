'use client';

import { I18nProvider } from '../i18n/context';

interface ClientProviderProps {
  children: React.ReactNode;
}

export default function ClientProvider({ children }: ClientProviderProps) {
  return (
    <I18nProvider>
      {children}
    </I18nProvider>
  );
}