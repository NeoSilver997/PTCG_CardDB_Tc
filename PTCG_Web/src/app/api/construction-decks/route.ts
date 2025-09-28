import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

export const dynamic = 'force-dynamic';

const CONSTRUCTION_DECKS_FILE = path.join(process.cwd(), 'data', 'all_construction_decks.json');

interface ImportedDeck {
  name: string;
  description: string;
  format: string;
  source?: string;
  url?: string;
  scraped_at?: string;
  cards: Array<{
    cardId: number | null;
    name: string;
    quantity: number;
    type: string;
    expansion: string;
    rarity: string;
    confidence: number;
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
    const transformedDecks = constructionDecks.map((deck, index) => ({
      id: `deck_${index + 1}`,
      name: deck.name,
      description: deck.description,
      format: deck.format || 'Standard',
      source: deck.source || 'Official Pokemon Card Website',
      cards: deck.cards.map(card => ({
        cardId: card.cardId,
        name: card.name,
        quantity: card.quantity,
        type: card.type || '寶可夢',
        expansion: card.expansion || '',
        rarity: card.rarity || 'normal'
      }))
    }));

    console.log(`✅ Serving ${transformedDecks.length} construction decks to API`);
    return NextResponse.json(transformedDecks);
  } catch (error) {
    console.error('Error fetching construction decks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch construction decks' },
      { status: 500 }
    );
  }
}