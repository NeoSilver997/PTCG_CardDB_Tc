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
    attribute: '',
    regulation: '',
    expansion: '',
    weaknessType: '',
    resistanceType: '',
    noRetreat: false,
    noResistance: false,
    noWeakness: false,
    specialPokemonType: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCard, setSelectedCard] = useState<PTCGCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [abilities, setAbilities] = useState<AbilityOption[]>([]);
  const [effectTypes, setEffectTypes] = useState<EffectTypeOption[]>([]);
  const [notification, setNotification] = useState<string | null>(null);

  const isPokemonCard = (card: PTCGCard) => {
    return card.CardType.includes('寶可夢') || card.CardType.toLowerCase().includes('pokemon');
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
      
      // Sort cards by CardID numerically in descending order to find the latest card
      const sortedData = data.sort((a: PTCGCard, b: PTCGCard) => {
        const aId = parseInt(String(a.CardID).replace(/\D/g, '')) || 0;
        const bId = parseInt(String(b.CardID).replace(/\D/g, '')) || 0;
        return bId - aId; // Descending order
      });
      
      setCards(sortedData);
      extractFilterOptions(sortedData);
      
      // Find the latest card (first in sorted array) and set up initial filter
      if (sortedData.length > 0) {
        const latestCard = sortedData[0];
        // Set initial search term to the latest card's CardID to show only that card
        //setSearchTerm(latestCard.CardID);
      }
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
        (
          card.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          String(card.CardID).toLowerCase().includes(searchTerm.toLowerCase()) ||
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
        (
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
        card.Rarity === filters.rarity
      );
    }

    // Apply tier filter
    if (filters.tier) {
      filtered = filtered.filter(card =>
         card.Tier === filters.tier
      );
    }

    // Apply attribute filter
    if (filters.attribute) {
      filtered = filtered.filter(card =>
         card.Type === filters.attribute
      );
    }

    // Apply weakness type filter
    if (filters.weaknessType) {
      filtered = filtered.filter(card =>
         card.WeaknessType === filters.weaknessType
      );
    }

    // Apply resistance type filter
    if (filters.resistanceType) {
      filtered = filtered.filter(card =>
         card.ResistanceType === filters.resistanceType
      );
    }

    // Apply regulation filter
    if (filters.regulation) {
      filtered = filtered.filter(card =>
         card.RegulationMark === filters.regulation
      );
    }

    // Apply expansion filter
    if (filters.expansion) {
      filtered = filtered.filter(card =>
         (card.ExpansionCode === filters.expansion || card.ExpansionName === filters.expansion)
      );
    }

    // Apply no retreat filter (only for Pokemon cards)
    if (filters.noRetreat) {
      filtered = filtered.filter(card =>
        isPokemonCard(card) && (!card.RetreatCost || card.RetreatCost.trim() === '' || card.RetreatCost === '0')
      );
    }

    // Apply no resistance filter (only for Pokemon cards)
    if (filters.noResistance) {
      filtered = filtered.filter(card =>
        isPokemonCard(card) && (!card.ResistanceType || card.ResistanceType.trim() === '')
      );
    }

    // Apply no weakness filter (only for Pokemon cards)
    if (filters.noWeakness) {
      filtered = filtered.filter(card =>
        isPokemonCard(card) && (!card.WeaknessType || card.WeaknessType.trim() === '')
      );
    }

    // Apply special Pokemon type filter when any special filter is active
    if (filters.specialPokemonType && (filters.noRetreat || filters.noResistance || filters.noWeakness)) {
      filtered = filtered.filter(card =>
        isPokemonCard(card) && card.Type === filters.specialPokemonType
      );
    }

    setFilteredCards(filtered);
  };

  const handleCardClick = (card: PTCGCard) => {
    setSelectedCard(card);
  };

  // Helper function to check if a card is basic energy
  const isBasicEnergy = (card: PTCGCard): boolean => {
    // Basic energy cards have specific names and are energy type
    const basicEnergyNames = [
      '草能量', '炎能量', '水能量', '雷能量', '超能量', '鬥能量', '惡能量', '鋼能量', '妖精能量',
      'Grass Energy', 'Fire Energy', 'Water Energy', 'Lightning Energy', 'Psychic Energy', 
      'Fighting Energy', 'Darkness Energy', 'Metal Energy', 'Fairy Energy'
    ];
    
    return card.CardType.includes('能量') && 
           (basicEnergyNames.includes(card.Name) || card.Name.includes('基本') || card.Name.includes('Basic'));
  };

  // Get maximum allowed quantity for a card
  const getMaxQuantity = (card: PTCGCard): number => {
    return isBasicEnergy(card) ? 99 : 4; // Unlimited basic energy, 4 for others
  };

  const handleAddToDeck = async (card: PTCGCard, quantity: number = 1) => {
    // Get existing decks from server or localStorage
    let existingDecks = [];
    try {
      const response = await fetch('/api/decks');
      if (response.ok) {
        existingDecks = await response.json();
      } else {
        throw new Error('Server unavailable');
      }
    } catch (error) {
      // Fallback to localStorage
      existingDecks = JSON.parse(localStorage.getItem('ptcg_decks') || '[]');
    }
    
    // Get the current/latest deck or create a new one
    let currentDeck = existingDecks.find((deck: any) => deck.id === 'quick-add') || {
      id: 'quick-add',
      name: 'Quick Add Deck',
      format: 'Standard',
      description: 'Cards quickly added from card browser',
      cards: [],
      totalCards: 0,
      pokemonCount: 0,
      trainerCount: 0,
      energyCount: 0,
      isValid: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Check if card already exists in deck
    const existingCardIndex = currentDeck.cards.findIndex((c: any) => c.CardID === card.CardID);
    const maxQuantity = getMaxQuantity(card);
    
    if (existingCardIndex >= 0) {
      // Update quantity (respecting card-specific limits)
      const newQuantity = Math.min(currentDeck.cards[existingCardIndex].quantity + quantity, maxQuantity);
      currentDeck.cards[existingCardIndex].quantity = newQuantity;
    } else {
      // Add new card to deck
      const deckCard = { ...card, quantity: Math.min(quantity, maxQuantity) };
      currentDeck.cards.push(deckCard);
    }

    // Recalculate deck stats
    currentDeck.totalCards = currentDeck.cards.reduce((sum: number, c: any) => sum + c.quantity, 0);
    currentDeck.pokemonCount = currentDeck.cards
      .filter((c: any) => c.CardType.includes('寶可夢') || c.CardType.toLowerCase().includes('pokemon'))
      .reduce((sum: number, c: any) => sum + c.quantity, 0);
    currentDeck.trainerCount = currentDeck.cards
      .filter((c: any) => c.CardType.includes('物品') || c.CardType.includes('支援') || c.CardType.includes('場地'))
      .reduce((sum: number, c: any) => sum + c.quantity, 0);
    currentDeck.energyCount = currentDeck.cards
      .filter((c: any) => c.CardType.includes('能量'))
      .reduce((sum: number, c: any) => sum + c.quantity, 0);
    
    // Basic validation
    currentDeck.isValid = currentDeck.totalCards === 60;
    currentDeck.updatedAt = new Date();

    try {
      // Save to server
      const response = await fetch('/api/decks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentDeck),
      });

      if (!response.ok) {
        throw new Error('Server save failed');
      }
    } catch (error) {
      console.error('Error saving to server:', error);
      // Fallback to localStorage
      const localDecks = JSON.parse(localStorage.getItem('ptcg_decks') || '[]');
      const deckIndex = localDecks.findIndex((deck: any) => deck.id === 'quick-add');
      if (deckIndex >= 0) {
        localDecks[deckIndex] = currentDeck;
      } else {
        localDecks.push(currentDeck);
      }
      localStorage.setItem('ptcg_decks', JSON.stringify(localDecks));
    }

    // Show notification
    setNotification(`Added ${quantity}x ${card.Name} to Quick Add Deck (${currentDeck.totalCards}/60 cards)`);
    setTimeout(() => setNotification(null), 3000);
  };

  const getRelatedCards = (card: PTCGCard): PTCGCard[] => {
    if (!card) return [];

    const relatedCards: PTCGCard[] = [];
    const usedCardIds = new Set([card.CardID]);

    // Helper function to add cards without duplicates
    const addCards = (cardsToAdd: PTCGCard[]) => {
      for (const c of cardsToAdd) {
        if (!usedCardIds.has(c.CardID)) {
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
        c.Type === card.Type 
      );
      addCards(sameTypeCards);
    }

    if (relatedCards.length >= 6) return relatedCards;

    // 2. Same evolution family (same base name)
    const baseName = card.Name.replace(/V|VMAX|VSTAR|GX|EX|♂|♀|\s+|\d+$/g, '').trim();
    if (baseName) {
      const familyCards = cards.filter(c =>
        c.CardID !== card.CardID &&
        !usedCardIds.has(c.CardID)  &&
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
        complementaryPairs[card.Name].includes(c.Name)
      );
      addCards(pairCards);
    }

    if (relatedCards.length >= 6) return relatedCards;

    // 2.6. Same evolution stage (Basic, Stage 1, Stage 2, etc.)
    if (card.Evolution) {
      const evolutionCards = cards.filter(c =>
        c.CardID !== card.CardID &&
        !usedCardIds.has(c.CardID) &&
        c.Evolution === card.Evolution
      );
      addCards(evolutionCards);
    }

    if (relatedCards.length >= 6) return relatedCards;

    // 2.7. Evolution chain progression (Basic -> Stage 1, Stage 1 -> Stage 2, etc.)
    if (card.Evolution && card.Name) {
      const baseName = card.Name.replace(/EX|♂|♀|\s+|\d+$/g, '').trim();
      let evolutionChainCards: PTCGCard[] = [];

      if (card.Evolution === 'Basic') {
        // For Basic cards, find their Stage 1 evolutions
        evolutionChainCards = cards.filter(c =>
          c.CardID !== card.CardID &&
          !usedCardIds.has(c.CardID) &&
          c.Evolution === 'Stage 1' &&
          c.Name.replace(/|EX|♂|♀|\s+|\d+$/g, '').trim() === baseName
        );
      } else if (card.Evolution === 'Stage 1') {
        // For Stage 1 cards, find their Basic forms and Stage 2 evolutions
        const basicCards = cards.filter(c =>
          c.CardID !== card.CardID &&
          !usedCardIds.has(c.CardID) &&
          c.Evolution === 'Basic' &&
          c.Name.replace(/EX|♂|♀|\s+|\d+$/g, '').trim() === baseName
        );
        const stage2Cards = cards.filter(c =>
          c.CardID !== card.CardID &&
          !usedCardIds.has(c.CardID) &&
          c.Evolution === 'Stage 2' &&
          c.Name.replace(/EX|♂|♀|\s+|\d+$/g, '').trim() === baseName
        );
        evolutionChainCards = [...basicCards, ...stage2Cards];
      } else if (card.Evolution === 'Stage 2') {
        // For Stage 2 cards, find their Stage 1 forms
        evolutionChainCards = cards.filter(c =>
          c.CardID !== card.CardID &&
          !usedCardIds.has(c.CardID) &&
          c.Evolution === 'Stage 1' &&
          c.Name.replace(/EX|♂|♀|\s+|\d+$/g, '').trim() === baseName
        );
      }

      addCards(evolutionChainCards);
    }

    if (relatedCards.length >= 6) return relatedCards;

    // 2.75. Same ability themes (more flexible ability matching)
    if (card.AbilityStats) {
      const cardAbilityThemes = card.AbilityStats.split(',').map(a => a.trim().toLowerCase());
      const abilityThemeCards = cards.filter(c => {
        if (c.CardID === card.CardID || usedCardIds.has(c.CardID)  || !c.AbilityStats) {
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
        if (c.CardID === card.CardID || usedCardIds.has(c.CardID) ) {
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
        if (c.CardID === card.CardID || usedCardIds.has(c.CardID) ) {
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
      if (c.CardID === card.CardID || usedCardIds.has(c.CardID) ) {
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
        <div className="max-w-8xl mx-auto px-6 sm:px-8 lg:px-12 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Gamepad2 className="h-10 w-10 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">PTCG Card Search</h1>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="/deck-builder"
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Sword className="h-5 w-5" />
                <span>Deck Builder</span>
              </a>
              <div className="text-base text-gray-500">
                {filteredCards.length} cards found
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-8xl mx-auto px-6 sm:px-8 lg:px-12 py-12">
        {/* Search Bar */}
        <div className="mb-12">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-6 w-6" />
            <input
              type="text"
              placeholder="Search cards by name, ability, or effect..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-4 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            />
          </div>
        </div>

        <div className="flex gap-12">
          {/* Filters Sidebar */}
          <div className="w-96 flex-shrink-0">
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
          allCards={cards}
          onAddToDeck={handleAddToDeck}
        />
      )}

      {/* Notification */}
      {notification && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
          {notification}
        </div>
      )}
    </div>
  );
}