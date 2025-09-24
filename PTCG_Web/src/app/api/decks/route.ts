import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

interface Deck {
  id: string;
  name: string;
  description: string;
  cards: any[];
  format: string;
  createdAt: Date;
  updatedAt: Date;
  isValid: boolean;
  pokemonCount: number;
  trainerCount: number;
  energyCount: number;
  totalCards: number;
}

export const dynamic = 'force-dynamic';

const DECKS_FILE = path.join(process.cwd(), 'data', 'decks.json');

// Ensure data directory exists
const ensureDataDirectory = () => {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

// Load decks from file
const loadDecks = (): Deck[] => {
  try {
    ensureDataDirectory();
    if (!fs.existsSync(DECKS_FILE)) {
      return [];
    }
    const data = fs.readFileSync(DECKS_FILE, 'utf-8');
    const decks = JSON.parse(data);
    // Convert date strings back to Date objects
    return decks.map((deck: any) => ({
      ...deck,
      createdAt: new Date(deck.createdAt),
      updatedAt: new Date(deck.updatedAt),
    }));
  } catch (error) {
    console.error('Error loading decks:', error);
    return [];
  }
};

// Save decks to file
const saveDecks = (decks: Deck[]) => {
  try {
    ensureDataDirectory();
    fs.writeFileSync(DECKS_FILE, JSON.stringify(decks, null, 2));
  } catch (error) {
    console.error('Error saving decks:', error);
    throw error;
  }
};

export async function GET() {
  try {
    const decks = loadDecks();
    return NextResponse.json(decks);
  } catch (error) {
    console.error('Error fetching decks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch decks' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const deckData = await request.json();

    // Validate required fields
    if (!deckData.name || !deckData.cards) {
      return NextResponse.json(
        { error: 'Deck name and cards are required' },
        { status: 400 }
      );
    }

    const decks = loadDecks();

    // Create new deck or update existing
    const now = new Date();
    let deck: Deck;

    if (deckData.id) {
      // Update existing deck
      const existingIndex = decks.findIndex(d => d.id === deckData.id);
      if (existingIndex === -1) {
        return NextResponse.json(
          { error: 'Deck not found' },
          { status: 404 }
        );
      }

      deck = {
        ...deckData,
        updatedAt: now,
        // Recalculate validation stats
        pokemonCount: deckData.cards.filter((c: any) => c.CardType && (c.CardType.includes('寶可夢') || c.CardType.toLowerCase().includes('pokemon') || c.CardType.includes('Pokémon'))).length,
        trainerCount: deckData.cards.filter((c: any) => c.CardType && (c.CardType.includes('物品') || c.CardType.includes('支援') || c.CardType.includes('場地') || c.CardType.toLowerCase().includes('trainer'))).length,
        energyCount: deckData.cards.filter((c: any) => c.CardType && (c.CardType.toLowerCase().includes('energy') || c.CardType.includes('能量'))).length,
        totalCards: deckData.cards.reduce((sum: number, c: any) => sum + c.quantity, 0),
        isValid: deckData.cards.reduce((sum: number, c: any) => sum + c.quantity, 0) === 60,
      };

      decks[existingIndex] = deck;
    } else {
      // Create new deck
      deck = {
        id: `deck_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: deckData.name,
        description: deckData.description || '',
        cards: deckData.cards,
        format: deckData.format || 'Standard',
        createdAt: now,
        updatedAt: now,
        pokemonCount: deckData.cards.filter((c: any) => c.CardType && (c.CardType.includes('寶可夢') || c.CardType.toLowerCase().includes('pokemon') || c.CardType.includes('Pokémon'))).length,
        trainerCount: deckData.cards.filter((c: any) => c.CardType && (c.CardType.includes('物品') || c.CardType.includes('支援') || c.CardType.includes('場地') || c.CardType.toLowerCase().includes('trainer'))).length,
        energyCount: deckData.cards.filter((c: any) => c.CardType && (c.CardType.toLowerCase().includes('energy') || c.CardType.includes('能量'))).length,
        totalCards: deckData.cards.reduce((sum: number, c: any) => sum + c.quantity, 0),
        isValid: deckData.cards.reduce((sum: number, c: any) => sum + c.quantity, 0) === 60,
      };

      decks.push(deck);
    }

    saveDecks(decks);

    return NextResponse.json(deck);
  } catch (error) {
    console.error('Error saving deck:', error);
    return NextResponse.json(
      { error: 'Failed to save deck' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Deck ID is required' },
        { status: 400 }
      );
    }

    const decks = loadDecks();
    const filteredDecks = decks.filter(d => d.id !== id);

    if (filteredDecks.length === decks.length) {
      return NextResponse.json(
        { error: 'Deck not found' },
        { status: 404 }
      );
    }

    saveDecks(filteredDecks);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting deck:', error);
    return NextResponse.json(
      { error: 'Failed to delete deck' },
      { status: 500 }
    );
  }
}