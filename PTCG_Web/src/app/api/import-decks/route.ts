import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { forceReimport = false, updateExisting = false } = body;
    
    // Read the construction decks JSON file
    const jsonPath = path.join(process.cwd(), 'scripts', 'construction_decks.json');
    
    if (!fs.existsSync(jsonPath)) {
      return NextResponse.json(
        { error: 'Construction decks file not found. Please run the Python import script first.' },
        { status: 404 }
      );
    }

    const decksData: any[] = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    
    // Get existing decks from localStorage simulation (in a real app, this would be from a database)
    const existingDecksPath = path.join(process.cwd(), 'data', 'imported_decks.json');
    let existingDecks: any[] = [];
    
    if (fs.existsSync(existingDecksPath)) {
      existingDecks = JSON.parse(fs.readFileSync(existingDecksPath, 'utf-8'));
    }

    // Process and validate each deck
    const importedDecks: any[] = [];
    const errors: string[] = [];

    for (const deck of decksData) {
      try {
        // Validate deck structure
        if (!deck.name || !deck.cards || !Array.isArray(deck.cards)) {
          errors.push(`Invalid deck structure for: ${deck.name || 'Unknown'}`);
          continue;
        }

        // Handle duplicate deck names
        const existingDeckIndex = existingDecks.findIndex(existing => existing.name === deck.name);
        const isDuplicate = existingDeckIndex !== -1;
        
        if (isDuplicate && !forceReimport && !updateExisting) {
          errors.push(`Deck already exists: ${deck.name} (use forceReimport or updateExisting option)`);
          continue;
        }

        // Validate cards
        const validCards = deck.cards.filter(card => {
          return card.cardId && card.name && card.quantity > 0;
        });

        if (validCards.length === 0) {
          errors.push(`No valid cards found in deck: ${deck.name}`);
          continue;
        }

        // Create processed deck object
        const processedDeck = {
          id: `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: deck.name,
          description: deck.description || `Imported construction deck: ${deck.name}`,
          format: deck.format || 'Standard',
          cards: validCards.map(card => ({
            cardId: parseInt(card.cardId),
            name: card.name,
            quantity: parseInt(card.quantity),
            type: card.type || '',
            expansion: card.expansion || '',
            rarity: card.rarity || ''
          })),
          createdAt: deck.createdAt || new Date().toISOString().split('T')[0],
          updatedAt: new Date().toISOString().split('T')[0],
          tags: deck.tags || ['Imported', 'Construction Deck'],
          source: 'Official Construction Deck',
          isPublic: true,
          matchStats: deck.matchStats
        };

        if (isDuplicate && (forceReimport || updateExisting)) {
          // Remove old deck and add new one
          existingDecks[existingDeckIndex] = processedDeck;
          importedDecks.push({ ...processedDeck, action: updateExisting ? 'updated' : 'reimported' });
        } else {
          // Add new deck
          importedDecks.push({ ...processedDeck, action: 'imported' });
          existingDecks.push(processedDeck);
        }

      } catch (deckError) {
        errors.push(`Error processing deck ${deck.name}: ${deckError.message}`);
      }
    }

    // Save updated decks list
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    fs.writeFileSync(existingDecksPath, JSON.stringify(existingDecks, null, 2));

    // Generate import report
    const report = {
      timestamp: new Date().toISOString(),
      totalDecksProcessed: decksData.length,
      successfulImports: importedDecks.length,
      errors: errors,
      importedDecks: importedDecks.map(deck => ({
        name: deck.name,
        cardCount: deck.cards.length,
        matchStats: deck.matchStats
      }))
    };

    const reportPath = path.join(process.cwd(), 'data', 'last_import_report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${importedDecks.length} construction decks`,
      imported: importedDecks.length,
      errors: errors.length,
      report: report
    });

  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: 'Failed to import construction decks', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Return import status and last report
    const reportPath = path.join(process.cwd(), 'data', 'last_import_report.json');
    const decksPath = path.join(process.cwd(), 'data', 'imported_decks.json');
    
    let lastReport = null;
    let currentDeckCount = 0;

    if (fs.existsSync(reportPath)) {
      lastReport = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
    }

    if (fs.existsSync(decksPath)) {
      const decks = JSON.parse(fs.readFileSync(decksPath, 'utf-8'));
      currentDeckCount = decks.length;
    }

    return NextResponse.json({
      status: 'ready',
      currentDeckCount,
      lastImport: lastReport,
      scriptsAvailable: {
        constructionDecks: fs.existsSync(path.join(process.cwd(), 'scripts', 'construction_decks.json')),
        pythonScripts: fs.existsSync(path.join(process.cwd(), 'scripts', 'run_deck_import.py'))
      }
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get import status', details: error.message },
      { status: 500 }
    );
  }
}