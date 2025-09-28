'use client';

import { PTCGCard } from '../types/card';
import CardItem from './CardItem';
import { useI18n } from '../i18n/context';

interface CardGridProps {
  cards: PTCGCard[];
  onCardClick: (card: PTCGCard) => void;
  viewSize?: 'small' | 'medium' | 'large';
}

export default function CardGrid({ cards, onCardClick, viewSize = 'medium' }: CardGridProps) {
  const { t } = useI18n();

  // Define grid classes based on view size
  const getGridClasses = () => {
    switch (viewSize) {
      case 'small':
        return 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4';
      case 'medium':
        return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6';
      case 'large':
        return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 gap-8';
      default:
        return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6';
    }
  };

  if (cards.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg">{t.noCardsFound}</div>
        <div className="text-gray-400 text-sm mt-2">{t.adjustFilters}</div>
      </div>
    );
  }

  return (
    <div className={getGridClasses()}>
      {cards.map((card) => (
        <CardItem
          key={card.CardID}
          card={card}
          onClick={() => onCardClick(card)}
          viewSize={viewSize}
        />
      ))}
    </div>
  );
}