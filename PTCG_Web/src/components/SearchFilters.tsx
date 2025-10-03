'use client';

import { Filter, X } from 'lucide-react';
import { SearchFilters, AbilityOption, EffectTypeOption } from '../types/card';
import { useI18n } from '../i18n/context';

interface SearchFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  abilities: AbilityOption[];
  effectTypes: EffectTypeOption[];
  allOptions: {
    abilities?: AbilityOption[];
    effectTypes?: EffectTypeOption[];
    cardTypes?: { value: string; label: string }[];
    rarities?: { value: string; label: string }[];
    tiers?: { value: string; label: string }[];
    attributes?: { value: string; label: string }[];
    regulations?: { value: string; label: string }[];
    expansions?: { value: string; label: string }[];
    weaknessTypes?: { value: string; label: string }[];
    resistanceTypes?: { value: string; label: string }[];
  };
}

export default function SearchFiltersComponent({
  filters,
  onFiltersChange,
  abilities,
  effectTypes,
  allOptions = {}
}: SearchFiltersProps) {
  const { t } = useI18n();
  
  const updateFilter = (key: keyof SearchFilters, value: string | boolean) => {
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
      specialPokemonType: '',
      owned: 'all',
      priceRange: 'all'
    });
  };

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (typeof value === 'boolean') {
      return value;
    }
    return value && value !== 'all';
  });

  // Extract options from the allOptions prop
  const cardTypeOptions = allOptions.cardTypes || [];
  const rarityOptions = allOptions.rarities || [];
  const tierOptions = allOptions.tiers || [];
  const attributeOptions = allOptions.attributes || [];
  const regulationOptions = allOptions.regulations || [];
  const expansionOptions = allOptions.expansions || [];
  const weaknessTypeOptions = allOptions.weaknessTypes || [];
  const resistanceTypeOptions = allOptions.resistanceTypes || [];

  return (
    <div className="bg-white rounded-lg shadow-md border p-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-600" />
          <h2 className="text-base font-semibold text-gray-900">{t.filters}</h2>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center space-x-1 text-xs text-gray-500 hover:text-gray-700 min-h-[28px] min-w-[50px] justify-center"
          >
            <X className="h-3 w-3" />
            <span className="hidden sm:inline">{t.clear}</span>
          </button>
        )}
      </div>

      <div className="space-y-3">
        {/* Ability Filter */}
        <div>
          <label htmlFor="ability-filter" className="block text-xs font-medium text-gray-700 mb-1">
            {t.ability}
          </label>
          <select
            id="ability-filter"
            value={filters.ability}
            onChange={(e) => updateFilter('ability', e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
          >
            <option value="">{t.allAbilities}</option>
            {abilities.map((ability) => (
              <option key={ability.value} value={ability.value}>
                {ability.label} ({ability.count})
              </option>
            ))}
          </select>
        </div>

        {/* Effect Type Filter */}
        <div>
          <label htmlFor="effectType-filter" className="block text-xs font-medium text-gray-700 mb-1">
            {t.effectType}
          </label>
          <select
            id="effectType-filter"
            value={filters.effectType}
            onChange={(e) => updateFilter('effectType', e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
          >
            <option value="">{t.allEffectTypes}</option>
            {effectTypes.map((effect) => (
              <option key={effect.value} value={effect.value}>
                {effect.label} ({effect.count})
              </option>
            ))}
          </select>
        </div>

        {/* Card Type Filter */}
        <div>
          <label htmlFor="cardType-filter" className="block text-xs font-medium text-gray-700 mb-1">
            {t.cardType}
          </label>
          <select
            id="cardType-filter"
            value={filters.cardType}
            onChange={(e) => updateFilter('cardType', e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
          >
            <option value="">{t.allCardTypes}</option>
            {cardTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Rarity Filter */}
        <div>
          <label htmlFor="rarity-filter" className="block text-xs font-medium text-gray-700 mb-1">
            {t.rarity}
          </label>
          <select
            id="rarity-filter"
            value={filters.rarity}
            onChange={(e) => updateFilter('rarity', e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
          >
            <option value="">{t.allRarities}</option>
            {rarityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Tier Filter */}
        <div>
          <label htmlFor="tier-filter" className="block text-xs font-medium text-gray-700 mb-1">
            {t.tier}
          </label>
          <select
            id="tier-filter"
            value={filters.tier}
            onChange={(e) => updateFilter('tier', e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
          >
            <option value="">{t.allTiers}</option>
            {tierOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Attribute Filter */}
        <div>
          <label htmlFor="attribute-filter" className="block text-xs font-medium text-gray-700 mb-1">
            {t.attribute}
          </label>
          <select
            id="attribute-filter"
            value={filters.attribute}
            onChange={(e) => updateFilter('attribute', e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
          >
            <option value="">{t.allAttributes}</option>
            {attributeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Weakness Type Filter */}
        <div>
          <label htmlFor="weaknessType-filter" className="block text-xs font-medium text-gray-700 mb-1">
            {t.weaknessType}
          </label>
          <select
            id="weaknessType-filter"
            value={filters.weaknessType}
            onChange={(e) => updateFilter('weaknessType', e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
          >
            <option value="">{t.allWeaknessTypes}</option>
            {weaknessTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Resistance Type Filter */}
        <div>
          <label htmlFor="resistanceType-filter" className="block text-xs font-medium text-gray-700 mb-1">
            {t.resistanceType}
          </label>
          <select
            id="resistanceType-filter"
            value={filters.resistanceType}
            onChange={(e) => updateFilter('resistanceType', e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
          >
            <option value="">{t.allResistanceTypes}</option>
            {resistanceTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Regulation Filter */}
        <div>
          <label htmlFor="regulation-filter" className="block text-xs font-medium text-gray-700 mb-1">
            {t.regulationMark}
          </label>
          <select
            id="regulation-filter"
            value={filters.regulation}
            onChange={(e) => updateFilter('regulation', e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
          >
            <option value="">{t.allRegulations}</option>
            {regulationOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Expansion Filter */}
        <div>
          <label htmlFor="expansion-filter" className="block text-xs font-medium text-gray-700 mb-1">
            {t.expansion}
          </label>
          <select
            id="expansion-filter"
            value={filters.expansion}
            onChange={(e) => updateFilter('expansion', e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
          >
            <option value="">{t.allExpansions}</option>
            {expansionOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Special Filters */}
        <div className="col-span-full border-t pt-3">
          <h3 className="text-xs font-medium text-gray-700 mb-2">Special Filters</h3>
          <div className="space-y-2">
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={!!filters.noRetreat}
                  onChange={(e) => updateFilter('noRetreat', e.target.checked)}
                  className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-xs text-gray-700">No Retreat Cost</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={!!filters.noResistance}
                  onChange={(e) => updateFilter('noResistance', e.target.checked)}
                  className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-xs text-gray-700">No Resistance</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={!!filters.noWeakness}
                  onChange={(e) => updateFilter('noWeakness', e.target.checked)}
                  className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-xs text-gray-700">No Weakness</span>
              </label>
            </div>

            {/* Owned Filter */}
            <div>
              <label htmlFor="owned-filter" className="block text-xs font-medium text-gray-700 mb-1">
                {t.ownershipStatus || 'Ownership Status'}
              </label>
              <select
                id="owned-filter"
                value={filters.owned}
                onChange={(e) => updateFilter('owned', e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
              >
                <option value="all">{t.allCards || 'All Cards'}</option>
                <option value="owned">{t.ownedOnly || 'Owned Cards Only'}</option>
                <option value="unowned">{t.unownedOnly || 'Unowned Cards Only'}</option>
              </select>
            </div>

            {/* Price Range Filter */}
            <div>
              <label htmlFor="priceRange-filter" className="block text-xs font-medium text-gray-700 mb-1">
                {t.priceRange || 'Price Range'}
              </label>
              <select
                id="priceRange-filter"
                value={filters.priceRange}
                onChange={(e) => updateFilter('priceRange', e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
              >
                <option value="all">{t.allPrices || 'All Prices'}</option>
                <option value="low">{t.underTen || 'Under $10'}</option>
                <option value="medium">{t.tenToFifty || '$10 - $50'}</option>
                <option value="high">{t.overFifty || 'Over $50'}</option>
                <option value="no-price">{t.noPriceData || 'No Price Data'}</option>
              </select>
            </div>

            {/* Pokemon Type for Special Filters */}
            {(filters.noRetreat || filters.noResistance || filters.noWeakness) && (
              <div className="border-t pt-2">
                <label htmlFor="specialPokemonType-filter" className="block text-xs font-medium text-gray-700 mb-1">
                  Pokemon Type (for Special Filters)
                </label>
                <select
                  id="specialPokemonType-filter"
                  value={filters.specialPokemonType}
                  onChange={(e) => updateFilter('specialPokemonType', e.target.value)}
                  className="w-full border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                >
                  <option value="">All Types</option>
                  {attributeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
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