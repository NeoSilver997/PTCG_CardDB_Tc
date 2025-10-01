'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Search, Plus, TrendingUp, TrendingDown, Minus, Clock, X, BarChart3, PieChart, Activity, DollarSign, Users, Package, Star, Award, Sword, Gamepad2 } from 'lucide-react';
import { PTCGCard } from '../../types/card';
import { MarketPrice, MarketCard } from '../../types/market';
import { getDefaultCurrencyForCard, getCurrencySymbol } from '../../utils/currency';

interface NewPriceForm {
  cardId: number;
  price: number;
  currency: string;
  condition: string;
  source?: string;
}

export default function MarketPage() {
  const [cards, setCards] = useState<PTCGCard[]>([]);
  const [marketPrices, setMarketPrices] = useState<MarketPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'price-high' | 'price-low' | 'change'>('name');
  const [selectedCard, setSelectedCard] = useState<MarketCard | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPrice, setNewPrice] = useState<NewPriceForm>({
    cardId: 0,
    price: 0,
    currency: 'HKD',
    condition: 'Near Mint',
    source: ''
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          loadCards(),
          fetchMarketPrices()
        ]);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const loadCards = async () => {
    try {
      const response = await fetch('/api/cards?detail=true');
      if (response.ok) {
        const data = await response.json();
        console.log('Debug: cards loaded:', data.length);
        console.log('Sample card:', data[0]);
        setCards(data);
      }
    } catch (error) {
      console.error('Error loading cards:', error);
    }
  };

  const fetchMarketPrices = async () => {
    try {
      // Fetch raw market prices data to show ALL entries from market-prices.json
      const response = await fetch('/api/market-prices?format=raw');
      if (response.ok) {
        const rawData = await response.json();
        console.log('Debug: raw market data:', Object.keys(rawData).length, 'cards with prices');
        // Convert raw data to flat array of market prices
        const allPrices: MarketPrice[] = [];
        Object.entries(rawData).forEach(([cardId, prices]) => {
          if (Array.isArray(prices)) {
            allPrices.push(...prices);
          }
        });
        console.log('Debug: marketPrices loaded:', allPrices.length);
        console.log('Sample market price:', allPrices[0]);
        setMarketPrices(allPrices);
        console.log('Loaded', allPrices.length, 'market price entries from market-prices.json');
      }
    } catch (error) {
      console.error('Error fetching market prices:', error);
    }
  };

  const handleAddPrice = async () => {
    if (!newPrice.cardId || !newPrice.price || !newPrice.currency || !newPrice.condition) {
      return;
    }

    try {
      const response = await fetch('/api/market-prices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPrice),
      });

      if (response.ok) {
        fetchMarketPrices();
        setNewPrice({
          cardId: 0,
          price: 0,
          currency: 'HKD',
          condition: 'Near Mint',
          source: ''
        });
        setShowAddForm(false);
      } else {
        console.error('Failed to add price');
      }
    } catch (error) {
      console.error('Error adding price:', error);
    }
  };

  const filteredMarketCards = useMemo(() => {
    // Debug logging
    console.log('Debug: cards loaded:', cards.length);
    console.log('Debug: marketPrices loaded:', marketPrices.length);
    if (marketPrices.length > 0) {
      console.log('Debug: first market price:', marketPrices[0]);
    }

    // Group market prices by cardId
    const pricesByCardId = new Map<number, MarketPrice[]>();
    marketPrices.forEach(price => {
      const cardId = price.cardId;
      if (!pricesByCardId.has(cardId)) {
        pricesByCardId.set(cardId, []);
      }
      pricesByCardId.get(cardId)!.push(price);
    });

    console.log('Debug: unique cards with prices:', pricesByCardId.size);

    // Create MarketCard entries for all cards with prices (even if card data is missing)
    const marketCards: MarketCard[] = [];
    
    pricesByCardId.forEach((cardPrices, cardId) => {
      // Try to find card data
      const cardData = cards.find(card => card.CardID === cardId);
      
      // Sort prices by date (newest first)
      const sortedPrices = cardPrices.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      // Calculate average price from recent prices (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentPrices = sortedPrices.filter(price => 
        new Date(price.date) >= thirtyDaysAgo
      );
      
      const avgPrice = recentPrices.length > 0
        ? recentPrices.reduce((sum, price) => sum + price.price, 0) / recentPrices.length
        : sortedPrices[0]?.price || 0;

      // Calculate price change
      let priceChange: { amount: number; percentage: number; direction: 'up' | 'down' | 'stable' } | undefined = undefined;
      if (sortedPrices.length >= 2) {
        const currentPrice = sortedPrices[0].price;
        const previousPrice = sortedPrices[1].price;
        const change = currentPrice - previousPrice;
        const percentage = previousPrice > 0 ? (change / previousPrice) * 100 : 0;
        
        priceChange = {
          amount: change,
          percentage,
          direction: (change > 0 ? 'up' : change < 0 ? 'down' : 'stable') as 'up' | 'down' | 'stable'
        };
      }

      // Use metadata from market price if card data is missing
      const cardName = cardData?.Name || sortedPrices[0]?.metadata?.cardName || `Card #${cardId}`;
      const expansionName = cardData?.ExpansionName || sortedPrices[0]?.metadata?.expansionCode || 'Unknown';
      const cardType = cardData?.CardType || 'Unknown';

      // Create MarketCard entry
      const marketCard: MarketCard = {
        CardID: cardId,
        Name: cardName,
        EvolutionStage: cardData?.EvolutionStage || '',
        ImageURL: cardData?.ImageURL || `/cards/hk${cardId.toString().padStart(8, '0')}.png`,
        CardType: cardType,
        HP: cardData?.HP || '',
        Type: cardData?.Type || '',
        Attribute: cardData?.Attribute || cardData?.Type || '',
        AbilityName: cardData?.AbilityName || '',
        AbilityEffect: cardData?.AbilityEffect || '',
        Skill1Name: cardData?.Skill1Name || '',
        Skill1Energy: cardData?.Skill1Energy || '',
        Skill1Damage: cardData?.Skill1Damage || '',
        Skill1Effect: cardData?.Skill1Effect || '',
        Skill2Name: cardData?.Skill2Name || '',
        Skill2Energy: cardData?.Skill2Energy || '',
        Skill2Damage: cardData?.Skill2Damage || '',
        Skill2Effect: cardData?.Skill2Effect || '',
        Weakness: cardData?.Weakness || '',
        WeaknessType: cardData?.WeaknessType || '',
        Resistance: cardData?.Resistance || '',
        ResistanceType: cardData?.ResistanceType || '',
        RetreatCost: cardData?.RetreatCost || '',
        CollectorNumber: cardData?.CollectorNumber || '',
        Rarity: cardData?.Rarity || '',
        RegulationMark: cardData?.RegulationMark || '',
        ExpansionName: expansionName,
        ExpansionCode: cardData?.ExpansionCode || '',
        Illustrator: cardData?.Illustrator || '',
        Artist: cardData?.Artist || '',
        SpecialTag: cardData?.SpecialTag || '',
        Evolution: cardData?.Evolution || '',
        PrimaryEffectType: cardData?.PrimaryEffectType || '',
        SpecialEffectType: cardData?.SpecialEffectType || '',
        AbilityStats: cardData?.AbilityStats || '',
        Tier: cardData?.Tier || '',
        Score: cardData?.Score || '',
        ScoreBreakdown: cardData?.ScoreBreakdown || '',
        OriginalImageURL: cardData?.OriginalImageURL || '',
        marketPrices: sortedPrices,
        averagePrice: avgPrice,
        priceChange,
        priceUpdated: sortedPrices[0]?.updatedAt
      };

      marketCards.push(marketCard);
    });

    console.log('Debug: total market cards created:', marketCards.length);

    // Filter by search term
    const filteredCards = marketCards.filter(card =>
      card.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.ExpansionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.CardType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.CardID.toString().includes(searchTerm)
    );

    // Sort the results
    return filteredCards.sort((a, b) => {
      switch (sortBy) {
        case 'price-high':
          return (b.averagePrice || 0) - (a.averagePrice || 0);
        case 'price-low':
          return (a.averagePrice || 0) - (b.averagePrice || 0);
        case 'change':
          const aChange = a.priceChange?.percentage || 0;
          const bChange = b.priceChange?.percentage || 0;
          return bChange - aChange;
        case 'name':
        default:
          return a.Name.localeCompare(b.Name);
      }
    });
  }, [cards, marketPrices, searchTerm, sortBy]);

  // Calculate comprehensive market statistics
  const marketStats = useMemo(() => {
    // Group market prices by cardId for calculations
    const pricesByCardId = new Map<number, MarketPrice[]>();
    marketPrices.forEach(price => {
      const cardId = price.cardId;
      if (!pricesByCardId.has(cardId)) {
        pricesByCardId.set(cardId, []);
      }
      pricesByCardId.get(cardId)!.push(price);
    });

    // Calculate market cards for statistics (similar to filteredMarketCards but for stats only)
    const marketCardsForStats: MarketCard[] = [];
    pricesByCardId.forEach((cardPrices, cardId) => {
      const cardData = cards.find(card => card.CardID === cardId);
      const sortedPrices = cardPrices.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentPrices = sortedPrices.filter(price => 
        new Date(price.date) >= thirtyDaysAgo
      );
      
      const avgPrice = recentPrices.length > 0
        ? recentPrices.reduce((sum, price) => sum + price.price, 0) / recentPrices.length
        : sortedPrices[0]?.price || 0;

      let priceChange: { amount: number; percentage: number; direction: 'up' | 'down' | 'stable' } | undefined = undefined;
      if (sortedPrices.length >= 2) {
        const currentPrice = sortedPrices[0].price;
        const previousPrice = sortedPrices[1].price;
        const change = currentPrice - previousPrice;
        const percentage = previousPrice > 0 ? (change / previousPrice) * 100 : 0;
        
        priceChange = {
          amount: change,
          percentage,
          direction: (change > 0 ? 'up' : change < 0 ? 'down' : 'stable') as 'up' | 'down' | 'stable'
        };
      }

      const cardName = cardData?.Name || sortedPrices[0]?.metadata?.cardName || `Card #${cardId}`;
      const expansionName = cardData?.ExpansionName || sortedPrices[0]?.metadata?.expansionCode || 'Unknown';

      const marketCard: MarketCard = {
        CardID: cardId,
        Name: cardName,
        ExpansionName: expansionName,
        ImageURL: cardData?.ImageURL || `/cards/hk${cardId.toString().padStart(8, '0')}.png`,
        averagePrice: avgPrice,
        priceChange,
        marketPrices: sortedPrices,
        // Add other required fields with defaults
        EvolutionStage: cardData?.EvolutionStage || '',
        CardType: cardData?.CardType || 'Unknown',
        HP: cardData?.HP || '',
        Type: cardData?.Type || '',
        Attribute: cardData?.Attribute || cardData?.Type || '',
        AbilityName: cardData?.AbilityName || '',
        AbilityEffect: cardData?.AbilityEffect || '',
        Skill1Name: cardData?.Skill1Name || '',
        Skill1Energy: cardData?.Skill1Energy || '',
        Skill1Damage: cardData?.Skill1Damage || '',
        Skill1Effect: cardData?.Skill1Effect || '',
        Skill2Name: cardData?.Skill2Name || '',
        Skill2Energy: cardData?.Skill2Energy || '',
        Skill2Damage: cardData?.Skill2Damage || '',
        Skill2Effect: cardData?.Skill2Effect || '',
        Weakness: cardData?.Weakness || '',
        WeaknessType: cardData?.WeaknessType || '',
        Resistance: cardData?.Resistance || '',
        ResistanceType: cardData?.ResistanceType || '',
        RetreatCost: cardData?.RetreatCost || '',
        CollectorNumber: cardData?.CollectorNumber || '',
        Rarity: cardData?.Rarity || '',
        RegulationMark: cardData?.RegulationMark || '',
        ExpansionCode: cardData?.ExpansionCode || '',
        Illustrator: cardData?.Illustrator || '',
        Artist: cardData?.Artist || '',
        SpecialTag: cardData?.SpecialTag || '',
        Evolution: cardData?.Evolution || '',
        PrimaryEffectType: cardData?.PrimaryEffectType || '',
        SpecialEffectType: cardData?.SpecialEffectType || '',
        AbilityStats: cardData?.AbilityStats || '',
        Tier: cardData?.Tier || '',
        Score: cardData?.Score || '',
        ScoreBreakdown: cardData?.ScoreBreakdown || '',
        OriginalImageURL: cardData?.OriginalImageURL || '',
        priceUpdated: sortedPrices[0]?.updatedAt
      };

      marketCardsForStats.push(marketCard);
    });

    const totalCards = marketCardsForStats.length;
    const totalPrices = marketPrices.length;
    
    // Price statistics
    const prices = marketPrices.map(p => p.price);
    const avgPrice = prices.length > 0 ? prices.reduce((sum, price) => sum + price, 0) / prices.length : 0;
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
    
    // Currency distribution
    const currencyCount = new Map<string, number>();
    marketPrices.forEach(price => {
      currencyCount.set(price.currency, (currencyCount.get(price.currency) || 0) + 1);
    });
    
    // Condition distribution
    const conditionCount = new Map<string, number>();
    marketPrices.forEach(price => {
      conditionCount.set(price.condition, (conditionCount.get(price.condition) || 0) + 1);
    });
    
    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentPrices = marketPrices.filter(price => new Date(price.date) >= sevenDaysAgo);
    
    // Price range distribution
    const priceRanges = {
      'Under $5': prices.filter(p => p < 5).length,
      '$5-25': prices.filter(p => p >= 5 && p < 25).length,
      '$25-100': prices.filter(p => p >= 25 && p < 100).length,
      '$100-500': prices.filter(p => p >= 100 && p < 500).length,
      'Over $500': prices.filter(p => p >= 500).length
    };
    
    // Cards with price changes
    const cardsWithChanges = marketCardsForStats.filter(card => card.priceChange);
    const priceIncreases = cardsWithChanges.filter(card => card.priceChange?.direction === 'up').length;
    const priceDecreases = cardsWithChanges.filter(card => card.priceChange?.direction === 'down').length;
    
    // Top movers
    const topGainers = marketCardsForStats
      .filter(card => card.priceChange?.direction === 'up')
      .sort((a, b) => (b.priceChange?.percentage || 0) - (a.priceChange?.percentage || 0))
      .slice(0, 3);
      
    const topLosers = marketCardsForStats
      .filter(card => card.priceChange?.direction === 'down')
      .sort((a, b) => (a.priceChange?.percentage || 0) - (b.priceChange?.percentage || 0))
      .slice(0, 3);
    
    // Most expensive cards
    const mostExpensive = marketCardsForStats
      .sort((a, b) => (b.averagePrice || 0) - (a.averagePrice || 0))
      .slice(0, 5);
    
    // Debug: Log the most expensive cards data
    console.log('Most expensive cards:', mostExpensive.map(card => ({
      cardId: card.CardID,
      name: card.Name,
      imageURL: card.ImageURL,
      averagePrice: card.averagePrice
    })));
    
    return {
      totalCards,
      totalPrices,
      avgPrice,
      minPrice,
      maxPrice,
      currencyCount,
      conditionCount,
      recentPrices: recentPrices.length,
      priceRanges,
      priceIncreases,
      priceDecreases,
      topGainers,
      topLosers,
      mostExpensive
    };
  }, [cards, marketPrices]);

  const handleDeletePrice = async (cardId: number, date: string) => {
    try {
      const response = await fetch(`/api/market-prices?cardId=${cardId}&date=${encodeURIComponent(date)}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchMarketPrices();
      } else {
        console.error('Failed to delete price');
      }
    } catch (error) {
      console.error('Error deleting price:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center h-64">
            <div className="text-xl">Loading market prices...</div>
          </div>
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
              <DollarSign className="h-8 w-8 sm:h-10 sm:w-10 text-purple-600" />
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Market Prices</h1>
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
                href="/debug"
                className="flex items-center justify-center space-x-2 px-3 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors text-xs font-medium opacity-75 hover:opacity-100"
                title="Debug Console - All Routes & API Endpoints"
              >
                <span>🐛</span>
                <span>Debug</span>
              </a>
              <div className="text-sm sm:text-base text-gray-500">
                {filteredMarketCards.length} items
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-8xl mx-auto px-2 sm:px-2 lg:px-2 py-2 sm:py-2">
        {/* Market Controls */}
        <div className="mb-4 bg-white rounded-lg shadow-sm border p-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Market Overview</h2>
              <p className="text-gray-600">Track and manage Pokemon card market prices</p>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 w-full sm:w-auto"
            >
              <Plus size={16} />
              Add Price
            </button>
          </div>
        </div>

        {/* Market Statistics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Overview Stats */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-blue-900">Market Overview</h3>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-blue-700 text-sm">Total Cards</span>
                <span className="font-bold text-blue-900">{marketStats.totalCards.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-700 text-sm">Price Entries</span>
                <span className="font-bold text-blue-900">{marketStats.totalPrices.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-700 text-sm">Avg Price</span>
                <span className="font-bold text-blue-900">HK${marketStats.avgPrice.toFixed(0)}</span>
              </div>
            </div>
          </div>

          {/* Price Range Stats */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-green-900">Price Ranges</h3>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <div className="space-y-2">
              {Object.entries(marketStats.priceRanges).map(([range, count]) => (
                <div key={range} className="flex justify-between items-center text-sm">
                  <span className="text-green-700">{range}</span>
                  <span className="font-semibold text-green-900">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Market Activity */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-purple-900">Market Activity</h3>
              <Activity className="h-8 w-8 text-purple-600" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-purple-700 text-sm">Recent (7d)</span>
                <span className="font-bold text-purple-900">{marketStats.recentPrices}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-purple-700 text-sm flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Increases
                </span>
                <span className="font-bold text-green-600">{marketStats.priceIncreases}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-purple-700 text-sm flex items-center gap-1">
                  <TrendingDown className="h-3 w-3" />
                  Decreases
                </span>
                <span className="font-bold text-red-600">{marketStats.priceDecreases}</span>
              </div>
            </div>
          </div>

          {/* Price Extremes */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-orange-900">Price Range</h3>
              <Star className="h-8 w-8 text-orange-600" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-orange-700 text-sm">Minimum</span>
                <span className="font-bold text-orange-900">HK${marketStats.minPrice.toFixed(0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-orange-700 text-sm">Maximum</span>
                <span className="font-bold text-orange-900">HK${marketStats.maxPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-orange-700 text-sm">Range</span>
                <span className="font-bold text-orange-900">HK${(marketStats.maxPrice - marketStats.minPrice).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Movers and Most Expensive */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Top Gainers */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Top Gainers</h3>
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="space-y-3">
              {marketStats.topGainers.length > 0 ? (
                marketStats.topGainers.map((card) => (
                  <div key={card.CardID} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Image
                        src={card.ImageURL}
                        alt={card.Name}
                        width={40}
                        height={56}
                        className="rounded object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder-card.png';
                        }}
                      />
                      <div>
                        <div className="font-medium text-sm text-gray-900 truncate max-w-32">{card.Name}</div>
                        <div className="text-xs text-gray-600">HK${card.averagePrice?.toFixed(0)}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-green-600">
                        +{card.priceChange?.percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-gray-500 text-center py-4">No price increases found</div>
              )}
            </div>
          </div>

          {/* Top Losers */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Top Losers</h3>
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
            <div className="space-y-3">
              {marketStats.topLosers.length > 0 ? (
                marketStats.topLosers.map((card) => (
                  <div key={card.CardID} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Image
                        src={card.ImageURL}
                        alt={card.Name}
                        width={40}
                        height={56}
                        className="rounded object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder-card.png';
                        }}
                      />
                      <div>
                        <div className="font-medium text-sm text-gray-900 truncate max-w-32">{card.Name}</div>
                        <div className="text-xs text-gray-600">HK${card.averagePrice?.toFixed(0)}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-red-600">
                        {card.priceChange?.percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-gray-500 text-center py-4">No price decreases found</div>
              )}
            </div>
          </div>
        </div>

        {/* Most Expensive Cards */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Most Expensive Cards</h3>
            <Award className="h-6 w-6 text-yellow-600" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {marketStats.mostExpensive.map((card, index) => (
              <div key={card.CardID} className="relative bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg p-4 border border-yellow-200">
                <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  {index + 1}
                </div>
                <div className="flex flex-col items-center space-y-2">
                  <img
                    src={card.ImageURL}
                    alt={card.Name}
                    width={80}
                    height={112}
                    className="rounded object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      console.log(`Image failed to load: ${card.ImageURL} for card: ${card.Name}`);
                      target.src = '/placeholder-card.png';
                    }}
                  />
                  <div className="text-center">
                    <div className="font-medium text-sm text-gray-900 truncate max-w-full">{card.Name}</div>
                    <div className="text-lg font-bold text-yellow-700">HK${card.averagePrice?.toLocaleString()}</div>
                    <div className="text-xs text-gray-600">{card.ExpansionName}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Currency and Condition Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Currency Distribution */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Currency Distribution</h3>
              <PieChart className="h-6 w-6 text-blue-600" />
            </div>
            <div className="space-y-3">
              {Array.from(marketStats.currencyCount.entries())
                .sort(([,a], [,b]) => b - a)
                .map(([currency, count]) => {
                  const percentage = (count / marketStats.totalPrices * 100).toFixed(1);
                  return (
                    <div key={currency} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-sm font-medium">{getCurrencySymbol(currency)} {currency}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">{count.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">{percentage}%</div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Condition Distribution */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Card Condition Distribution</h3>
              <Package className="h-6 w-6 text-green-600" />
            </div>
            <div className="space-y-3">
              {Array.from(marketStats.conditionCount.entries())
                .sort(([,a], [,b]) => b - a)
                .map(([condition, count]) => {
                  const percentage = (count / marketStats.totalPrices * 100).toFixed(1);
                  const colorClass = condition === 'Near Mint' ? 'bg-green-500' : 
                                   condition === 'Lightly Played' ? 'bg-yellow-500' :
                                   condition === 'Moderately Played' ? 'bg-orange-500' :
                                   condition === 'Heavily Played' ? 'bg-red-500' : 'bg-gray-500';
                  return (
                    <div key={condition} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 ${colorClass} rounded-full`}></div>
                        <span className="text-sm font-medium">{condition}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">{count.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">{percentage}%</div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Add Price Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Add Market Price</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Card ID</label>
                <input
                  type="number"
                  value={newPrice.cardId}
                  onChange={(e) => setNewPrice(prev => ({ ...prev, cardId: parseInt(e.target.value) || 0 }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter card ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={newPrice.price}
                  onChange={(e) => setNewPrice(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <select
                  value={newPrice.currency}
                  onChange={(e) => setNewPrice(prev => ({ ...prev, currency: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="HKD">{getCurrencySymbol('HKD')} HKD</option>
                  <option value="USD">{getCurrencySymbol('USD')} USD</option>
                  <option value="JPY">{getCurrencySymbol('JPY')} JPY</option>
                  <option value="EUR">{getCurrencySymbol('EUR')} EUR</option>
                  <option value="GBP">{getCurrencySymbol('GBP')} GBP</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                <select
                  value={newPrice.condition}
                  onChange={(e) => setNewPrice(prev => ({ ...prev, condition: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Near Mint">Near Mint</option>
                  <option value="Lightly Played">Lightly Played</option>
                  <option value="Moderately Played">Moderately Played</option>
                  <option value="Heavily Played">Heavily Played</option>
                  <option value="Damaged">Damaged</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Source (Optional)</label>
                <input
                  type="text"
                  value={newPrice.source || ''}
                  onChange={(e) => setNewPrice(prev => ({ ...prev, source: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., eBay, TCGPlayer"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleAddPrice}
                  disabled={!newPrice.cardId || !newPrice.price || !newPrice.currency || !newPrice.condition}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Add Price
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Search and Sort */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search cards..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="md:w-48">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="name">Sort by Name</option>
                <option value="price-high">Price (High to Low)</option>
                <option value="price-low">Price (Low to High)</option>
                <option value="change">Price Change</option>
              </select>
            </div>
          </div>
        </div>

        {/* Market Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredMarketCards.map(card => (
            <div key={card.CardID} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-lg truncate flex-1">{card.Name}</h3>
                  {card.priceChange && (
                    <div className={`flex items-center gap-1 px-2 py-1 rounded text-sm ${
                      card.priceChange.direction === 'up' 
                        ? 'bg-green-100 text-green-800' 
                        : card.priceChange.direction === 'down'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {card.priceChange.direction === 'up' ? (
                        <TrendingUp size={14} />
                      ) : card.priceChange.direction === 'down' ? (
                        <TrendingDown size={14} />
                      ) : (
                        <Minus size={14} />
                      )}
                      {card.priceChange.percentage.toFixed(1)}%
                    </div>
                  )}
                </div>

                <div className="text-2xl font-bold text-blue-600 mb-2">
                  {card.averagePrice ? `${getCurrencySymbol(card.marketPrices?.[0]?.currency || 'HKD')}${card.averagePrice.toFixed(2)}` : 'N/A'}
                </div>

                <div className="text-sm text-gray-600 mb-4">
                  <div>Set: {card.ExpansionName}</div>
                  <div>Rarity: {card.Rarity}</div>
                  <div className="flex items-center gap-1 mt-1">
                    <Clock size={12} />
                    {card.priceUpdated ? new Date(card.priceUpdated).toLocaleDateString() : 'No prices'}
                  </div>
                </div>

                {/* Recent Prices */}
                {card.marketPrices && card.marketPrices.length > 0 && (
                  <div className="border-t pt-3">
                    <div className="text-sm font-medium text-gray-700 mb-2">Recent Prices:</div>
                    <div className="space-y-1">
                      {card.marketPrices.slice(0, 3).map((price, index) => (
                        <div key={`${price.cardId}-${price.date}-${index}`} className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">
                            {price.condition} - {getCurrencySymbol(price.currency)}{price.price.toFixed(2)}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">
                              {new Date(price.date).toLocaleDateString()}
                            </span>
                            <button
                              onClick={() => handleDeletePrice(price.cardId, price.date)}
                              className="text-red-500 hover:text-red-700"
                              title="Delete price"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    {card.marketPrices.length > 3 && (
                      <div className="text-xs text-gray-500 mt-1">
                        +{card.marketPrices.length - 3} more prices
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={() => setSelectedCard(selectedCard?.CardID === card.CardID ? null : card)}
                  className="w-full mt-3 px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
                >
                  {selectedCard?.CardID === card.CardID ? 'Hide Details' : 'View Details'}
                </button>
              </div>

              {/* Expanded Details */}
              {selectedCard?.CardID === card.CardID && (
                <div className="border-t bg-gray-50 p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Card ID:</strong> {card.CardID}
                    </div>
                    <div>
                      <strong>Collection No:</strong> {card.CollectorNumber || 'N/A'}
                    </div>
                    <div>
                      <strong>Set:</strong> {card.ExpansionName}
                    </div>
                    <div>
                      <strong>Card Type:</strong> {card.CardType}
                    </div>
                    <div>
                      <strong>HP:</strong> {card.HP || 'N/A'}
                    </div>
                    <div>
                      <strong>Type:</strong> {card.Type}
                    </div>
                    <div>
                      <strong>Tier:</strong> {card.Tier}
                    </div>
                    <div>
                      <strong>Rarity:</strong> {card.Rarity}
                    </div>
                  </div>
                  {card.AbilityName && (
                    <div className="mt-3">
                      <strong className="text-sm">Ability:</strong>
                      <div className="text-sm text-gray-600 mt-1">{card.AbilityName}: {card.AbilityEffect}</div>
                    </div>
                  )}
                  {(card.Skill1Name || card.Skill2Name) && (
                    <div className="mt-3">
                      <strong className="text-sm">Attacks:</strong>
                      <div className="text-sm text-gray-600 mt-1">
                        {card.Skill1Name && <div>{card.Skill1Name} - {card.Skill1Effect}</div>}
                        {card.Skill2Name && <div>{card.Skill2Name} - {card.Skill2Effect}</div>}
                      </div>
                    </div>
                  )}
                  
                  {/* All Prices */}
                  {card.marketPrices && card.marketPrices.length > 0 && (
                    <div className="mt-4">
                      <strong className="text-sm">All Recorded Prices:</strong>
                      <div className="mt-2 max-h-32 overflow-y-auto space-y-1">
                        {card.marketPrices.map((price, index) => (
                          <div key={`${price.cardId}-${price.date}-${index}`} className="flex justify-between items-center text-xs p-2 bg-white rounded border">
                            <div>
                              <div className="font-medium">{getCurrencySymbol(price.currency)}{price.price.toFixed(2)} {price.currency}</div>
                              <div className="text-gray-600">{price.condition}</div>
                              {price.source && <div className="text-gray-500">({price.source})</div>}
                            </div>
                            <div className="text-right">
                              <div>{new Date(price.date).toLocaleDateString()}</div>
                              <button
                                onClick={() => handleDeletePrice(price.cardId, price.date)}
                                className="text-red-500 hover:text-red-700 mt-1"
                                title="Delete price"
                              >
                                <X size={10} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredMarketCards.length === 0 && (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="text-gray-500 text-lg mb-4">No market data found</div>
              <div className="space-y-3">
                <p className="text-gray-400">Get started by adding price data:</p>
                <div className="bg-white rounded-lg p-4 border-2 border-dashed border-gray-300">
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-blue-600">1.</span>
                      <span>Browse cards on the <a href="/" className="text-blue-600 hover:underline">home page</a></span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-blue-600">2.</span>
                      <span>Click any card to view details</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-blue-600">3.</span>
                      <span>Use the &ldquo;Add Price&rdquo; button in the card detail modal</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-blue-600">4.</span>
                      <span>Or use the &ldquo;Add Price&rdquo; button above to add prices by Card ID</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-500">
                  Market prices help track card values and trends over time
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}