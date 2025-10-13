export interface PTCGCard {
  Name: string;
  Evolution: string;
  EvolutionStage: string;
  CardID: number; // WebCardID converted to number
  ImageURL: string;
  OriginalImageURL?: string; // Original internet link for detailed views
  CardType: string;
  HP: string;
  Type: string;
  Attribute: string;
  Weakness: string;
  WeaknessType: string;
  Resistance: string;
  ResistanceType: string;
  Skill1Name: string;
  Skill1Energy: string;
  Skill1Damage: string;
  Skill1Effect: string;
  Skill2Name: string;
  Skill2Energy: string;
  Skill2Damage: string;
  Skill2Effect: string;
  AbilityName: string;
  AbilityEffect: string;
  RetreatCost: number;
  Illustrator: string;
  Rarity: string;
  ExpansionCode: string;
  ExpansionName: string;
  CollectorNumber: string;
  RegulationMark: string;
  Artist: string;
  SpecialTag: string;
  PrimaryEffectType: string;
  SpecialEffectType: string;
  AbilityStats: string;
  Tier?: string;
  Score?: string;
  ScoreBreakdown?: string;
}

export interface SearchFilters {
  ability: string;
  effectType: string;
  cardType: string;
  rarity: string;
  tier: string;
  attribute: string;
  regulation: string;
  expansion: string;
  weaknessType: string;
  resistanceType: string;
  noRetreat: boolean;
  noResistance: boolean;
  noWeakness: boolean;
  specialPokemonType: string;
  owned: string; // 'all', 'owned', 'unowned'
  priceRange: string; // 'all', 'low', 'medium', 'high', 'no-price'
}

export interface AbilityOption {
  value: string;
  label: string;
  count: number;
}

export interface EffectTypeOption {
  value: string;
  label: string;
  count: number;
}