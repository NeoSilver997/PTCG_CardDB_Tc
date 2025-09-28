'use client';

import { PTCGCard } from '../types/card';
import { getCardImageSrc, PLACEHOLDER_IMAGE_PATH } from '../utils/imageUtils';
import InventoryButton from './InventoryButton';

interface CardItemProps {
  card: PTCGCard;
  onClick: () => void;
  viewSize?: 'small' | 'medium' | 'large';
  cardOnlyView?: boolean;
  onOpenInventory?: () => void;
  onAddToInventory?: (cardId: number) => Promise<boolean>;
}

export default function CardItem({ card, onClick, viewSize = 'medium', cardOnlyView = false, onOpenInventory, onAddToInventory }: CardItemProps) {
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
        <h3 className="font-semibold text-gray-900 text-base leading-tight mb-3">
          {card.Name}
        </h3>
        
        <InventoryButton cardId={card.CardID} onOpenInventory={onOpenInventory} onAddToInventory={onAddToInventory} />
      </div>
    </div>
  );
}