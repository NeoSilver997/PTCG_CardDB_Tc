'use client';

import { Filter, X } from 'lucide-react';
import { SearchFilters, AbilityOption, EffectTypeOption, PTCGCard } from '../types/card';

interface SearchFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  abilities: AbilityOption[];
  effectTypes: EffectTypeOption[];
  cards: PTCGCard[];
}

export default function SearchFiltersComponent({
  filters,
  onFiltersChange,
  abilities,
  effectTypes,
  cards
}: SearchFiltersProps) {
  const updateFilter = (key: keyof SearchFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      ability: '',
      effectType: '',
      cardType: '',
      rarity: '',
      tier: '',
      attribute: '',
      regulation: '',
      weaknessType: '',
      resistanceType: ''
    });
  };

  // Get unique values for dropdowns
  const cardTypes = Array.from(new Set(cards.map(card => card.CardType).filter(Boolean)));
  const rarities = Array.from(new Set(cards.map(card => card.Rarity).filter(Boolean)));
  const tiers = Array.from(new Set(cards.map(card => card.Tier).filter(Boolean)));
  const attributes = Array.from(new Set(cards.map(card => card.Type).filter(Boolean)));
  const regulations = Array.from(new Set(cards.map(card => card.RegulationMark).filter(Boolean)));
  const weaknessTypes = Array.from(new Set(cards.map(card => card.WeaknessType).filter(Boolean)));
  const resistanceTypes = Array.from(new Set(cards.map(card => card.ResistanceType).filter(Boolean)));

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  return (
    <div className="bg-white rounded-xl shadow-lg border p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Filter className="h-6 w-6 text-gray-600" />
          <h2 className="text-xl font-bold text-gray-900">Filters</h2>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
            <span>Clear</span>
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Ability Filter */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Ability
          </label>
          <select
            value={filters.ability}
            onChange={(e) => updateFilter('ability', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
          >
            <option value="">All Abilities</option>
            {abilities.map((ability) => (
              <option key={ability.value} value={ability.value}>
                {ability.label} ({ability.count})
              </option>
            ))}
          </select>
        </div>

        {/* Effect Type Filter */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Effect Type
          </label>
          <select
            value={filters.effectType}
            onChange={(e) => updateFilter('effectType', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
          >
            <option value="">All Effect Types</option>
            {effectTypes.map((effect) => (
              <option key={effect.value} value={effect.value}>
                {effect.label} ({effect.count})
              </option>
            ))}
          </select>
        </div>

        {/* Card Type Filter */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Card Type
          </label>
          <select
            value={filters.cardType}
            onChange={(e) => updateFilter('cardType', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
          >
            <option value="">All Card Types</option>
            {cardTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Rarity Filter */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Rarity
          </label>
          <select
            value={filters.rarity}
            onChange={(e) => updateFilter('rarity', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
          >
            <option value="">All Rarities</option>
            {rarities.map((rarity) => (
              <option key={rarity} value={rarity}>
                {rarity}
              </option>
            ))}
          </select>
        </div>

        {/* Tier Filter */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Tier
          </label>
          <select
            value={filters.tier}
            onChange={(e) => updateFilter('tier', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
          >
            <option value="">All Tiers</option>
            {tiers.map((tier) => (
              <option key={tier} value={tier}>
                {tier}
              </option>
            ))}
          </select>
        </div>

        {/* Attribute Filter */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Attribute
          </label>
          <select
            value={filters.attribute}
            onChange={(e) => updateFilter('attribute', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
          >
            <option value="">All Attributes</option>
            {attributes.map((attribute) => (
              <option key={attribute} value={attribute}>
                {attribute}
              </option>
            ))}
          </select>
        </div>

        {/* Weakness Type Filter */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Weakness Type
          </label>
          <select
            value={filters.weaknessType}
            onChange={(e) => updateFilter('weaknessType', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
          >
            <option value="">All Weakness Types</option>
            {weaknessTypes.map((weaknessType) => (
              <option key={weaknessType} value={weaknessType}>
                {weaknessType}
              </option>
            ))}
          </select>
        </div>

        {/* Resistance Type Filter */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Resistance Type
          </label>
          <select
            value={filters.resistanceType}
            onChange={(e) => updateFilter('resistanceType', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
          >
            <option value="">All Resistance Types</option>
            {resistanceTypes.map((resistanceType) => (
              <option key={resistanceType} value={resistanceType}>
                {resistanceType}
              </option>
            ))}
          </select>
        </div>

        {/* Regulation Filter */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Regulation
          </label>
          <select
            value={filters.regulation}
            onChange={(e) => updateFilter('regulation', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
          >
            <option value="">All Regulations</option>
            {regulations.map((regulation) => (
              <option key={regulation} value={regulation}>
                {regulation}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}