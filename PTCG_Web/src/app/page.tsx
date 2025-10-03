'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Filter, Zap, Shield, Sword, Gamepad2, Package, DollarSign, ChevronRight } from 'lucide-react';
import { PTCGCard, SearchFilters, AbilityOption, EffectTypeOption } from '../types/card';
import { MarketPrice } from '../types/market';
import CardGrid from '../components/CardGrid';
import SearchFiltersComponent from '../components/SearchFilters';
import CardDetailModal from '../components/CardDetailModal';
import LanguageSelector from '../components/LanguageSelector';
import { useI18n } from '../i18n/context';
import { useInventory } from '../hooks/useInventory';

export default function Home() {
  const { t } = useI18n();
  const [cards, setCards] = useState<PTCGCard[]>([]);
  const [totalCards, setTotalCards] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [cardsPerPage, setCardsPerPage] = useState(50);

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
    specialPokemonType: '',
    owned: 'all',
    priceRange: 'all'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCard, setSelectedCard] = useState<PTCGCard | null>(null);
  const [loading, setLoading] = useState(true);

  // State for filter options
  const [abilities, setAbilities] = useState<AbilityOption[]>([]);
  const [effectTypes, setEffectTypes] = useState<EffectTypeOption[]>([]);
  const [allFilterOptions, setAllFilterOptions] = useState<any>({});

  const [notification, setNotification] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'id' | 'rarity' | 'tier' | 'description'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [viewSize, setViewSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [filtersVisible, setFiltersVisible] = useState(true);
  const filterHideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [cardOnlyView, setCardOnlyView] = useState(false);

  // Inventory management
  const { addToInventory, inventory, getCardInventory, getTotalQuantity } = useInventory();
  const [addingAllToInventory, setAddingAllToInventory] = useState(false);
  const [marketPrices, setMarketPrices] = useState<{[cardId: string]: MarketPrice[]}>({});

  const isPokemonCard = (card: PTCGCard) => {
    return card.CardType.includes('寶可夢') || card.CardType.toLowerCase().includes('pokemon');
  };

  const loadMarketPrices = useCallback(async () => {
    try {
      const response = await fetch('/api/market-prices?format=raw');
      const data = await response.json();
      setMarketPrices(data);
    } catch (error) {
      console.error('Failed to load market prices:', error);
      setMarketPrices({});
    }
  }, []);

  const getCardMarketPrice = useCallback((cardId: number) => {
    const prices = marketPrices[cardId.toString()];
    if (!prices || prices.length === 0) return null;
    
    // Get the most recent price
    const sortedPrices = prices.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return sortedPrices[0];
  }, [marketPrices]);

  const fetchCards = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: cardsPerPage.toString(),
        sortBy,
        sortDirection,
        searchTerm,
      });

      // Append filters to params
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params.append(key, String(value));
        }
      });
      
      const response = await fetch(`/api/cards?${params.toString()}`);
      const data = await response.json();

      setCards(data.cards);
      setTotalCards(data.total);
    } catch (error) {
      console.error('Failed to load card data:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, cardsPerPage, sortBy, sortDirection, searchTerm, filters]);

  const fetchFilterOptions = useCallback(async () => {
    try {
      const response = await fetch('/api/cards/filters');
      const data = await response.json();
      setAllFilterOptions(data);
      setAbilities(data.abilities || []);
      setEffectTypes(data.effectTypes || []);
    } catch (error) {
      console.error('Failed to load filter options:', error);
    }
  }, []);

  // Fetch initial data
  useEffect(() => {
    fetchFilterOptions();
    loadMarketPrices();
  }, [fetchFilterOptions, loadMarketPrices]);

  // Fetch cards when dependencies change
  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const handleCardClick = (card: PTCGCard) => {
    setSelectedCard(card);
  };

  // The rest of the component logic (handleAddToDeck, getRelatedCards, etc.) remains largely the same,
  // but it will now operate on the `cards` state which is paginated and filtered by the backend.
  // Note: getRelatedCards might need to be moved to the backend for efficiency with a large dataset.

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
          const existingCard = currentDeck.cards[existingCardIndex] as any;
          const newQuantity = Math.min(existingCard.quantity + quantity, maxQuantity);
          existingCard.quantity = newQuantity;
        } else {
          // Add new card to deck
          const deckCard = { ...card, quantity: Math.min(quantity, maxQuantity) };
          (currentDeck.cards as any[]).push(deckCard);
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

          // Same ability (check both AbilityName and AbilityStats)
          if ((card.AbilityName && c.AbilityName && card.AbilityName === c.AbilityName) ||
              (card.AbilityStats && c.AbilityStats)) {
            if (card.AbilityName && c.AbilityName && card.AbilityName === c.AbilityName) return true;
            if (card.AbilityStats && c.AbilityStats) {
              const cardAbilities = card.AbilityStats.split(',').map(a => a.trim());
              const otherAbilities = c.AbilityStats.split(',').map(a => a.trim());
              if (cardAbilities.some(a => otherAbilities.includes(a))) return true;
            }
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

      const handleAddToInventory = useCallback(async (cardId: number): Promise<boolean> => {
        try {
          const success = await addToInventory(
            cardId,
            1, // Default quantity of 1
            'Near Mint', // Default condition
            undefined, // No notes
            undefined, // No purchase cost
            undefined // No market price
          );
          if (success) {
            setNotification('Card added to inventory successfully!');
            // Clear notification after 3 seconds
            setTimeout(() => setNotification(null), 3000);
          } else {
            setNotification('Failed to add card to inventory');
            setTimeout(() => setNotification(null), 3000);
          }
          return success;
        } catch (error) {
          console.error('Error adding card to inventory:', error);
          setNotification('Error adding card to inventory');
          setTimeout(() => setNotification(null), 3000);
          return false;
        }
      }, [addToInventory]);

  if (loading && cards.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">{t.loading}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-8xl mx-auto px-2 sm:px-2 lg:px-2 py-2 sm:py-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <Gamepad2 className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600" />
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{t.cardSearch}</h1>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
              <LanguageSelector />
              <a
                href="/deck-studio"
                className="flex items-center justify-center space-x-2 px-4 py-3 sm:py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm font-medium w-full sm:w-auto min-h-[44px] sm:min-h-auto"
              >
                <Package className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Deck Studio</span>
              </a>
              <a
                href="/deck-builder"
                className="flex items-center justify-center space-x-2 px-4 py-3 sm:py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium w-full sm:w-auto min-h-[44px] sm:min-h-auto"
              >
                <Sword className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>{t.deckBuilder}</span>
              </a>
              <a
                href="/inventory"
                className="flex items-center justify-center space-x-2 px-4 py-3 sm:py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium w-full sm:w-auto min-h-[44px] sm:min-h-auto"
              >
                <Package className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>{t.inventory}</span>
              </a>
              <a
                href="/market"
                className="flex items-center justify-center space-x-2 px-4 py-3 sm:py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm font-medium w-full sm:w-auto min-h-[44px] sm:min-h-auto"
              >
                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Market</span>
              </a>
              <a
                href="/debug"
                className="flex items-center justify-center space-x-2 px-3 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors text-xs font-medium opacity-75 hover:opacity-100"
                title="Debug Console - All Routes & API Endpoints"
              >
                <span>🐛</span>
                <span>Debug</span>
              </a>
              <div className="text-sm sm:text-base text-gray-500">
                {totalCards} {t.results}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-8xl mx-auto px-2 sm:px-2 lg:px-2 py-2 sm:py-2">
        {/* Controls */}
        <div className="mb-4 bg-white rounded-lg shadow-sm border p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center space-x-2">
              <label className="text-xs font-medium text-gray-700">Sort:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-xs"
              >
                <option value="name">Name</option>
                <option value="id">Card ID</option>
                <option value="rarity">Rarity</option>
                <option value="tier">Tier</option>
                <option value="description">Description</option>
              </select>
              <button
                onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                className="px-2 py-1 text-xs bg-gray-200 text-gray-700 hover:bg-gray-300 rounded border border-gray-300"
                title={`Sort ${sortDirection === 'asc' ? 'Descending' : 'Ascending'}`}
              >
                {sortDirection === 'asc' ? '↑' : '↓'}
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-xs font-medium text-gray-700">Size:</label>
              <div className="flex space-x-1">
                <button
                  onClick={() => setViewSize('small')}
                  className={`px-2 py-1 text-xs rounded ${
                    viewSize === 'small' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  S
                </button>
                <button
                  onClick={() => setViewSize('medium')}
                  className={`px-2 py-1 text-xs rounded ${
                    viewSize === 'medium' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  M
                </button>
                <button
                  onClick={() => setViewSize('large')}
                  className={`px-2 py-1 text-xs rounded ${
                    viewSize === 'large' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  L
                </button>
              </div>
            </div>
          </div>
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            />
          </div>
          <div className="text-xs text-gray-500">
            {totalCards} {t.results}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
          {/* Filters Sidebar */}
          <div className="lg:w-64 lg:flex-shrink-0">
            <div className="lg:sticky lg:top-6">
                <SearchFiltersComponent
                  filters={filters}
                  onFiltersChange={setFilters}
                  abilities={abilities}
                  effectTypes={effectTypes}
                  cards={[]} // Pass empty array as it's no longer used for extraction
                  allOptions={allFilterOptions}
                />
            </div>
          </div>

          {/* Card Grid */}
          <div className="flex-1 min-w-0">
            <CardGrid
              cards={cards}
              onCardClick={handleCardClick}
              viewSize={viewSize}
              cardOnlyView={cardOnlyView}
              onOpenInventory={handleCardClick}
              onAddToInventory={handleAddToInventory}
              marketPrices={marketPrices}
            />
             {/* Pagination Controls */}
            <div className="flex justify-center items-center space-x-4 mt-8">
                <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
                >
                    Previous
                </button>
                <span>Page {currentPage} of {Math.ceil(totalCards / cardsPerPage)}</span>
                <button
                    onClick={() => setCurrentPage(p => p + 1)}
                    disabled={currentPage * cardsPerPage >= totalCards}
                    className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
                >
                    Next
                </button>
            </div>
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
          allCards={cards} // This should be refactored to fetch related cards from backend
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