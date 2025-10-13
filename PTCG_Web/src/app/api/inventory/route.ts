import { NextRequest, NextResponse } from 'next/server';
const sqlite3 = require('sqlite3');
const path = require('path');

// Database path - use same as cards API
const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), '..', 'pokemon_cards.db');
console.log(`[INVENTORY API] Using database path: ${dbPath}`);

// Initialize database and create inventory table if it doesn't exist
const initializeDatabase = () => {
  return new Promise<void>((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
      if (err) {
        console.error('[INVENTORY API] Database connection error:', err);
        reject(err);
        return;
      }

      // Create inventory table if it doesn't exist
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS inventory (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          card_id INTEGER NOT NULL,
          quantity INTEGER NOT NULL DEFAULT 0,
          condition TEXT NOT NULL,
          notes TEXT,
          purchase_cost REAL,
          market_price REAL,
          date_added TEXT NOT NULL,
          last_updated TEXT NOT NULL,
          UNIQUE(card_id, condition)
        )
      `;

      db.run(createTableQuery, (err) => {
        if (err) {
          console.error('[INVENTORY API] Error creating inventory table:', err);
          reject(err);
          return;
        }
        console.log('[INVENTORY API] Inventory table initialized');
        db.close();
        resolve();
      });
    });
  });
};

// Initialize database on module load
initializeDatabase().catch(err => {
  console.error('[INVENTORY API] Failed to initialize database:', err);
});

// Get database connection
const getDatabase = () => {
  return new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY);
};

export async function GET() {
  return new Promise((resolve) => {
    const db = getDatabase();

    const query = `
      SELECT
        card_id as CardID,
        quantity,
        condition,
        notes,
        purchase_cost as purchaseCost,
        market_price as marketPrice,
        date_added as dateAdded,
        last_updated as lastUpdated
      FROM inventory
      ORDER BY card_id, condition
    `;


    db.all(query, [], (err, rows) => {
      db.close();

      if (err) {
        console.error('[INVENTORY API] Error loading inventory:', err);
        resolve(NextResponse.json(
          { error: 'Failed to load inventory' },
          { status: 500 }
        ));
        return;
      }

      console.log(`[INVENTORY API] Retrieved ${rows ? rows.length : 0} inventory items`);
      resolve(NextResponse.json(rows || []));
    });
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { CardID, quantity, condition, notes, purchaseCost, marketPrice } = body;

    if (!CardID || quantity === undefined || !condition) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate price fields if provided
    if (purchaseCost !== undefined && (isNaN(purchaseCost) || purchaseCost < 0)) {
      return NextResponse.json(
        { error: 'Purchase cost must be a valid positive number' },
        { status: 400 }
      );
    }

    if (marketPrice !== undefined && (isNaN(marketPrice) || marketPrice < 0)) {
      return NextResponse.json(
        { error: 'Market price must be a valid positive number' },
        { status: 400 }
      );
    }

    return new Promise((resolve) => {
      const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE);

      const now = new Date().toISOString();

      // Use INSERT OR REPLACE to handle both insert and update
      const query = `
        INSERT OR REPLACE INTO inventory
        (card_id, quantity, condition, notes, purchase_cost, market_price, date_added, last_updated)
        VALUES (?, ?, ?, ?, ?, ?, COALESCE((SELECT date_added FROM inventory WHERE card_id = ? AND condition = ?), ?), ?)
      `;

      const params = [
        CardID,
        quantity,
        condition,
        notes || '',
        purchaseCost !== undefined ? purchaseCost : null,
        marketPrice !== undefined ? marketPrice : null,
        CardID,
        condition,
        now,
        now
      ];

      console.log(`[INVENTORY API] Executing POST query for CardID: ${CardID}, condition: ${condition}`);

      db.run(query, params, function(err) {
        db.close();

        if (err) {
          console.error('[INVENTORY API] Error saving inventory item:', err);
          resolve(NextResponse.json(
            { error: 'Failed to save inventory item' },
            { status: 500 }
          ));
          return;
        }

        console.log(`[INVENTORY API] Successfully saved inventory item (ID: ${this.lastID})`);
        resolve(NextResponse.json({ success: true }));
      });
    });
  } catch (error) {
    console.error('[INVENTORY API] Error in POST:', error);
    return NextResponse.json(
      { error: 'Failed to update inventory' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const CardID = searchParams.get('CardID');
    const condition = searchParams.get('condition');

    if (!CardID) {
      return NextResponse.json(
        { error: 'Card ID is required' },
        { status: 400 }
      );
    }

    return new Promise((resolve) => {
      const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE);

      let query;
      let params;

      if (condition) {
        // Remove specific condition entry
        query = 'DELETE FROM inventory WHERE card_id = ? AND condition = ?';
        params = [CardID, condition];
        console.log(`[INVENTORY API] Executing DELETE query for CardID: ${CardID}, condition: ${condition}`);
      } else {
        // Remove all entries for this card
        query = 'DELETE FROM inventory WHERE card_id = ?';
        params = [CardID];
        console.log(`[INVENTORY API] Executing DELETE query for all conditions of CardID: ${CardID}`);
      }

      db.run(query, params, function(err) {
        db.close();

        if (err) {
          console.error('[INVENTORY API] Error deleting inventory item:', err);
          resolve(NextResponse.json(
            { error: 'Failed to delete inventory item' },
            { status: 500 }
          ));
          return;
        }

        if (this.changes === 0) {
          console.log(`[INVENTORY API] No inventory items found to delete`);
          resolve(NextResponse.json(
            { error: 'Inventory item not found' },
            { status: 404 }
          ));
          return;
        }

        console.log(`[INVENTORY API] Successfully deleted ${this.changes} inventory item(s)`);
        resolve(NextResponse.json({ success: true }));
      });
    });
  } catch (error) {
    console.error('[INVENTORY API] Error in DELETE:', error);
    return NextResponse.json(
      { error: 'Failed to delete from inventory' },
      { status: 500 }
    );
  }
}