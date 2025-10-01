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

// Mock data for demonstration - will be replaced with real API calls
const mockDecks: Deck[] = [
  {
    id: '1',
    name: 'Lightning Storm',
    format: 'Standard',
    totalCards: 60,
    pokemonCount: 15,
    trainerCount: 35,
    energyCount: 10,
    isValid: true,
    updatedAt: new Date('2024-10-01'),
    description: 'Aggressive Lightning-type deck focused on fast KO strategy with powerful Electric Pokemon',
    keyCards: ['Pikachu VMAX', 'Raichu V', 'Lightning Energy', 'Professor Oak'],
    estimatedValue: 245.50,
    mainAttribute: 'Lightning',
    primaryEffect: 'Damage Boost'
  },
  {
    id: '2',
    name: 'Fire Control',
    format: 'Expanded',
    totalCards: 60,
    pokemonCount: 12,
    trainerCount: 38,
    energyCount: 10,
    isValid: true,
    updatedAt: new Date('2024-09-28'),
    description: 'Control-focused Fire deck using disruption and powerful finishers',
    keyCards: ['Charizard V', 'Arcanine', 'Fire Energy', 'Team Rocket\'s Handiwork'],
    estimatedValue: 189.75,
    mainAttribute: 'Fire',
    primaryEffect: 'Hand Disruption'
  },
  {
    id: '3',
    name: 'Psychic Force',
    format: 'Standard',
    totalCards: 58,
    pokemonCount: 14,
    trainerCount: 34,
    energyCount: 10,
    isValid: false,
    updatedAt: new Date('2024-09-25'),
    description: 'Psychic-type deck with powerful psychic abilities and mind control effects',
    keyCards: ['Mewtwo V-UNION', 'Mr. Mime', 'Psychic Energy'],
    estimatedValue: 320.25,
    mainAttribute: 'Psychic',
    primaryEffect: 'Special Conditions'
  },
  {
    id: '4',
    name: 'Water Rush',
    format: 'Standard',
    totalCards: 60,
    pokemonCount: 16,
    trainerCount: 34,
    energyCount: 10,
    isValid: true,
    updatedAt: new Date('2024-09-30'),
    description: 'Fast-paced Water deck focusing on quick setup and consistent pressure',
    keyCards: ['Blastoise VMAX', 'Squirtle', 'Water Energy', 'Misty\'s Favor'],
    estimatedValue: 156.80,
    mainAttribute: 'Water',
    primaryEffect: 'Energy Acceleration'
  }
];

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
      // Try to load from API first
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
          primaryEffect: deck.primaryEffect || 'Unknown'
        }));
        setDecks([...mockDecks, ...processedApiDecks]);
      } else {
        throw new Error('API unavailable');
      }
    } catch (error) {
      // Fallback to mock data
      setDecks(mockDecks);
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
        estimatedValue: 0, // TODO: Calculate based on market prices
        mainAttribute: pokemonCards[0]?.WeaknessType || 'Unknown', // Using WeaknessType as fallback for attribute
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
                  <div className="text-lg font-semibold text-blue-600">{deck.pokemonCount}</div>
                  <div className="text-xs text-gray-500">Pokemon</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-600">{deck.trainerCount}</div>
                  <div className="text-xs text-gray-500">Trainers</div>
                </div>
              </div>

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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Deck ({currentDeckCards.reduce((sum, card) => sum + card.quantity, 0)} cards)</h3>
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
    if (!selectedDeck) return null;

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
                  {selectedDeck.estimatedValue ? formatPrice(selectedDeck.estimatedValue) : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Average per Card:</span>
                <span className="font-semibold">
                  {selectedDeck.estimatedValue ? formatPrice(selectedDeck.estimatedValue / selectedDeck.totalCards) : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Most Expensive:</span>
                <span className="font-semibold text-blue-600">Pikachu VMAX</span>
              </div>
              <div className="border-t pt-2">
                <div className="text-xs text-gray-500 mb-1">Price Distribution:</div>
                <div className="flex space-x-1">
                  <div className="flex-1 bg-green-200 h-2 rounded"></div>
                  <div className="flex-1 bg-yellow-200 h-2 rounded"></div>
                  <div className="flex-1 bg-red-200 h-2 rounded"></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Budget</span>
                  <span>Premium</span>
                  <span>Expensive</span>
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
                <span className="text-sm font-medium text-blue-600">Aggressive Offense</span>
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
                  <div className="flex justify-between text-sm">
                    <span>Damage Boost</span>
                    <span className="text-gray-500">40%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Energy Acceleration</span>
                    <span className="text-gray-500">25%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Card Draw</span>
                    <span className="text-gray-500">20%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Other</span>
                    <span className="text-gray-500">15%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card Type Breakdown */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Card Type Breakdown</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span>Pokemon Cards</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{selectedDeck.pokemonCount}</div>
                  <div className="text-xs text-gray-500">{Math.round((selectedDeck.pokemonCount / selectedDeck.totalCards) * 100)}%</div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span>Trainer Cards</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{selectedDeck.trainerCount}</div>
                  <div className="text-xs text-gray-500">{Math.round((selectedDeck.trainerCount / selectedDeck.totalCards) * 100)}%</div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                  <span>Energy Cards</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{selectedDeck.energyCount}</div>
                  <div className="text-xs text-gray-500">{Math.round((selectedDeck.energyCount / selectedDeck.totalCards) * 100)}%</div>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Consistency Score:</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{width: '85%'}}></div>
                  </div>
                  <span className="text-sm font-medium">85%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Speed Rating:</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{width: '78%'}}></div>
                  </div>
                  <span className="text-sm font-medium">78%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Power Level:</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div className="bg-red-500 h-2 rounded-full" style={{width: '92%'}}></div>
                  </div>
                  <span className="text-sm font-medium">92%</span>
                </div>
              </div>
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Navigation Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-3">
                <Package className="h-8 w-8 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900">Deck Studio</h1>
              </div>
              
              {/* Navigation Tabs */}
              <nav className="hidden md:flex space-x-8">
                <button
                  onClick={() => setCurrentView('manager')}
                  className={`px-1 py-2 text-sm font-medium border-b-2 transition-colors ${
                    currentView === 'manager'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Manager
                </button>
                <button
                  onClick={() => setCurrentView('builder')}
                  className={`px-1 py-2 text-sm font-medium border-b-2 transition-colors ${
                    currentView === 'builder'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Builder
                </button>
                {selectedDeck && (
                  <button
                    onClick={() => setCurrentView('review')}
                    className={`px-1 py-2 text-sm font-medium border-b-2 transition-colors ${
                      currentView === 'review'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Review
                  </button>
                )}
              </nav>
            </div>

            {/* Mobile Menu */}
            <div className="md:hidden">
              <select
                value={currentView}
                onChange={(e) => setCurrentView(e.target.value as any)}
                className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="manager">Manager</option>
                <option value="builder">Builder</option>
                {selectedDeck && <option value="review">Review</option>}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'manager' && <DeckManagerView />}
        {currentView === 'builder' && <DeckBuilderView />}
        {currentView === 'review' && <DeckReviewView />}
      </div>
    </div>
  );
}