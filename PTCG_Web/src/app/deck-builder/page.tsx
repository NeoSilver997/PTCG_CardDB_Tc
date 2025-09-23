'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { PTCGCard } from '../../types/card';
import { Deck } from '../../types/deck';

// Dynamically import components to prevent SSR issues
const DeckBuilder = dynamic(() => import('../../components/DeckBuilder'), { ssr: false });
const DeckManager = dynamic(() => import('../../components/DeckManager'), { ssr: false });

export default function DeckBuilderPage() {
  const [cards, setCards] = useState<PTCGCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'manager' | 'builder'>('manager');
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null);

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    try {
      const response = await fetch('/api/cards');
      const data = await response.json();
      setCards(data);
    } catch (error) {
      console.error('Failed to load cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDeck = () => {
    setEditingDeck(null);
    setCurrentView('builder');
  };

  const handleEditDeck = (deck: Deck) => {
    setEditingDeck(deck);
    setCurrentView('builder');
  };



  const handleCloseDeckBuilder = () => {
    setEditingDeck(null);
    setCurrentView('manager');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Loading cards...</p>
        </div>
      </div>
    );
  }

  if (currentView === 'builder') {
    return (
      <DeckBuilder 
        initialCards={cards} 
        onClose={handleCloseDeckBuilder}
        initialDeck={editingDeck}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <DeckManager
        onCreateDeck={handleCreateDeck}
        onEditDeck={handleEditDeck}
      />
    </div>
  );
}