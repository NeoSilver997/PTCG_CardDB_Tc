'use client';

import { useState, useEffect, useCallback } from 'react';
import { InventoryCard } from '../types/inventory';

export function useInventory() {
  const [inventory, setInventory] = useState<InventoryCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadInventoryFromCards = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/cards');
      if (!response.ok) {
        throw new Error('Failed to load cards');
      }
      const cards = await response.json();

      // Extract inventory data from cards
      const inventoryData: InventoryCard[] = [];
      cards.forEach((card: any) => {
        if (card.Inventory && Array.isArray(card.Inventory)) {
          card.Inventory.forEach((inv: any) => {
            inventoryData.push({
              id: inv.id,
              CardID: card.CardID,
              quantity: inv.quantity,
              condition: inv.condition,
              notes: inv.notes || '',
              purchaseCost: inv.purchaseCost,
              marketPrice: inv.marketPrice,
              dateAdded: inv.dateAdded,
              lastUpdated: inv.lastUpdated
            });
          });
        }
      });

      setInventory(inventoryData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inventory from cards');
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

      await loadInventoryFromCards(); // Reload inventory
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add to inventory');
      return false;
    }
  }, [loadInventoryFromCards]);

  const removeFromInventory = useCallback(async (
    identifier: number | { CardID: number; condition?: string }
  ) => {
    try {
      const url = new URL('/api/inventory', window.location.origin);

      if (typeof identifier === 'number') {
        // Delete by record ID
        url.searchParams.append('id', identifier.toString());
      } else {
        // Delete by CardID and condition
        url.searchParams.append('CardID', identifier.CardID.toString());
        if (identifier.condition) {
          url.searchParams.append('condition', identifier.condition);
        }
      }

      const response = await fetch(url, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove from inventory');
      }

      await loadInventoryFromCards(); // Reload inventory
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove from inventory');
      return false;
    }
  }, [loadInventoryFromCards]);

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
    // Don't automatically load inventory - call loadInventoryFromCards() manually when needed
  }, []);

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
    loadInventory: loadInventoryFromCards
  };
}