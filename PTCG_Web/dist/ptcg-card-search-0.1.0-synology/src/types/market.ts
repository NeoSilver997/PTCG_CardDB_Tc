export interface MarketPrice {
  cardId: number;
  price: number;
  currency: string;
  source: string; // e.g., 'TCGPlayer', 'eBay', 'Manual', 'CardMarket'
  condition: string; // 'Near Mint', 'Lightly Played', 'Moderately Played', 'Heavily Played', 'Damaged'
  date: string; // ISO date string
  updatedAt: string; // ISO date string
  metadata?: {
    cardName?: string;
    rarity?: string;
    stockQuantity?: number;
    isSoldOut?: boolean;
    productUrl?: string;
    expansionCode?: string;
    cardNumber?: string;
    mappingKey?: string;
    language?: string;
  };
}

export interface MarketPriceHistory {
  cardId: number;
  prices: MarketPrice[];
}

export interface PriceConditions {
  nearMint?: number;
  lightlyPlayed?: number;
  moderatelyPlayed?: number;
  heavilyPlayed?: number;
  damaged?: number;
}

export interface MarketCard extends PTCGCard {
  marketPrices?: MarketPrice[];
  averagePrice?: number;
  priceByCondition?: PriceConditions;
  priceUpdated?: string;
  priceChange?: {
    amount: number;
    percentage: number;
    direction: 'up' | 'down' | 'stable';
  };
}

// Import the PTCGCard interface
import { PTCGCard } from './card';