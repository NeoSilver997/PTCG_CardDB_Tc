'use client';

import { PTCGCard } from '../types/card';
import { Star, Zap, Shield, Sword } from 'lucide-react';

interface CardItemProps {
  card: PTCGCard;
  onClick: () => void;
}

export default function CardItem({ card, onClick }: CardItemProps) {
  const getTierColor = (tier?: string) => {
    switch (tier) {
      case 'S+': return 'bg-red-100 text-red-800';
      case 'S': return 'bg-orange-100 text-orange-800';
      case 'A+': return 'bg-yellow-100 text-yellow-800';
      case 'A': return 'bg-green-100 text-green-800';
      case 'B+': return 'bg-blue-100 text-blue-800';
      case 'B': return 'bg-indigo-100 text-indigo-800';
      case 'C+': return 'bg-purple-100 text-purple-800';
      case 'C': return 'bg-gray-100 text-gray-800';
      case 'D': return 'bg-gray-200 text-gray-600';
      default: return 'bg-gray-100 text-gray-600';
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

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border border-gray-200 overflow-hidden"
    >
      {/* Card Image */}
      <div className="aspect-[3/4] bg-gray-100 relative">
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
              <div className="text-4xl mb-2">🎴</div>
              <div className="text-sm">No Image</div>
            </div>
          </div>
        )}

        {/* Tier Badge */}
        {card.Tier && (
          <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-semibold ${getTierColor(card.Tier)}`}>
            {card.Tier}
          </div>
        )}
      </div>

      {/* Card Info */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">
            {card.Name}
          </h3>
          {card.Type && (
            <span className="text-lg ml-2 flex-shrink-0" title={card.Type}>
              {getTypeIcon(card.Type)}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
          <span>{card.CardType}</span>
          <span>{card.Rarity}</span>
        </div>

        {/* HP */}
        {card.HP && (
          <div className="flex items-center text-xs text-gray-600 mb-2">
            <Shield className="h-3 w-3 mr-1" />
            <span>HP: {card.HP}</span>
          </div>
        )}

        {/* Abilities */}
        {card.AbilityStats && card.AbilityStats !== '無' && (
          <div className="mb-2">
            <div className="text-xs text-gray-600 mb-1">Abilities:</div>
            <div className="flex flex-wrap gap-1">
              {card.AbilityStats.split(',').slice(0, 2).map((ability, index) => (
                <span
                  key={index}
                  className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                >
                  {ability.trim()}
                </span>
              ))}
              {card.AbilityStats.split(',').length > 2 && (
                <span className="text-xs text-gray-500">+{card.AbilityStats.split(',').length - 2} more</span>
              )}
            </div>
          </div>
        )}

        {/* Effect Types */}
        {(card.PrimaryEffectType || (card.SpecialEffectType && card.SpecialEffectType !== '無')) && (
          <div className="mb-2">
            <div className="text-xs text-gray-600 mb-1">Effects:</div>
            <div className="flex flex-wrap gap-1">
              {card.PrimaryEffectType && card.PrimaryEffectType.split(',').slice(0, 2).map((effect, index) => (
                <span
                  key={index}
                  className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full"
                >
                  {effect.trim()}
                </span>
              ))}
              {card.SpecialEffectType && card.SpecialEffectType !== '無' && card.SpecialEffectType.split(',').slice(0, 1).map((effect, index) => (
                <span
                  key={index}
                  className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full"
                >
                  {effect.trim()}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Score */}
        {card.Score && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">Score:</span>
            <span className="font-semibold text-gray-900">{card.Score}</span>
          </div>
        )}
      </div>
    </div>
  );
}