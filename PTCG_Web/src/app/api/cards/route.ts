import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

export const dynamic = 'force-dynamic';

// Define the path to the SQLite database
const dbPath = '/app/PTCG_Web/public/ptcg_cards.db';

// Function to get a database connection
const getDb = () => {
  try {
    const db = new Database(dbPath, { readonly: true });
    return db;
  } catch (error) {
    console.error("Failed to connect to database:", error);
    throw new Error("Failed to connect to database.");
  }
};

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);

    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = (page - 1) * limit;

    // Filter parameters
    const filters: { [key: string]: string | boolean } = {};
    const validFilters = [
      'ability', 'effectType', 'cardType', 'rarity', 'tier', 'attribute',
      'regulation', 'expansion', 'weaknessType', 'resistanceType',
      'specialPokemonType', 'owned', 'priceRange'
    ];

    validFilters.forEach(key => {
      if (searchParams.has(key)) {
        filters[key] = searchParams.get(key)!;
      }
    });

    // Boolean filters
    const booleanFilters = ['noRetreat', 'noResistance', 'noWeakness'];
    booleanFilters.forEach(key => {
      if (searchParams.has(key)) {
        filters[key] = searchParams.get(key) === 'true';
      }
    });

    // Search term
    const searchTerm = searchParams.get('searchTerm') || '';

    // Sorting parameters
    const sortBy = searchParams.get('sortBy') || 'Name';
    const sortDirection = searchParams.get('sortDirection') || 'asc';

    // Build the query
    let whereClauses: string[] = [];
    let queryParams: (string | number)[] = [];

    // Base query
    let query = `SELECT * FROM cards`;

    // Exclude energy cards by default
    whereClauses.push(`(CardType NOT LIKE ? AND CardType NOT LIKE ?)`);
    queryParams.push('%能量%');
    queryParams.push('%energy%');

    // Search term filter
    if (searchTerm) {
      whereClauses.push(`(Name LIKE ? OR CardID LIKE ? OR Skill1Effect LIKE ? OR Skill2Effect LIKE ? OR AbilityEffect LIKE ?)`);
      const searchTermLike = `%${searchTerm}%`;
      queryParams.push(searchTermLike, searchTermLike, searchTermLike, searchTermLike, searchTermLike);
    }

    // Add other filters
    Object.entries(filters).forEach(([key, value]) => {
      if (typeof value === 'string') {
        // Handle specific filters
        if (key === 'ability') {
          whereClauses.push(`(AbilityName LIKE ? OR AbilityStats LIKE ?)`);
          queryParams.push(`%${value}%`, `%${value}%`);
        } else if (key === 'effectType') {
          whereClauses.push(`(PrimaryEffectType LIKE ? OR SpecialEffectType LIKE ?)`);
          queryParams.push(`%${value}%`, `%${value}%`);
        } else if (key === 'expansion' && value.includes('|')) {
          const [name, code] = value.split('|');
          whereClauses.push(`(ExpansionName = ? OR ExpansionCode = ?)`);
          queryParams.push(name, code);
        } else {
          // Generic filter
          const dbKey = key.charAt(0).toUpperCase() + key.slice(1); // Capitalize first letter
          whereClauses.push(`${dbKey} = ?`);
          queryParams.push(value);
        }
      } else if (typeof value === 'boolean' && value) {
        // Boolean filters
        if (key === 'noRetreat') {
          whereClauses.push(`(RetreatCost IS NULL OR RetreatCost = '' OR RetreatCost = '0')`);
        }
        if (key === 'noResistance') {
          whereClauses.push(`(ResistanceType IS NULL OR ResistanceType = '')`);
        }
        if (key === 'noWeakness') {
          whereClauses.push(`(WeaknessType IS NULL OR WeaknessType = '')`);
        }
      }
    });

    if (whereClauses.length > 0) {
      query += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    // Sorting logic
    const validSortColumns: { [key: string]: string } = {
      name: 'Name',
      id: 'CardID',
      rarity: 'Rarity',
      tier: 'Tier',
      description: `Skill1Effect || ' ' || Skill2Effect || ' ' || AbilityEffect`
    };

    if (validSortColumns[sortBy]) {
      const sortColumn = validSortColumns[sortBy];
      const direction = sortDirection.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
      query += ` ORDER BY ${sortColumn} ${direction}`;
    }

    // Pagination
    query += ` LIMIT ? OFFSET ?`;
    queryParams.push(limit, offset);

    // Execute query
    const stmt = db.prepare(query);
    const cards = stmt.all(...queryParams);

    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) as count FROM cards`;
    if (whereClauses.length > 0) {
      countQuery += ` WHERE ${whereClauses.join(' AND ')}`;
    }
    const countStmt = db.prepare(countQuery);
    const totalCount = countStmt.get(...queryParams.slice(0, -2)); // Exclude limit and offset

    db.close();

    return NextResponse.json({
      cards: cards,
      total: (totalCount as any).count,
      page,
      limit
    });

  } catch (error) {
    console.error('Error loading card data from database:', error);
    return NextResponse.json(
      { error: 'Failed to load card data' },
      { status: 500 }
    );
  }
}