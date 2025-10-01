'use client';

import { useState, useEffect, useCallback } from 'react';

export interface MarketPrice {
  id: string;
  cardId: number;
  price: number;
  currency: string;
  condition: string;
  source?: string;
  date: string;
  updatedAt: string;
  metadata?: {
    cardName?: string;
    expansionCode?: string;
  };
}

export interface MarketPriceData {
  cardId: number;
  prices: MarketPrice[];
  totalPrices: number;
}

export function useMarketPrice(cardId?: number) {
  const [marketPrice, setMarketPrice] = useState<MarketPrice | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMarketPrice = useCallback(async (cardIdToFetch: number) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/market-prices?cardId=${cardIdToFetch}`);
      if (!response.ok) {
        throw new Error('Failed to fetch market price');
      }
      
      const data: MarketPriceData = await response.json();
      
      if (data.prices && data.prices.length > 0) {
        // Get the most recent price (prices are sorted by date descending)
        const latestPrice = data.prices[0];
        setMarketPrice(latestPrice);
      } else {
        setMarketPrice(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch market price');
      setMarketPrice(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (cardId) {
      fetchMarketPrice(cardId);
    }
  }, [cardId, fetchMarketPrice]);

  return {
    marketPrice,
    loading,
    error,
    refetch: cardId ? () => fetchMarketPrice(cardId) : () => {}
  };
}

export function useMarketPrices() {
  const [marketPrices, setMarketPrices] = useState<{[cardId: string]: MarketPrice[]}>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAllMarketPrices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/market-prices?format=raw');
      if (!response.ok) {
        throw new Error('Failed to fetch market prices');
      }
      
      const data = await response.json();
      setMarketPrices(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch market prices');
      setMarketPrices({});
    } finally {
      setLoading(false);
    }
  }, []);

  const getCardMarketPrice = useCallback((cardId: number): MarketPrice | null => {
    const prices = marketPrices[cardId.toString()];
    if (!prices || prices.length === 0) return null;
    
    // Get the most recent price
    const sortedPrices = prices.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    return sortedPrices[0];
  }, [marketPrices]);

  return {
    marketPrices,
    loading,
    error,
    loadAllMarketPrices,
    getCardMarketPrice
  };
}