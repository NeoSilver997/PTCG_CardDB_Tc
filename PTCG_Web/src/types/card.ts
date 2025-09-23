export interface PTCGCard {
  Name: string;
  Evolution: string;
  EvolutionStage: string;
  CardID: string;
  ImageURL: string;
  CardType: string;
  HP: string;
  Type: string;
  Weakness: string;
  Resistance: string;
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
  RetreatCost: string;
  Illustrator: string;
  Rarity: string;
  ExpansionCode: string;
  ExpansionName: string;
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