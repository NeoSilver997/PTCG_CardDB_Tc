'use client';

import { PTCGCard } from '../types/card';
import { getCardImageSrc, PLACEHOLDER_IMAGE_PATH } from '../utils/imageUtils';
import { getCurrencySymbol } from '../utils/currency';
import { DollarSign } from 'lucide-react';
import InventoryButton from './InventoryButton';

interface CardItemProps {
  card: PTCGCard;
  onClick: () => void;
  viewSize?: 'small' | 'medium' | 'large';
  cardOnlyView?: boolean;
  onOpenInventory?: () => void;
  onAddToInventory?: (cardId: number) => Promise<boolean>;
  marketPrice?: any; // Market price passed from parent to avoid individual API calls
}

export default function CardItem({ card, onClick, viewSize = 'medium', cardOnlyView = false, onOpenInventory, onAddToInventory, marketPrice }: CardItemProps) {
  if (cardOnlyView) {
    return (
      <div
        onClick={onClick}
        className="relative cursor-pointer group"
      >
        <div className={`aspect-[5/7] bg-gray-100 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 ${
          viewSize === 'small' ? 'min-h-[120px]' : viewSize === 'large' ? 'min-h-[200px]' : 'min-h-[160px]'
        }`}>
          <img
            src={getCardImageSrc(card)}
            alt={card.Name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            onError={(e) => {
              e.currentTarget.src = PLACEHOLDER_IMAGE_PATH;
            }}
          />
          
          {/* Market Price Overlay for Card-Only View */}
          {marketPrice && (
            <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded-md text-xs font-semibold shadow-md">
              {getCurrencySymbol(marketPrice.currency)}{marketPrice.price.toFixed(0)}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-250 cursor-pointer border border-gray-200 overflow-hidden"
    >
      <div className="aspect-[5/7] bg-gray-100 relative">
        <img
          src={getCardImageSrc(card)}
          alt={card.Name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = PLACEHOLDER_IMAGE_PATH;
          }}
        />
      </div>
      
      <div className="p-4">
        {/* Card Name and Market Price Header */}
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold text-gray-900 text-base leading-tight flex-1 mr-2">
            {card.Name}
          </h3>
          
          {/* Market Price Badge */}
          {marketPrice && (
            <div className="flex items-center space-x-1 bg-green-50 px-2 py-1 rounded-md border border-green-200 flex-shrink-0">
              <DollarSign className="h-3 w-3 text-green-600" />
              <span className="text-xs font-semibold text-green-800">
                {getCurrencySymbol(marketPrice.currency)}{marketPrice.price.toFixed(0)}
              </span>
            </div>
          )}
        </div>
        
        <InventoryButton cardId={card.CardID} onOpenInventory={onOpenInventory} onAddToInventory={onAddToInventory} />
      </div>
    </div>
  );
}