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
      expansion: '',
      weaknessType: '',
      resistanceType: '',
      noRetreat: false,
      noResistance: false,
      noWeakness: false,
      specialPokemonType: ''
    });
  };

  // Helper function to create filter options with counts, sorted by count descending
  const createFilterOptions = (field: keyof PTCGCard, excludeEnergy: boolean = true) => {
    const countMap = new Map<string, number>();
    
    cards.forEach(card => {
      if (excludeEnergy && card.CardType.includes('能量')) return;
      
      const value = card[field] as string;
      if (value && value.trim() !== '') {
        countMap.set(value, (countMap.get(value) || 0) + 1);
      }
    });
    
    return Array.from(countMap.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count); // Sort by count descending
  };

  // Get filter options with counts
  const cardTypeOptions = createFilterOptions('CardType', false);
  const rarityOptions = createFilterOptions('Rarity');
  const tierOptions = createFilterOptions('Tier');
  const attributeOptions = createFilterOptions('Type');
  const regulationOptions = createFilterOptions('RegulationMark');
  
  // Handle expansions (combine ExpansionName and ExpansionCode, remove duplicates)
  const expansionNameOptions = createFilterOptions('ExpansionName');
  const expansionCodeOptions = createFilterOptions('ExpansionCode');
  const expansionOptions = [...expansionNameOptions, ...expansionCodeOptions]
    .reduce((acc, option) => {
      const existing = acc.find(item => item.value === option.value);
      if (existing) {
        existing.count += option.count;
      } else {
        acc.push({ ...option });
      }
      return acc;
    }, [] as { value: string; count: number }[])
    .sort((a, b) => b.count - a.count);
    
  const weaknessTypeOptions = createFilterOptions('WeaknessType');
  const resistanceTypeOptions = createFilterOptions('ResistanceType');

  const hasActiveFilters = Object.values(filters).some(value =>
    value !== '' && value !== false
  );

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
            {cardTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.value} ({option.count})
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
            {rarityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.value} ({option.count})
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
            {tierOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.value} ({option.count})
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
            {attributeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.value} ({option.count})
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
            {weaknessTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.value} ({option.count})
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
            {resistanceTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.value} ({option.count})
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
            {regulationOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.value} ({option.count})
              </option>
            ))}
          </select>
        </div>

        {/* Expansion Filter */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Expansion
          </label>
          <select
            value={filters.expansion}
            onChange={(e) => updateFilter('expansion', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
          >
            <option value="">All Expansions</option>
            {expansionOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.value} ({option.count})
              </option>
            ))}
          </select>
        </div>

        {/* Special Filters */}
        <div className="col-span-full border-t pt-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Special Filters</h3>
          <div className="space-y-4">
            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={filters.noRetreat}
                  onChange={(e) => onFiltersChange({ ...filters, noRetreat: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">No Retreat Cost</span>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={filters.noResistance}
                  onChange={(e) => onFiltersChange({ ...filters, noResistance: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">No Resistance</span>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={filters.noWeakness}
                  onChange={(e) => onFiltersChange({ ...filters, noWeakness: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">No Weakness</span>
              </label>
            </div>

            {/* Pokemon Type for Special Filters */}
            {(filters.noRetreat || filters.noResistance || filters.noWeakness) && (
              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pokemon Type (for Special Filters)
                </label>
                <select
                  value={filters.specialPokemonType}
                  onChange={(e) => updateFilter('specialPokemonType', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="">All Types</option>
                  {attributes.map((attribute) => (
                    <option key={attribute} value={attribute}>
                      {attribute}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Filter Pokemon by type when special filters are active
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}