import { PTCGCard, SearchFilters } from './card';

export interface DeckCard extends PTCGCard {
  quantity: number;
}

export interface Deck {
  id: string;
  name: string;
  description: string;
  cards: DeckCard[];
  format: 'Standard' | 'Expanded' | 'Unlimited';
  createdAt: Date;
  updatedAt: Date;
  isValid: boolean;
  pokemonCount: number;
  trainerCount: number;
  energyCount: number;
  totalCards: number;
}

export interface DeckValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  pokemonCount: number;
  trainerCount: number;
  energyCount: number;
  totalCards: number;
}

export interface DeckBuilderFilters extends SearchFilters {
  format: 'Standard' | 'Expanded' | 'Unlimited' | '';
  energyType: string;
  hp: {
    min: number;
    max: number;
  };
  retreatCost: {
    min: number;
    max: number;
  };
}

export interface DeckStats {
  averageHP: number;
  averageRetreatCost: number;
  energyDistribution: { [key: string]: number };
  typeDistribution: { [key: string]: number };
  rarityDistribution: { [key: string]: number };
  abilityCount: number;
  attackerCount: number;
  supportCount: number;
}