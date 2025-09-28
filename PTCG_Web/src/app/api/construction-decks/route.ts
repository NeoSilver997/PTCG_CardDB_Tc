import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

export const dynamic = 'force-dynamic';

const CONSTRUCTION_DECKS_FILE = path.join(process.cwd(), 'data', 'imported_decks.json');

interface ImportedDeck {
  id: string;
  name: string;
  description: string;
  format: string;
  cards: Array<{
    cardId: number;
    name: string;
    quantity: number;
    type: string;
    expansion: string;
    rarity: string;
  }>;
}

// Load construction decks from the imported decks file
const loadConstructionDecks = (): ImportedDeck[] => {
  try {
    if (!fs.existsSync(CONSTRUCTION_DECKS_FILE)) {
      console.log('Construction decks file not found:', CONSTRUCTION_DECKS_FILE);
      return [];
    }
    
    const data = fs.readFileSync(CONSTRUCTION_DECKS_FILE, 'utf-8');
    const decks = JSON.parse(data);
    
    console.log(`Loaded ${decks.length} construction decks`);
    return decks;
  } catch (error) {
    console.error('Error loading construction decks:', error);
    return [];
  }
};

export async function GET() {
  try {
    const constructionDecks = loadConstructionDecks();
    
    // Transform the construction decks to the expected format
    const transformedDecks = constructionDecks.map(deck => ({
      id: deck.id,
      name: deck.name,
      description: deck.description || `Official construction deck featuring ${deck.name.split(' ')[deck.name.split(' ').length - 1]}`,
      format: deck.format || 'Standard',
      cards: deck.cards.map(card => ({
        cardId: card.cardId,
        name: card.name,
        quantity: card.quantity,
        type: card.type || '寶可夢',
        expansion: card.expansion || '',
        rarity: card.rarity || 'normal'
      }))
    }));

    return NextResponse.json(transformedDecks);
  } catch (error) {
    console.error('Error fetching construction decks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch construction decks' },
      { status: 500 }
    );
  }
}