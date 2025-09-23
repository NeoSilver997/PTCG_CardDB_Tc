'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Minus, 
  Save, 
  Download, 
  Upload, 
  Trash2, 
  Eye, 
  BarChart3,
  Settings,
  Shuffle,
  Copy,
  FileText,
  Zap,
  Shield,
  Sword,
  Star,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react';
import { PTCGCard } from '../types/card';
import { Deck, DeckCard, DeckValidation, DeckStats, DeckBuilderFilters } from '../types/deck';

interface DeckBuilderProps {
  initialCards: PTCGCard[];
  onClose: () => void;
  initialDeck?: Deck | null;
}

export default function DeckBuilder({ initialCards, onClose, initialDeck }: DeckBuilderProps) {
  // Deck state
  const [currentDeck, setCurrentDeck] = useState<Deck>(
    initialDeck || {
      id: '',
      name: 'New Deck',
      description: '',
      cards: [],
      format: 'Standard',
      createdAt: new Date(),
      updatedAt: new Date(),
      isValid: false,
      pokemonCount: 0,
      trainerCount: 0,
      energyCount: 0,
      totalCards: 0
    }
  );

  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<DeckBuilderFilters>({
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
    format: 'Standard',
    energyType: '',
    hp: { min: 0, max: 1000 },
    retreatCost: { min: 0, max: 5 }
  });
  
  const [showFilters, setShowFilters] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [selectedCard, setSelectedCard] = useState<PTCGCard | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filter cards based on search and filters
  const filteredCards = useMemo(() => {
    return initialCards.filter(card => {
      // Search term
      if (searchTerm && !card.Name.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !card.AbilityName?.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !card.Skill1Name?.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !card.Skill2Name?.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Card type filter
      if (filters.cardType && !card.CardType.includes(filters.cardType)) {
        return false;
      }

      // Attribute filter
      if (filters.attribute && card.Type !== filters.attribute) {
        return false;
      }

      // Rarity filter
      if (filters.rarity && card.Rarity !== filters.rarity) {
        return false;
      }

      // Tier filter
      if (filters.tier && card.Tier !== filters.tier) {
        return false;
      }

      // HP filter
      if (card.HP && filters.hp) {
        const hp = parseInt(card.HP);
        if (!isNaN(hp) && (hp < filters.hp.min || hp > filters.hp.max)) {
          return false;
        }
      }

      // Retreat cost filter
      if (card.RetreatCost && filters.retreatCost) {
        const retreatCost = parseInt(card.RetreatCost);
        if (!isNaN(retreatCost) && (retreatCost < filters.retreatCost.min || retreatCost > filters.retreatCost.max)) {
          return false;
        }
      }

      return true;
    });
  }, [initialCards, searchTerm, filters]);

  // Deck validation
  const deckValidation = useMemo((): DeckValidation => {
    const totalCards = currentDeck.cards.reduce((sum, card) => sum + card.quantity, 0);
    const pokemonCards = currentDeck.cards.filter(card => card.CardType.includes('寶可夢') || card.CardType.toLowerCase().includes('pokemon'));
    const trainerCards = currentDeck.cards.filter(card => card.CardType.includes('物品') || card.CardType.includes('支援') || card.CardType.includes('場地'));
    const energyCards = currentDeck.cards.filter(card => card.CardType.includes('能量'));

    const pokemonCount = pokemonCards.reduce((sum, card) => sum + card.quantity, 0);
    const trainerCount = trainerCards.reduce((sum, card) => sum + card.quantity, 0);
    const energyCount = energyCards.reduce((sum, card) => sum + card.quantity, 0);

    const errors: string[] = [];
    const warnings: string[] = [];

    // Standard deck validation
    if (totalCards !== 60) {
      errors.push(`Deck must contain exactly 60 cards (currently ${totalCards})`);
    }

    // Check for illegal card quantities
    currentDeck.cards.forEach(card => {
      if (card.quantity > 4 && !card.CardType.includes('基本') && !card.CardType.includes('能量')) {
        errors.push(`${card.Name}: Maximum 4 copies allowed`);
      }
    });

    // Energy recommendations
    if (energyCount < 10) {
      warnings.push('Consider adding more energy cards (recommended: 10-15)');
    } else if (energyCount > 20) {
      warnings.push('Too many energy cards might slow down your deck');
    }

    // Pokemon recommendations
    if (pokemonCount < 10) {
      warnings.push('Consider adding more Pokemon (recommended: 10-20)');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      pokemonCount,
      trainerCount,
      energyCount,
      totalCards
    };
  }, [currentDeck.cards]);

  // Deck statistics
  const deckStats = useMemo((): DeckStats => {
    const pokemonCards = currentDeck.cards.filter(card => card.CardType.includes('寶可夢') || card.CardType.toLowerCase().includes('pokemon'));
    
    const hpValues = pokemonCards.filter(card => card.HP).map(card => parseInt(card.HP) * card.quantity).filter(hp => !isNaN(hp));
    const averageHP = hpValues.length > 0 ? hpValues.reduce((sum, hp) => sum + hp, 0) / hpValues.length : 0;

    const retreatValues = pokemonCards.filter(card => card.RetreatCost).map(card => parseInt(card.RetreatCost) * card.quantity).filter(cost => !isNaN(cost));
    const averageRetreatCost = retreatValues.length > 0 ? retreatValues.reduce((sum, cost) => sum + cost, 0) / retreatValues.length : 0;

    const energyDistribution: { [key: string]: number } = {};
    const typeDistribution: { [key: string]: number } = {};
    const rarityDistribution: { [key: string]: number } = {};

    currentDeck.cards.forEach(card => {
      // Energy distribution
      if (card.Type) {
        energyDistribution[card.Type] = (energyDistribution[card.Type] || 0) + card.quantity;
      }

      // Type distribution
      typeDistribution[card.CardType] = (typeDistribution[card.CardType] || 0) + card.quantity;

      // Rarity distribution
      rarityDistribution[card.Rarity] = (rarityDistribution[card.Rarity] || 0) + card.quantity;
    });

    const abilityCount = currentDeck.cards.filter(card => card.AbilityName).reduce((sum, card) => sum + card.quantity, 0);
    const attackerCount = pokemonCards.filter(card => card.Skill1Name || card.Skill2Name).reduce((sum, card) => sum + card.quantity, 0);
    const supportCount = currentDeck.cards.filter(card => card.CardType.includes('支援')).reduce((sum, card) => sum + card.quantity, 0);

    return {
      averageHP,
      averageRetreatCost,
      energyDistribution,
      typeDistribution,
      rarityDistribution,
      abilityCount,
      attackerCount,
      supportCount
    };
  }, [currentDeck.cards]);

  // Helper function to check if a card is basic energy
  const isBasicEnergy = (card: PTCGCard): boolean => {    
    return card.CardType.includes('基本能量卡');
  };

  // Get maximum allowed quantity for a card
  const getMaxQuantity = (card: PTCGCard): number => {
    return isBasicEnergy(card) ? 59 : 4; // Unlimited basic energy, 4 for others
  };

  // Add card to deck
  const addCardToDeck = (card: PTCGCard, quantity: number = 1) => {
    setCurrentDeck(prev => {
      const existingCardIndex = prev.cards.findIndex(c => c.CardID === card.CardID);
      const maxQuantity = getMaxQuantity(card);
      let newCards: DeckCard[];

      if (existingCardIndex >= 0) {
        newCards = [...prev.cards];
        const newQuantity = Math.min(newCards[existingCardIndex].quantity + quantity, maxQuantity);
        newCards[existingCardIndex] = { ...newCards[existingCardIndex], quantity: newQuantity };
      } else {
        newCards = [...prev.cards, { ...card, quantity: Math.min(quantity, maxQuantity) }];
      }

      return {
        ...prev,
        cards: newCards,
        updatedAt: new Date()
      };
    });
  };

  // Remove card from deck
  const removeCardFromDeck = (cardId: number, quantity: number = 1) => {
    setCurrentDeck(prev => {
      const newCards = prev.cards.map(card => {
        if (card.CardID === cardId) {
          const newQuantity = Math.max(card.quantity - quantity, 0);
          return { ...card, quantity: newQuantity };
        }
        return card;
      }).filter(card => card.quantity > 0);

      return {
        ...prev,
        cards: newCards,
        updatedAt: new Date()
      };
    });
  };

  // Get card quantity in deck
  const getCardQuantityInDeck = (cardId: number): number => {
    const deckCard = currentDeck.cards.find(c => c.CardID === cardId);
    return deckCard ? deckCard.quantity : 0;
  };

  // Save deck
  const saveDeck = () => {
    // Check if we're on the client side
    if (typeof window === 'undefined') return;

    // Recalculate counts before saving
    const totalCards = currentDeck.cards.reduce((sum, card) => sum + card.quantity, 0);
    const pokemonCards = currentDeck.cards.filter(card => card.CardType.includes('寶可夢') || card.CardType.toLowerCase().includes('pokemon'));
    const trainerCards = currentDeck.cards.filter(card => card.CardType.includes('物品') || card.CardType.includes('支援') || card.CardType.includes('場地'));
    const energyCards = currentDeck.cards.filter(card => card.CardType.includes('能量'));

    const pokemonCount = pokemonCards.reduce((sum, card) => sum + card.quantity, 0);
    const trainerCount = trainerCards.reduce((sum, card) => sum + card.quantity, 0);
    const energyCount = energyCards.reduce((sum, card) => sum + card.quantity, 0);

    const deckToSave = {
      ...currentDeck,
      id: currentDeck.id || `deck_${Date.now()}`,
      updatedAt: new Date(),
      pokemonCount,
      trainerCount,
      energyCount,
      totalCards
    };

    // Save to localStorage
    const savedDecks = JSON.parse(localStorage.getItem('ptcg_decks') || '[]');
    const existingIndex = savedDecks.findIndex((d: Deck) => d.id === deckToSave.id);
    
    if (existingIndex >= 0) {
      savedDecks[existingIndex] = deckToSave;
    } else {
      savedDecks.push(deckToSave);
    }

    localStorage.setItem('ptcg_decks', JSON.stringify(savedDecks));
    alert('Deck saved successfully!');
  };

  // Export deck
  const exportDeck = () => {
    const deckText = generateDeckList();
    const blob = new Blob([deckText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentDeck.name}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Generate deck list text
  const generateDeckList = (): string => {
    let deckList = `${currentDeck.name}\n`;
    deckList += `Format: ${currentDeck.format}\n`;
    deckList += `Total Cards: ${deckValidation.totalCards}\n\n`;

    const pokemonCards = currentDeck.cards.filter(card => card.CardType.includes('寶可夢'));
    const trainerCards = currentDeck.cards.filter(card => card.CardType.includes('物品') || card.CardType.includes('支援') || card.CardType.includes('場地'));
    const energyCards = currentDeck.cards.filter(card => card.CardType.includes('能量'));

    if (pokemonCards.length > 0) {
      deckList += `Pokemon (${pokemonCards.reduce((sum, card) => sum + card.quantity, 0)}):\n`;
      pokemonCards.forEach(card => {
        deckList += `${card.quantity}x ${card.Name} ${card.ExpansionCode || ''}\n`;
      });
      deckList += '\n';
    }

    if (trainerCards.length > 0) {
      deckList += `Trainers (${trainerCards.reduce((sum, card) => sum + card.quantity, 0)}):\n`;
      trainerCards.forEach(card => {
        deckList += `${card.quantity}x ${card.Name} ${card.ExpansionCode || ''}\n`;
      });
      deckList += '\n';
    }

    if (energyCards.length > 0) {
      deckList += `Energy (${energyCards.reduce((sum, card) => sum + card.quantity, 0)}):\n`;
      energyCards.forEach(card => {
        deckList += `${card.quantity}x ${card.Name} ${card.ExpansionCode || ''}\n`;
      });
    }

    return deckList;
  };

  // Import deck from text
  const importDeck = (deckText: string) => {
    console.log('🔍 [DEBUG] Starting deck import...');
    console.log('📝 [DEBUG] Raw input:', deckText);

    try {
      const lines = deckText.split('\n').map(line => line.trim()).filter(line => line);
      console.log('📋 [DEBUG] Processed lines:', lines);

      let deckName = 'Imported Deck';
      let format = 'Standard';
      const importedCards: { name: string; quantity: number }[] = [];

      for (const line of lines) {
        console.log('🔍 [DEBUG] Processing line:', line);

        // Parse deck name (only the first line that looks like a deck name)
        if (!line.includes('x ') && !line.includes(':') && !line.includes('(') && !line.includes(')') &&
            !/^\d/.test(line) && !line.includes('張') && line.length > 2 &&
            !line.toLowerCase().includes('pokemon') && !line.toLowerCase().includes('trainer') &&
            !line.toLowerCase().includes('energy') && deckName === 'Imported Deck') {
          deckName = line;
          console.log('📛 [DEBUG] Found deck name:', deckName);
          continue;
        }

        // Parse format
        if (line.toLowerCase().startsWith('format:')) {
          format = line.split(':')[1].trim();
          console.log('🏷️ [DEBUG] Found format:', format);
          continue;
        }

        // Skip section headers
        if (line.includes('(') && line.includes(')') && (line.toLowerCase().includes('pokemon') || line.toLowerCase().includes('trainer') || line.toLowerCase().includes('energy'))) {
          console.log('⏭️ [DEBUG] Skipping section header:', line);
          continue;
        }

        // Parse card lines (format: "4x Card Name EXP" or "4 Card Name EXP" or "Card Name 3張")
        const cardMatch = line.includes('張') ? line.match(/^(.+?)\s+(\d+)張$/) : line.match(/^(\d+)\s*x?\s*(.+)$/);
        console.log('🎯 [DEBUG] Card match result:', cardMatch);

        if (cardMatch) {
          let quantity: number;
          let cardNameWithExp: string;

          if (line.includes('張')) {
            // Chinese format: "Card Name 3張"
            cardNameWithExp = cardMatch[1].trim();
            quantity = parseInt(cardMatch[2]);
            console.log('🇨🇳 [DEBUG] Chinese format detected - Name:', cardNameWithExp, 'Quantity:', quantity);
          } else {
            // English format: "4x Card Name" or "4 Card Name"
            quantity = parseInt(cardMatch[1]);
            cardNameWithExp = cardMatch[2].trim();
            console.log('🇺🇸 [DEBUG] English format detected - Quantity:', quantity, 'Name:', cardNameWithExp);
          }

          // Remove expansion code if present (usually at the end)
          const cardName = cardNameWithExp.replace(/\s+[A-Z]{2,3}\d*$/, '').trim();
          console.log('✂️ [DEBUG] Cleaned card name:', cardName, '(from:', cardNameWithExp, ')');

          importedCards.push({ name: cardName, quantity });
          console.log('✅ [DEBUG] Added card to import list:', { name: cardName, quantity });
        } else {
          console.log('❌ [DEBUG] Could not parse line as card:', line);
        }
      }

      console.log('📊 [DEBUG] Final parsed cards:', importedCards);
      console.log('📚 [DEBUG] Available cards in database:', initialCards.length);

      // Match cards to database
      const matchedCards: { card: PTCGCard; quantity: number }[] = [];
      const unmatchedCards: string[] = [];

      for (const importedCard of importedCards) {
        // Clean the imported card name by removing 【 and 】 brackets
        const cleanedCardName = importedCard.name.replace(/[【】]/g, '');
        console.log('🔍 [DEBUG] Matching card:', importedCard.name, '(cleaned:', cleanedCardName, ')');

        // Try exact match first with cleaned name
        let matchedCard = initialCards.find(card =>
          card.Name.toLowerCase() === cleanedCardName.toLowerCase()
        );

        if (matchedCard) {
          console.log('🎯 [DEBUG] Exact match found:', matchedCard.Name);
        } else {
          console.log('⚠️ [DEBUG] No exact match, trying partial match...');
        }

        // If no exact match, try partial match with cleaned name
        if (!matchedCard) {
          matchedCard = initialCards.find(card =>
            card.Name.toLowerCase().includes(cleanedCardName.toLowerCase()) ||
            cleanedCardName.toLowerCase().includes(card.Name.toLowerCase())
          );

          if (matchedCard) {
            console.log('🔄 [DEBUG] Partial match found:', matchedCard.Name, '(searched for:', cleanedCardName, ')');
          } else {
            console.log('❌ [DEBUG] No match found for:', cleanedCardName);
          }
        }

        if (matchedCard) {
          matchedCards.push({ card: matchedCard, quantity: importedCard.quantity });
          console.log('✅ [DEBUG] Successfully matched card:', matchedCard.Name, 'x', importedCard.quantity);
        } else {
          const unmatchedEntry = `${importedCard.quantity}x ${importedCard.name}`;
          unmatchedCards.push(unmatchedEntry);
          console.log('🚫 [DEBUG] Added to unmatched list:', unmatchedEntry);
        }
      }

      console.log('📊 [DEBUG] Matching summary - Matched:', matchedCards.length, 'Unmatched:', unmatchedCards.length);

      // Create new deck with imported cards
      const newDeck: Deck = {
        id: `deck_${Date.now()}`,
        name: deckName,
        description: '',
        cards: matchedCards.map(({ card, quantity }) => ({ ...card, quantity })),
        format: format as 'Standard' | 'Expanded' | 'Unlimited',
        createdAt: new Date(),
        updatedAt: new Date(),
        isValid: false,
        pokemonCount: 0,
        trainerCount: 0,
        energyCount: 0,
        totalCards: matchedCards.reduce((sum, { quantity }) => sum + quantity, 0)
      };

      console.log('🎉 [DEBUG] Created new deck:', { name: deckName, format, totalCards: newDeck.totalCards });

      setCurrentDeck(newDeck);
      setShowImportModal(false);

      // Show results
      const message = `Deck imported successfully!\nMatched: ${matchedCards.length} cards\nUnmatched: ${unmatchedCards.length} cards`;
      if (unmatchedCards.length > 0) {
        alert(`${message}\n\nUnmatched cards:\n${unmatchedCards.slice(0, 5).join('\n')}${unmatchedCards.length > 5 ? '\n...' : ''}`);
      } else {
        alert(message);
      }
    } catch (error) {
      console.error('❌ [DEBUG] Deck import failed:', error);
      alert('Failed to import deck. Please check the format and try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full h-full max-w-7xl max-h-[95vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-blue-500 text-white rounded-lg">
              <Sword className="h-6 w-6" />
            </div>
            <div>
              <input
                type="text"
                value={currentDeck.name}
                onChange={(e) => setCurrentDeck(prev => ({ ...prev, name: e.target.value }))}
                className="text-2xl font-bold text-gray-900 bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white px-2 py-1 rounded"
                placeholder="Enter deck name..."
              />
              <p className="text-gray-600">Build and manage your Pokemon TCG decks</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowStats(!showStats)}
              className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              title="Deck Statistics"
            >
              <BarChart3 className="h-5 w-5" />
            </button>
            <button
              onClick={saveDeck}
              className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              title="Save Deck"
            >
              <Save className="h-5 w-5" />
            </button>
            <button
              onClick={exportDeck}
              className="p-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              title="Export Deck"
            >
              <Download className="h-5 w-5" />
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="p-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              title="Import Deck"
            >
              <Upload className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Card Collection Panel */}
          <div className="w-3/5 flex flex-col border-r">
            {/* Search and Filters */}
            <div className="p-4 border-b bg-gray-50">
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search cards..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-2 rounded-lg transition-colors ${showFilters ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  <Filter className="h-5 w-5" />
                </button>
                <select
                  value={viewMode}
                  onChange={(e) => setViewMode(e.target.value as 'grid' | 'list')}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="grid">Grid View</option>
                  <option value="list">List View</option>
                </select>
              </div>

              {/* Quick Filters */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilters(prev => ({ ...prev, cardType: prev.cardType === '寶可夢' ? '' : '寶可夢' }))}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filters.cardType === '寶可夢' 
                      ? 'bg-red-500 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Pokemon
                </button>
                <button
                  onClick={() => setFilters(prev => ({ ...prev, cardType: prev.cardType === '物品' ? '' : '物品' }))}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filters.cardType === '物品' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Trainers
                </button>
                <button
                  onClick={() => setFilters(prev => ({ ...prev, cardType: prev.cardType === '能量' ? '' : '能量' }))}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filters.cardType === '能量' 
                      ? 'bg-yellow-500 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Energy
                </button>
              </div>
            </div>

            {/* Card Grid/List */}
            <div className="flex-1 overflow-y-auto p-4">
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-4 gap-4">
                  {filteredCards.map(card => (
                    <div
                      key={card.CardID}
                      className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      <div className="aspect-[5/7] bg-gray-100 overflow-hidden">
                        {card.ImageURL ? (
                          <img
                            src={card.ImageURL}
                            alt={card.Name}
                            className="w-full h-full object-cover cursor-pointer"
                            onClick={() => setSelectedCard(card)}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <div className="text-center">
                              <div className="text-4xl mb-2">🎴</div>
                              <div className="text-xs">{card.Name}</div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <h3 className="font-medium text-sm text-gray-900 line-clamp-2 mb-2">{card.Name}</h3>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => removeCardFromDeck(card.CardID)}
                              disabled={getCardQuantityInDeck(card.CardID) === 0}
                              className="p-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="px-2 py-1 bg-gray-100 rounded text-sm font-medium min-w-[2rem] text-center">
                              {getCardQuantityInDeck(card.CardID)}
                            </span>
                            <button
                              onClick={() => addCardToDeck(card)}
                              disabled={getCardQuantityInDeck(card.CardID) >= 4}
                              className="p-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          {card.Tier && (
                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                              card.Tier === 'S+' ? 'bg-red-500 text-white' :
                              card.Tier === 'S' ? 'bg-orange-500 text-white' :
                              card.Tier === 'A+' ? 'bg-yellow-500 text-white' :
                              card.Tier === 'A' ? 'bg-green-500 text-white' :
                              'bg-gray-500 text-white'
                            }`}>
                              {card.Tier}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredCards.map(card => (
                    <div
                      key={card.CardID}
                      className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-16 bg-gray-100 rounded overflow-hidden">
                          {card.ImageURL ? (
                            <img
                              src={card.ImageURL}
                              alt={card.Name}
                              className="w-full h-full object-cover cursor-pointer"
                              onClick={() => setSelectedCard(card)}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                              🎴
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{card.Name}</h3>
                          <p className="text-sm text-gray-600">{card.CardType}</p>
                          {card.HP && <p className="text-xs text-gray-500">HP: {card.HP}</p>}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {card.Tier && (
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            card.Tier === 'S+' ? 'bg-red-500 text-white' :
                            card.Tier === 'S' ? 'bg-orange-500 text-white' :
                            card.Tier === 'A+' ? 'bg-yellow-500 text-white' :
                            card.Tier === 'A' ? 'bg-green-500 text-white' :
                            'bg-gray-500 text-white'
                          }`}>
                            {card.Tier}
                          </span>
                        )}
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => removeCardFromDeck(card.CardID)}
                            disabled={getCardQuantityInDeck(card.CardID) === 0}
                            className="p-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="px-3 py-1 bg-gray-100 rounded font-medium min-w-[2.5rem] text-center">
                            {getCardQuantityInDeck(card.CardID)}
                          </span>
                          <button
                            onClick={() => addCardToDeck(card)}
                            disabled={getCardQuantityInDeck(card.CardID) >= 4}
                            className="p-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Deck Panel */}
          <div className="w-2/5 flex flex-col">
            {/* Deck Header */}
            <div className="p-4 border-b bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <input
                  type="text"
                  value={currentDeck.name}
                  onChange={(e) => setCurrentDeck(prev => ({ ...prev, name: e.target.value }))}
                  className="text-lg font-bold bg-transparent border-none outline-none text-gray-900"
                />
                <select
                  value={currentDeck.format}
                  onChange={(e) => setCurrentDeck(prev => ({ ...prev, format: e.target.value as 'Standard' | 'Expanded' | 'Unlimited' }))}
                  className="px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Standard">Standard</option>
                  <option value="Expanded">Expanded</option>
                  <option value="Unlimited">Unlimited</option>
                </select>
              </div>

              {/* Deck Status */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-4 text-sm">
                  <span className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                    <span>Pokemon: {deckValidation.pokemonCount}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span>Trainers: {deckValidation.trainerCount}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                    <span>Energy: {deckValidation.energyCount}</span>
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {deckValidation.isValid ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span className={`font-bold ${deckValidation.isValid ? 'text-green-600' : 'text-red-600'}`}>
                    {deckValidation.totalCards}/60
                  </span>
                </div>
              </div>

              {/* Validation Messages */}
              {(deckValidation.errors.length > 0 || deckValidation.warnings.length > 0) && (
                <div className="space-y-1">
                  {deckValidation.errors.map((error, index) => (
                    <div key={index} className="flex items-center space-x-2 text-red-600 text-xs">
                      <AlertCircle className="h-3 w-3" />
                      <span>{error}</span>
                    </div>
                  ))}
                  {deckValidation.warnings.map((warning, index) => (
                    <div key={index} className="flex items-center space-x-2 text-yellow-600 text-xs">
                      <AlertCircle className="h-3 w-3" />
                      <span>{warning}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Deck List */}
            <div className="flex-1 overflow-y-auto">
              {currentDeck.cards.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <Shuffle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-2">Your deck is empty</p>
                    <p className="text-sm">Add cards from the collection to start building</p>
                  </div>
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  {/* Pokemon Section */}
                  {currentDeck.cards.filter(card => card.CardType.includes('寶可夢') || card.CardType.toLowerCase().includes('pokemon')).length > 0 && (
                    <div>
                      <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                        <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
                        Pokemon ({currentDeck.cards.filter(card => card.CardType.includes('寶可夢') || card.CardType.toLowerCase().includes('pokemon')).reduce((sum, card) => sum + card.quantity, 0)})
                      </h3>
                      <div className="space-y-2">
                        {currentDeck.cards
                          .filter(card => card.CardType.includes('寶可夢') || card.CardType.toLowerCase().includes('pokemon'))
                          .map(card => (
                            <DeckCardItem
                              key={card.CardID}
                              card={card}
                              onAdd={() => addCardToDeck(card)}
                              onRemove={() => removeCardFromDeck(card.CardID)}
                              onView={() => setSelectedCard(card)}
                              maxQuantity={getMaxQuantity(card)}
                            />
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Trainer Section */}
                  {currentDeck.cards.filter(card => card.CardType.includes('物品') || card.CardType.includes('支援') || card.CardType.includes('場地')).length > 0 && (
                    <div>
                      <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                        <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
                        Trainers ({currentDeck.cards.filter(card => card.CardType.includes('物品') || card.CardType.includes('支援') || card.CardType.includes('場地')).reduce((sum, card) => sum + card.quantity, 0)})
                      </h3>
                      <div className="space-y-2">
                        {currentDeck.cards
                          .filter(card => card.CardType.includes('物品') || card.CardType.includes('支援') || card.CardType.includes('場地'))
                          .map(card => (
                            <DeckCardItem
                              key={card.CardID}
                              card={card}
                              onAdd={() => addCardToDeck(card)}
                              onRemove={() => removeCardFromDeck(card.CardID)}
                              onView={() => setSelectedCard(card)}
                              maxQuantity={getMaxQuantity(card)}
                            />
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Energy Section */}
                  {currentDeck.cards.filter(card => card.CardType.includes('能量')).length > 0 && (
                    <div>
                      <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                        <div className="w-4 h-4 bg-yellow-500 rounded mr-2"></div>
                        Energy ({currentDeck.cards.filter(card => card.CardType.includes('能量')).reduce((sum, card) => sum + card.quantity, 0)})
                      </h3>
                      <div className="space-y-2">
                        {currentDeck.cards
                          .filter(card => card.CardType.includes('能量'))
                          .map(card => (
                            <DeckCardItem
                              key={card.CardID}
                              card={card}
                              onAdd={() => addCardToDeck(card)}
                              onRemove={() => removeCardFromDeck(card.CardID)}
                              onView={() => setSelectedCard(card)}
                              maxQuantity={getMaxQuantity(card)}
                            />
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Panel (if shown) */}
        {showStats && (
          <div className="border-t bg-gray-50 p-4">
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div className="bg-white p-3 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Deck Composition</h4>
                <div className="space-y-1">
                  <div>Pokemon: {deckValidation.pokemonCount}</div>
                  <div>Trainers: {deckValidation.trainerCount}</div>
                  <div>Energy: {deckValidation.energyCount}</div>
                </div>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Pokemon Stats</h4>
                <div className="space-y-1">
                  <div>Avg HP: {deckStats.averageHP.toFixed(0)}</div>
                  <div>Avg Retreat: {deckStats.averageRetreatCost.toFixed(1)}</div>
                  <div>Abilities: {deckStats.abilityCount}</div>
                </div>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Energy Types</h4>
                <div className="space-y-1 max-h-16 overflow-y-auto">
                  {Object.entries(deckStats.energyDistribution).slice(0, 3).map(([type, count]) => (
                    <div key={type}>{type}: {count}</div>
                  ))}
                </div>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Rarity Breakdown</h4>
                <div className="space-y-1 max-h-16 overflow-y-auto">
                  {Object.entries(deckStats.rarityDistribution).slice(0, 3).map(([rarity, count]) => (
                    <div key={rarity}>{rarity}: {count}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Import Deck</h2>
              <button
                onClick={() => setShowImportModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paste your deck list below
                </label>
                <textarea
                  id="deckImportText"
                  rows={15}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder={`Example formats supported:

English format:
4x Charizard V SS
3x Radiant Charizard PGO

Chinese format:
炭小侍 3張
紅蓮鎧騎 2張
阿響的鳳王ex 2張

Deck Name
Format: Standard

Pokemon (20):
[List your Pokemon cards here]

Trainers (15):
[List your Trainer cards here]

Energy (25):
[List your Energy cards here]`}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  <p>Supported formats: Standard deck list format with &quot;4x Card Name&quot; syntax</p>
                  <p>Cards will be matched to your database automatically</p>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowImportModal(false)}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const textarea = document.getElementById('deckImportText') as HTMLTextAreaElement;
                      if (textarea && textarea.value.trim()) {
                        importDeck(textarea.value.trim());
                      } else {
                        alert('Please paste a deck list to import.');
                      }
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Import Deck
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Deck Card Item Component
interface DeckCardItemProps {
  card: DeckCard;
  onAdd: () => void;
  onRemove: () => void;
  onView: () => void;
  maxQuantity?: number;
}

function DeckCardItem({ card, onAdd, onRemove, onView, maxQuantity = 4 }: DeckCardItemProps) {
  return (
    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-14 bg-gray-100 rounded overflow-hidden">
          {card.ImageURL ? (
            <img
              src={card.ImageURL}
              alt={card.Name}
              className="w-full h-full object-cover cursor-pointer"
              onClick={onView}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
              🎴
            </div>
          )}
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 text-sm">{card.Name}</h4>
          <div className="flex items-center space-x-2 text-xs text-gray-600">
            {card.ExpansionCode && <span>{card.ExpansionCode}</span>}
            {card.HP && <span>HP: {card.HP}</span>}
            {card.Tier && (
              <span className={`px-1 py-0.5 rounded text-xs font-bold ${
                card.Tier === 'S+' ? 'bg-red-500 text-white' :
                card.Tier === 'S' ? 'bg-orange-500 text-white' :
                card.Tier === 'A+' ? 'bg-yellow-500 text-white' :
                card.Tier === 'A' ? 'bg-green-500 text-white' :
                'bg-gray-500 text-white'
              }`}>
                {card.Tier}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={onRemove}
          className="p-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          <Minus className="h-3 w-3" />
        </button>
        <span className="px-2 py-1 bg-gray-100 rounded text-sm font-medium min-w-[1.5rem] text-center">
          {card.quantity}
        </span>
        <button
          onClick={onAdd}
          disabled={card.quantity >= maxQuantity}
          className="p-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title={maxQuantity > 4 ? `Add (max ${maxQuantity} for basic energy)` : 'Add (max 4)'}
        >
          <Plus className="h-3 w-3" />
        </button>
        <button
          onClick={onView}
          className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          <Eye className="h-3 w-3" />
        </button>
      </div>
    </div>
  );

  // Deck Card Item Component
}