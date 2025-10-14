'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PTCGCard } from '../../types/card';
import { InventoryCard, CARD_CONDITIONS } from '../../types/inventory';
import { useInventory } from '../../hooks/useInventory';
import { useI18n } from '../../i18n/context';
import { getCardImageSrc, PLACEHOLDER_IMAGE_PATH } from '../../utils/imageUtils';
import InventoryManager from '../../components/InventoryManager';
import LanguageSelector from '../../components/LanguageSelector';
import { 
  Package, 
  Search, 
  Filter, 
  BarChart3, 
  Eye,
  Download,
  Upload,
  DollarSign,
  TrendingUp,
  X,
  Gamepad2,
  Sword,
  ChevronRight,
  Zap,
  Shield
} from 'lucide-react';

export default function InventoryPage() {
  const { t } = useI18n();
  const {
    inventory,
    loading,
    error,
    getInventoryStats,
    loadInventory
  } = useInventory();  const [cards, setCards] = useState<PTCGCard[]>([]);
  const [loadingCards, setLoadingCards] = useState(true);
  const [selectedCard, setSelectedCard] = useState<PTCGCard | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [conditionFilter, setConditionFilter] = useState('');
  const [showStats, setShowStats] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'id' | 'rarity' | 'tier' | 'quantity' | 'value' | 'expansion' | 'type'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [viewSize, setViewSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [filtersVisible, setFiltersVisible] = useState(true);
  const [cardOnlyView, setCardOnlyView] = useState(false);
  const filterHideTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load cards data
  useEffect(() => {
    const loadCards = async () => {
      try {
        console.log('Loading cards data...');
        setLoadingCards(true);
        const response = await fetch('/api/cards?detail=true');
        console.log('Cards API response status:', response.status);
        if (!response.ok) {
          throw new Error('Failed to load cards');
        }
        const cardsData = await response.json();
        console.log('Loaded cards count:', cardsData.length);
        setCards(cardsData);
      } catch (err) {
        console.error('Error loading cards:', err);
      } finally {
        setLoadingCards(false);
        console.log('Cards loading completed');
      }
    };

    loadCards();
  }, []);

  // Load inventory data
  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  // Tier color helper function
  const getTierColor = (tier?: string) => {
    switch (tier) {
      case 'S+': return 'bg-red-100 text-red-800';
      case 'S': return 'bg-orange-100 text-orange-800';
      case 'A+': return 'bg-yellow-100 text-yellow-800';
      case 'A': return 'bg-green-100 text-green-800';
      case 'B+': return 'bg-blue-100 text-blue-800';
      case 'B': return 'bg-indigo-100 text-indigo-800';
      case 'C+': return 'bg-purple-100 text-purple-800';
      case 'C': return 'bg-gray-100 text-gray-800';
      case 'D': return 'bg-gray-200 text-gray-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  // Rarity order helper function
  const getRarityOrder = (rarity?: string) => {
    const rarityOrder: { [key: string]: number } = {
      'C': 1, 'Common': 1,
      'U': 2, 'Uncommon': 2,
      'R': 3, 'Rare': 3,
      'RR': 4, 'Double Rare': 4,
      'RRR': 5, 'Triple Rare': 5,
      'SR': 6, 'Secret Rare': 6,
      'UR': 7, 'Ultra Rare': 7,
      'HR': 8, 'Hyper Rare': 8,
      'AR': 9, 'Art Rare': 9,
      'SAR': 10, 'Special Art Rare': 10,
      'MUR': 11, 'Master Ultra Rare': 11,
      'PR': 12, 'Promo': 12
    };
    return rarityOrder[rarity || ''] || 0;
  };

  // Auto-hide filters functionality
  useEffect(() => {
    const startHideTimer = () => {
      if (filterHideTimerRef.current) {
        clearTimeout(filterHideTimerRef.current);
      }
      const timer = setTimeout(() => {
        setFiltersVisible(false);
      }, 5000);
      filterHideTimerRef.current = timer;
    };

    const resetHideTimer = () => {
      if (filterHideTimerRef.current) {
        clearTimeout(filterHideTimerRef.current);
      }
      setFiltersVisible(true);
      startHideTimer();
    };

    // Start the timer initially
    startHideTimer();

    // Show filters on any user interaction
    const handleUserActivity = () => resetHideTimer();
    document.addEventListener('click', handleUserActivity);
    document.addEventListener('keydown', handleUserActivity);
    document.addEventListener('scroll', handleUserActivity);

    return () => {
      document.removeEventListener('click', handleUserActivity);
      document.removeEventListener('keydown', handleUserActivity);
      document.removeEventListener('scroll', handleUserActivity);
      if (filterHideTimerRef.current) {
        clearTimeout(filterHideTimerRef.current);
      }
    };
  }, []);

  // Get inventory stats
  const stats = useMemo(() => getInventoryStats(), [getInventoryStats]);

  // Filter and search inventory
  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      const card = cards.find(c => c.CardID === item.CardID);

      // Allow items even if card data isn't loaded yet
      const matchesSearch = !searchTerm ||
        (card && (
          (card.Name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (card.CardType || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (card.ExpansionName || '').toLowerCase().includes(searchTerm.toLowerCase())
        )) ||
        // If no card data, still allow searching by CardID
        (!card && item.CardID.toString().includes(searchTerm));

      const matchesCondition = !conditionFilter || item.condition === conditionFilter;

      return matchesSearch && matchesCondition;
    });
  }, [inventory, cards, searchTerm, conditionFilter]);

  // Apply sorting
  const sortedInventory = useMemo(() => {
    const sorted = [...filteredInventory].sort((a, b) => {
      const cardA = cards.find(c => c.CardID === a.CardID);
      const cardB = cards.find(c => c.CardID === b.CardID);

      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = (cardA?.Name || `Card #${a.CardID}`).localeCompare(cardB?.Name || `Card #${b.CardID}`);
          break;
        case 'id':
          comparison = a.CardID - b.CardID;
          break;
        case 'rarity':
          comparison = getRarityOrder(cardA?.Rarity) - getRarityOrder(cardB?.Rarity);
          break;
        case 'tier':
          comparison = (cardA?.Tier || '').localeCompare(cardB?.Tier || '');
          break;
        case 'expansion':
          comparison = (cardA?.ExpansionName || '').localeCompare(cardB?.ExpansionName || '');
          break;
        case 'type':
          comparison = (cardA?.CardType || '').localeCompare(cardB?.CardType || '');
          break;
        case 'quantity':
          comparison = a.quantity - b.quantity;
          break;
        case 'value':
          const valueA = a.purchaseCost || a.marketPrice || 0;
          const valueB = b.purchaseCost || b.marketPrice || 0;
          comparison = valueA - valueB;
          break;
        default:
          comparison = 0;
      }
      
      return sortDirection === 'desc' ? -comparison : comparison;
    });
    
    return sorted;
  }, [filteredInventory, cards, sortBy, sortDirection]);

  // Group inventory by card
  const groupedInventory = useMemo(() => {
    const grouped = sortedInventory.reduce((acc, item) => {
      if (!acc[item.CardID]) {
        acc[item.CardID] = [];
      }
      acc[item.CardID].push(item);
      return acc;
    }, {} as Record<number, InventoryCard[]>);

    return grouped;
  }, [sortedInventory]);

  const exportInventory = () => {
    const exportData = inventory.map(item => {
      const card = cards.find(c => c.CardID === item.CardID);
      return {
        cardId: item.CardID,
        cardName: card?.Name || 'Unknown',
        expansion: card?.ExpansionName || 'Unknown',
        quantity: item.quantity,
        condition: item.condition,
        notes: item.notes,
        dateAdded: item.dateAdded,
        lastUpdated: item.lastUpdated
      };
    });

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ptcg-inventory-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading || loadingCards) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <X className="h-12 w-12 mx-auto" />
          </div>
          <p className="text-gray-600 mb-4">Error loading inventory: {error}</p>
          <button
            onClick={loadInventory}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Retry
          </button>
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
              <Package className="h-8 w-8 sm:h-10 sm:w-10 text-green-600" />
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{t.cardLibrary}</h1>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
              <LanguageSelector />
              <a
                href="/"
                className="flex items-center justify-center space-x-2 px-4 py-3 sm:py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium w-full sm:w-auto min-h-[44px] sm:min-h-auto"
              >
                <Gamepad2 className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Search</span>
              </a>
              <a
                href="/deck-builder"
                className="flex items-center justify-center space-x-2 px-4 py-3 sm:py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium w-full sm:w-auto min-h-[44px] sm:min-h-auto"
              >
                <Sword className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Deck Builder</span>
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
                {Object.keys(groupedInventory).length} unique cards
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-8xl mx-auto px-2 sm:px-2 lg:px-2 py-2 sm:py-2">
        

        {/* Sort and View Controls - Compact */}
        <div className="mb-4 bg-white rounded-lg shadow-sm border p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center space-x-2">
              <label className="text-xs font-medium text-gray-700">Sort:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-xs"
              >
                <option value="name">Name</option>
                <option value="id">Card ID</option>
                <option value="expansion">Expansion</option>
                <option value="type">Card Type</option>
                <option value="rarity">Rarity</option>
                <option value="tier">Tier</option>
                <option value="quantity">Quantity</option>
                <option value="value">Value</option>
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
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCardOnlyView(!cardOnlyView)}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  cardOnlyView 
                    ? 'bg-purple-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                title={cardOnlyView ? "Show Full Cards" : "Card Only View"}
              >
                {cardOnlyView ? "Full" : "Card Only"}
              </button>
              <button
                onClick={() => setShowStats(!showStats)}
                className={`px-3 py-1 text-xs rounded transition-colors flex items-center space-x-1 ${
                  showStats 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                title="Toggle Statistics Panel"
              >
                <BarChart3 className="h-3 w-3" />
                <span>Stats</span>
              </button>
              <button
                onClick={exportInventory}
                className="px-3 py-1 text-xs bg-green-500 text-white hover:bg-green-600 rounded flex items-center space-x-1"
                title="Export Inventory to JSON"
              >
                <Download className="h-3 w-3" />
                <span>Export</span>
              </button>
            </div>
          </div>
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search cards..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            />
          </div>
          <div className="text-xs text-gray-500">
            {Object.keys(groupedInventory).length} unique cards
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
          {/* Filters Sidebar - Auto-hide and Compact */}
          <div className={`lg:flex-shrink-0 transition-all duration-300 ${
            filtersVisible 
              ? 'lg:w-64 w-full opacity-100 translate-x-0' 
              : 'lg:w-12 w-0 opacity-0 -translate-x-full lg:translate-x-0'
          }`}>
            <div className="lg:sticky lg:top-6 relative">
              {!filtersVisible && (
                <button
                  onClick={() => setFiltersVisible(true)}
                  className="absolute left-2 top-4 z-10 bg-blue-500 text-white p-2 rounded-full shadow-lg hover:bg-blue-600 transition-colors"
                  title="Show Filters"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
              <div className={`bg-white rounded-lg border shadow-sm p-4 ${!filtersVisible ? 'hidden lg:block' : ''}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                    <Filter className="w-5 h-5" />
                    <span>Filters</span>
                  </h3>
                  {filtersVisible && (
                    <button
                      onClick={() => setFiltersVisible(false)}
                      className="text-gray-400 hover:text-gray-600"
                      title="Hide Filters"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Condition</label>
                    <select
                      value={conditionFilter}
                      onChange={(e) => setConditionFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Conditions</option>
                      {CARD_CONDITIONS.map(condition => (
                        <option key={condition.value} value={condition.value}>
                          {condition.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {showStats && (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Total Cards</p>
                    <p className="text-2xl font-bold text-blue-900">{stats.totalCards}</p>
                  </div>
                  <Package className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium">Unique Cards</p>
                    <p className="text-2xl font-bold text-green-900">{stats.uniqueCards}</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-green-600" />
                </div>
              </div>

              {/* Financial Stats */}
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-yellow-600 font-medium">Total Investment</p>
                    <p className="text-2xl font-bold text-yellow-900">
                      ${stats.totalPurchaseCost?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-yellow-600" />
                </div>
              </div>

              <div className="bg-emerald-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-emerald-600 font-medium">Market Value</p>
                    <p className="text-2xl font-bold text-emerald-900">
                      ${stats.totalMarketValue?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-emerald-600" />
                </div>
              </div>

              {/* Profit/Loss Card */}
              {(stats.totalPurchaseCost && stats.totalMarketValue) && (
                <div className={`p-4 rounded-lg ${stats.totalProfit >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-medium ${stats.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {stats.totalProfit >= 0 ? 'Total Profit' : 'Total Loss'}
                      </p>
                      <p className={`text-2xl font-bold ${stats.totalProfit >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                        {stats.totalProfit >= 0 ? '+' : ''}${stats.totalProfit?.toFixed(2)}
                      </p>
                    </div>
                    <TrendingUp className={`w-8 h-8 ${stats.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                  </div>
                </div>
              )}

              {/* Average Card Value */}
              {stats.averageCardValue && (
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-indigo-600 font-medium">Avg Card Value</p>
                      <p className="text-2xl font-bold text-indigo-900">
                        ${stats.averageCardValue.toFixed(2)}
                      </p>
                    </div>
                    <BarChart3 className="w-8 h-8 text-indigo-600" />
                  </div>
                </div>
              )}

              {/* Most Valuable Card */}
              {stats.mostValuableCard && (
                <div className="bg-amber-50 p-4 rounded-lg border-2 border-amber-200">
                  <div>
                    <p className="text-sm text-amber-700 font-medium">Most Valuable Card</p>
                    <p className="text-lg font-bold text-amber-900 truncate">
                      {stats.mostValuableCard.cardName}
                    </p>
                    <p className="text-xl font-bold text-amber-800">
                      ${stats.mostValuableCard.value.toFixed(2)}
                    </p>
                  </div>
                </div>
              )}

              {/* Condition Breakdown */}
              <div className="bg-purple-50 p-4 rounded-lg sm:col-span-2 lg:col-span-3 xl:col-span-4">
                <p className="text-sm text-purple-600 font-medium mb-2">Condition Breakdown</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 text-sm">
                  {CARD_CONDITIONS.map(condition => {
                    const count = stats.conditionBreakdown[condition.value] || 0;
                    return count > 0 ? (
                      <div key={condition.value} className="flex justify-between">
                        <span className="text-purple-700">{condition.label}:</span>
                        <span className="font-semibold text-purple-900">{count}</span>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Inventory Cards Grid */}
          <div className="mt-6">
            {sortedInventory.length === 0 ? (
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No cards found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || conditionFilter ? 'Try adjusting your search or filters.' : 'Your inventory is empty.'}
                </p>
              </div>
            ) : (
              <div className={`grid gap-4 ${
                viewSize === 'small' 
                  ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8' 
                  : viewSize === 'medium'
                  ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
                  : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              }`}>
                {sortedInventory.map((item) => {
                  const card = cards.find(c => c.CardID === item.CardID);
                  // Don't skip items just because card data isn't available
                  // if (!card) return null;
                  
                  return (
                    <div
                      key={`${item.CardID}-${item.condition}`}
                      className={`bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow cursor-pointer ${
                        cardOnlyView ? 'p-2' : 'p-4'
                      }`}
                      onClick={() => setSelectedCard(card || null)}
                    >
                      {!cardOnlyView && (
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-gray-900 truncate">
                              {card?.Name || `Card #${item.CardID}`}
                            </h3>
                            <p className="text-xs text-gray-500 truncate">
                              {card?.CardID || item.CardID}
                            </p>
                          </div>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            item.condition === 'near-mint' ? 'bg-green-100 text-green-800' :
                            item.condition === 'lightly-played' ? 'bg-yellow-100 text-yellow-800' :
                            item.condition === 'moderately-played' ? 'bg-orange-100 text-orange-800' :
                            item.condition === 'heavily-played' ? 'bg-red-100 text-red-800' :
                            item.condition === 'damaged' ? 'bg-gray-100 text-gray-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {CARD_CONDITIONS.find(c => c.value === item.condition)?.label || item.condition}
                          </span>
                        </div>
                      )}
                      
                      <div className={`relative ${cardOnlyView ? 'aspect-[2.5/3.5]' : 'aspect-[2.5/3.5] mb-3'}`}>
                        <img
                          src={card ? getCardImageSrc(card) : PLACEHOLDER_IMAGE_PATH}
                          alt={card?.Name || `Card #${item.CardID}`}
                          className="w-full h-full object-cover rounded"
                          onError={(e) => {
                            e.currentTarget.src = PLACEHOLDER_IMAGE_PATH;
                          }}
                        />
                      </div>

                      {!cardOnlyView && (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Qty:</span>
                            <span className="font-medium">{item.quantity}</span>
                          </div>
                          
                          {item.purchaseCost && (
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-600">Purchase:</span>
                              <span className="font-medium">${item.purchaseCost.toFixed(2)}</span>
                            </div>
                          )}
                          
                          {item.marketPrice && (
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-600">Market:</span>
                              <span className="font-medium text-green-600">${item.marketPrice.toFixed(2)}</span>
                            </div>
                          )}

                          {item.purchaseCost && item.marketPrice && (
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-600">Profit:</span>
                              <span className={`font-medium ${
                                (item.marketPrice - item.purchaseCost) >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {((item.marketPrice - item.purchaseCost) * item.quantity) >= 0 ? '+' : ''}
                                ${((item.marketPrice - item.purchaseCost) * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

    {/* Inventory Manager Modal */}
    {selectedCard && (
      <InventoryManager
        card={selectedCard}
        onClose={() => setSelectedCard(null)}
      />
    )}
  </div>
);
}