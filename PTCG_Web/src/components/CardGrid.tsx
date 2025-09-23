'use client';

import { PTCGCard } from '../types/card';
import CardItem from './CardItem';

interface CardGridProps {
  cards: PTCGCard[];
  onCardClick: (card: PTCGCard) => void;
}

export default function CardGrid({ cards, onCardClick }: CardGridProps) {
  if (cards.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg">No cards found matching your criteria.</div>
        <div className="text-gray-400 text-sm mt-2">Try adjusting your filters or search terms.</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-10">
      {cards.map((card) => (
        <CardItem
          key={card.CardID}
          card={card}
          onClick={() => onCardClick(card)}
        />
      ))}
    </div>
  );
}