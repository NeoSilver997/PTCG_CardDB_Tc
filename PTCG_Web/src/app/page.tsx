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
    tier: '',
    attribute: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCard, setSelectedCard] = useState<PTCGCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [abilities, setAbilities] = useState<AbilityOption[]>([]);
  const [effectTypes, setEffectTypes] = useState<EffectTypeOption[]>([]);

  const isEnergyCard = (card: PTCGCard) => {
    return card.CardType.includes('能量') || card.CardType.toLowerCase().includes('energy');
  };

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

    // Apply search term (exclude energy cards from search)
    if (searchTerm) {
      filtered = filtered.filter(card =>
        !isEnergyCard(card) && (
          card.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          card.Skill1Effect.toLowerCase().includes(searchTerm.toLowerCase()) ||
          card.Skill2Effect.toLowerCase().includes(searchTerm.toLowerCase()) ||
          card.AbilityEffect.toLowerCase().includes(searchTerm.toLowerCase())
        )
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
        !isEnergyCard(card) && (
          (card.PrimaryEffectType && card.PrimaryEffectType.includes(filters.effectType)) ||
          (card.SpecialEffectType && card.SpecialEffectType.includes(filters.effectType))
        )
      );
    }

    // Apply card type filter
    if (filters.cardType) {
      filtered = filtered.filter(card => card.CardType === filters.cardType);
    }

    // Apply rarity filter
    if (filters.rarity) {
      filtered = filtered.filter(card =>
        !isEnergyCard(card) && card.Rarity === filters.rarity
      );
    }

    // Apply tier filter
    if (filters.tier) {
      filtered = filtered.filter(card =>
        !isEnergyCard(card) && card.Tier === filters.tier
      );
    }

    // Apply attribute filter
    if (filters.attribute) {
      filtered = filtered.filter(card =>
        !isEnergyCard(card) && card.Type === filters.attribute
      );
    }

    // Always exclude energy cards from final results
    filtered = filtered.filter(card => !isEnergyCard(card));

    setFilteredCards(filtered);
  };

  const handleCardClick = (card: PTCGCard) => {
    setSelectedCard(card);
  };

  const getRelatedCards = (card: PTCGCard): PTCGCard[] => {
    if (!card) return [];

    const relatedCards: PTCGCard[] = [];
    const usedCardIds = new Set([card.CardID]);

    // Helper function to add cards without duplicates
    const addCards = (cardsToAdd: PTCGCard[]) => {
      for (const c of cardsToAdd) {
        if (!usedCardIds.has(c.CardID) && !c.CardType.includes('能量')) {
          relatedCards.push(c);
          usedCardIds.add(c.CardID);
          if (relatedCards.length >= 6) break;
        }
      }
    };

    // 1. Same type (highest priority)
    if (card.Type) {
      const sameTypeCards = cards.filter(c =>
        c.CardID !== card.CardID &&
        c.Type === card.Type &&
        !c.CardType.includes('能量')
      );
      addCards(sameTypeCards);
    }

    if (relatedCards.length >= 6) return relatedCards;

    // 2. Same evolution family (same base name)
    const baseName = card.Name.replace(/V|VMAX|VSTAR|GX|EX|♂|♀|\s+|\d+$/g, '').trim();
    if (baseName) {
      const familyCards = cards.filter(c =>
        c.CardID !== card.CardID &&
        !usedCardIds.has(c.CardID) &&
        !c.CardType.includes('能量') &&
        c.Name.replace(/V|VMAX|VSTAR|GX|EX|♂|♀|\s+|\d+$/g, '').trim() === baseName
      );
      addCards(familyCards);
    }

    if (relatedCards.length >= 6) return relatedCards;

    // 2.5. Complementary Pokemon pairs (like Lunatone/Solrock, Latios/Latias, etc.)
    const complementaryPairs: { [key: string]: string[] } = {
      '月石': ['太陽岩'],
      '太陽岩': ['月石'],
      '拉帝亞斯': ['拉帝歐斯'],
      '拉帝歐斯': ['拉帝亞斯'],
      '利歐路': ['路卡利歐'],
      '瑪納霏': ['瑪納菲'],
      // Add more complementary pairs as needed
    };

    if (complementaryPairs[card.Name]) {
      const pairCards = cards.filter(c =>
        c.CardID !== card.CardID &&
        !usedCardIds.has(c.CardID) &&
        !c.CardType.includes('能量') &&
        complementaryPairs[card.Name].includes(c.Name)
      );
      addCards(pairCards);
    }

    if (relatedCards.length >= 6) return relatedCards;

    // 2.75. Same ability themes (more flexible ability matching)
    if (card.AbilityStats) {
      const cardAbilityThemes = card.AbilityStats.split(',').map(a => a.trim().toLowerCase());
      const abilityThemeCards = cards.filter(c => {
        if (c.CardID === card.CardID || usedCardIds.has(c.CardID) || c.CardType.includes('能量') || !c.AbilityStats) {
          return false;
        }

        const otherAbilityThemes = c.AbilityStats.split(',').map(a => a.trim().toLowerCase());

        // Check for partial matches in ability themes
        return cardAbilityThemes.some(cardTheme =>
          otherAbilityThemes.some(otherTheme =>
            cardTheme.includes(otherTheme) || otherTheme.includes(cardTheme) ||
            // Check for similar ability categories
            (cardTheme.includes('傷害') && otherTheme.includes('傷害')) ||
            (cardTheme.includes('防禦') && otherTheme.includes('防禦')) ||
            (cardTheme.includes('狀態') && otherTheme.includes('狀態')) ||
            (cardTheme.includes('回復') && otherTheme.includes('回復'))
          )
        );
      });
      addCards(abilityThemeCards);
    }

    if (relatedCards.length >= 6) return relatedCards;

    // 3.5. Cards with special effect keywords (like 「XXX」 patterns)
    const specialEffectKeywords = [
      '「', '」', // Japanese quote marks
      '不能', '可以', '必須', // Modal verbs
      '每次', '每回', // Frequency words
      '對手', '我方', // Player references
      '場上', '牌庫', '棄牌區', // Location references
      '選擇', '查看', '抽', // Action words
      '回復', '治療', // Healing terms
      '交換', '進化', // Evolution terms
      '阻擋', '防禦', // Defense terms
    ];

    const cardEffectText = [
      card.Skill1Effect,
      card.Skill2Effect,
      card.AbilityEffect
    ].filter(effect => effect).join(' ');

    // Find special keywords in the current card's effects
    const matchingKeywords = specialEffectKeywords.filter(keyword =>
      cardEffectText.includes(keyword)
    );

    if (matchingKeywords.length > 0) {
      const specialEffectCards = cards.filter(c => {
        if (c.CardID === card.CardID || usedCardIds.has(c.CardID) || c.CardType.includes('能量')) {
          return false;
        }

        const otherEffectText = [
          c.Skill1Effect,
          c.Skill2Effect,
          c.AbilityEffect
        ].filter(effect => effect).join(' ');

        // Check if other card has any of the same special keywords
        return matchingKeywords.some(keyword =>
          otherEffectText.includes(keyword)
        );
      });
      addCards(specialEffectCards);
    }

    if (relatedCards.length >= 6) return relatedCards;

    // 4. Same skill names
    const skillNames = [
      card.Skill1Name,
      card.Skill2Name
    ].filter(name => name && name.trim() !== '');

    if (skillNames.length > 0) {
      const sameSkillCards = cards.filter(c =>
        c.CardID !== card.CardID &&
        !usedCardIds.has(c.CardID) &&
        !c.CardType.includes('能量') &&
        (skillNames.includes(c.Skill1Name) || skillNames.includes(c.Skill2Name))
      );
      addCards(sameSkillCards);
    }

    if (relatedCards.length >= 6) return relatedCards;

    // 4. Effects containing keywords from original card
    const effectKeywords = [
      ...(card.Skill1Effect ? card.Skill1Effect.split(/\s+/) : []),
      ...(card.Skill2Effect ? card.Skill2Effect.split(/\s+/) : []),
      ...(card.AbilityEffect ? card.AbilityEffect.split(/\s+/) : [])
    ].filter(word => word.length > 2); // Only meaningful keywords

    if (effectKeywords.length > 0) {
      const effectCards = cards.filter(c => {
        if (c.CardID === card.CardID || usedCardIds.has(c.CardID) || c.CardType.includes('能量')) {
          return false;
        }

        const cardEffects = [
          c.Skill1Effect,
          c.Skill2Effect,
          c.AbilityEffect
        ].filter(effect => effect).join(' ');

        return effectKeywords.some(keyword =>
          cardEffects.includes(keyword)
        );
      });
      addCards(effectCards);
    }

    if (relatedCards.length >= 6) return relatedCards;

    // 5. Fallback: same ability or effect type (original logic)
    const fallbackCards = cards.filter(c => {
      if (c.CardID === card.CardID || usedCardIds.has(c.CardID) || c.CardType.includes('能量')) {
        return false;
      }

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

      return false;
    });

    addCards(fallbackCards);

    return relatedCards;
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