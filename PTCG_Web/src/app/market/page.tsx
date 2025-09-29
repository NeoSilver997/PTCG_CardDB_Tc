'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Search, Plus, TrendingUp, TrendingDown, Minus, Clock, X } from 'lucide-react';
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
      const response = await fetch('/api/cards?details=true');
      if (response.ok) {
        const data = await response.json();
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
        // Convert raw data to flat array of market prices
        const allPrices: MarketPrice[] = [];
        Object.entries(rawData).forEach(([cardId, prices]) => {
          if (Array.isArray(prices)) {
            allPrices.push(...prices);
          }
        });
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
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Market Prices</h1>
              <p className="text-gray-600">Track and manage Pokemon card market prices</p>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus size={16} />
              Add Price
            </button>
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