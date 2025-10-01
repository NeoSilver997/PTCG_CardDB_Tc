export interface InventoryCard {
  CardID: number;
  quantity: number;
  condition: 'mint' | 'near-mint' | 'lightly-played' | 'moderately-played' | 'heavily-played' | 'damaged';
  notes?: string;
  purchaseCost?: number; // Cost when purchased (per card)
  marketPrice?: number; // Current estimated market value (per card)
  dateAdded: string;
  lastUpdated: string;
}

export interface InventoryFilters {
  condition: string;
  minQuantity: number;
  maxQuantity: number;
  minValue: number;
  maxValue: number;
  dateRange: {
    from: string;
    to: string;
  };
}

export interface InventoryStats {
  totalCards: number;
  totalPurchaseCost: number; // Total amount spent on cards
  totalMarketValue: number; // Current estimated market value
  totalProfit: number; // Market value - purchase cost
  uniqueCards: number;
  conditionBreakdown: Record<string, number>;
  averageCardValue: number;
  mostValuableCard?: {
    name: string;
    value: number;
  };
}

export const CARD_CONDITIONS = [
  { value: 'mint', label: 'Mint (M)' },
  { value: 'near-mint', label: 'Near Mint (NM)' },
  { value: 'lightly-played', label: 'Lightly Played (LP)' },
  { value: 'moderately-played', label: 'Moderately Played (MP)' },
  { value: 'heavily-played', label: 'Heavily Played (HP)' },
  { value: 'damaged', label: 'Damaged (D)' }
] as const;