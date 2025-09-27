'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { PTCGCard } from '../../types/card';
import { InventoryCard, CARD_CONDITIONS } from '../../types/inventory';
import { useInventory } from '../../hooks/useInventory';
import { useI18n } from '../../i18n/context';
import InventoryManager from '../../components/InventoryManager';
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
  X
} from 'lucide-react';

export default function InventoryPage() {
  const { t } = useI18n();
  const { 
    inventory, 
    loading, 
    error, 
    getInventoryStats,
    reloadInventory
  } = useInventory();

  const [cards, setCards] = useState<PTCGCard[]>([]);
  const [loadingCards, setLoadingCards] = useState(true);
  const [selectedCard, setSelectedCard] = useState<PTCGCard | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [conditionFilter, setConditionFilter] = useState('');
  const [showStats, setShowStats] = useState(false);

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

  // Load card data
  useEffect(() => {
    const loadCards = async () => {
      try {
        const response = await fetch('/api/cards');
        const data = await response.json();
        setCards(data);
      } catch (error) {
        console.error('Failed to load cards:', error);
      } finally {
        setLoadingCards(false);
      }
    };
    loadCards();
  }, []);

  // Get inventory stats
  const stats = useMemo(() => getInventoryStats(), [getInventoryStats]);

  // Filter and search inventory
  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      const card = cards.find(c => c.CardID === item.CardID);
      if (!card) return false;

      const matchesSearch = !searchTerm || 
        card.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.CardType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.ExpansionName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCondition = !conditionFilter || item.condition === conditionFilter;

      return matchesSearch && matchesCondition;
    });
  }, [inventory, cards, searchTerm, conditionFilter]);

  // Group inventory by card
  const groupedInventory = useMemo(() => {
    const grouped = filteredInventory.reduce((acc, item) => {
      if (!acc[item.CardID]) {
        acc[item.CardID] = [];
      }
      acc[item.CardID].push(item);
      return acc;
    }, {} as Record<number, InventoryCard[]>);

    return grouped;
  }, [filteredInventory]);

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-3">
              <Package className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{t.cardLibrary}</h1>
                <p className="text-gray-600">Manage your PTCG card collection</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowStats(!showStats)}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Stats</span>
              </button>
              
              <button
                onClick={exportInventory}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          </div>

          {/* Stats Panel */}
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
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white p-4 rounded-lg border mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search cards..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={conditionFilter}
                  onChange={(e) => setConditionFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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

        {/* Inventory Grid */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {Object.keys(groupedInventory).length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No cards in inventory</h3>
            <p className="text-gray-600">Start adding cards to your inventory from the card search page</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {Object.entries(groupedInventory).map(([cardIdStr, inventoryItems]) => {
              const cardId = parseInt(cardIdStr);
              const card = cards.find(c => c.CardID === cardId);
              if (!card) return null;

              const totalQuantity = inventoryItems.reduce((sum, item) => sum + item.quantity, 0);
              const totalPurchaseValue = inventoryItems.reduce((sum, item) => 
                sum + (item.purchaseCost ? item.purchaseCost * item.quantity : 0), 0);
              const totalMarketValue = inventoryItems.reduce((sum, item) => 
                sum + (item.marketPrice ? item.marketPrice * item.quantity : 0), 0);
              const profitLoss = totalMarketValue - totalPurchaseValue;

              return (
                <div key={cardId} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden group">
                  {/* Full Card Image */}
                  <div className="aspect-[5/7] bg-gray-100 relative min-h-[320px] lg:min-h-[360px]">
                    <img
                      src={card.ImageURL}
                      alt={card.Name}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-card.png';
                      }}
                    />
                    
                    {/* Overlay Information */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                        <h3 className="font-bold text-lg mb-1">{card.Name}</h3>
                        <p className="text-sm opacity-90 mb-2">{card.ExpansionName}</p>
                        {card.CardType && (
                          <p className="text-xs opacity-75">{card.CardType} • {card.Rarity}</p>
                        )}
                      </div>
                    </div>

                    {/* Quantity Badge */}
                    <div className="absolute top-3 right-3 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                      ×{totalQuantity}
                    </div>

                    {/* Tier Badge */}
                    {card.Tier && (
                      <div className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-bold shadow-lg ${getTierColor(card.Tier)}`}>
                        {card.Tier}
                      </div>
                    )}
                  </div>

                  {/* Card Info Panel */}
                  <div className="p-4 space-y-3">
                    {/* Quick Info */}
                    <div className="text-center">
                      <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">{card.Name}</h3>
                      <p className="text-xs text-gray-600">{card.ExpansionName}</p>
                    </div>
                    
                    {/* Inventory Details */}
                    <div className="space-y-2">
                      {inventoryItems.map((item) => (
                        <div key={`${item.CardID}-${item.condition}`} className="flex justify-between items-center text-xs bg-gray-50 rounded-lg px-3 py-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-600 font-medium">
                              {CARD_CONDITIONS.find(c => c.value === item.condition)?.label}
                            </span>
                            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                              ×{item.quantity}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            {item.purchaseCost && (
                              <span className="text-green-600 font-semibold" title="Purchase Cost">
                                ${item.purchaseCost.toFixed(2)}
                              </span>
                            )}
                            {item.marketPrice && (
                              <span className="text-blue-600 font-semibold" title="Market Price">
                                ${item.marketPrice.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Financial Summary */}
                    {(totalPurchaseValue > 0 || totalMarketValue > 0) && (
                      <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">Purchase Value:</span>
                          <span className="font-semibold text-green-600">
                            ${totalPurchaseValue.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">Market Value:</span>
                          <span className="font-semibold text-blue-600">
                            ${totalMarketValue.toFixed(2)}
                          </span>
                        </div>
                        {totalPurchaseValue > 0 && totalMarketValue > 0 && (
                          <div className="flex justify-between text-xs pt-1 border-t border-gray-200">
                            <span className="text-gray-600 font-medium">Profit/Loss:</span>
                            <span className={`font-bold ${profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {profitLoss >= 0 ? '+' : ''}${profitLoss.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Manage Button */}
                    <button
                      onClick={() => setSelectedCard(card)}
                      className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Manage Inventory</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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