'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { PTCGCard, SearchFilters, AbilityOption, EffectTypeOption } from '../types/card';
import { Deck, DeckCard } from '../types/deck';
import { MarketPrice } from '../types/market';
import { Search, Plus, Minus, Eye, X, Filter, Star, Users, Zap, Shield, Sword, Heart, DollarSign, Target, Package } from 'lucide-react';
import { useI18n } from '../i18n/context';
import SearchFiltersComponent from './SearchFilters';

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
  const [activeTab, setActiveTab] = useState<'library' | 'deck' | 'summary'>('summary');
  const [marketPrices, setMarketPrices] = useState<{ [cardId: string]: any }>({});
  const [loadingPrices, setLoadingPrices] = useState(false);

  // Fetch market prices on component mount
  useEffect(() => {
    const fetchMarketPrices = async () => {
      try {
        setLoadingPrices(true);
        const response = await fetch('/api/market-prices');
        if (response.ok) {
          const data = await response.json();
          
          // Convert array response to object with CardID as keys
          const pricesObject: { [cardId: string]: any } = {};
          data.forEach((item: any) => {
            if (item.CardID) {
              pricesObject[item.CardID.toString()] = item;
            }
          });
          
          console.log('🔍 Market prices loaded:', {
            totalCards: Object.keys(pricesObject).length,
            sampleKeys: Object.keys(pricesObject).slice(0, 5),
            sampleData: pricesObject[Object.keys(pricesObject)[0]]
          });
          
          // Check ID ranges
          const ids = Object.keys(pricesObject).map(Number).sort((a,b) => a-b);
          console.log('📊 ID Ranges:', {
            min: ids[0],
            max: ids[ids.length-1],
            firstTen: ids.slice(0, 10),
            lastTen: ids.slice(-10),
            count: ids.length
          });
          
          // Check for specific problematic IDs
          const problemIds = [14376, 14456, 12107, 12386];
          console.log('🔍 Checking problem IDs:');
          problemIds.forEach(id => {
            const hasData = !!pricesObject[id.toString()];
            console.log(`  ${id}: ${hasData ? '✅' : '❌'}`);
          });
          
          setMarketPrices(pricesObject);
        } else {
          console.error('❌ Failed to fetch market prices:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('Error fetching market prices:', error);
      } finally {
        setLoadingPrices(false);
      }
    };

    fetchMarketPrices();
  }, []);

  // Helper function to get the best price for a card
  const getCardPrice = useCallback((cardId: number): number => {
    const cardIdStr = cardId.toString();
    const cardData = marketPrices[cardIdStr];
    
    // Debug specific card
    if (cardId === 12386) {
      console.log('🔍 Debugging card 12386:', {
        cardIdStr,
        marketPricesKeys: Object.keys(marketPrices).length,
        hasKey: cardIdStr in marketPrices,
        cardData: cardData,
        hasMarketPrices: cardData?.marketPrices ? true : false,
        averagePrice: cardData?.averagePrice
      });
    }
    
    if (!cardData) {
      if (cardId === 12386) console.log('❌ No card data for 12386');
      return 0;
    }

    // Use averagePrice if available (most efficient)
    if (typeof cardData.averagePrice === 'number' && cardData.averagePrice > 0) {
      if (cardId === 12386) console.log('✅ Using averagePrice for 12386:', cardData.averagePrice);
      return cardData.averagePrice;
    }

    // Fallback to marketPrices array
    if (Array.isArray(cardData.marketPrices) && cardData.marketPrices.length > 0) {
      const prices = cardData.marketPrices.filter((p: any) => p && typeof p.price === 'number');
      
      if (cardId === 12386) {
        console.log('🔍 Market prices array for 12386:', prices);
      }
      
      if (prices.length === 0) {
        if (cardId === 12386) console.log('❌ No valid prices after filtering for 12386');
        return 0;
      }

      // Get the most recent price for Near Mint condition first
      const nearMintPrices = prices.filter((p: any) => p.condition === 'Near Mint');
      if (nearMintPrices.length > 0) {
        const price = Math.min(...nearMintPrices.map((p: any) => p.price));
        if (cardId === 12386) console.log('✅ Near Mint price for 12386:', price);
        return price;
      }

      // Fallback to the lowest price available
      const price = Math.min(...prices.map((p: any) => p.price));
      if (cardId === 12386) console.log('✅ Fallback price for 12386:', price);
      return price;
    }

    if (cardId === 12386) console.log('❌ No valid price data structure for 12386');
    return 0;
  }, [marketPrices]);  // Helper function to format image path from CardID
  const getImagePath = (cardId: number) => {
    return `hk${cardId.toString().padStart(8, '0')}.png`;
  };

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

  // Generate abilities and effect types with counts for SearchFiltersComponent
  const abilities: AbilityOption[] = useMemo(() => {
    const countMap = new Map<string, number>();

    initialCards.forEach(card => {
      if (card.CardType.includes('能量')) return; // Exclude energy cards

      const ability = card.AbilityName;
      if (ability && ability.trim() !== '') {
        countMap.set(ability, (countMap.get(ability) || 0) + 1);
      }
    });

    return Array.from(countMap.entries())
      .map(([value, count]) => ({ value, label: value, count }))
      .sort((a, b) => b.count - a.count);
  }, [initialCards]);

  const effectTypes: EffectTypeOption[] = useMemo(() => {
    const countMap = new Map<string, number>();

    initialCards.forEach(card => {
      if (card.CardType.includes('能量')) return; // Exclude energy cards

      const effectType = card.PrimaryEffectType;
      if (effectType && effectType.trim() !== '') {
        countMap.set(effectType, (countMap.get(effectType) || 0) + 1);
      }
    });

    return Array.from(countMap.entries())
      .map(([value, count]) => ({ value, label: value, count }))
      .sort((a, b) => b.count - a.count);
  }, [initialCards]);

  const filteredCards = initialCards.filter(card => {
    const matchesSearch = card.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         card.AbilityName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         card.AbilityEffect?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilters = (!filters.ability || card.AbilityName === filters.ability) &&
                          (!filters.effectType || card.PrimaryEffectType === filters.effectType) &&
                          (!filters.cardType || card.CardType === filters.cardType) &&
                          (!filters.rarity || card.Rarity === filters.rarity) &&
                          (!filters.tier || card.Tier === filters.tier) &&
                          (!filters.attribute || card.Type === filters.attribute) &&
                          (!filters.regulation || card.RegulationMark === filters.regulation) &&
                          (!filters.expansion || card.ExpansionName === filters.expansion || card.ExpansionCode === filters.expansion) &&
                          (!filters.weaknessType || card.WeaknessType === filters.weaknessType) &&
                          (!filters.resistanceType || card.ResistanceType === filters.resistanceType) &&
                          (!filters.noRetreat || card.RetreatCost === 'None' || card.RetreatCost === '' || card.RetreatCost === '0') &&
                          (!filters.noResistance || !card.Resistance || card.Resistance === 'None' || card.Resistance === '') &&
                          (!filters.noWeakness || !card.Weakness || card.Weakness === 'None' || card.Weakness === '') &&
                          (!filters.specialPokemonType || card.SpecialTag === filters.specialPokemonType);

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

  // Deck Summary Calculations
  const getDeckSummary = useMemo(() => {
    // Don't calculate if market prices aren't loaded yet
    if (Object.keys(marketPrices).length === 0) {
      console.log('⏳ Market prices not loaded yet, skipping calculation');
      return {
        totalPrice: 0,
        keyCards: [],
        damageAnalysis: {
          totalDamage: 0,
          averageDamage: 0,
          maxDamage: 0,
          damageCards: []
        },
        turnItems: {
          firstTurn: [],
          secondTurn: []
        }
      };
    }
    
    console.log('📊 Calculating deck summary with', Object.keys(marketPrices).length, 'market prices loaded');
    
    const summary = {
      totalPrice: 0,
      keyCards: [] as SimpleDeckCard[],
      damageAnalysis: {
        totalDamage: 0,
        averageDamage: 0,
        maxDamage: 0,
        damageCards: [] as { card: SimpleDeckCard, damage: number }[]
      },
      turnItems: {
        firstTurn: [] as SimpleDeckCard[],
        secondTurn: [] as SimpleDeckCard[]
      }
    };

    // Calculate total price from market prices
    summary.totalPrice = deck.cards.reduce((total, card) => {
      const cardPrice = getCardPrice(card.CardID);
      return total + (cardPrice * card.quantity);
    }, 0);

    // Key cards (S/A tier Pokemon and important trainers)
    summary.keyCards = deck.cards.filter(card =>
      (card.CardType === 'Pokémon' && (card.Tier === 'S' || card.Tier === 'A')) ||
      (card.CardType === 'Trainer' && (card.AbilityName?.includes('Search') || card.AbilityName?.includes('Draw')))
    ).sort((a, b) => {
      const tierOrder = { 'S': 0, 'A': 1, 'B': 2, 'C': 3, 'D': 4 };
      const aTier = tierOrder[a.Tier as keyof typeof tierOrder] ?? 5;
      const bTier = tierOrder[b.Tier as keyof typeof tierOrder] ?? 5;
      return aTier - bTier;
    });

    // Damage analysis
    const damageData: { card: SimpleDeckCard, damage: number }[] = [];
    deck.cards.forEach(card => {
      if (card.CardType === 'Pokémon') {
        let maxDamage = 0;
        if (card.Skill1Damage && card.Skill1Damage !== '') {
          const damage1 = parseInt(card.Skill1Damage.replace(/\D/g, '')) || 0;
          maxDamage = Math.max(maxDamage, damage1);
        }
        if (card.Skill2Damage && card.Skill2Damage !== '') {
          const damage2 = parseInt(card.Skill2Damage.replace(/\D/g, '')) || 0;
          maxDamage = Math.max(maxDamage, damage2);
        }
        if (maxDamage > 0) {
          damageData.push({ card, damage: maxDamage });
          summary.damageAnalysis.totalDamage += maxDamage * card.quantity;
        }
      }
    });

    summary.damageAnalysis.damageCards = damageData.sort((a, b) => b.damage - a.damage);
    summary.damageAnalysis.maxDamage = Math.max(...damageData.map(d => d.damage), 0);
    summary.damageAnalysis.averageDamage = damageData.length > 0 ?
      summary.damageAnalysis.totalDamage / deck.cards.reduce((sum, card) => sum + card.quantity, 0) : 0;

    // Turn-based items categorization
    deck.cards.forEach(card => {
      if (card.CardType === 'Trainer' || card.CardType === 'Energy') {
        // First turn items (searchers, basic energy, etc.)
        if (card.AbilityName?.includes('Search') ||
            card.AbilityName?.includes('Draw') ||
            card.CardType === 'Energy' ||
            card.Name.includes('Nest Ball') ||
            card.Name.includes('Quick Ball')) {
          summary.turnItems.firstTurn.push(card);
        }
        // Second turn items (supporters, stadiums, etc.)
        else if (card.AbilityName?.includes('Supporter') ||
                 card.Name.includes('Professor') ||
                 card.Name.includes('Boss') ||
                 card.Name.includes('Stadium')) {
          summary.turnItems.secondTurn.push(card);
        }
      }
    });

    return summary;
  }, [deck.cards, getCardPrice, marketPrices]);

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

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('library')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'library'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.cardLibrary}
            </button>
            <button
              onClick={() => setActiveTab('deck')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'deck'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.currentDeck}
            </button>
            <button
              onClick={() => setActiveTab('summary')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'summary'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              牌組摘要
            </button>
          </div>
        </div>

        {activeTab === 'summary' ? (
          /* Deck Summary View */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Price Summary */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <DollarSign className="w-5 h-5 text-green-500 mr-2" />
                <h3 className="text-lg font-semibold">牌組總價</h3>
              </div>
              {loadingPrices ? (
                <div className="text-gray-500 text-sm mb-2">載入市場價格中...</div>
              ) : deck.cards.length === 0 ? (
                <div className="text-gray-500 text-sm mb-2">請先添加卡牌到牌組</div>
              ) : (
                <div>
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    HK$ {getDeckSummary.totalPrice.toLocaleString()}
                  </div>
                  {getDeckSummary.totalPrice === 0 ? (
                    <div className="text-sm text-amber-600">
                      ⚠️ 當前牌組中的卡牌沒有可用的市場價格數據
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600">
                      基於可用的市場價格數據計算
                    </div>
                  )}
                </div>
              )}
              <p className="text-sm text-gray-600 flex items-center gap-2">
                基於市場價格計算
                {loadingPrices ? (
                  <span className="text-xs text-blue-500">載入中...</span>
                ) : Object.keys(marketPrices).length > 0 ? (
                  <span className="text-xs text-green-500">✓ 價格已載入</span>
                ) : (
                  <span className="text-xs text-red-500">價格載入失敗</span>
                )}
              </p>
              {deck.cards.length === 0 && (
                <div className="mt-2 text-sm text-gray-500">
                  從「瀏覽」頁面新增卡牌以查看價格分析
                  <button
                    onClick={() => {
                      // Add a test card with known ID from market prices
                      const testCardId = 14376; // One of the card IDs that should have price data
                      const testCard = {
                        CardID: testCardId,
                        Name: "測試卡片 (氣球)",
                        CardType: "Trainer",
                        quantity: 1,
                        AbilityName: "", AbilityEffect: "", Rarity: "U", Evolution: "", EvolutionStage: "",
                        ImageURL: "", HP: "", Type: "", Weakness: "", WeaknessType: "", Resistance: "",
                        ResistanceType: "", Skill1Name: "", Skill1Energy: "", Skill1Damage: "", Skill1Effect: "",
                        Skill2Name: "", Skill2Energy: "", Skill2Damage: "", Skill2Effect: "", RetreatCost: "",
                        Illustrator: "", ExpansionCode: "", ExpansionName: "", CollectorNumber: "", RegulationMark: "",
                        Artist: "", SpecialTag: "", PrimaryEffectType: "", SpecialEffectType: "", AbilityStats: "", Tier: ""
                      };
                      setDeck(prev => ({ ...prev, cards: [testCard] }));
                      
                      // Also test a few other IDs to see which ones have data
                      console.log('🔍 Testing price availability:');
                      [14376, 14456, 12107, 12386, 8293, 8294].forEach(id => {
                        const hasPrice = marketPrices[id.toString()];
                        console.log(`Card ${id}: ${hasPrice ? '✅ Has price data' : '❌ No price data'}`);
                      });
                    }}
                    className="ml-2 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                  >
                    🧪 測試價格
                  </button>
                </div>
              )}
            </div>

            {/* Key Cards */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <Star className="w-5 h-5 text-yellow-500 mr-2" />
                <h3 className="text-lg font-semibold">關鍵卡牌</h3>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {getDeckSummary.keyCards.length === 0 ? (
                  <p className="text-gray-500 text-sm">無關鍵卡牌</p>
                ) : (
                  getDeckSummary.keyCards.map(card => (
                    <div key={card.CardID} className="flex items-center justify-between bg-gray-50 rounded p-2">
                      <div className="flex items-center">
                        {card.Tier && getTierIcon(card.Tier)}
                        <span className="ml-2 text-sm font-medium">{card.Name}</span>
                      </div>
                      <span className="text-sm text-gray-600">x{card.quantity}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Damage Analysis */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <Target className="w-5 h-5 text-red-500 mr-2" />
                <h3 className="text-lg font-semibold">傷害分析</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">平均傷害</p>
                  <p className="text-2xl font-bold text-red-600">{Math.round(getDeckSummary.damageAnalysis.averageDamage)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">最高傷害</p>
                  <p className="text-2xl font-bold text-red-600">{getDeckSummary.damageAnalysis.maxDamage}</p>
                </div>
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                <p className="text-sm font-medium">高傷害卡牌:</p>
                {getDeckSummary.damageAnalysis.damageCards.slice(0, 5).map(({ card, damage }) => (
                  <div key={card.CardID} className="flex justify-between text-sm">
                    <span>{card.Name}</span>
                    <span className="font-medium text-red-600">{damage}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Turn-based Items */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <Package className="w-5 h-5 text-blue-500 mr-2" />
                <h3 className="text-lg font-semibold">回合道具</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-green-600 mb-2">先攻道具</h4>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {getDeckSummary.turnItems.firstTurn.length === 0 ? (
                      <p className="text-xs text-gray-500">無</p>
                    ) : (
                      getDeckSummary.turnItems.firstTurn.map(card => (
                        <div key={card.CardID} className="text-xs">
                          {card.Name} x{card.quantity}
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-blue-600 mb-2">後攻道具</h4>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {getDeckSummary.turnItems.secondTurn.length === 0 ? (
                      <p className="text-xs text-gray-500">無</p>
                    ) : (
                      getDeckSummary.turnItems.secondTurn.map(card => (
                        <div key={card.CardID} className="text-xs">
                          {card.Name} x{card.quantity}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'deck' ? (
          /* Deck Panel - Mobile Optimized */
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">{t.currentDeck}</h2>

            <div className="mb-4">
              <input
                type="text"
                placeholder={t.deckName}
                value={deck.name}
                onChange={(e) => setDeck(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 font-medium">
                {t.cards}: {deck.cards.reduce((sum, card) => sum + card.quantity, 0)} / 60
              </p>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto mb-4">
              {deck.cards.length === 0 ? (
                <p className="text-gray-500 text-center py-8 text-sm">{t.noCards}</p>
              ) : (
                deck.cards.map(card => (
                  <div key={card.CardID} className="flex items-center justify-between bg-gray-50 rounded p-2">
                    <div className="flex-1 min-w-0 mr-2">
                      <p className="text-sm font-medium truncate" title={card.Name}>{card.Name}</p>
                      <p className="text-xs text-gray-600 truncate" title={card.CardType}>{card.CardType}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => removeCardFromDeck(card.CardID)}
                        className="p-1 bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-medium min-w-[20px] text-center">
                        {card.quantity}
                      </span>
                      <button
                        onClick={() => addCardToDeck(card)}
                        disabled={card.quantity >= 4}
                        className="p-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
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
              className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
            >
              {t.saveDeck}
            </button>
          </div>
        ) : (
          /* Card Library View */
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">{t.cardLibrary}</h2>

            {/* Search and Filters */}
            <div className="mb-6 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder={t.searchPlaceholder}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  })}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  {t.clear}
                </button>
              </div>

              {/* Comprehensive Filters */}
              <SearchFiltersComponent
                filters={filters}
                onFiltersChange={setFilters}
                cards={initialCards}
                abilities={abilities}
                effectTypes={effectTypes}
              />
            </div>

            {/* Card Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
              {filteredCards.map(card => (
                <div key={card.CardID} className="bg-gray-50 rounded-lg p-3 hover:shadow-md transition-shadow">
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
                  <h3 className="font-medium text-sm mb-1 truncate" title={card.Name}>{card.Name}</h3>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-600 truncate flex-1 mr-1" title={card.CardType}>{card.CardType}</span>
                    {card.Tier && getTierIcon(card.Tier)}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => addCardToDeck(card)}
                      disabled={getCardCount(card.CardID) >= 4}
                      className="flex-1 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      {t.add}
                    </button>
                    <button
                      onClick={() => setSelectedCard(card)}
                      className="px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                    >
                      <Eye className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Card Detail Modal */}
        {selectedCard && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-40">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-2xl font-bold pr-4">{selectedCard.Name}</h2>
                  <button
                    onClick={() => setSelectedCard(null)}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Card Image and Basic Info */}
                  <div>
                    <div className="aspect-[3/4] bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                      <img
                        src={`/cards/${getImagePath(selectedCard.CardID)}`}
                        alt={selectedCard.Name}
                        className="w-full h-full object-cover rounded-lg"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>

                    <div className="space-y-2 text-sm">
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
