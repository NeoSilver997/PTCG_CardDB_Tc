'use client';

import { useState, useEffect, useCallback } from 'react';
import { InventoryCard } from '../types/inventory';

export function useInventory() {
  const [inventory, setInventory] = useState<InventoryCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadInventory = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/inventory');
      if (!response.ok) {
        throw new Error('Failed to load inventory');
      }
      const data = await response.json();
      setInventory(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, []);

  const addToInventory = useCallback(async (
    CardID: number,
    quantity: number,
    condition: string,
    notes?: string,
    purchaseCost?: number,
    marketPrice?: number
  ) => {
    try {
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          CardID, 
          quantity, 
          condition, 
          notes, 
          purchaseCost, 
          marketPrice 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add to inventory');
      }

      await loadInventory(); // Reload inventory
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add to inventory');
      return false;
    }
  }, [loadInventory]);

  const removeFromInventory = useCallback(async (
    CardID: number,
    condition?: string
  ) => {
    try {
      const url = new URL('/api/inventory', window.location.origin);
      url.searchParams.append('cardId', CardID.toString());
      if (condition) {
        url.searchParams.append('condition', condition);
      }

      const response = await fetch(url, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove from inventory');
      }

      await loadInventory(); // Reload inventory
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove from inventory');
      return false;
    }
  }, [loadInventory]);

  const getCardInventory = useCallback((CardID: number) => {
    return inventory.filter(item => item.CardID === CardID);
  }, [inventory]);

  const getTotalQuantity = useCallback((CardID: number) => {
    return inventory
      .filter(item => item.CardID === CardID)
      .reduce((total, item) => total + item.quantity, 0);
  }, [inventory]);

  const isCardOwned = useCallback((CardID: number) => {
    return inventory.some(item => item.CardID === CardID && item.quantity > 0);
  }, [inventory]);

  const getInventoryStats = useCallback(() => {
    const totalCards = inventory.reduce((sum, item) => sum + item.quantity, 0);
    const uniqueCards = new Set(inventory.map(item => item.CardID)).size;
    const conditionBreakdown = inventory.reduce((acc, item) => {
      acc[item.condition] = (acc[item.condition] || 0) + item.quantity;
      return acc;
    }, {} as Record<string, number>);

    // Calculate total purchase cost and market value
    const totalPurchaseCost = inventory.reduce((sum, item) => {
      return sum + (item.purchaseCost || 0) * item.quantity;
    }, 0);

    const totalMarketValue = inventory.reduce((sum, item) => {
      return sum + (item.marketPrice || 0) * item.quantity;
    }, 0);

    const totalProfit = totalMarketValue - totalPurchaseCost;
    const averageCardValue = totalCards > 0 ? totalMarketValue / totalCards : 0;

    // Find most valuable card (by total value: market price * quantity)
    let mostValuableCard;
    if (inventory.length > 0) {
      const sortedByValue = inventory
        .filter(item => item.marketPrice && item.marketPrice > 0)
        .sort((a, b) => {
          const aValue = (a.marketPrice || 0) * a.quantity;
          const bValue = (b.marketPrice || 0) * b.quantity;
          return bValue - aValue;
        });

      if (sortedByValue.length > 0) {
        const topCard = sortedByValue[0];
        mostValuableCard = {
          cardId: topCard.CardID,
          value: (topCard.marketPrice || 0) * topCard.quantity
        };
      }
    }

    return {
      totalCards,
      uniqueCards,
      totalPurchaseCost,
      totalMarketValue,
      totalProfit,
      averageCardValue,
      mostValuableCard,
      conditionBreakdown
    };
  }, [inventory]);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  return {
    inventory,
    loading,
    error,
    addToInventory,
    removeFromInventory,
    getCardInventory,
    getTotalQuantity,
    isCardOwned,
    getInventoryStats,
    reloadInventory: loadInventory
  };
}