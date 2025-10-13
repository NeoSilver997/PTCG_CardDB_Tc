import { NextRequest, NextResponse } from 'next/server';
import { MarketPrice } from '../../../types/market';
const sqlite3 = require('sqlite3');
const path = require('path');

// Database path - use absolute path to ensure it works in all contexts
const dbPath = path.resolve(process.cwd(), '..', 'pokemon_cards.db');
console.log(`[MARKET PRICES API] Using database path: ${dbPath}`);

// Initialize database and create market_prices table if it doesn't exist
const initializeDatabase = () => {
  return new Promise<void>((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
      if (err) {
        console.error('[MARKET PRICES API] Database connection error:', err);
        reject(err);
        return;
      }

      // Create market_prices table if it doesn't exist
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS market_prices (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          card_id INTEGER NOT NULL,
          price REAL NOT NULL,
          currency TEXT NOT NULL,
          source TEXT NOT NULL,
          condition TEXT NOT NULL,
          date TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          metadata TEXT
        )
      `;

      db.run(createTableQuery, (err) => {
        if (err) {
          console.error('[MARKET PRICES API] Error creating market_prices table:', err);
          reject(err);
          return;
        }
        db.close();
        resolve();
      });
    });
  });
};

// Initialize database on module load
initializeDatabase()
  .then(() => {
    console.log('[MARKET PRICES API] Database initialization completed successfully');
  })
  .catch(err => {
    console.error('[MARKET PRICES API] Database initialization failed:', err);
  });

// Get database connection
const getDatabase = () => {
  return new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY);
};

const getDatabaseWrite = () => {
  return new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE);
};

// GET - Get all market prices or prices for a specific card
export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();

    const { searchParams } = new URL(request.url);
    const cardId = searchParams.get('cardId');
    const format = searchParams.get('format');

    const db = getDatabase();

    // If cardId is provided, return prices for that specific card
    if (cardId) {
      const cardIdNum = parseInt(cardId);
      if (isNaN(cardIdNum)) {
        return NextResponse.json({ error: 'Invalid card ID' }, { status: 400 });
      }

      return new Promise<NextResponse>((resolve) => {
        const query = `
          SELECT * FROM market_prices
          WHERE card_id = ?
          ORDER BY date DESC
        `;

        db.all(query, [cardIdNum], (err, rows: any[]) => {
          db.close();

          if (err) {
            console.error('Error fetching market prices for card:', err);
            resolve(NextResponse.json({ error: 'Failed to fetch market prices' }, { status: 500 }));
            return;
          }

          // Convert database rows to MarketPrice objects
          const prices: MarketPrice[] = rows.map(row => ({
            cardId: row.card_id,
            price: row.price,
            currency: row.currency,
            source: row.source,
            condition: row.condition,
            date: row.date,
            updatedAt: row.updated_at,
            metadata: row.metadata ? JSON.parse(row.metadata) : undefined
          }));

          resolve(NextResponse.json({
            cardId: cardIdNum,
            prices: prices,
            totalPrices: prices.length
          }));
        });
      });
    }

    // If format=raw is requested, return all data grouped by card ID
    if (format === 'raw') {
      return new Promise<NextResponse>((resolve) => {
        const query = `
          SELECT * FROM market_prices
          ORDER BY card_id, date DESC
        `;

        db.all(query, [], (err, rows: any[]) => {
          db.close();

          if (err) {
            console.error('Error fetching all market prices:', err);
            resolve(NextResponse.json({ error: 'Failed to fetch market prices' }, { status: 500 }));
            return;
          }

          // Group by card ID
          const groupedData: { [cardId: string]: MarketPrice[] } = {};
          rows.forEach(row => {
            const cardIdStr = row.card_id.toString();
            if (!groupedData[cardIdStr]) {
              groupedData[cardIdStr] = [];
            }

            groupedData[cardIdStr].push({
              cardId: row.card_id,
              price: row.price,
              currency: row.currency,
              source: row.source,
              condition: row.condition,
              date: row.date,
              updatedAt: row.updated_at,
              metadata: row.metadata ? JSON.parse(row.metadata) : undefined
            });
          });

          resolve(NextResponse.json(groupedData));
        });
      });
    }

    // Otherwise return all market prices in transformed format
    return new Promise<NextResponse>((resolve) => {
      const query = `
        SELECT * FROM market_prices
        ORDER BY card_id, date DESC
      `;

      db.all(query, [], (err, rows: any[]) => {
        db.close();

        if (err) {
          console.error('Error fetching market prices:', err);
          resolve(NextResponse.json({ error: 'Failed to fetch market prices' }, { status: 500 }));
          return;
        }

        // Group by card ID and transform data
        const cardGroups: { [cardId: number]: MarketPrice[] } = {};
        rows.forEach(row => {
          const cardId = row.card_id;
          if (!cardGroups[cardId]) {
            cardGroups[cardId] = [];
          }

          cardGroups[cardId].push({
            cardId: row.card_id,
            price: row.price,
            currency: row.currency,
            source: row.source,
            condition: row.condition,
            date: row.date,
            updatedAt: row.updated_at,
            metadata: row.metadata ? JSON.parse(row.metadata) : undefined
          });
        });

        // Transform to market cards format
        const marketCards = Object.entries(cardGroups).map(([cardIdStr, prices]) => {
          const cardId = parseInt(cardIdStr);

          // Sort prices by date (newest first) - already sorted by query
          const sortedPrices = prices;

          // Calculate average price from recent prices (last 30 days)
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

          const recentPrices = sortedPrices.filter(price =>
            new Date(price.date) >= thirtyDaysAgo
          );

          const averagePrice = recentPrices.length > 0
            ? recentPrices.reduce((sum, price) => sum + price.price, 0) / recentPrices.length
            : sortedPrices[0]?.price || 0;

          // Calculate price change
          let priceChange: { amount: number; percentage: number; direction: 'up' | 'down' | 'stable' } | undefined;
          if (sortedPrices.length >= 2) {
            const currentPrice = sortedPrices[0].price;
            const previousPrice = sortedPrices[1].price;
            const change = currentPrice - previousPrice;
            const percentage = previousPrice > 0 ? (change / previousPrice) * 100 : 0;

            priceChange = {
              amount: change,
              percentage,
              direction: (change > 0 ? 'up' : change < 0 ? 'down' : 'stable') as 'up' | 'down' | 'stable'
            };
          }

          return {
            cardId,
            prices: sortedPrices,
            averagePrice,
            priceChange,
            totalPrices: sortedPrices.length
          };
        });

        resolve(NextResponse.json(marketCards));
      });
    });
  } catch (error) {
    console.error('Error in GET market-prices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market prices' },
      { status: 500 }
    );
  }
}

// POST - Add a new market price
// POST - Add a new market price
export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();

    const newPrice: MarketPrice = await request.json();

    // Validate required fields
    if (!newPrice.cardId || !newPrice.price || !newPrice.currency || !newPrice.condition) {
      return NextResponse.json(
        { error: 'Missing required fields: cardId, price, currency, condition' },
        { status: 400 }
      );
    }

    // Validate price is positive
    if (newPrice.price <= 0) {
      return NextResponse.json(
        { error: 'Price must be greater than 0' },
        { status: 400 }
      );
    }

    const db = getDatabaseWrite();
    const now = new Date().toISOString();

    const priceWithTimestamp = {
      ...newPrice,
      date: now,
      updatedAt: now
    };

    return new Promise<NextResponse>((resolve) => {
      const query = `
        INSERT INTO market_prices (card_id, price, currency, source, condition, date, updated_at, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        newPrice.cardId,
        newPrice.price,
        newPrice.currency,
        newPrice.source || 'Manual',
        newPrice.condition,
        now,
        now,
        newPrice.metadata ? JSON.stringify(newPrice.metadata) : null
      ];

      db.run(query, params, function(err) {
        db.close();

        if (err) {
          console.error('Error adding market price:', err);
          resolve(NextResponse.json(
            { error: 'Failed to add market price' },
            { status: 500 }
          ));
          return;
        }

        console.log(`Added market price for card ${newPrice.cardId}: $${newPrice.price} ${newPrice.currency}`);
        resolve(NextResponse.json(priceWithTimestamp, { status: 201 }));
      });
    });
  } catch (error) {
    console.error('Error in POST market-prices:', error);
    return NextResponse.json(
      { error: 'Failed to add market price' },
      { status: 500 }
    );
  }
}

// DELETE - Delete market prices
export async function DELETE(request: NextRequest) {
  try {
    await initializeDatabase();

    const { searchParams } = new URL(request.url);
    const cardId = searchParams.get('cardId');
    const priceDate = searchParams.get('date');
    const id = searchParams.get('id');

    const db = getDatabaseWrite();

    let query: string;
    let params: any[];

    if (id) {
      // Delete by record ID
      const recordId = parseInt(id);
      if (isNaN(recordId)) {
        return NextResponse.json({ error: 'Invalid record ID' }, { status: 400 });
      }

      query = 'DELETE FROM market_prices WHERE id = ?';
      params = [recordId];
    } else if (cardId && priceDate) {
      // Delete specific price entry by card ID and date
      const cardIdNum = parseInt(cardId);
      if (isNaN(cardIdNum)) {
        return NextResponse.json({ error: 'Invalid card ID' }, { status: 400 });
      }

      query = 'DELETE FROM market_prices WHERE card_id = ? AND date = ?';
      params = [cardIdNum, priceDate];
    } else if (cardId) {
      // Delete all prices for a card
      const cardIdNum = parseInt(cardId);
      if (isNaN(cardIdNum)) {
        return NextResponse.json({ error: 'Invalid card ID' }, { status: 400 });
      }

      query = 'DELETE FROM market_prices WHERE card_id = ?';
      params = [cardIdNum];
    } else {
      return NextResponse.json(
        { error: 'Missing required parameters: id, or cardId (with optional date)' },
        { status: 400 }
      );
    }

    return new Promise<NextResponse>((resolve) => {
      db.run(query, params, function(err) {
        db.close();

        if (err) {
          console.error('Error deleting market price:', err);
          resolve(NextResponse.json(
            { error: 'Failed to delete market price' },
            { status: 500 }
          ));
          return;
        }

        if (this.changes === 0) {
          resolve(NextResponse.json(
            { error: 'Market price not found' },
            { status: 404 }
          ));
          return;
        }

        console.log(`Deleted ${this.changes} market price record(s)`);
        resolve(NextResponse.json({ success: true, deletedCount: this.changes }));
      });
    });
  } catch (error) {
    console.error('Error in DELETE market-prices:', error);
    return NextResponse.json(
      { error: 'Failed to delete market price' },
      { status: 500 }
    );
  }
}