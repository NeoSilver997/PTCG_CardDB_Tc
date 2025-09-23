'use client';

import { X, ExternalLink } from 'lucide-react';
import { PTCGCard } from '../types/card';

interface CardDetailModalProps {
  card: PTCGCard;
  relatedCards: PTCGCard[];
  onClose: () => void;
  onCardClick: (card: PTCGCard) => void;
}

export default function CardDetailModal({
  card,
  relatedCards,
  onClose,
  onCardClick
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
      <div className="space-y-2">
        <div className="text-sm font-medium text-gray-700 mb-3">Score Breakdown</div>
        {parsedData.map((item, index) => {
          const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
          return (
            <div key={index} className="flex items-center space-x-3">
              <div className="w-16 text-xs text-gray-600 font-medium">{item.label}</div>
              <div className="flex-1 bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
              <div className="w-8 text-xs text-gray-600 font-medium text-right">{item.value}</div>
            </div>
          );
        })}
        <div className="text-xs text-gray-500 mt-2">
          Total Score: {parsedData.reduce((sum, item) => sum + item.value, 0).toFixed(1)}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <h2 className="text-2xl font-bold text-gray-900">{card.Name}</h2>
            {card.Type && (
              <span className="text-2xl" title={card.Type}>
                {getTypeIcon(card.Type)}
              </span>
            )}
            {card.Tier && (
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getTierColor(card.Tier)}`}>
                {card.Tier}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row max-h-[calc(90vh-80px)] overflow-y-auto">
          {/* Card Image and Basic Info */}
          <div className="lg:w-1/3 p-6">
            <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden mb-4">
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
                    <div className="text-6xl mb-4">🎴</div>
                    <div className="text-lg">No Image Available</div>
                  </div>
                </div>
              )}
            </div>

            {/* Basic Stats */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Type:</span>
                  <div className="font-semibold">{card.CardType}</div>
                </div>
                <div>
                  <span className="text-gray-600">Rarity:</span>
                  <div className="font-semibold">{card.Rarity}</div>
                </div>
                <div>
                  <span className="text-gray-600">HP:</span>
                  <div className="font-semibold">{card.HP || 'N/A'}</div>
                </div>
                <div>
                  <span className="text-gray-600">Evolution:</span>
                  <div className="font-semibold">{card.Evolution}</div>
                </div>
                {card.Weakness && (
                  <div>
                    <span className="text-gray-600">Weakness:</span>
                    <div className="font-semibold">{card.Weakness}</div>
                  </div>
                )}
                {card.Resistance && (
                  <div>
                    <span className="text-gray-600">Resistance:</span>
                    <div className="font-semibold">{card.Resistance}</div>
                  </div>
                )}
                {card.RetreatCost && (
                  <div>
                    <span className="text-gray-600">Retreat Cost:</span>
                    <div className="font-semibold">{card.RetreatCost}</div>
                  </div>
                )}
                {card.RegulationMark && (
                  <div>
                    <span className="text-gray-600">Regulation:</span>
                    <div className="font-semibold">{card.RegulationMark}</div>
                  </div>
                )}
              </div>

              {/* Additional Details */}
              {(card.ExpansionName || card.ExpansionCode || card.Illustrator || card.Artist || card.SpecialTag) && (
                <div className="pt-3 border-t space-y-2">
                  {card.ExpansionName && (
                    <div>
                      <span className="text-gray-600 text-sm">Expansion:</span>
                      <div className="font-semibold text-sm">{card.ExpansionName}</div>
                      {card.ExpansionCode && (
                        <div className="text-xs text-gray-500">Code: {card.ExpansionCode}</div>
                      )}
                    </div>
                  )}
                  {(card.Illustrator || card.Artist) && (
                    <div>
                      <span className="text-gray-600 text-sm">Artist:</span>
                      <div className="font-semibold text-sm">{card.Illustrator || card.Artist}</div>
                    </div>
                  )}
                  {card.SpecialTag && (
                    <div>
                      <span className="text-gray-600 text-sm">Special Tag:</span>
                      <div className="font-semibold text-sm">{card.SpecialTag}</div>
                    </div>
                  )}
                </div>
              )}

              {card.Score && (
                <div className="pt-3 border-t">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-gray-600">Score:</span>
                    <span className="font-bold text-lg">{card.Score}</span>
                  </div>
                  {card.ScoreBreakdown && renderScoreBreakdownChart(card.ScoreBreakdown)}
                </div>
              )}

              {card.ImageURL && (
                <div className="pt-3 border-t">
                  <a
                    href={card.ImageURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 text-sm"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>View Full Image</span>
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Card Details */}
          <div className="lg:w-2/3 p-6 border-t lg:border-t-0 lg:border-l">
            {/* Skills */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills</h3>

              {/* Skill 1 */}
              {(card.Skill1Name || card.Skill1Effect) && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">{card.Skill1Name || 'Skill 1'}</h4>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      {card.Skill1Energy && (
                        <span>Energy: {card.Skill1Energy}</span>
                      )}
                      {card.Skill1Damage && (
                        <span>Damage: {card.Skill1Damage}</span>
                      )}
                    </div>
                  </div>
                  {card.Skill1Effect && (
                    <p className="text-gray-700 text-sm leading-relaxed">{card.Skill1Effect}</p>
                  )}
                </div>
              )}

              {/* Skill 2 */}
              {(card.Skill2Name || card.Skill2Effect) && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">{card.Skill2Name || 'Skill 2'}</h4>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      {card.Skill2Energy && (
                        <span>Energy: {card.Skill2Energy}</span>
                      )}
                      {card.Skill2Damage && (
                        <span>Damage: {card.Skill2Damage}</span>
                      )}
                    </div>
                  </div>
                  {card.Skill2Effect && (
                    <p className="text-gray-700 text-sm leading-relaxed">{card.Skill2Effect}</p>
                  )}
                </div>
              )}
            </div>

            {/* Ability */}
            {(card.AbilityName || card.AbilityEffect) && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Ability</h3>
                <div className="p-4 bg-blue-50 rounded-lg">
                  {card.AbilityName && (
                    <h4 className="font-semibold text-blue-900 mb-2">{card.AbilityName}</h4>
                  )}
                  {card.AbilityEffect && (
                    <p className="text-blue-800 text-sm leading-relaxed">{card.AbilityEffect}</p>
                  )}
                </div>
              </div>
            )}

            {/* Effect Classifications */}
            {(card.PrimaryEffectType || card.SpecialEffectType || card.AbilityStats) && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Effect Classifications</h3>
                <div className="space-y-3">
                  {card.PrimaryEffectType && (
                    <div>
                      <span className="text-sm text-gray-600">Primary Effects:</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {card.PrimaryEffectType.split(',').map((effect, index) => (
                          <span
                            key={index}
                            className="inline-block bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full font-medium"
                          >
                            {effect.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {card.SpecialEffectType && card.SpecialEffectType !== '無' && (
                    <div>
                      <span className="text-sm text-gray-600">Special Effects:</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {card.SpecialEffectType.split(',').map((effect, index) => (
                          <span
                            key={index}
                            className="inline-block bg-purple-100 text-purple-800 text-xs px-3 py-1 rounded-full font-medium"
                          >
                            {effect.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {card.AbilityStats && card.AbilityStats !== '無' && (
                    <div>
                      <span className="text-sm text-gray-600">Ability Stats:</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {card.AbilityStats.split(',').map((ability, index) => (
                          <span
                            key={index}
                            className="inline-block bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-medium"
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

            {/* Related Cards */}
            {relatedCards.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Cards</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {relatedCards.map((relatedCard) => (
                    <div
                      key={relatedCard.CardID}
                      onClick={() => onCardClick(relatedCard)}
                      className="bg-gray-50 rounded-lg p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      <div className="aspect-[3/4] bg-gray-200 rounded mb-2 overflow-hidden">
                        {relatedCard.ImageURL ? (
                          <img
                            src={relatedCard.ImageURL}
                            alt={relatedCard.Name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                            🎴
                          </div>
                        )}
                      </div>
                      <h4 className="font-medium text-gray-900 text-sm leading-tight line-clamp-2">
                        {relatedCard.Name}
                      </h4>
                      <div className="text-xs text-gray-600 mt-1">
                        {relatedCard.Tier && (
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold mr-2 ${getTierColor(relatedCard.Tier)}`}>
                            {relatedCard.Tier}
                          </span>
                        )}
                        {relatedCard.Score}
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