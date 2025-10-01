'use client';

import { Globe } from 'lucide-react';
import { useI18n } from '../i18n/context';
import { SupportedLanguage } from '../i18n';

const languageNames = {
  'en': 'English',
  'zh': '简体中文',
  'zh-tw': '繁體中文'
};

export default function LanguageSelector() {
  const { language, setLanguage } = useI18n();

  return (
    <div className="relative">
      <div className="flex items-center space-x-2">
        <Globe className="h-4 w-4 text-gray-600" />
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
          className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
        >
          {Object.entries(languageNames).map(([code, name]) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}