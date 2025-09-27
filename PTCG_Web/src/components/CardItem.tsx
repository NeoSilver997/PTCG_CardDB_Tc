'use client';

import { useState } from 'react';
import { PTCGCard } from '../types/card';
import { Star, Zap, Shield, Sword } from 'lucide-react';
import InventoryButton from './InventoryButton';
import InventoryManager from './InventoryManager';

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

  const renderEnergyCost = (energyCost: string) => {
    if (!energyCost || energyCost.trim() === '') return null;

    const energyTypes = energyCost.split(',').map(type => type.trim());
    
    return (
      <div className="flex items-center space-x-1">
        {energyTypes.map((energyType, index) => {
          const energyImageUrl = `/energy/${energyType}.png`;
          return (
            <div
              key={index}
              className="w-8 h-8 rounded-full bg-white border border-gray-300 shadow-sm overflow-hidden"
              title={energyType}
            >
              <img
                src={energyImageUrl}
                alt={energyType}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to emoji if image fails to load
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.innerHTML = getTypeIcon(energyType);
                }}
              />
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-200 overflow-hidden hover:scale-105"
    >
      {/* Card Image */}
      <div className="aspect-[5/7] bg-gray-100 relative min-h-[280px] lg:min-h-[320px] xl:min-h-[360px]">
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
          <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-sm font-bold ${getTierColor(card.Tier)} shadow-lg`}>
            {card.Tier}
          </div>
        )}
      </div>

      {/* Card Info */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-bold text-gray-900 text-base leading-tight line-clamp-2">
            {card.Name}
          </h3>
          {card.Type && (
            <span className="text-xl ml-3 flex-shrink-0" title={card.Type}>
              {renderEnergyCost(card.Type)}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
          <span className="font-medium">{card.CardType}</span>
          <span className="font-medium">{card.Rarity}</span>
        </div>

        {/* HP */}
        {card.HP && (
          <div className="flex items-center text-xs text-gray-600 mb-2">
            <Shield className="h-3 w-3 mr-1" />
            <span>HP: {card.HP}</span>
          </div>
        )}

        {/* Evolution and Regulation Mark */}
        <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
          {card.Evolution && (
            <span className="font-medium">Evolution: {card.Evolution}</span>
          )}
          {card.RegulationMark && (
            <span className="font-medium">Mark: {card.RegulationMark}</span>
          )}
        </div>

        {/* Abilities */}
        {card.AbilityStats && card.AbilityStats !== '無' && (
          <div className="mb-3">
            <div className="text-sm text-gray-600 mb-2 font-medium">Abilities:</div>
            <div className="flex flex-wrap gap-2">
              {card.AbilityStats.split(',').slice(0, 2).map((ability, index) => (
                <span
                  key={index}
                  className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full font-medium"
                >
                  {ability.trim()}
                </span>
              ))}
              {card.AbilityStats.split(',').length > 2 && (
                <span className="text-sm text-gray-500 font-medium">+{card.AbilityStats.split(',').length - 2} more</span>
              )}
            </div>
          </div>
        )}

        {/* Effect Types */}
        {(card.PrimaryEffectType || (card.SpecialEffectType && card.SpecialEffectType !== '無')) && (
          <div className="mb-3">
            <div className="text-sm text-gray-600 mb-2 font-medium">Effects:</div>
            <div className="flex flex-wrap gap-2">
              {card.PrimaryEffectType && card.PrimaryEffectType.split(',').slice(0, 2).map((effect, index) => (
                <span
                  key={index}
                  className="inline-block bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full font-medium"
                >
                  {effect.trim()}
                </span>
              ))}
              {card.SpecialEffectType && card.SpecialEffectType !== '無' && card.SpecialEffectType.split(',').slice(0, 1).map((effect, index) => (
                <span
                  key={index}
                  className="inline-block bg-purple-100 text-purple-800 text-sm px-3 py-1 rounded-full font-medium"
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