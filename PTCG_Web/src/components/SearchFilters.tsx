'use client';

import { Filter, X } from 'lucide-react';
import { SearchFilters, AbilityOption, EffectTypeOption, PTCGCard } from '../types/card';
import { useI18n } from '../i18n/context';

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
  const { t } = useI18n();
  
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
  
  // Handle expansions (combine ExpansionName and ExpansionCode, sort by CardID)
  const createExpansionOptions = () => {
    const expansionMap = new Map<string, { count: number; minCardId: number; displayName: string; code: string; name: string }>();
    
    cards.forEach(card => {
      if (card.CardType.includes('能量')) return;
      
      const expansionName = card.ExpansionName?.trim();
      const expansionCode = card.ExpansionCode?.trim();
      
      if (expansionName && expansionName !== '' && expansionCode && expansionCode !== '') {
        // Create combined display format: "Name (Code)"
        const displayName = `${expansionName} (${expansionCode})`;
        const key = `${expansionName}|${expansionCode}`; // Use unique key for mapping
        
        const existing = expansionMap.get(key);
        expansionMap.set(key, {
          count: (existing?.count || 0) + 1,
          minCardId: existing ? Math.min(existing.minCardId, card.CardID) : card.CardID,
          displayName: displayName,
          code: expansionCode,
          name: expansionName
        });
      } else if (expansionName && expansionName !== '') {
        // If only name exists, use just the name
        const key = `${expansionName}|`;
        const existing = expansionMap.get(key);
        expansionMap.set(key, {
          count: (existing?.count || 0) + 1,
          minCardId: existing ? Math.min(existing.minCardId, card.CardID) : card.CardID,
          displayName: expansionName,
          code: '',
          name: expansionName
        });
      } else if (expansionCode && expansionCode !== '') {
        // If only code exists, use just the code
        const key = `|${expansionCode}`;
        const existing = expansionMap.get(key);
        expansionMap.set(key, {
          count: (existing?.count || 0) + 1,
          minCardId: existing ? Math.min(existing.minCardId, card.CardID) : card.CardID,
          displayName: expansionCode,
          code: expansionCode,
          name: ''
        });
      }
    });
    
    return Array.from(expansionMap.entries())
      .map(([key, data]) => ({ 
        value: key, // Use the key for filtering
        displayName: data.displayName,
        count: data.count, 
        minCardId: data.minCardId 
      }))
      .sort((a, b) => b.minCardId - a.minCardId); // Sort by minimum CardID ascending
  };
  
  const expansionOptions = createExpansionOptions();
    
  const weaknessTypeOptions = createFilterOptions('WeaknessType');
  const resistanceTypeOptions = createFilterOptions('ResistanceType');

  const hasActiveFilters = Object.values(filters).some(value =>
    value !== '' && value !== false
  );

  return (
    <div className="bg-white rounded-lg shadow-md border p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-bold text-gray-900">{t.filters}</h2>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700 min-h-[32px] min-w-[60px] justify-center"
          >
            <X className="h-4 w-4" />
            <span className="hidden sm:inline">{t.clear}</span>
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Ability Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.ability}
          </label>
          <select
            value={filters.ability}
            onChange={(e) => updateFilter('ability', e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.effectType}
          </label>
          <select
            value={filters.effectType}
            onChange={(e) => updateFilter('effectType', e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.cardType}
          </label>
          <select
            value={filters.cardType}
            onChange={(e) => updateFilter('cardType', e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="">{t.allCardTypes}</option>
            {cardTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.value} ({option.count})
              </option>
            ))}
          </select>
        </div>

        {/* Rarity Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.rarity}
          </label>
          <select
            value={filters.rarity}
            onChange={(e) => updateFilter('rarity', e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="">{t.allRarities}</option>
            {rarityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.value} ({option.count})
              </option>
            ))}
          </select>
        </div>

        {/* Tier Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.tier}
          </label>
          <select
            value={filters.tier}
            onChange={(e) => updateFilter('tier', e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="">{t.allTiers}</option>
            {tierOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.value} ({option.count})
              </option>
            ))}
          </select>
        </div>

        {/* Attribute Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.attribute}
          </label>
          <select
            value={filters.attribute}
            onChange={(e) => updateFilter('attribute', e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="">{t.allAttributes}</option>
            {attributeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.value} ({option.count})
              </option>
            ))}
          </select>
        </div>

        {/* Weakness Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.weaknessType}
          </label>
          <select
            value={filters.weaknessType}
            onChange={(e) => updateFilter('weaknessType', e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="">{t.allWeaknessTypes}</option>
            {weaknessTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.value} ({option.count})
              </option>
            ))}
          </select>
        </div>

        {/* Resistance Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.resistanceType}
          </label>
          <select
            value={filters.resistanceType}
            onChange={(e) => updateFilter('resistanceType', e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="">{t.allResistanceTypes}</option>
            {resistanceTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.value} ({option.count})
              </option>
            ))}
          </select>
        </div>

        {/* Regulation Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.regulationMark}
          </label>
          <select
            value={filters.regulation}
            onChange={(e) => updateFilter('regulation', e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="">{t.allRegulations}</option>
            {regulationOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.value} ({option.count})
              </option>
            ))}
          </select>
        </div>

        {/* Expansion Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.expansion}
          </label>
          <select
            value={filters.expansion}
            onChange={(e) => updateFilter('expansion', e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="">{t.allExpansions}</option>
            {expansionOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.displayName} ({option.count})
              </option>
            ))}
          </select>
        </div>

        {/* Special Filters */}
        <div className="col-span-full border-t pt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Special Filters</h3>
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.noRetreat}
                  onChange={(e) => onFiltersChange({ ...filters, noRetreat: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">No Retreat Cost</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.noResistance}
                  onChange={(e) => onFiltersChange({ ...filters, noResistance: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">No Resistance</span>
              </label>
              <label className="flex items-center space-x-2">
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
              <div className="border-t pt-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pokemon Type (for Special Filters)
                </label>
                <select
                  value={filters.specialPokemonType}
                  onChange={(e) => updateFilter('specialPokemonType', e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="">All Types</option>
                  {attributeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.value} ({option.count})
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