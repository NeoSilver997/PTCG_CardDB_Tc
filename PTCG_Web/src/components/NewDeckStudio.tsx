'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  Plus,
  Minus,
  Edit,
  Trash2,
  Eye,
  Copy,
  Download,
  Sword,
  Shield,
  Zap,
  Heart,
  Star,
  BookOpen,
  Package,
  Settings,
  ChevronDown,
  ChevronUp,
  X,
  Grid,
  List,
  ArrowLeft,
  Home,
  BarChart3,
  CheckCircle,
  Calendar,
  Users,
  Target,
  DollarSign,
  Sparkles
} from 'lucide-react';
import { PTCGCard, SearchFilters, AbilityOption, EffectTypeOption } from '../types/card';

interface Deck {
  id: string;
  name: string;
  format: 'Standard' | 'Expanded' | 'Unlimited';
  totalCards: number;
  pokemonCount: number;
  trainerCount: number;
  energyCount: number;
  isValid: boolean;
  updatedAt: Date | string;
  description: string;
  keyCards?: string[];
  estimatedValue?: number;
  mainAttribute?: string;
  primaryEffect?: string;
  cards?: DeckCard[];
}

interface DeckCard extends PTCGCard {
  quantity: number;
}

// Helper function to fetch market prices
const fetchMarketPrices = async (): Promise<{ [cardId: number]: number }> => {
  try {
    const response = await fetch('/api/market-prices?format=raw');
    if (!response.ok) {
      throw new Error('Failed to fetch market prices');
    }
    const marketPricesData = await response.json();
    
    // Convert to a simple lookup object with CardID -> average price
    const priceMap: { [cardId: number]: number } = {};
    
    Object.entries(marketPricesData).forEach(([cardIdStr, prices]: [string, any[]]) => {
      const cardId = parseInt(cardIdStr);
      if (prices && prices.length > 0) {
        // Calculate average price from recent prices (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const recentPrices = prices.filter(price => 
          new Date(price.date) >= thirtyDaysAgo
        );
        
        const validPrices = recentPrices.length > 0 ? recentPrices : prices;
        const averagePrice = validPrices.reduce((sum, price) => sum + price.price, 0) / validPrices.length;
        
        priceMap[cardId] = averagePrice;
      }
    });
    
    return priceMap;
  } catch (error) {
    console.error('Error fetching market prices:', error);
    return {};
  }
};

// Helper functions for deck analysis
const calculateDeckStats = async (deck: Deck) => {
  if (!deck.cards || deck.cards.length === 0) {
    return {
      mostExpensiveCard: 'N/A',
      estimatedValue: 0,
      averageCardPrice: 0,
      priceDistribution: { budget: 0, premium: 0, expensive: 0 },
      consistencyScore: 0,
      speedRating: 0,
      powerLevel: 0,
      strategyFocus: 'Unknown',
      effectDistribution: { 'Unknown': 100 }
    };
  }

  // Fetch market prices
  const marketPrices = await fetchMarketPrices();

  // Fallback rarity-based prices (used when market data is unavailable)
  const rarityPrices: { [key: string]: number } = {
    'C': 0.25,      // Common
    'U': 0.50,      // Uncommon  
    'R': 2.00,      // Rare
    'RR': 5.00,     // Double Rare
    'RRR': 15.00,   // Triple Rare
    'UR': 50.00,    // Ultra Rare
    'HR': 75.00,    // Hyper Rare
    'SR': 100.00,   // Secret Rare
    'PR': 8.00      // Promo
  };

  // Calculate total estimated value and find most expensive card
  let totalValue = 0;
  let mostExpensiveCard = 'N/A';
  let highestPrice = 0;
  const cardPrices: { name: string, price: number }[] = [];

  deck.cards.forEach(card => {
    let estimatedPrice = 0;
    
    // Try to use market price first
    if (marketPrices[card.CardID]) {
      estimatedPrice = marketPrices[card.CardID];
    } else {
      // Fallback to rarity-based pricing with multipliers
      const basePrice = rarityPrices[card.Rarity] || 0.50;
      
      // Apply multipliers for special characteristics
      let multiplier = 1;
      if (card.AbilityName && card.AbilityName !== '無') multiplier *= 1.5;
      if (card.HP && parseInt(card.HP) > 250) multiplier *= 1.3;
      if (card.CardType.includes('寶可夢') && card.EvolutionStage.includes('基礎')) multiplier *= 1.2;
      if (card.Tier === 'S' || card.Tier === 'A') multiplier *= 2;
      
      estimatedPrice = basePrice * multiplier;
    }
    
    const totalCardValue = estimatedPrice * card.quantity;
    
    totalValue += totalCardValue;
    cardPrices.push({ name: card.Name, price: estimatedPrice });
    
    if (estimatedPrice > highestPrice) {
      highestPrice = estimatedPrice;
      mostExpensiveCard = card.Name;
    }
  });

  const averageCardPrice = totalValue / deck.totalCards;

  // Calculate price distribution
  const budgetCards = cardPrices.filter(c => c.price <= 1).length;
  const premiumCards = cardPrices.filter(c => c.price > 1 && c.price <= 10).length;
  const expensiveCards = cardPrices.filter(c => c.price > 10).length;
  const totalCards = cardPrices.length;

  const priceDistribution = {
    budget: Math.round((budgetCards / totalCards) * 100),
    premium: Math.round((premiumCards / totalCards) * 100),
    expensive: Math.round((expensiveCards / totalCards) * 100)
  };

  // Calculate consistency score based on deck composition
  const basicPokemonCount = deck.cards.filter(card => 
    card.EvolutionStage && card.EvolutionStage.includes('基礎')
  ).reduce((sum, card) => sum + card.quantity, 0);
  
  const consistencyScore = Math.min(100, Math.max(0, 
    (basicPokemonCount / deck.totalCards * 100) + 
    (deck.isValid ? 20 : 0) + 
    (deck.totalCards === 60 ? 15 : 0)
  ));

  // Calculate speed rating based on energy and trainer ratios
  const speedRating = Math.min(100, Math.max(0,
    (deck.energyCount / deck.totalCards * 100) + 
    (deck.trainerCount / deck.totalCards * 100)
  ));

  // Calculate power level based on rare cards and key cards
  const rareCards = deck.cards.filter(card => 
    card.Rarity === 'RRR' || card.Rarity === 'UR' || card.Rarity === 'R'
  ).length;
  const powerLevel = Math.min(100, Math.max(0,
    (rareCards / deck.cards.length * 100) + 
    ((deck.keyCards?.length || 0) * 10)
  ));

  // Analyze strategy focus
  const pokemonCards = deck.cards.filter(card => 
    card.CardType && (
      card.CardType.includes('寶可夢') || 
      card.CardType.toLowerCase().includes('pokemon')
    )
  );
  
  const hasHighHP = pokemonCards.some(card => parseInt(card.HP || '0') > 200);
  const hasLowRetreat = pokemonCards.some(card => parseInt(card.RetreatCost || '3') <= 1);
  const hasSpecialEffects = pokemonCards.some(card => 
    card.AbilityName && card.AbilityName !== '無'
  );

  let strategyFocus = 'Balanced';
  if (hasHighHP && !hasLowRetreat) strategyFocus = 'Tank/Control';
  else if (hasLowRetreat && !hasHighHP) strategyFocus = 'Speed/Rush';
  else if (hasSpecialEffects) strategyFocus = 'Combo/Synergy';
  else if (deck.trainerCount > deck.pokemonCount) strategyFocus = 'Support Heavy';

  // Analyze effect distribution
  const effectTypes = new Map<string, number>();
  deck.cards.forEach(card => {
    if (card.PrimaryEffectType) {
      const effects = card.PrimaryEffectType.split(',').map(e => e.trim());
      effects.forEach(effect => {
        effectTypes.set(effect, (effectTypes.get(effect) || 0) + card.quantity);
      });
    }
  });

  const totalEffects = Array.from(effectTypes.values()).reduce((sum, count) => sum + count, 0);
  const effectDistribution: { [key: string]: number } = {};
  
  if (totalEffects > 0) {
    effectTypes.forEach((count, effect) => {
      effectDistribution[effect] = Math.round((count / totalEffects) * 100);
    });
  } else {
    effectDistribution['Various'] = 100;
  }

  return {
    mostExpensiveCard,
    estimatedValue: Math.round(totalValue * 100) / 100,
    averageCardPrice: Math.round(averageCardPrice * 100) / 100,
    priceDistribution,
    consistencyScore: Math.round(consistencyScore),
    speedRating: Math.round(speedRating),
    powerLevel: Math.round(powerLevel),
    strategyFocus,
    effectDistribution
  };
};

export default function NewDeckStudio() {
  const [currentView, setCurrentView] = useState<'manager' | 'builder' | 'review'>('manager');
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Card search state for builder
  const [cards, setCards] = useState<PTCGCard[]>([]);
  const [filteredCards, setFilteredCards] = useState<PTCGCard[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
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
  const [abilities, setAbilities] = useState<AbilityOption[]>([]);
  const [effectTypes, setEffectTypes] = useState<EffectTypeOption[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'id' | 'rarity' | 'tier' | 'description'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Current deck being built/edited
  const [currentDeckCards, setCurrentDeckCards] = useState<DeckCard[]>([]);
  const [deckName, setDeckName] = useState('');
  const [deckDescription, setDeckDescription] = useState('');
  const [deckFormat, setDeckFormat] = useState<'Standard' | 'Expanded' | 'Unlimited'>('Standard');

  // Initialize deck editing
  useEffect(() => {
    if (selectedDeck && currentView === 'builder') {
      setCurrentDeckCards(selectedDeck.cards || []);
      setDeckName(selectedDeck.name);
      setDeckDescription(selectedDeck.description);
      setDeckFormat(selectedDeck.format as 'Standard' | 'Expanded' | 'Unlimited');
    } else if (currentView === 'builder' && !selectedDeck) {
      // New deck
      setCurrentDeckCards([]);
      setDeckName('New Deck');
      setDeckDescription('');
      setDeckFormat('Standard');
    }
  }, [selectedDeck, currentView]);

  const loadDecks = async () => {
    try {
      // Load from API
      const response = await fetch('/api/decks');
      if (response.ok) {
        const apiDecks = await response.json();
        // Process API decks to ensure proper date format
        const processedApiDecks = apiDecks.map((deck: any) => ({
          ...deck,
          updatedAt: deck.updatedAt ? new Date(deck.updatedAt) : new Date(),
          keyCards: deck.keyCards || [],
          estimatedValue: deck.estimatedValue || 0,
          mainAttribute: deck.mainAttribute || 'Unknown',
          primaryEffect: deck.primaryEffect || 'Unknown',
          cards: deck.cards || []
        }));
        setDecks(processedApiDecks);
      } else {
        // Start with empty deck list if API fails
        setDecks([]);
      }
    } catch (error) {
      console.error('Error loading decks:', error);
      // Start with empty deck list on error
      setDecks([]);
    } finally {
      setLoading(false);
    }
  };

  // Deck Management Functions
  const createNewDeck = () => {
    const newDeck: Deck = {
      id: `temp_${Date.now()}`,
      name: 'New Deck',
      format: 'Standard',
      totalCards: 0,
      pokemonCount: 0,
      trainerCount: 0,
      energyCount: 0,
      isValid: false,
      updatedAt: new Date(),
      description: '',
      cards: [],
      keyCards: [],
      estimatedValue: 0,
      mainAttribute: 'Unknown',
      primaryEffect: 'Unknown'
    };
    
    setSelectedDeck(newDeck);
    setCurrentView('builder');
  };

  const editDeck = (deck: Deck) => {
    setSelectedDeck(deck);
    setCurrentView('builder');
  };

  const cloneDeck = async (deck: Deck) => {
    try {
      const clonedDeck = {
        ...deck,
        id: undefined, // Let API generate new ID
        name: `${deck.name} (Copy)`,
        description: `Copy of ${deck.name}`,
        cards: deck.cards || []
      };
      
      const response = await fetch('/api/decks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clonedDeck),
      });
      
      if (!response.ok) {
        throw new Error('Failed to clone deck');
      }
      
      const newDeck = await response.json();
      
      // Add to local state
      setDecks(prev => [...prev, newDeck]);
      
      console.log('Deck cloned successfully!');
    } catch (error) {
      console.error('Error cloning deck:', error);
      alert('Failed to clone deck. Please try again.');
    }
  };

  const deleteDeck = async (deckId: string) => {
    if (!confirm('Are you sure you want to delete this deck? This action cannot be undone.')) return;
    
    try {
      const response = await fetch(`/api/decks?id=${deckId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete deck');
      }
      
      // Remove from local state
      setDecks(prev => prev.filter(d => d.id !== deckId));
      
      if (selectedDeck?.id === deckId) {
        setSelectedDeck(null);
        setCurrentView('manager');
      }
      
      console.log('Deck deleted successfully!');
    } catch (error) {
      console.error('Error deleting deck:', error);
      alert('Failed to delete deck. Please try again.');
    }
  };

  const saveDeck = async (deckData: Deck) => {
    try {
      const response = await fetch('/api/decks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(deckData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save deck');
      }
      
      const savedDeck = await response.json();
      
      // Update the deck in the list
      setDecks(prev => {
        const existingIndex = prev.findIndex(d => d.id === savedDeck.id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = savedDeck;
          return updated;
        } else {
          return [...prev, savedDeck];
        }
      });
      
      setSelectedDeck(savedDeck);
      return savedDeck;
    } catch (error) {
      console.error('Error saving deck:', error);
      throw error;
    }
  };

  const exportDeck = (deck: Deck) => {
    const deckData = {
      ...deck,
      exportedAt: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(deckData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${deck.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_deck.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  };

  // Card Management Functions for Deck Building
  const addCardToDeck = (card: PTCGCard) => {
    setCurrentDeckCards(prev => {
      const existing = prev.find(c => c.CardID === card.CardID);
      if (existing) {
        return prev.map(c => 
          c.CardID === card.CardID 
            ? { ...c, quantity: Math.min(c.quantity + 1, 4) }
            : c
        );
      } else {
        return [...prev, { ...card, quantity: 1 }];
      }
    });
  };

  const removeCardFromDeck = (cardId: number) => {
    setCurrentDeckCards(prev => {
      const existing = prev.find(c => c.CardID === cardId);
      if (existing && existing.quantity > 1) {
        return prev.map(c => 
          c.CardID === cardId 
            ? { ...c, quantity: c.quantity - 1 }
            : c
        );
      } else {
        return prev.filter(c => c.CardID !== cardId);
      }
    });
  };

  const removeAllCardFromDeck = (cardId: number) => {
    setCurrentDeckCards(prev => prev.filter(c => c.CardID !== cardId));
  };

  const saveDeckFromBuilder = async () => {
    if (!deckName.trim()) {
      alert('Please enter a deck name');
      return;
    }

    try {
      const totalCards = currentDeckCards.reduce((sum, card) => sum + card.quantity, 0);
      const pokemonCards = currentDeckCards.filter(card => 
        card.CardType && (
          card.CardType.includes('寶可夢') || 
          card.CardType.toLowerCase().includes('pokemon') || 
          card.CardType.includes('Pokémon')
        )
      );
      const trainerCards = currentDeckCards.filter(card => 
        card.CardType && (
          card.CardType.includes('物品') || 
          card.CardType.includes('支援') || 
          card.CardType.includes('場地') || 
          card.CardType.toLowerCase().includes('trainer')
        )
      );
      const energyCards = currentDeckCards.filter(card => 
        card.CardType && (
          card.CardType.toLowerCase().includes('energy') || 
          card.CardType.includes('能量')
        )
      );

      // Calculate deck stats with market prices
      const deckStats = await calculateDeckStats({ cards: currentDeckCards, totalCards } as Deck);

      const deckData: Deck = {
        id: selectedDeck?.id || `deck_${Date.now()}`,
        name: deckName,
        description: deckDescription,
        format: deckFormat,
        totalCards,
        pokemonCount: pokemonCards.reduce((sum, card) => sum + card.quantity, 0),
        trainerCount: trainerCards.reduce((sum, card) => sum + card.quantity, 0),
        energyCount: energyCards.reduce((sum, card) => sum + card.quantity, 0),
        isValid: totalCards === 60,
        updatedAt: new Date(),
        cards: currentDeckCards,
        keyCards: currentDeckCards
          .filter(card => card.quantity >= 3 || card.Rarity === 'RRR' || card.Rarity === 'UR')
          .map(card => card.Name)
          .slice(0, 5),
        estimatedValue: deckStats.estimatedValue,
        mainAttribute: pokemonCards[0]?.Type || 'Unknown', // Use card Type instead of WeaknessType
        primaryEffect: pokemonCards[0]?.PrimaryEffectType || 'Unknown'
      };

      const savedDeck = await saveDeck(deckData);
      setCurrentView('manager');
      console.log('Deck saved successfully!');
    } catch (error) {
      console.error('Error saving deck:', error);
      alert('Failed to save deck. Please try again.');
    }
  };

  const loadCards = useCallback(async () => {
    try {
      const response = await fetch('/api/cards');
      const data = await response.json();
      
      // Filter out energy cards and sort by ID
      const filteredData = data
        .filter((card: PTCGCard) => !card.CardType.includes('能量') && !card.CardType.toLowerCase().includes('energy'))
        .sort((a: PTCGCard, b: PTCGCard) => {
          const aId = parseInt(String(a.CardID).replace(/\D/g, '')) || 0;
          const bId = parseInt(String(b.CardID).replace(/\D/g, '')) || 0;
          return bId - aId;
        });
      
      setCards(filteredData);
      extractFilterOptions(filteredData);
    } catch (error) {
      console.error('Failed to load card data:', error);
    }
  }, []);

  // Load decks on component mount
  useEffect(() => {
    loadDecks();
    loadCards();
  }, [loadCards]);

  const extractFilterOptions = (cardData: PTCGCard[]) => {
    const abilityMap = new Map<string, number>();
    const effectTypeMap = new Map<string, number>();

    cardData.forEach(card => {
      // Process abilities
      const abilities = new Set<string>();
      
      if (card.AbilityName && card.AbilityName.trim() !== '' && card.AbilityName !== '無') {
        abilities.add(card.AbilityName.trim());
      }
      
      if (card.AbilityStats && card.AbilityStats !== '無') {
        const cardAbilities = card.AbilityStats.split(',').map(a => a.trim());
        cardAbilities.forEach(ability => {
          if (ability && ability !== '無') {
            abilities.add(ability);
          }
        });
      }
      
      abilities.forEach(ability => {
        abilityMap.set(ability, (abilityMap.get(ability) || 0) + 1);
      });

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

  const applyFilters = useCallback(() => {
    let filtered = cards;

    // Apply search term
    if (searchTerm) {
      filtered = filtered.filter(card =>
        card.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(card.CardID).toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.Skill1Effect.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.Skill2Effect.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.AbilityEffect.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply other filters (simplified for demo)
    if (filters.ability) {
      filtered = filtered.filter(card => 
        (card.AbilityName && card.AbilityName.includes(filters.ability)) ||
        (card.AbilityStats && card.AbilityStats.includes(filters.ability))
      );
    }

    if (filters.effectType) {
      filtered = filtered.filter(card =>
        (card.PrimaryEffectType && card.PrimaryEffectType.includes(filters.effectType)) ||
        (card.SpecialEffectType && card.SpecialEffectType.includes(filters.effectType))
      );
    }

    if (filters.cardType) {
      filtered = filtered.filter(card => card.CardType === filters.cardType);
    }

    if (filters.rarity) {
      filtered = filtered.filter(card => card.Rarity === filters.rarity);
    }

    if (filters.tier) {
      filtered = filtered.filter(card => card.Tier === filters.tier);
    }

    if (filters.attribute) {
      filtered = filtered.filter(card => card.Type === filters.attribute);
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.Name.localeCompare(b.Name);
          break;
        case 'id':
          comparison = parseInt(String(a.CardID)) - parseInt(String(b.CardID));
          break;
        case 'rarity':
          comparison = a.Rarity.localeCompare(b.Rarity);
          break;
        case 'tier':
          comparison = (a.Tier || '').localeCompare(b.Tier || '');
          break;
        default:
          comparison = 0;
      }
      
      return sortDirection === 'desc' ? -comparison : comparison;
    });

    setFilteredCards(sorted);
  }, [cards, searchTerm, filters, sortBy, sortDirection]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const getAttributeColor = (attribute: string) => {
    const colors: { [key: string]: string } = {
      'Lightning': 'text-yellow-600 bg-yellow-100',
      'Fire': 'text-red-600 bg-red-100',
      'Water': 'text-blue-600 bg-blue-100',
      'Grass': 'text-green-600 bg-green-100',
      'Psychic': 'text-purple-600 bg-purple-100',
      'Fighting': 'text-orange-600 bg-orange-100',
      'Darkness': 'text-gray-800 bg-gray-200',
      'Metal': 'text-gray-600 bg-gray-100',
      'Fairy': 'text-pink-600 bg-pink-100',
      'Colorless': 'text-gray-500 bg-gray-100'
    };
    return colors[attribute] || 'text-gray-600 bg-gray-100';
  };

  const formatDate = (date: Date | string) => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) {
        return 'Invalid Date';
      }
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }).format(dateObj);
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  // Energy Icon Components
  const EnergyIcon = ({ type, size = 'w-4 h-4' }: { type: string; size?: string }) => {
    const getEnergyIcon = (energyType: string) => {
      switch (energyType.toLowerCase()) {
        case 'fire':
        case 'fire energy':
        case '火':
          return (
            <div className={`${size} rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center`}>
              <div className="text-white text-xs font-bold">🔥</div>
            </div>
          );
        case 'water':
        case 'water energy':
        case '水':
          return (
            <div className={`${size} rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center`}>
              <div className="text-white text-xs font-bold">💧</div>
            </div>
          );
        case 'lightning':
        case 'electric':
        case 'lightning energy':
        case '雷':
          return (
            <div className={`${size} rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center`}>
              <div className="text-white text-xs font-bold">⚡</div>
            </div>
          );
        case 'grass':
        case 'grass energy':
        case '草':
          return (
            <div className={`${size} rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center`}>
              <div className="text-white text-xs font-bold">🌿</div>
            </div>
          );
        case 'psychic':
        case 'psychic energy':
        case '超':
          return (
            <div className={`${size} rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center`}>
              <div className="text-white text-xs font-bold">🔮</div>
            </div>
          );
        case 'fighting':
        case 'fighting energy':
        case '鬥':
          return (
            <div className={`${size} rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center`}>
              <div className="text-white text-xs font-bold">👊</div>
            </div>
          );
        case 'darkness':
        case 'dark':
        case 'darkness energy':
        case '惡':
          return (
            <div className={`${size} rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center`}>
              <div className="text-white text-xs font-bold">🌙</div>
            </div>
          );
        case 'metal':
        case 'steel':
        case 'metal energy':
        case '鋼':
          return (
            <div className={`${size} rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center`}>
              <div className="text-white text-xs font-bold">⚙️</div>
            </div>
          );
        case 'fairy':
        case 'fairy energy':
        case '妖精':
          return (
            <div className={`${size} rounded-full bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center`}>
              <div className="text-white text-xs font-bold">✨</div>
            </div>
          );
        case 'colorless':
        case 'normal':
        case '無色':
          return (
            <div className={`${size} rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center`}>
              <div className="text-white text-xs font-bold">○</div>
            </div>
          );
        default:
          return (
            <div className={`${size} rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center`}>
              <div className="text-white text-xs font-bold">?</div>
            </div>
          );
      }
    };
    
    return getEnergyIcon(type);
  };

  // Helper function to get basic Pokemon from deck
  const getBasicPokemon = (deck: Deck) => {
    if (!deck.cards) return [];
    
    return deck.cards.filter(card => {
      // Check if it's a Pokemon card and likely basic (not evolved)
      const isPokemon = card.CardType && (
        card.CardType.includes('寶可夢') || 
        card.CardType.toLowerCase().includes('pokemon') || 
        card.CardType.includes('Pokémon')
      );
      
      if (!isPokemon) return false;
      
      // Check if it's basic (doesn't have evolution keywords)
      const isBasic = card.EvolutionStage.includes('基礎');
      
      return isBasic;
    });
  };

  // Helper function to get energy cards from deck
  const getEnergyCards = (deck: Deck) => {
    if (!deck.cards) return [];
    
    return deck.cards.filter(card => {
      return card.CardType && (
        card.CardType.toLowerCase().includes('energy') || 
        card.CardType.includes('能量')
      );
    });
  };

  // Deck Manager View
  const DeckManagerView = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Deck Manager</h2>
          <p className="text-gray-600">Manage your Pokemon TCG decks and collections</p>
        </div>
        <button
          onClick={createNewDeck}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>New Deck</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Total Decks</p>
              <p className="text-2xl font-bold">{decks.length}</p>
            </div>
            <Package className="h-8 w-8 text-blue-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Valid Decks</p>
              <p className="text-2xl font-bold">{decks.filter(d => d.isValid).length}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Total Value</p>
              <p className="text-2xl font-bold">
                {formatPrice(decks.reduce((sum, deck) => sum + (deck.estimatedValue || 0), 0))}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-purple-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100">Formats</p>
              <p className="text-2xl font-bold">{new Set(decks.map(d => d.format)).size}</p>
            </div>
            <Target className="h-8 w-8 text-orange-200" />
          </div>
        </div>
      </div>

      {/* Deck Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {decks.map((deck) => (
          <div key={deck.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            {/* Deck Header */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{deck.name}</h3>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      deck.format === 'Standard' ? 'bg-green-100 text-green-800' :
                      deck.format === 'Expanded' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {deck.format}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      deck.isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {deck.isValid ? 'Valid' : 'Invalid'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => {
                      setSelectedDeck(deck);
                      setCurrentView('review');
                    }}
                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                    title="View Details"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => editDeck(deck)}
                    className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                    title="Edit Deck"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => cloneDeck(deck)}
                    className="p-1 text-gray-400 hover:text-purple-600 transition-colors"
                    title="Clone Deck"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => deleteDeck(deck.id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete Deck"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Deck Stats */}
            <div className="p-4">
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">{deck.totalCards}</div>
                  <div className="text-xs text-gray-500">Total Cards</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-blue-600">{deck.pokemonCount} ({getBasicPokemon(deck).length})</div>
                  <div className="text-xs text-gray-500">Pokemon (Basic)</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-600">{deck.trainerCount}</div>
                  <div className="text-xs text-gray-500">Trainers</div>
                </div>
              </div>

              {/* Energy Types */}
              {getEnergyCards(deck).length > 0 && (
                <div className="mb-3">
                  <div className="text-xs font-medium text-gray-500 mb-2">Energy Types:</div>
                  <div className="flex flex-wrap gap-1">
                    {Array.from(new Set(getEnergyCards(deck).map(card => card.Type))).map((energyType, index) => (
                      <div key={index} className="flex items-center bg-gray-100 rounded-full p-1">
                        <EnergyIcon type={energyType} size="w-4 h-4" />
                      </div>
                    ))}
                  </div>
                </div>
              )}



              {/* Main Attribute & Effect */}
              <div className="space-y-2 mb-3">
                {deck.mainAttribute && (
                  <div className="flex items-center space-x-2">
                    <Zap className="h-4 w-4 text-gray-400" />
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getAttributeColor(deck.mainAttribute)}`}>
                      {deck.mainAttribute}
                    </span>
                  </div>
                )}
                {deck.primaryEffect && (
                  <div className="flex items-center space-x-2">
                    <Sparkles className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{deck.primaryEffect}</span>
                  </div>
                )}
              </div>

              {/* Estimated Value */}
              {deck.estimatedValue && (
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-500">Estimated Value:</span>
                  <span className="text-sm font-semibold text-green-600">{formatPrice(deck.estimatedValue)}</span>
                </div>
              )}

              {/* Description */}
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{deck.description}</p>

              {/* Key Cards */}
              {deck.keyCards && deck.keyCards.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs font-medium text-gray-500 mb-1">Key Cards:</div>
                  <div className="flex flex-wrap gap-1">
                    {deck.keyCards.slice(0, 3).map((card, index) => (
                      <span key={index} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                        {card}
                      </span>
                    ))}
                    {deck.keyCards.length > 3 && (
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-500 rounded">
                        +{deck.keyCards.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Last Updated */}
              <div className="flex items-center text-xs text-gray-500">
                <Calendar className="h-3 w-3 mr-1" />
                Updated {formatDate(deck.updatedAt)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Deck Builder View (using Home layout with smaller images)
  const DeckBuilderView = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Deck Builder</h2>
          <p className="text-gray-600">Search and add cards to build your deck</p>
        </div>
        <button
          onClick={() => setCurrentView('manager')}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Manager</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search cards by name, ability, or effect..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2">
            <select
              value={filters.attribute}
              onChange={(e) => setFilters({...filters, attribute: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              <option value="Fire">Fire</option>
              <option value="Water">Water</option>
              <option value="Lightning">Lightning</option>
              <option value="Grass">Grass</option>
              <option value="Psychic">Psychic</option>
              <option value="Fighting">Fighting</option>
              <option value="Darkness">Darkness</option>
              <option value="Metal">Metal</option>
              <option value="Fairy">Fairy</option>
            </select>

            <select
              value={filters.cardType}
              onChange={(e) => setFilters({...filters, cardType: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Card Types</option>
              <option value="寶可夢">Pokemon</option>
              <option value="物品">Item</option>
              <option value="支援">Supporter</option>
              <option value="場地">Stadium</option>
            </select>

            <select
              value={filters.rarity}
              onChange={(e) => setFilters({...filters, rarity: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Rarities</option>
              <option value="Common">Common</option>
              <option value="Uncommon">Uncommon</option>
              <option value="Rare">Rare</option>
              <option value="Ultra Rare">Ultra Rare</option>
            </select>
          </div>
        </div>
      </div>

      {/* Deck Info and Save Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Deck Name Input */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Deck Name</label>
            <input
              type="text"
              value={deckName}
              onChange={(e) => setDeckName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter deck name..."
            />
          </div>

          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
            <select
              value={deckFormat}
              onChange={(e) => setDeckFormat(e.target.value as 'Standard' | 'Expanded' | 'Unlimited')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Standard">Standard</option>
              <option value="Expanded">Expanded</option>
              <option value="Unlimited">Unlimited</option>
            </select>
          </div>

          {/* Deck Stats */}
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{currentDeckCards.reduce((sum, card) => sum + card.quantity, 0)}</div>
              <div className="text-xs text-gray-500">Total Cards</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{getBasicPokemon({ cards: currentDeckCards } as Deck).length}</div>
              <div className="text-xs text-gray-500">Basic Pokemon</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${currentDeckCards.reduce((sum, card) => sum + card.quantity, 0) === 60 ? 'text-green-600' : 'text-orange-600'}`}>
                {currentDeckCards.reduce((sum, card) => sum + card.quantity, 0) === 60 ? 'Valid' : 'Invalid'}
              </div>
              <div className="text-xs text-gray-500">Status</div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-end">
            <button
              onClick={saveDeckFromBuilder}
              disabled={!deckName.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Save Deck
            </button>
          </div>
        </div>
      </div>

      {/* Current Deck Cards */}
      {currentDeckCards.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Current Deck ({currentDeckCards.reduce((sum, card) => sum + card.quantity, 0)} cards)</h3>
            
            {/* Energy Summary */}
            {getEnergyCards({ cards: currentDeckCards } as Deck).length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Energy:</span>
                {Array.from(new Set(getEnergyCards({ cards: currentDeckCards } as Deck).map(card => card.Type))).slice(0, 3).map((energyType, index) => (
                  <div key={index} className="flex items-center space-x-1">
                    <EnergyIcon type={energyType} size="w-4 h-4" />
                    <span className="text-xs text-gray-600">
                      {getEnergyCards({ cards: currentDeckCards } as Deck).filter(card => card.Type === energyType).reduce((sum, card) => sum + card.quantity, 0)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Basic Pokemon Summary */}
          {getBasicPokemon({ cards: currentDeckCards } as Deck).length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <div className="text-sm font-medium text-blue-700 mb-2">Basic Pokemon ({getBasicPokemon({ cards: currentDeckCards } as Deck).length} types):</div>
              <div className="flex flex-wrap gap-2">
                {getBasicPokemon({ cards: currentDeckCards } as Deck).slice(0, 6).map((pokemon, index) => (
                  <span key={index} className="text-xs bg-white px-2 py-1 rounded text-blue-600 font-medium">
                    {pokemon.Name} ×{pokemon.quantity}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {currentDeckCards.map((card) => (
              <div key={`deck-${card.CardID}`} className="relative bg-gray-50 rounded-lg overflow-hidden border">
                <div className="aspect-[3/4] bg-white">
                  <img
                    src={card.ImageURL || `/cards/${card.CardID}.png`}
                    alt={card.Name}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="p-2">
                  <div className="text-xs font-medium text-gray-900 truncate">{card.Name}</div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-500">Qty: {card.quantity}</span>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => removeCardFromDeck(card.CardID)}
                        className="p-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors"
                        title="Remove one"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeAllCardFromDeck(card.CardID)}
                        className="p-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors"
                        title="Remove all"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Card Grid - Using smaller images like Home page */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
        {filteredCards && filteredCards.length > 0 ? filteredCards.slice(0, 48).map((card) => (
          <div
            key={card.CardID}
            className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer group"
          >
            {/* Card Image - Smaller size */}
            <div className="aspect-[3/4] bg-gray-100 relative overflow-hidden">
              <img
                src={card.ImageURL || `/cards/${card.CardID}.png`}
                alt={card.Name}
                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/cards/placeholder.png';
                }}
              />
              {/* Add to Deck Button */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center">
                <button 
                  onClick={() => addCardToDeck(card)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  Add to Deck
                </button>
              </div>
            </div>

            {/* Card Info */}
            <div className="p-2">
              <h3 className="text-xs font-medium text-gray-900 truncate mb-1">{card.Name}</h3>
              <div className="flex items-center justify-between mb-2">
                <span className={`px-1.5 py-0.5 text-xs rounded-full ${getAttributeColor(card.Type)}`}>
                  {card.Type}
                </span>
                {card.HP && (
                  <span className="text-xs text-gray-500">{card.HP} HP</span>
                )}
              </div>
              {/* Quick Add Button */}
              <button
                onClick={() => addCardToDeck(card)}
                className="w-full px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1"
              >
                <Plus className="w-3 h-3" />
                <span>Add</span>
              </button>
            </div>
          </div>
        )) : (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500">No cards found. Try adjusting your search criteria.</p>
          </div>
        )}
      </div>

      {/* Load More */}
      {filteredCards && filteredCards.length > 48 && (
        <div className="text-center">
          <button className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
            Load More Cards ({filteredCards.length - 48} remaining)
          </button>
        </div>
      )}
    </div>
  );

  // Deck Review View
  const DeckReviewView = () => {
    const [deckStats, setDeckStats] = useState<any>(null);
    const [loadingStats, setLoadingStats] = useState(true);

    useEffect(() => {
      if (selectedDeck && selectedDeck.cards) {
        setLoadingStats(true);
        calculateDeckStats(selectedDeck)
          .then(stats => {
            setDeckStats(stats);
            setLoadingStats(false);
          })
          .catch(error => {
            console.error('Error calculating deck stats:', error);
            // Fallback to default stats
            setDeckStats({
              mostExpensiveCard: 'N/A',
              estimatedValue: 0,
              averageCardPrice: 0,
              priceDistribution: { budget: 0, premium: 0, expensive: 0 },
              consistencyScore: 0,
              speedRating: 0,
              powerLevel: 0,
              strategyFocus: 'Unknown',
              effectDistribution: { 'Unknown': 100 }
            });
            setLoadingStats(false);
          });
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedDeck]);

    if (!selectedDeck) return null;
    if (loadingStats || !deckStats) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Calculating deck analysis...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{selectedDeck.name}</h2>
            <p className="text-gray-600">Deck analysis and review</p>
          </div>
          <button
            onClick={() => setCurrentView('manager')}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Manager</span>
          </button>
        </div>

        {/* Deck Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Price Analysis */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Price Analysis</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Estimated Value:</span>
                <span className="font-semibold text-green-600">
                  {formatPrice(deckStats.estimatedValue)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Average per Card:</span>
                <span className="font-semibold">
                  {formatPrice(deckStats.averageCardPrice)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Most Expensive:</span>
                <span className="font-semibold text-blue-600">{deckStats.mostExpensiveCard}</span>
              </div>
              <div className="border-t pt-2">
                <div className="text-xs text-gray-500 mb-1">Price Distribution:</div>
                <div className="flex space-x-1">
                  <div 
                    className="bg-green-200 h-2 rounded" 
                    style={{ width: `${deckStats.priceDistribution.budget}%` }}
                  ></div>
                  <div 
                    className="bg-yellow-200 h-2 rounded" 
                    style={{ width: `${deckStats.priceDistribution.premium}%` }}
                  ></div>
                  <div 
                    className="bg-red-200 h-2 rounded" 
                    style={{ width: `${deckStats.priceDistribution.expensive}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Budget ({deckStats.priceDistribution.budget}%)</span>
                  <span>Premium ({deckStats.priceDistribution.premium}%)</span>
                  <span>Expensive ({deckStats.priceDistribution.expensive}%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Key Cards */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Star className="h-5 w-5 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Key Cards</h3>
            </div>
            <div className="space-y-3">
              {selectedDeck.keyCards && selectedDeck.keyCards.length > 0 ? (
                selectedDeck.keyCards.map((card, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-gray-900">{card}</span>
                    <div className="flex items-center space-x-1">
                      <Star className="h-3 w-3 text-yellow-500" />
                      <span className="text-xs text-gray-500">Core</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500">No key cards defined</div>
              )}
              <div className="border-t pt-2">
                <div className="text-xs text-gray-500 mb-1">Strategy Focus:</div>
                <span className="text-sm font-medium text-blue-600">{deckStats.strategyFocus}</span>
              </div>
            </div>
          </div>

          {/* Attribute & Effect Analysis */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Zap className="h-5 w-5 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Type & Effects</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Main Attribute:</span>
                <span className={`px-2 py-1 text-sm font-medium rounded-full ${getAttributeColor(selectedDeck.mainAttribute || '')}`}>
                  {selectedDeck.mainAttribute || 'Mixed'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Primary Effect:</span>
                <span className="font-medium text-purple-600">{selectedDeck.primaryEffect || 'Various'}</span>
              </div>
              <div className="border-t pt-2">
                <div className="text-xs text-gray-500 mb-2">Effect Distribution:</div>
                <div className="space-y-1">
                  {Object.entries(deckStats.effectDistribution).slice(0, 4).map(([effect, percentage], index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{effect}</span>
                      <span className="text-gray-500">{percentage as number}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* All Card Types Breakdown */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">All Card Types</h3>
            <div className="space-y-3">
              {Array.from(new Set(selectedDeck.cards?.map(card => card.CardType) || [])).map((cardType, index) => {
                const count = selectedDeck.cards?.filter(card => card.CardType === cardType).reduce((sum, card) => sum + card.quantity, 0) || 0;
                const percentage = selectedDeck.totalCards > 0 ? (count / selectedDeck.totalCards * 100).toFixed(1) : '0';
                
                return (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded ${
                        cardType.includes('寶可夢') || cardType.toLowerCase().includes('pokemon') ? 'bg-blue-500' :
                        cardType.includes('物品') || cardType.toLowerCase().includes('item') ? 'bg-green-500' :
                        cardType.includes('支援') || cardType.toLowerCase().includes('supporter') ? 'bg-purple-500' :
                        cardType.includes('場地') || cardType.toLowerCase().includes('stadium') ? 'bg-orange-500' :
                        cardType.includes('能量') || cardType.toLowerCase().includes('energy') ? 'bg-yellow-500' :
                        'bg-gray-500'
                      }`}></div>
                      <span className="text-sm">{cardType}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{count}</div>
                      <div className="text-xs text-gray-500">{percentage}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Energy Types Breakdown */}
            {getEnergyCards(selectedDeck).length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Energy Types</h4>
                <div className="space-y-2">
                  {Array.from(new Set(getEnergyCards(selectedDeck).map(card => card.Type))).map((energyType, index) => {
                    const count = getEnergyCards(selectedDeck).filter(card => card.Type === energyType).reduce((sum, card) => sum + (card.quantity || 1), 0);
                    return (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <EnergyIcon type={energyType} size="w-4 h-4" />
                          <span className="text-sm">{energyType}</span>
                        </div>
                        <span className="text-sm font-medium">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Rarity Breakdown */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Rarity Distribution</h4>
              <div className="space-y-2">
                {Array.from(new Set(selectedDeck.cards?.map(card => card.Rarity).filter(rarity => rarity) || [])).map((rarity, index) => {
                  const count = selectedDeck.cards?.filter(card => card.Rarity === rarity).reduce((sum, card) => sum + card.quantity, 0) || 0;
                  
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${
                          rarity === 'UR' || rarity === 'Ultra Rare' ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                          rarity === 'RRR' || rarity === 'Secret Rare' ? 'bg-gradient-to-r from-purple-400 to-pink-500' :
                          rarity === 'RR' || rarity === 'Double Rare' ? 'bg-gradient-to-r from-blue-400 to-purple-500' :
                          rarity === 'R' || rarity === 'Rare' ? 'bg-gradient-to-r from-green-400 to-blue-500' :
                          rarity === 'U' || rarity === 'Uncommon' ? 'bg-gradient-to-r from-gray-300 to-gray-500' :
                          'bg-gray-300'
                        }`}></div>
                        <span className="text-sm">{rarity}</span>
                      </div>
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Expansion/Mark Breakdown */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Expansion & Mark Analysis</h3>
            
            {/* Expansion Marks */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Expansion Sets</h4>
              <div className="space-y-2">
                {Array.from(new Set(selectedDeck.cards?.map(card => card.ExpansionName || card.ExpansionCode || 'Unknown').filter(expansion => expansion) || [])).map((expansion, index) => {
                  const count = selectedDeck.cards?.filter(card => (card.ExpansionName || card.ExpansionCode || 'Unknown') === expansion).reduce((sum, card) => sum + card.quantity, 0) || 0;
                  const percentage = selectedDeck.totalCards > 0 ? (count / selectedDeck.totalCards * 100).toFixed(1) : '0';
                  
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 bg-indigo-500 rounded"></div>
                        <span className="text-sm">{expansion}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{count}</div>
                        <div className="text-xs text-gray-500">{percentage}%</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Regulation Marks */}
            {Array.from(new Set(selectedDeck.cards?.map(card => card.RegulationMark).filter(reg => reg && reg !== '無') || [])).length > 0 && (
              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Regulation Marks</h4>
                <div className="space-y-2">
                  {Array.from(new Set(selectedDeck.cards?.map(card => card.RegulationMark).filter(reg => reg && reg !== '無') || [])).map((regulation, index) => {
                    const count = selectedDeck.cards?.filter(card => card.RegulationMark === regulation).reduce((sum, card) => sum + card.quantity, 0) || 0;
                    
                    return (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-blue-100 rounded border-2 border-blue-400 flex items-center justify-center">
                            <span className="text-xs font-bold text-blue-600">{regulation}</span>
                          </div>
                          <span className="text-sm">Regulation {regulation}</span>
                        </div>
                        <span className="text-sm font-medium">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Evolution Stages */}
            <div className="pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Evolution Stages</h4>
              <div className="space-y-2">
                {Array.from(new Set(selectedDeck.cards?.map(card => card.EvolutionStage).filter(stage => stage) || [])).map((stage, index) => {
                  const count = selectedDeck.cards?.filter(card => card.EvolutionStage === stage).reduce((sum, card) => sum + card.quantity, 0) || 0;
                  
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-4 h-4 rounded ${
                          stage.includes('基礎') || stage.toLowerCase().includes('basic') ? 'bg-green-500' :
                          stage.includes('1') ? 'bg-blue-500' :
                          stage.includes('2') ? 'bg-purple-500' :
                          'bg-gray-500'
                        }`}></div>
                        <span className="text-sm">{stage}</span>
                      </div>
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Weakness & Resistance Analysis */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Weakness & Resistance</h3>
            
            {/* Weakness Analysis */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Weakness Types</h4>
              <div className="space-y-2">
                {Array.from(new Set(selectedDeck.cards?.map(card => card.WeaknessType).filter(weakness => weakness && weakness !== '無' && weakness !== 'None') || [])).map((weakness, index) => {
                  const count = selectedDeck.cards?.filter(card => card.WeaknessType === weakness).reduce((sum, card) => sum + card.quantity, 0) || 0;
                  
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <EnergyIcon type={weakness} size="w-4 h-4" />
                        <span className="text-sm">{weakness} Weakness</span>
                      </div>
                      <span className="text-sm font-medium text-red-600">{count}</span>
                    </div>
                  );
                })}
                {Array.from(new Set(selectedDeck.cards?.map(card => card.WeaknessType).filter(weakness => weakness && weakness !== '無' && weakness !== 'None') || [])).length === 0 && (
                  <div className="text-sm text-gray-500">No weaknesses found</div>
                )}
              </div>
            </div>

            {/* Resistance Analysis */}
            <div className="pt-4 border-t border-gray-200 mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Resistance Types</h4>
              <div className="space-y-2">
                {Array.from(new Set(selectedDeck.cards?.map(card => card.ResistanceType).filter(resistance => resistance && resistance !== '無' && resistance !== 'None') || [])).map((resistance, index) => {
                  const count = selectedDeck.cards?.filter(card => card.ResistanceType === resistance).reduce((sum, card) => sum + card.quantity, 0) || 0;
                  
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <EnergyIcon type={resistance} size="w-4 h-4" />
                        <span className="text-sm">{resistance} Resistance</span>
                      </div>
                      <span className="text-sm font-medium text-green-600">{count}</span>
                    </div>
                  );
                })}
                {Array.from(new Set(selectedDeck.cards?.map(card => card.ResistanceType).filter(resistance => resistance && resistance !== '無' && resistance !== 'None') || [])).length === 0 && (
                  <div className="text-sm text-gray-500">No resistances found</div>
                )}
              </div>
            </div>

            {/* Retreat Cost Analysis */}
            <div className="pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Retreat Cost Distribution</h4>
              <div className="space-y-2">
                {Array.from(new Set(selectedDeck.cards?.map(card => card.RetreatCost).filter(cost => cost !== undefined && cost !== null && cost !== '') || [])).sort((a, b) => {
                  const aNum = parseInt(String(a)) || 0;
                  const bNum = parseInt(String(b)) || 0;
                  return aNum - bNum;
                }).map((cost, index) => {
                  const count = selectedDeck.cards?.filter(card => card.RetreatCost === cost).reduce((sum, card) => sum + card.quantity, 0) || 0;
                  
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center border-2 border-blue-400">
                          <span className="text-xs font-bold text-blue-600">{cost}</span>
                        </div>
                        <span className="text-sm">{cost} Retreat Cost</span>
                      </div>
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                  );
                })}
                {Array.from(new Set(selectedDeck.cards?.map(card => card.RetreatCost).filter(cost => cost !== undefined && cost !== null && cost !== '') || [])).length === 0 && (
                  <div className="text-sm text-gray-500">No retreat costs found</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Basic Pokemon List & Performance Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Pokemon List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Pokemon</h3>
            {getBasicPokemon(selectedDeck).length > 0 ? (
              <div className="space-y-3">
                {getBasicPokemon(selectedDeck).map((pokemon, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-blue-600 font-bold text-sm">{pokemon.HP || '?'}</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{pokemon.Name}</div>
                        <div className="text-sm text-gray-500">{pokemon.Type}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-blue-600">×{pokemon.quantity || 1}</div>
                      <div className="text-xs text-gray-500">copies</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No basic Pokemon found in this deck</p>
            )}
          </div>

          {/* Performance Metrics */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
            <div className="space-y-4">
              {(() => {
                return (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Consistency Score:</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{width: `${deckStats.consistencyScore}%`}}></div>
                        </div>
                        <span className="text-sm font-medium">{deckStats.consistencyScore}%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Speed Rating:</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{width: `${deckStats.speedRating}%`}}></div>
                        </div>
                        <span className="text-sm font-medium">{deckStats.speedRating}%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Power Level:</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div className="bg-red-500 h-2 rounded-full" style={{width: `${deckStats.powerLevel}%`}}></div>
                        </div>
                        <span className="text-sm font-medium">{deckStats.powerLevel}%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Deck Validity:</span>
                      <span className={`text-sm font-medium ${selectedDeck.isValid ? 'text-green-600' : 'text-red-600'}`}>
                        {selectedDeck.isValid ? 'Valid (60 cards)' : `Invalid (${selectedDeck.totalCards} cards)`}
                      </span>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Deck Studio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Mobile Optimized */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-8xl mx-auto px-2 sm:px-2 lg:px-2 py-2 sm:py-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <Package className="h-8 w-8 sm:h-10 sm:w-10 text-purple-600" />
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Deck Studio</h1>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
              <a
                href="/"
                className="flex items-center justify-center space-x-2 px-4 py-3 sm:py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium w-full sm:w-auto min-h-[44px] sm:min-h-auto"
              >
                <Search className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Card Search</span>
              </a>
              <a
                href="/deck-builder"
                className="flex items-center justify-center space-x-2 px-4 py-3 sm:py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium w-full sm:w-auto min-h-[44px] sm:min-h-auto"
              >
                <Sword className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Deck Builder</span>
              </a>
              <a
                href="/inventory"
                className="flex items-center justify-center space-x-2 px-4 py-3 sm:py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium w-full sm:w-auto min-h-[44px] sm:min-h-auto"
              >
                <Package className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Inventory</span>
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
                {decks.length} decks
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-8xl mx-auto px-2 sm:px-2 lg:px-2 py-2 sm:py-2">
        {/* View Navigation - Mobile Optimized */}
        <div className="mb-4 bg-white rounded-lg shadow-sm border p-3">
          <nav className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-6">
            <button
              onClick={() => setCurrentView('manager')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors w-full sm:w-auto ${
                currentView === 'manager'
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Manager
            </button>
            <button
              onClick={() => setCurrentView('builder')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors w-full sm:w-auto ${
                currentView === 'builder'
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Builder
            </button>
            <button
              onClick={() => setCurrentView('review')}
              disabled={!selectedDeck}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors w-full sm:w-auto ${
                currentView === 'review'
                  ? 'bg-purple-100 text-purple-700'
                  : selectedDeck
                  ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  : 'text-gray-400 cursor-not-allowed'
              }`}
            >
              Review {selectedDeck ? `(${selectedDeck.name})` : ''}
            </button>
          </nav>
        </div>

        {currentView === 'manager' && <DeckManagerView />}
        {currentView === 'builder' && <DeckBuilderView />}
        {currentView === 'review' && <DeckReviewView />}
      </div>
    </div>
  );
}