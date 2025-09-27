# PTCG Web Application - Multi-language Integration Guide

## Overview
The PTCG Web application now supports three languages:
- English (en)
- Simplified Chinese (zh) - 简体中文
- Traditional Chinese (zh-tw) - 繁體中文

## Quick Integration

### 1. Wrap your main app with AppLayout
```tsx
import AppLayout from '../components/AppLayout';

function App() {
  return (
    <AppLayout>
      <YourMainContent />
    </AppLayout>
  );
}
```

### 2. Use translations in your components
```tsx
import { useI18n } from '../i18n/context';

function YourComponent() {
  const { t } = useI18n(); // Get translation function

  return (
    <div>
      <h1>{t.cardSearch}</h1>
      <button>{t.search}</button>
    </div>
  );
}
```

## Updated Components

### ✅ Fully Updated Components
- **SearchFilters** - All filter labels, placeholders, and buttons translated
- **CardGrid** - "No cards found" messages and loading states
- **DeckBuilder** - Headers, buttons, form labels, and alert messages
- **LanguageSelector** - Language switching dropdown with native language names
- **AppLayout** - Main layout wrapper with I18nProvider

### 🔄 Partially Updated Components  
- **CardDetailModal** - useI18n hook added, needs string replacements

### ❌ Components to Update
- **DeckManager** - Needs full i18n integration
- **DeckViewer** - Needs full i18n integration  
- **CardItem** - Needs card-related term translations

## Available Translation Keys

### Navigation & Search
- `cardSearch`, `search`, `clearFilters`, `results`
- `searchPlaceholder`, `noCardsFound`

### Card Information
- `cardName`, `ability`, `effect`, `cardType`, `rarity`, `tier`, `attribute`
- `relatedCards`, `viewDetails`, `closeDetails`

### Deck Management
- `deckBuilder`, `deckName`, `addCard`, `removeCard`
- `saveDeck`, `loadDeck`, `clearDeck`, `exportDeck`
- `enterDeckName`, `saveSuccess`, `saveFail`, `saveError`

### Filters
- `ability`, `effectType`, `cardType`, `rarity`, `tier`, `attribute`
- `allAbilities`, `allEffects`, `allTypes`, `allRarities`, `allTiers`, `allAttributes`

## Language Detection
The system automatically detects the user's browser language and defaults to:
- `zh-tw` for Traditional Chinese users
- `zh` for Simplified Chinese users  
- `en` for all other users

Language preference is saved to localStorage and persists across sessions.

## Adding New Translation Keys

1. Add the key to `TranslationStrings` interface in `src/i18n/index.ts`
2. Add translations for all three languages in `src/i18n/translations.ts`
3. Use the new key with `t.newKey` in your components

## Example Usage in Next.js Page

```tsx
// pages/index.tsx or app/page.tsx
import AppLayout from '../components/AppLayout';
import { useI18n } from '../i18n/context';

export default function HomePage() {
  return (
    <AppLayout>
      <MainContent />
    </AppLayout>
  );
}

function MainContent() {
  const { t } = useI18n();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{t.cardSearch}</h1>
      {/* Your existing components */}
    </div>
  );
}
```

## Testing Different Languages

The language selector appears in the top-right corner. Click to switch between:
- English
- 简体中文 (Simplified Chinese)
- 繁體中文 (Traditional Chinese)

## Implementation Status

✅ **Complete Infrastructure**: Translation system, context provider, language selector
✅ **Core Components**: Search, filters, card grid, deck builder mostly complete
🔄 **Integration Pending**: Main app integration, remaining component updates

## Next Steps

1. Integrate `AppLayout` in your main application entry point
2. Complete remaining component updates (CardDetailModal, DeckManager, DeckViewer)
3. Test language switching functionality
4. Add any missing translation keys as needed