'use client';

import { I18nProvider } from '../i18n/context';
import { InventoryProvider } from '../contexts/InventoryContext';

interface ClientProviderProps {
  children: React.ReactNode;
}

export default function ClientProvider({ children }: ClientProviderProps) {
  return (
    <I18nProvider>
      <InventoryProvider>
        {children}
      </InventoryProvider>
    </I18nProvider>
  );
}