'use client';

import React, { useState, useEffect } from 'react';
import { PTCGCard } from '../types/card';
import { Deck, DeckCard } from '../types/deck';
import { Search, Plus, Minus, Eye, X, Filter, Star, Users, Zap, Shield, Sword, Heart } from 'lucide-react';
import { useI18n } from '../i18n/context';

interface SimpleDeckCard extends PTCGCard {
  quantity: number;
}

interface SimpleDeck {
  name: string;
  cards: SimpleDeckCard[];
}

interface DeckBuilderProps {
  initialCards: PTCGCard[];
  onClose?: () => void;
  initialDeck?: SimpleDeck;
}

const DeckBuilder: React.FC<DeckBuilderProps> = ({ initialCards, onClose, initialDeck }) => {
  const { t } = useI18n();
  
  const [deck, setDeck] = useState<SimpleDeck>(initialDeck || { name: '', cards: [] });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCard, setSelectedCard] = useState<PTCGCard | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Helper function to format image path from CardID
  const getImagePath = (cardId: number) => {
    return `hk${cardId.toString().padStart(8, '0')}.png`;
  };
  const [filters, setFilters] = useState({
    ability: '',
    effectType: '',
    cardType: '',
    rarity: '',
    tier: '',
    attribute: ''
  });

  const filteredCards = initialCards.filter(card => {
    const matchesSearch = card.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         card.AbilityName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         card.AbilityEffect?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilters = (!filters.ability || card.AbilityName === filters.ability) &&
                          (!filters.effectType || card.PrimaryEffectType === filters.effectType) &&
                          (!filters.cardType || card.CardType === filters.cardType) &&
                          (!filters.rarity || card.Rarity === filters.rarity) &&
                          (!filters.tier || card.Tier === filters.tier) &&
                          (!filters.attribute || card.Type === filters.attribute);

    return matchesSearch && matchesFilters;
  });

  const addCardToDeck = (card: PTCGCard) => {
    const existingCard = deck.cards.find(c => c.CardID === card.CardID);
    if (existingCard) {
      if (existingCard.quantity < 4) {
        setDeck(prev => ({
          ...prev,
          cards: prev.cards.map(c =>
            c.CardID === card.CardID ? { ...c, quantity: c.quantity + 1 } : c
          )
        }));
      }
    } else {
      setDeck(prev => ({
        ...prev,
        cards: [...prev.cards, { ...card, quantity: 1 }]
      }));
    }
  };

  const removeCardFromDeck = (cardId: number) => {
    setDeck(prev => ({
      ...prev,
      cards: prev.cards
        .map(c => c.CardID === cardId ? { ...c, quantity: c.quantity - 1 } : c)
        .filter(c => c.quantity > 0)
    }));
  };

  const getCardCount = (cardId: number) => {
    const card = deck.cards.find(c => c.CardID === cardId);
    return card ? card.quantity : 0;
  };

  const getRelatedCards = (card: PTCGCard) => {
    return initialCards.filter(c =>
      c.CardID !== card.CardID &&
      (c.AbilityName === card.AbilityName ||
       c.PrimaryEffectType === card.PrimaryEffectType ||
       c.Type === card.Type)
    ).slice(0, 6);
  };

  const getOtherVersions = (card: PTCGCard) => {
    return initialCards.filter(c =>
      c.CardID !== card.CardID &&
      c.Name === card.Name &&
      c.CardType === card.CardType
    );
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'S': return <Star className="w-4 h-4 text-yellow-500" />;
      case 'A': return <Zap className="w-4 h-4 text-green-500" />;
      case 'B': return <Shield className="w-4 h-4 text-blue-500" />;
      case 'C': return <Sword className="w-4 h-4 text-gray-500" />;
      case 'D': return <Heart className="w-4 h-4 text-red-500" />;
      default: return null;
    }
  };

  const saveDeck = async () => {
    if (!deck.name.trim()) {
      alert(t.enterDeckName);
      return;
    }

    try {
      const response = await fetch('/api/decks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deck)
      });

      if (response.ok) {
        alert(t.saveSuccess);
      } else {
        alert(t.saveFail);
      }
    } catch (error) {
      console.error('Error saving deck:', error);
      alert(t.saveError);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile-friendly header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center py-3 sm:py-4">
            <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-800">{t.deckBuilder}</h1>
            <div className="flex items-center gap-2">
              <div className="text-xs sm:text-sm text-gray-600 hidden sm:block">
                {deck.cards.reduce((sum, card) => sum + card.quantity, 0)}/60
              </div>
              {onClose && (
                <button
                  onClick={onClose}
                  className="px-3 sm:px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm min-h-[36px]"
                >
                  <span className="hidden sm:inline">{t.close}</span>
                  <X className="w-4 h-4 sm:hidden" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Card Library */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-3 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">{t.cardLibrary}</h2>

              {/* Search and Filters */}
              <div className="mb-4 sm:mb-6 space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder={t.searchPlaceholder}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => setFilters({
                      ability: '',
                      effectType: '',
                      cardType: '',
                      rarity: '',
                      tier: '',
                      attribute: ''
                    })}
                    className="px-4 py-3 sm:py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm min-h-[44px] sm:min-h-auto"
                  >
                    <Filter className="w-4 h-4 mx-auto sm:mx-0" />
                    <span className="ml-2 hidden sm:inline">{t.clear}</span>
                  </button>
                </div>

                {/* Filter Dropdowns - Mobile Optimized */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
                  <select
                    value={filters.ability}
                    onChange={(e) => setFilters(prev => ({ ...prev, ability: e.target.value }))}
                    className="px-3 py-3 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px] sm:min-h-auto"
                  >
                    <option value="">All Abilities</option>
                    {Array.from(new Set(initialCards.map(c => c.AbilityName).filter(Boolean))).map(ability => (
                      <option key={ability} value={ability}>{ability}</option>
                    ))}
                  </select>

                  <select
                    value={filters.effectType}
                    onChange={(e) => setFilters(prev => ({ ...prev, effectType: e.target.value }))}
                    className="px-3 py-3 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px] sm:min-h-auto"
                  >
                    <option value="">All Effect Types</option>
                    {Array.from(new Set(initialCards.map(c => c.PrimaryEffectType).filter(Boolean))).map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>

                  <select
                    value={filters.cardType}
                    onChange={(e) => setFilters(prev => ({ ...prev, cardType: e.target.value }))}
                    className="px-3 py-3 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px] sm:min-h-auto"
                  >
                    <option value="">All Card Types</option>
                    {Array.from(new Set(initialCards.map(c => c.CardType).filter(Boolean))).map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>

                  <select
                    value={filters.rarity}
                    onChange={(e) => setFilters(prev => ({ ...prev, rarity: e.target.value }))}
                    className="px-3 py-3 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px] sm:min-h-auto"
                  >
                    <option value="">All Rarities</option>
                    {Array.from(new Set(initialCards.map(c => c.Rarity).filter(Boolean))).map(rarity => (
                      <option key={rarity} value={rarity}>{rarity}</option>
                    ))}
                  </select>

                  <select
                    value={filters.tier}
                    onChange={(e) => setFilters(prev => ({ ...prev, tier: e.target.value }))}
                    className="px-3 py-3 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px] sm:min-h-auto"
                  >
                    <option value="">All Tiers</option>
                    {['S', 'A', 'B', 'C', 'D'].map(tier => (
                      <option key={tier} value={tier}>{tier}</option>
                    ))}
                  </select>

                  <select
                    value={filters.attribute}
                    onChange={(e) => setFilters(prev => ({ ...prev, attribute: e.target.value }))}
                    className="px-3 py-3 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px] sm:min-h-auto"
                  >
                    <option value="">All Attributes</option>
                    {Array.from(new Set(initialCards.map(c => c.Type).filter(Boolean))).map(attr => (
                      <option key={attr} value={attr}>{attr}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Card Grid - Mobile Optimized */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 max-h-96 overflow-y-auto">
                {filteredCards.map(card => (
                  <div key={card.CardID} className="bg-gray-50 rounded-lg p-2 sm:p-3 hover:shadow-md transition-shadow">
                    <div className="aspect-[3/4] bg-gray-200 rounded mb-2 flex items-center justify-center">
                      <img
                        src={`/cards/${getImagePath(card.CardID)}`}
                        alt={card.Name}
                        className="w-full h-full object-cover rounded"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                    <h3 className="font-medium text-xs sm:text-sm mb-1 truncate" title={card.Name}>{card.Name}</h3>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-600 truncate flex-1 mr-1" title={card.CardType}>{card.CardType}</span>
                      {card.Tier && getTierIcon(card.Tier)}
                    </div>
                    <div className="flex gap-1 sm:gap-2">
                      <button
                        onClick={() => addCardToDeck(card)}
                        disabled={getCardCount(card.CardID) >= 4}
                        className="flex-1 px-2 py-2 sm:py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed min-h-[36px] sm:min-h-auto flex items-center justify-center"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        <span className="hidden sm:inline">{t.add}</span>
                      </button>
                      <button
                        onClick={() => setSelectedCard(card)}
                        className="px-2 py-2 sm:py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 min-h-[36px] sm:min-h-auto flex items-center justify-center"
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Deck Panel - Mobile Optimized */}
          <div className="lg:col-span-1 order-first lg:order-last">
            <div className="bg-white rounded-lg shadow-md p-3 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">{t.currentDeck}</h2>

              <div className="mb-3 sm:mb-4">
                <input
                  type="text"
                  placeholder={t.deckName}
                  value={deck.name}
                  onChange={(e) => setDeck(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-3 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px] sm:min-h-auto"
                />
              </div>

              <div className="mb-3 sm:mb-4">
                <p className="text-sm text-gray-600 font-medium">
                  {t.cards}: {deck.cards.reduce((sum, card) => sum + card.quantity, 0)} / 60
                </p>
              </div>

              <div className="space-y-2 max-h-64 sm:max-h-80 overflow-y-auto mb-4">
                {deck.cards.length === 0 ? (
                  <p className="text-gray-500 text-center py-8 text-sm">{t.noCards}</p>
                ) : (
                  deck.cards.map(card => (
                    <div key={card.CardID} className="flex items-center justify-between bg-gray-50 rounded p-2">
                      <div className="flex-1 min-w-0 mr-2">
                        <p className="text-xs sm:text-sm font-medium truncate" title={card.Name}>{card.Name}</p>
                        <p className="text-xs text-gray-600 truncate" title={card.CardType}>{card.CardType}</p>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                        <button
                          onClick={() => removeCardFromDeck(card.CardID)}
                          className="p-1 sm:p-1 bg-red-500 text-white rounded hover:bg-red-600 min-w-[32px] min-h-[32px] sm:min-w-auto sm:min-h-auto flex items-center justify-center"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-medium min-w-[20px] text-center">
                          {card.quantity}
                        </span>
                        <button
                          onClick={() => addCardToDeck(card)}
                          disabled={card.quantity >= 4}
                          className="p-1 sm:p-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed min-w-[32px] min-h-[32px] sm:min-w-auto sm:min-h-auto flex items-center justify-center"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <button
                onClick={saveDeck}
                className="w-full px-4 py-3 sm:py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium min-h-[44px] sm:min-h-auto"
              >
                {t.saveDeck}
              </button>
            </div>
          </div>
        </div>

        {/* Card Detail Modal - Mobile Optimized */}
        {selectedCard && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-40">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto z-50">
              <div className="p-3 sm:p-6">
                <div className="flex justify-between items-start mb-4 sm:mb-6">
                  <h2 className="text-lg sm:text-2xl font-bold pr-4 flex-1">{selectedCard.Name}</h2>
                  <button
                    onClick={() => setSelectedCard(null)}
                    className="p-2 hover:bg-gray-100 rounded-full flex-shrink-0 min-w-[40px] min-h-[40px] flex items-center justify-center"
                  >
                    <X className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {/* Card Image and Basic Info */}
                  <div>
                    <div className="aspect-[3/4] bg-gray-200 rounded-lg mb-4 flex items-center justify-center max-w-sm mx-auto lg:max-w-none lg:mx-0">
                      <img
                        src={`/cards/${getImagePath(selectedCard.CardID)}`}
                        alt={selectedCard.Name}
                        className="w-full h-full object-cover rounded-lg"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>

                    <div className="space-y-2 text-sm sm:text-base">
                      <p><strong>Type:</strong> {selectedCard.CardType}</p>
                      <p><strong>Rarity:</strong> {selectedCard.Rarity}</p>
                      <p><strong>Tier:</strong> {selectedCard.Tier} {getTierIcon(selectedCard.Tier || '')}</p>
                      <p><strong>Attribute:</strong> {selectedCard.Type}</p>
                      {selectedCard.AbilityName && <p><strong>Ability:</strong> {selectedCard.AbilityName}</p>}
                      {selectedCard.PrimaryEffectType && <p><strong>Effect Type:</strong> {selectedCard.PrimaryEffectType}</p>}
                    </div>
                  </div>

                  {/* Card Details */}
                  <div>
                    {selectedCard.AbilityEffect && (
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold mb-2">Effect</h3>
                        <p className="text-gray-700">{selectedCard.AbilityEffect}</p>
                      </div>
                    )}

                    {/* Other Versions */}
                    {getOtherVersions(selectedCard).length > 0 && (
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold mb-2">Other Versions</h3>
                        <div className="grid grid-cols-2 gap-2">
                          {getOtherVersions(selectedCard).map(version => (
                            <div
                              key={version.CardID}
                              onClick={() => setSelectedCard(version)}
                              className="bg-gray-50 rounded p-2 hover:bg-gray-100 cursor-pointer"
                            >
                              <div className="aspect-[3/4] bg-gray-200 rounded mb-1 flex items-center justify-center">
                                <img
                                  src={`/cards/${getImagePath(version.CardID)}`}
                                  alt={version.Name}
                                  className="w-full h-full object-cover rounded"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              </div>
                              <p className="text-xs text-center">{version.Rarity}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Related Cards */}
                    {getRelatedCards(selectedCard).length > 0 && (
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold mb-2">Related Cards</h3>
                        <div className="grid grid-cols-2 gap-2">
                          {getRelatedCards(selectedCard).map(related => (
                            <div
                              key={related.CardID}
                              onClick={() => setSelectedCard(related)}
                              className="bg-gray-50 rounded p-2 hover:bg-gray-100 cursor-pointer"
                            >
                              <div className="aspect-[3/4] bg-gray-200 rounded mb-1 flex items-center justify-center">
                                <img
                                  src={`/cards/${getImagePath(related.CardID)}`}
                                  alt={related.Name}
                                  className="w-full h-full object-cover rounded"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              </div>
                              <p className="text-xs text-center truncate">{related.Name}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Add to Deck Button */}
                <div className="mt-6 flex justify-end gap-4">
                  <button
                    onClick={() => addCardToDeck(selectedCard)}
                    disabled={getCardCount(selectedCard.CardID) >= 4}

                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Add to Deck ({getCardCount(selectedCard.CardID)}/4)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeckBuilder;
