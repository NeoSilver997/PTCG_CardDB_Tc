'use client';

import { X, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { PTCGCard } from '../types/card';
import { useState, useMemo } from 'react';

interface CardDetailModalProps {
  card: PTCGCard;
  relatedCards: PTCGCard[];
  onClose: () => void;
  onCardClick: (card: PTCGCard) => void;
  allCards: PTCGCard[]; // Add allCards prop for evolution chain
}

export default function CardDetailModal({
  card,
  relatedCards,
  onClose,
  onCardClick,
  allCards
}: CardDetailModalProps) {
  const getTierColor = (tier?: string) => {
    switch (tier) {
      case 'S+': return 'bg-red-500 text-white';
      case 'S': return 'bg-orange-500 text-white';
      case 'A+': return 'bg-yellow-500 text-white';
      case 'A': return 'bg-green-500 text-white';
      case 'B+': return 'bg-blue-500 text-white';
      case 'B': return 'bg-indigo-500 text-white';
      case 'C+': return 'bg-purple-500 text-white';
      case 'C': return 'bg-gray-500 text-white';
      case 'D': return 'bg-gray-600 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'fire': return '🔥';
      case 'water': return '💧';
      case 'grass': return '🌱';
      case 'electric': return '⚡';
      case 'psychic': return '🔮';
      case 'fighting': return '👊';
      case 'darkness': return '🌑';
      case 'metal': return '⚙️';
      case 'fairy': return '✨';
      case 'dragon': return '🐉';
      case 'colorless': return '⚪';
      default: return '🎴';
    }
  };

  const renderColorlessEnergyCost = (energyCost: string) => {
    if (!energyCost || energyCost.trim() === '') return null;

    const energyTypes = energyCost.split(',').map(type => type.trim());
    const energyCount = energyTypes.length;

    return (
      <div className="flex items-center space-x-1">
        {Array.from({ length: energyCount }, (_, index) => {
          const energyImageUrl = `/energy/Colorless.png`;
          return (
            <div
              key={index}
              className="w-8 h-8 rounded-full bg-white border border-gray-300 shadow-sm overflow-hidden"
              title="Colorless"
            >
              <img
                src={energyImageUrl}
                alt="Colorless"
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to emoji if image fails to load
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.innerHTML = '⚪';
                }}
              />
            </div>
          );
        })}
      </div>
    );
  };

  const evolutionChain = useMemo(() => {
    const getEvolutionChain = (currentCard: PTCGCard): PTCGCard[] => {
      console.log('🔄 Evolution Chain Debug for:', currentCard.Name);
      console.log('📝 Evolution field:', currentCard.Evolution);
      console.log('📊 Total cards in database:', allCards.length);

      if (!currentCard.Evolution || !allCards.length) {
        console.log('❌ No evolution field or no cards in database, returning current card');
        return [currentCard];
      }

      // Parse the evolution chain from the Evolution field
      // Format: "妙蛙種子 → 妙蛙草 → 妙蛙花 → 超級妙蛙花ex → 妙蛙花ex"
      const evolutionNames = currentCard.Evolution.split('→').map(name => name.trim()).filter(name => name.length > 0);
      console.log('🔍 Parsed evolution names:', evolutionNames);

      const chain: PTCGCard[] = [];

      // Find cards for each evolution stage
      evolutionNames.forEach(evolutionName => {
        console.log(`🔎 Searching for: "${evolutionName}"`);
        
        // Find all cards with this exact name (excluding energy cards)
        const matchingCards = allCards.filter(c =>
          c.Name === evolutionName &&
          !c.CardType.includes('能量')
        );
        
        console.log(`📋 Found ${matchingCards.length} matching cards for "${evolutionName}"`);
        if (matchingCards.length > 0) {
          console.log('🎯 Matching cards:', matchingCards.map(c => ({ name: c.Name, score: c.Score, type: c.CardType })));
        }

        // Add the best card (prioritize higher scores), but avoid duplicates
        if (matchingCards.length > 0) {
          const bestCard = matchingCards.sort((a, b) => (parseFloat(b.Score || '0') - parseFloat(a.Score || '0')))[0];
          console.log(`⭐ Selected best card: ${bestCard.Name} (Score: ${bestCard.Score})`);
          
          // Only add if we don't already have a card with this name
          if (!chain.some(c => c.Name === bestCard.Name)) {
            chain.push(bestCard);
            console.log(`✅ Added to chain: ${bestCard.Name}`);
          } else {
            console.log(`⏭️ Skipped duplicate: ${bestCard.Name}`);
          }
        } else {
          console.log(`❌ No cards found for: "${evolutionName}"`);
        }
      });

      console.log('🔗 Chain before filtering:', chain.map(c => c.Name));

      // If no evolution chain found, return just the current card
      const result = chain.length > 0 ? chain : [currentCard];
      console.log('📋 Result before current card filter:', result.map(c => c.Name));
      
      // Filter out the current card from the evolution chain display
      // Only show cards that are different from the current card
      const filteredResult = result.filter(chainCard => chainCard.Name !== currentCard.Name);
      console.log('🎯 Final filtered result:', filteredResult.map(c => c.Name));
      console.log('📏 Final chain length:', filteredResult.length);
      
      // If no other evolutions exist, don't show the evolution chain
      return filteredResult;
    };

    return getEvolutionChain(card);
  }, [card, allCards]);

  const renderScoreBreakdownChart = (breakdown: string) => {
    if (!breakdown) return null;

    // Parse the breakdown string like "Base:5.0|Meta:0.0|Exp:3.0|Func:4.0|Syn:0.0|"
    const components = breakdown.split('|').filter(item => item.trim() !== '');
    const parsedData = components.map(item => {
      const [label, value] = item.split(':');
      return {
        label: label.trim(),
        value: parseFloat(value) || 0
      };
    }).filter(item => item.value > 0); // Only show components with values > 0

    if (parsedData.length === 0) return null;

    // Find max value for scaling
    const maxValue = Math.max(...parsedData.map(item => item.value));

    return (
      <div className="space-y-3">
        <div className="text-lg font-medium text-gray-700 mb-4">Score Breakdown</div>
        {parsedData.map((item, index) => {
          const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
          return (
            <div key={index} className="flex items-center space-x-4">
              <div className="w-20 text-sm text-gray-600 font-medium">{item.label}</div>
              <div className="flex-1 bg-gray-200 rounded-full h-4">
                <div
                  className="bg-blue-500 h-4 rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
              <div className="w-10 text-sm text-gray-600 font-medium text-right">{item.value}</div>
            </div>
          );
        })}
        <div className="text-sm text-gray-500 mt-3">
          Total Score: {parsedData.reduce((sum, item) => sum + item.value, 0).toFixed(1)}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50">
      <div className="bg-white rounded-xl max-w-7xl w-full max-h-[95vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b">
          <div className="flex items-center space-x-4">
            <h2 className="text-3xl font-bold text-gray-900">{card.Name}</h2>
            {card.Type && (
              <span className="text-3xl" title={card.Type}>
                {getTypeIcon(card.Type)}
              </span>
            )}
            {card.Tier && (
              <span className={`px-4 py-2 rounded-full text-base font-semibold ${getTierColor(card.Tier)}`}>
                {card.Tier}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-3 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-7 w-7" />
          </button>
        </div>

        <div className="flex flex-col xl:flex-row max-h-[calc(95vh-120px)] overflow-y-auto">
          {/* Card Image and Basic Info */}
          <div className="xl:w-2/5 p-8">
            <div className="aspect-[5/7] bg-gray-100 rounded-xl overflow-hidden mb-6 shadow-lg">
              {card.ImageURL ? (
                <img
                  src={card.ImageURL}
                  alt={card.Name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder-card.svg';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <div className="text-7xl mb-6">🎴</div>
                    <div className="text-xl">No Image Available</div>
                  </div>
                </div>
              )}
            </div>

            {/* Basic Stats */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-6 text-base">
                <div>
                  <span className="text-gray-600 font-medium">Type:</span>
                  <div className="font-semibold text-lg">{card.CardType}</div>
                </div>
                <div>
                  <span className="text-gray-600 font-medium">Rarity:</span>
                  <div className="font-semibold text-lg">{card.Rarity}</div>
                </div>
                {card.CardType.includes('寶可夢') && (
                  <div>
                    <span className="text-gray-600 font-medium">HP:</span>
                    <div className="font-semibold text-lg">{card.HP || 'N/A'}</div>
                  </div>
                )}
                {card.CardType.includes('寶可夢') && (
                  <div>
                    <span className="text-gray-600 font-medium">Evolution:</span>
                    <div className="font-semibold text-lg">{card.Evolution}</div>
                  </div>
                )}
                {card.CardType.includes('寶可夢')  && (
                  <div className="group relative">
                    <span className="text-gray-600 font-medium">Weakness:</span>
                    <div className="font-semibold text-lg flex items-center space-x-2">
                      <span className="text-red-600">{card.Weakness}</span>
                      {card.WeaknessType && (
                        <div className="flex items-center space-x-1">
                          {renderEnergyCost(card.WeaknessType)}
                        </div>
                      )}
                    </div>
                    <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
                      Takes extra damage from this type
                    </div>
                  </div>
                )}
                {card.CardType.includes('寶可夢')  && (
                  <div className="group relative">
                    <span className="text-gray-600 font-medium">Resistance:</span>
                    <div className="font-semibold text-lg flex items-center space-x-2">
                      <span className="text-green-600">{card.Resistance}</span>
                      {card.ResistanceType && (
                        <div className="flex items-center space-x-1">
                          {renderEnergyCost(card.ResistanceType)}
                        </div>
                      )}
                    </div>
                    <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
                      Takes less damage from this type
                    </div>
                  </div>
                )}
                {card.RetreatCost && card.CardType.includes('寶可夢') && (
                  <div>
                    <span className="text-gray-600 font-medium">Retreat Cost:</span>
                    <div className="font-semibold text-lg flex items-center space-x-2">
                      {renderEnergyCost(card.RetreatCost)}
                    </div>
                  </div>
                )}
                {card.CardType.includes('寶可夢') && card.Tier && (
                  <div>
                    <span className="text-gray-600 font-medium">Tier:</span>
                    <div className="font-semibold text-lg">
                      <span className={`px-2 py-1 rounded-full text-sm font-bold ${getTierColor(card.Tier)}`}>
                        {card.Tier}
                      </span>
                    </div>
                  </div>
                )}
                {card.CardType.includes('寶可夢') && card.Score && (
                  <div>
                    <span className="text-gray-600 font-medium">Score:</span>
                    <div className="font-semibold text-lg text-blue-600">{card.Score}</div>
                  </div>
                )}
                {card.CardType.includes('寶可夢') && card.SpecialTag && (
                  <div>
                    <span className="text-gray-600 font-medium">Special Tag:</span>
                    <div className="font-semibold text-lg">
                      <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-sm font-medium">
                        {card.SpecialTag}
                      </span>
                    </div>
                  </div>
                )}
                {card.Illustrator && (
                  <div>
                    <span className="text-gray-600 font-medium">Illustrator:</span>
                    <div className="font-semibold text-lg">{card.Illustrator}</div>
                  </div>
                )}
                {card.RegulationMark && (
                  <div>
                    <span className="text-gray-600 font-medium">Regulation:</span>
                    <div className="font-semibold text-lg">{card.RegulationMark}</div>
                  </div>
                )}
              </div>

              {/* Additional Details */}
              {(card.ExpansionName || card.ExpansionCode || card.Illustrator || card.Artist || card.SpecialTag) && (
                <div className="pt-4 border-t space-y-3">
                  {card.ExpansionName && (
                    <div>
                      <span className="text-gray-600 text-base font-medium">Expansion:</span>
                      <div className="font-semibold text-lg">{card.ExpansionName}</div>
                      {card.ExpansionCode && (
                        <div className="text-sm text-gray-500">Code: {card.ExpansionCode}</div>
                      )}
                    </div>
                  )}
                  {(card.Illustrator || card.Artist) && (
                    <div>
                      <span className="text-gray-600 text-base font-medium">Artist:</span>
                      <div className="font-semibold text-lg">{card.Illustrator || card.Artist}</div>
                    </div>
                  )}
                  {card.SpecialTag && (
                    <div>
                      <span className="text-gray-600 text-base font-medium">Special Tag:</span>
                      <div className="font-semibold text-lg">{card.SpecialTag}</div>
                    </div>
                  )}
                </div>
              )}

              {card.Score && (
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-600 text-base font-medium">Score:</span>
                    <span className="font-bold text-2xl">{card.Score}</span>
                  </div>
                  {card.ScoreBreakdown && renderScoreBreakdownChart(card.ScoreBreakdown)}
                </div>
              )}

              {card.ImageURL && (
                <div className="pt-4 border-t">
                  <a
                    href={card.ImageURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-3 text-blue-600 hover:text-blue-800 text-base font-medium"
                  >
                    <ExternalLink className="h-5 w-5" />
                    <span>View Full Image</span>
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Card Details */}
          <div className="xl:w-3/5 p-8 border-t xl:border-t-0 xl:border-l">
            {/* Skills */}
            <div className="mb-8">

              {/* Skill 1 */}
              {(card.Skill1Name || card.Skill1Effect) && (
                <div className="mb-6 p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 text-xl mb-2">{card.Skill1Name || 'Skill 1'}</h4>
                      <div className="flex items-center space-x-4 text-sm">
                        {card.Skill1Energy && renderEnergyCost(card.Skill1Energy)}
                        {card.Skill1Damage && (
                          <div className="flex items-center space-x-2">
                            <span className="text-red-600 font-semibold text-lg">💥</span>
                            <span className="font-bold text-red-600">{card.Skill1Damage}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        Attack
                      </div>
                    </div>
                  </div>
                  {card.Skill1Effect && (
                    <div className="bg-white p-4 rounded-lg border-l-4 border-blue-500">
                      <p className="text-gray-700 text-base leading-relaxed">{card.Skill1Effect}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Skill 2 */}
              {(card.Skill2Name || card.Skill2Effect) && (
                <div className="mb-6 p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 text-xl mb-2">{card.Skill2Name || 'Skill 2'}</h4>
                      <div className="flex items-center space-x-4 text-sm">
                        {card.Skill2Energy && renderEnergyCost(card.Skill2Energy)}
                        {card.Skill2Damage && (
                          <div className="flex items-center space-x-2">
                            <span className="text-red-600 font-semibold text-lg">💥</span>
                            <span className="font-bold text-red-600">{card.Skill2Damage}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        Attack
                      </div>
                    </div>
                  </div>
                  {card.Skill2Effect && (
                    <div className="bg-white p-4 rounded-lg border-l-4 border-purple-500">
                      <p className="text-gray-700 text-base leading-relaxed">{card.Skill2Effect}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Ability */}
            {(card.AbilityName || card.AbilityEffect) && (
              <div className="mb-8">
                <div className="p-6 bg-blue-50 rounded-xl">
                  {card.AbilityName && (
                    <h4 className="font-semibold text-blue-900 mb-3 text-xl">{card.AbilityName}</h4>
                  )}
                  {card.AbilityEffect && (
                    <p className="text-blue-800 text-base leading-relaxed">{card.AbilityEffect}</p>
                  )}
                </div>
              </div>
            )}

            {/* Effect Classifications */}
            {(card.PrimaryEffectType || card.SpecialEffectType || card.AbilityStats) && (
              <div className="mb-8">
                <div className="space-y-4">
                  {card.PrimaryEffectType && (
                    <div>
                      <span className="text-base text-gray-600 font-medium">Primary Effects:</span>
                      <div className="flex flex-wrap gap-3 mt-2">
                        {card.PrimaryEffectType.split(',').map((effect, index) => (
                          <span
                            key={index}
                            className="inline-block bg-green-100 text-green-800 text-sm px-4 py-2 rounded-full font-medium"
                          >
                            {effect.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {card.SpecialEffectType && card.SpecialEffectType !== '無' && (
                    <div>
                      <span className="text-base text-gray-600 font-medium">Special Effects:</span>
                      <div className="flex flex-wrap gap-3 mt-2">
                        {card.SpecialEffectType.split(',').map((effect, index) => (
                          <span
                            key={index}
                            className="inline-block bg-purple-100 text-purple-800 text-sm px-4 py-2 rounded-full font-medium"
                          >
                            {effect.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {card.AbilityStats && card.AbilityStats !== '無' && (
                    <div>
                      <span className="text-base text-gray-600 font-medium">Ability Stats:</span>
                      <div className="flex flex-wrap gap-3 mt-2">
                        {card.AbilityStats.split(',').map((ability, index) => (
                          <span
                            key={index}
                            className="inline-block bg-blue-100 text-blue-800 text-sm px-4 py-2 rounded-full font-medium"
                          >
                            {ability.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Evolution Chain Progression */}
            {card.Evolution && evolutionChain.length > 0 && (
              <div className="mb-8">

                {/* Evolution Chain Text Display */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
                  <div className="text-center">
                    <div className="text-lg font-medium text-gray-800">
                      {evolutionChain.map((chainCard, index) => (
                        <span key={chainCard.Name + index}>
                          <span
                            className={`cursor-pointer hover:text-blue-600 transition-colors ${
                              chainCard.Name === card.Name ? 'font-bold text-blue-700' : ''
                            }`}
                            onClick={() => onCardClick(chainCard)}
                          >
                            {chainCard.Name}
                          </span>
                          {index < evolutionChain.length - 1 && (
                            <span className="text-gray-500 mx-2">→</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Related Cards */}
            {relatedCards.length > 0 && (
              <div>
                <div className="grid grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                  {relatedCards.map((relatedCard) => (
                    <div
                      key={relatedCard.CardID}
                      onClick={() => onCardClick(relatedCard)}
                      className="bg-gray-50 rounded-xl p-4 cursor-pointer hover:bg-gray-100 hover:scale-105 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      <div className="aspect-[5/7] bg-gray-200 rounded-lg mb-3 overflow-hidden">
                        {relatedCard.ImageURL ? (
                          <img
                            src={relatedCard.ImageURL}
                            alt={relatedCard.Name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-lg">
                            🎴
                          </div>
                        )}
                      </div>
                      <h4 className="font-medium text-gray-900 text-sm leading-tight line-clamp-2 mb-2">
                        {relatedCard.Name}
                      </h4>
                      <div className="flex items-center justify-between">
                        {relatedCard.Tier && (
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getTierColor(relatedCard.Tier)}`}>
                            {relatedCard.Tier}
                          </span>
                        )}
                        {relatedCard.Score && (
                          <span className="text-xs text-gray-600 font-medium">
                            {relatedCard.Score}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}