// Example usage of the new i18n system in a main page component

'use client';

import { useState, useEffect } from 'react';
import { PTCGCard } from '../types/card';
import { useI18n } from '../i18n/context';
import SearchFilters from '../components/SearchFilters';
import CardGrid from '../components/CardGrid';
import CardDetailModal from '../components/CardDetailModal';
import DeckBuilder from '../components/DeckBuilder';
import LanguageSelector from '../components/LanguageSelector';

export default function MainPage() {
  const { t } = useI18n();
  const [cards, setCards] = useState<PTCGCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<PTCGCard | null>(null);
  const [showDeckBuilder, setShowDeckBuilder] = useState(false);

  // ... component logic ...

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with language selector */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">{t.deckBuilder}</h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowDeckBuilder(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {t.deckBuilder}
            </button>
            <LanguageSelector />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            {/* SearchFilters component will use i18n internally */}
            <SearchFilters
              filters={{
                ability: '',
                effectType: '',
                cardType: '',
                rarity: '',
                tier: '',
                attribute: '',
                regulation: '',
                expansion: '',
                weaknessType: '',
                resistanceType: '',
                noRetreat: false,
                noResistance: false,
                noWeakness: false,
                specialPokemonType: '',
                owned: 'all',
                priceRange: 'all'
              }} // your filters
              onFiltersChange={() => {}} // your handler
              abilities={[]} // your abilities
              effectTypes={[]} // your effect types
              cards={cards}
            />
          </div>
          <div className="lg:col-span-3">
            {/* CardGrid component will use i18n internally */}
            <CardGrid
              cards={cards}
              onCardClick={setSelectedCard}
            />
          </div>
        </div>
      </main>

      {/* Modals */}
      {selectedCard && (
        <CardDetailModal
          card={selectedCard}
          relatedCards={[]}
          onClose={() => setSelectedCard(null)}
          onCardClick={setSelectedCard}
          allCards={cards}
        />
      )}

      {showDeckBuilder && (
        <DeckBuilder
          initialCards={cards}
          onClose={() => setShowDeckBuilder(false)}
        />
      )}
    </div>
  );
}