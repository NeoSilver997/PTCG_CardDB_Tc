'use client';

import { useState } from 'react';
import { PTCGCard } from '../types/card';
import { Star, Zap, Shield, Sword } from 'lucide-react';
import InventoryButton from './InventoryButton';
import InventoryManager from './InventoryManager';

interface CardItemProps {
  card: PTCGCard;
  onClick: () => void;
  viewSize?: 'small' | 'medium' | 'large';
  cardOnlyView?: boolean;
}

export default function CardItem({ card, onClick, viewSize = 'medium', cardOnlyView = false }: CardItemProps) {
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

  // Get size-dependent classes
  const getSizeClasses = () => {
    switch (viewSize) {
      case 'small':
        return {
          container: 'bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer border border-gray-200 overflow-hidden hover:scale-102',
          image: 'aspect-[5/7] bg-gray-100 relative min-h-[180px]',
          padding: 'p-3',
          title: 'font-semibold text-gray-900 text-sm leading-tight line-clamp-2',
          info: 'text-xs',
          badge: 'px-2 py-0.5 text-xs',
          tierBadge: 'absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-bold shadow-md'
        };
      case 'large':
        return {
          container: 'bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer border border-gray-200 overflow-hidden hover:scale-105',
          image: 'aspect-[5/7] bg-gray-100 relative min-h-[400px] lg:min-h-[450px] xl:min-h-[500px]',
          padding: 'p-8',
          title: 'font-bold text-gray-900 text-lg leading-tight line-clamp-2',
          info: 'text-base',
          badge: 'px-4 py-2 text-sm',
          tierBadge: 'absolute top-4 right-4 px-4 py-2 rounded-full text-base font-bold shadow-lg'
        };
      case 'medium':
      default:
        return {
          container: 'bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-200 overflow-hidden hover:scale-105',
          image: 'aspect-[5/7] bg-gray-100 relative min-h-[280px] lg:min-h-[320px] xl:min-h-[360px]',
          padding: 'p-6',
          title: 'font-bold text-gray-900 text-base leading-tight line-clamp-2',
          info: 'text-sm',
          badge: 'px-3 py-1 text-sm',
          tierBadge: 'absolute top-3 right-3 px-3 py-1 rounded-full text-sm font-bold shadow-lg'
        };
    }
  };

  const sizeClasses = getSizeClasses();

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
    const iconSize = viewSize === 'small' ? 'w-6 h-6' : viewSize === 'large' ? 'w-10 h-10' : 'w-8 h-8';
    
    return (
      <div className="flex items-center space-x-1">
        {energyTypes.map((energyType, index) => {
          const energyImageUrl = `/energy/${energyType}.png`;
          return (
            <div
              key={index}
              className={`${iconSize} rounded-full bg-white border border-gray-300 shadow-sm overflow-hidden`}
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

  // Card-only view: show only image and tier badge
  if (cardOnlyView) {
    return (
      <div
        onClick={onClick}
        className="relative cursor-pointer group"
      >
        <div className={`aspect-[5/7] bg-gray-100 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 ${
          viewSize === 'small' ? 'min-h-[120px]' : viewSize === 'large' ? 'min-h-[200px]' : 'min-h-[160px]'
        }`}>
          {card.ImageURL ? (
            <img
              src={card.ImageURL}
              alt={card.Name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              onError={(e) => {
                e.currentTarget.src = '/placeholder-card.svg';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <div className={`${viewSize === 'small' ? 'text-lg' : viewSize === 'large' ? 'text-3xl' : 'text-xl'} mb-1`}>🎴</div>
                <div className="text-xs">No Image</div>
              </div>
            </div>
          )}
        </div>
        {/* Tier Badge */}
        {card.Tier && (
          <div className={`absolute top-1 right-1 px-2 py-1 rounded-full text-xs font-bold shadow-md ${getTierColor(card.Tier)}`}>
            {card.Tier}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={sizeClasses.container}
    >
      {/* Card Image */}
      <div className={sizeClasses.image}>
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
              <div className={`${viewSize === 'small' ? 'text-2xl' : viewSize === 'large' ? 'text-6xl' : 'text-4xl'} mb-2`}>🎴</div>
              <div className={viewSize === 'small' ? 'text-xs' : 'text-sm'}>No Image</div>
            </div>
          </div>
        )}

        {/* Tier Badge */}
        {card.Tier && (
          <div className={`${sizeClasses.tierBadge} ${getTierColor(card.Tier)}`}>
            {card.Tier}
          </div>
        )}
      </div>

      {/* Card Info */}
      <div className={sizeClasses.padding}>
        <div className="flex items-start justify-between mb-3">
          <h3 className={sizeClasses.title}>
            {card.Name}
          </h3>
          {card.Type && (
            <span className={`${viewSize === 'small' ? 'text-lg' : viewSize === 'large' ? 'text-2xl' : 'text-xl'} ml-3 flex-shrink-0`} title={card.Type}>
              {renderEnergyCost(card.Type)}
            </span>
          )}
        </div>

        <div className={`flex items-center justify-between ${sizeClasses.info} text-gray-600 mb-3`}>
          <span className="font-medium">{card.CardType}</span>
          <span className="font-medium">{card.Rarity}</span>
        </div>

        {/* HP */}
        {card.HP && (
          <div className={`flex items-center ${sizeClasses.info} text-gray-600 mb-2`}>
            <Shield className={`${viewSize === 'small' ? 'h-3 w-3' : 'h-4 w-4'} mr-1`} />
            <span>HP: {card.HP}</span>
          </div>
        )}

        {/* Evolution and Regulation Mark */}
        {(card.Evolution || card.RegulationMark) && (
          <div className={`flex items-center justify-between ${sizeClasses.info} text-gray-600 mb-3`}>
            {card.Evolution && (
              <span className="font-medium">Evolution: {card.Evolution}</span>
            )}
            {card.RegulationMark && (
              <span className="font-medium">Mark: {card.RegulationMark}</span>
            )}
          </div>
        )}

        {/* Abilities */}
        {card.AbilityStats && card.AbilityStats !== '無' && viewSize !== 'small' && (
          <div className="mb-3">
            <div className={`${sizeClasses.info} text-gray-600 mb-2 font-medium`}>Abilities:</div>
            <div className="flex flex-wrap gap-2">
              {card.AbilityStats.split(',').slice(0, viewSize === 'large' ? 3 : 2).map((ability, index) => (
                <span
                  key={index}
                  className={`inline-block bg-blue-100 text-blue-800 ${sizeClasses.badge} rounded-full font-medium`}
                >
                  {ability.trim()}
                </span>
              ))}
              {card.AbilityStats.split(',').length > (viewSize === 'large' ? 3 : 2) && (
                <span className={`${sizeClasses.info} text-gray-500 font-medium`}>
                  +{card.AbilityStats.split(',').length - (viewSize === 'large' ? 3 : 2)} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Effect Types */}
        {(card.PrimaryEffectType || (card.SpecialEffectType && card.SpecialEffectType !== '無')) && viewSize !== 'small' && (
          <div className="mb-3">
            <div className={`${sizeClasses.info} text-gray-600 mb-2 font-medium`}>Effects:</div>
            <div className="flex flex-wrap gap-2">
              {card.PrimaryEffectType && card.PrimaryEffectType.split(',').slice(0, viewSize === 'large' ? 2 : 1).map((effect, index) => (
                <span
                  key={index}
                  className={`inline-block bg-green-100 text-green-800 ${sizeClasses.badge} rounded-full font-medium`}
                >
                  {effect.trim()}
                </span>
              ))}
              {card.SpecialEffectType && card.SpecialEffectType !== '無' && card.SpecialEffectType.split(',').slice(0, 1).map((effect, index) => (
                <span
                  key={index}
                  className={`inline-block bg-purple-100 text-purple-800 ${sizeClasses.badge} rounded-full font-medium`}
                >
                  {effect.trim()}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Score */}
        {card.Score && (
          <div className={`flex items-center justify-between ${sizeClasses.info}`}>
            <span className="text-gray-600">Score:</span>
            <span className="font-semibold text-gray-900">{card.Score}</span>
          </div>
        )}
      </div>
    </div>
  );
}