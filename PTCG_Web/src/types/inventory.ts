export interface InventoryCard {
  CardID: number;
  quantity: number;
  condition: 'mint' | 'near-mint' | 'lightly-played' | 'moderately-played' | 'heavily-played' | 'damaged';
  notes?: string;
  dateAdded: string;
  lastUpdated: string;
}

export interface InventoryFilters {
  condition: string;
  minQuantity: number;
  maxQuantity: number;
  dateRange: {
    from: string;
    to: string;
  };
}

export interface InventoryStats {
  totalCards: number;
  totalValue: number; // Could be implemented later with price data
  uniqueCards: number;
  conditionBreakdown: Record<string, number>;
}

export const CARD_CONDITIONS = [
  { value: 'mint', label: 'Mint (M)' },
  { value: 'near-mint', label: 'Near Mint (NM)' },
  { value: 'lightly-played', label: 'Lightly Played (LP)' },
  { value: 'moderately-played', label: 'Moderately Played (MP)' },
  { value: 'heavily-played', label: 'Heavily Played (HP)' },
  { value: 'damaged', label: 'Damaged (D)' }
] as const;