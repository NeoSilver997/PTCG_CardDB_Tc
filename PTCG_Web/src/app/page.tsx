'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Zap, Shield, Sword, Gamepad2 } from 'lucide-react';
import { PTCGCard, SearchFilters, AbilityOption, EffectTypeOption } from '../types/card';
import CardGrid from '../components/CardGrid';
import SearchFiltersComponent from '../components/SearchFilters';
import CardDetailModal from '../components/CardDetailModal';

export default function Home() {
  const [cards, setCards] = useState<PTCGCard[]>([]);
  const [filteredCards, setFilteredCards] = useState<PTCGCard[]>([]);
  const [filters, setFilters] = useState<SearchFilters>({
    ability: '',
    effectType: '',
    cardType: '',
    rarity: '',
    tier: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCard, setSelectedCard] = useState<PTCGCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [abilities, setAbilities] = useState<AbilityOption[]>([]);
  const [effectTypes, setEffectTypes] = useState<EffectTypeOption[]>([]);

  useEffect(() => {
    loadCardData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [cards, filters, searchTerm]);

  const loadCardData = async () => {
    try {
      const response = await fetch('/api/cards');
      const data = await response.json();
      setCards(data);
      extractFilterOptions(data);
    } catch (error) {
      console.error('Failed to load card data:', error);
    } finally {
      setLoading(false);
    }
  };

  const extractFilterOptions = (cardData: PTCGCard[]) => {
    // Extract unique abilities
    const abilityMap = new Map<string, number>();
    const effectTypeMap = new Map<string, number>();

    cardData.forEach(card => {
      // Process abilities
      if (card.AbilityStats && card.AbilityStats !== '無') {
        const cardAbilities = card.AbilityStats.split(',').map(a => a.trim());
        cardAbilities.forEach(ability => {
          abilityMap.set(ability, (abilityMap.get(ability) || 0) + 1);
        });
      }

      // Process effect types
      if (card.PrimaryEffectType) {
        const effects = card.PrimaryEffectType.split(',').map(e => e.trim());
        effects.forEach(effect => {
          effectTypeMap.set(effect, (effectTypeMap.get(effect) || 0) + 1);
        });
      }

      if (card.SpecialEffectType && card.SpecialEffectType !== '無') {
        const effects = card.SpecialEffectType.split(',').map(e => e.trim());
        effects.forEach(effect => {
          effectTypeMap.set(effect, (effectTypeMap.get(effect) || 0) + 1);
        });
      }
    });

    setAbilities(
      Array.from(abilityMap.entries())
        .map(([value, count]) => ({ value, label: value, count }))
        .sort((a, b) => b.count - a.count)
    );

    setEffectTypes(
      Array.from(effectTypeMap.entries())
        .map(([value, count]) => ({ value, label: value, count }))
        .sort((a, b) => b.count - a.count)
    );
  };

  const applyFilters = () => {
    let filtered = cards;

    // Apply search term
    if (searchTerm) {
      filtered = filtered.filter(card =>
        card.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.Skill1Effect.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.Skill2Effect.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.AbilityEffect.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply ability filter
    if (filters.ability) {
      filtered = filtered.filter(card =>
        card.AbilityStats && card.AbilityStats.includes(filters.ability)
      );
    }

    // Apply effect type filter
    if (filters.effectType) {
      filtered = filtered.filter(card =>
        (card.PrimaryEffectType && card.PrimaryEffectType.includes(filters.effectType)) ||
        (card.SpecialEffectType && card.SpecialEffectType.includes(filters.effectType))
      );
    }

    // Apply card type filter
    if (filters.cardType) {
      filtered = filtered.filter(card => card.CardType === filters.cardType);
    }

    // Apply rarity filter
    if (filters.rarity) {
      filtered = filtered.filter(card => card.Rarity === filters.rarity);
    }

    // Apply tier filter
    if (filters.tier) {
      filtered = filtered.filter(card => card.Tier === filters.tier);
    }

    setFilteredCards(filtered);
  };

  const handleCardClick = (card: PTCGCard) => {
    setSelectedCard(card);
  };

  const getRelatedCards = (card: PTCGCard): PTCGCard[] => {
    if (!card) return [];

    return cards
      .filter(c => c.CardID !== card.CardID)
      .filter(c => {
        // Same ability
        if (card.AbilityStats && c.AbilityStats) {
          const cardAbilities = card.AbilityStats.split(',').map(a => a.trim());
          const otherAbilities = c.AbilityStats.split(',').map(a => a.trim());
          if (cardAbilities.some(a => otherAbilities.includes(a))) return true;
        }

        // Same effect type
        if (card.PrimaryEffectType && c.PrimaryEffectType) {
          const cardEffects = card.PrimaryEffectType.split(',').map(e => e.trim());
          const otherEffects = c.PrimaryEffectType.split(',').map(e => e.trim());
          if (cardEffects.some(e => otherEffects.includes(e))) return true;
        }

        // Same type
        if (card.Type === c.Type) return true;

        return false;
      })
      .slice(0, 6);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading PTCG cards...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Gamepad2 className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">PTCG Card Search</h1>
            </div>
            <div className="text-sm text-gray-500">
              {filteredCards.length} cards found
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search cards by name, ability, or effect..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <div className="w-80 flex-shrink-0">
            <SearchFiltersComponent
              filters={filters}
              onFiltersChange={setFilters}
              abilities={abilities}
              effectTypes={effectTypes}
              cards={cards}
            />
          </div>

          {/* Card Grid */}
          <div className="flex-1">
            <CardGrid
              cards={filteredCards}
              onCardClick={handleCardClick}
            />
          </div>
        </div>
      </div>

      {/* Card Detail Modal */}
      {selectedCard && (
        <CardDetailModal
          card={selectedCard}
          relatedCards={getRelatedCards(selectedCard)}
          onClose={() => setSelectedCard(null)}
          onCardClick={handleCardClick}
        />
      )}
    </div>
  );
}