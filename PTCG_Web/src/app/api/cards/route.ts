import { NextRequest, NextResponse } from 'next/server';
const sqlite3 = require('sqlite3');
const path = require('path');

export const dynamic = 'force-dynamic';

// Database path - configurable via environment variable
const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), '..', 'pokemon_cards.db');
console.log(`[CARDS API] Using database path: ${dbPath}`);

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const isDetail = searchParams.get('detail') === 'true';
  const cardId = searchParams.get('cardId') || searchParams.get('id');
  const primaryId = searchParams.get('primaryId') || cardId; // Support both primaryId and cardId/id
  const getVersions = searchParams.get('versions') === 'true';

  return new Promise((resolve, reject) => {
    // Open database connection
    const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
      if (err) {
        console.error('Database connection error:', err);
        resolve(NextResponse.json(
          { error: 'Database connection failed' },
          { status: 500 }
        ));
        return;
      }

      if (isDetail) {
        // Detail request: return all records with full card details
        getDetailedCards(db, resolve, primaryId || undefined, getVersions);
      } else {
        // Master request: return primary cards (master table)
        getPrimaryCards(db, resolve, cardId || undefined, getVersions);
      }
    });
  });
}

function getPrimaryCards(db: any, resolve: (response: NextResponse) => void, cardId?: string | null, getVersions?: boolean) {
  if (getVersions && cardId) {
    // Get all versions with the same name as the specified card
    getCardVersions(db, resolve, cardId!, false);
    return;
  }

  console.log(`[CARDS API] getPrimaryCards called with cardId: ${cardId}, getVersions: ${getVersions}`);

  let query = `
    SELECT
      pc.primary_card_id as PrimaryID,
      pc.name as Name,
      pc.skill_name,
      pc.primary_card_id,
      pc.count as VariantCount,
      pc.rarity_card_ids,
      c.web_card_id as CardID,
      c.image_url as ImageURL,
      c.card_type as CardType,
      c.hp as HP,
      c.attribute as Type,
      c.attribute as Attribute,
      c.weakness as Weakness,
      c.weakness_type as WeaknessType,
      c.resistance as Resistance,
      c.resistance_type as ResistanceType,
      c.retreat_cost as RetreatCost,
      c.rarity as Rarity,
      c.expansion_id,
      e.name as ExpansionName,
      e.code as ExpansionCode,
      c.illustrator_id,
      i.name as Illustrator,
      c.evolution_stage as EvolutionStage,
      c.pokemon_info as Evolution,
      c.collector_number as CollectorNumber,
      c.tier as Tier,
      c.score as Score,
      c.score_breakdown as ScoreBreakdown,
      c.primary_effect_type as PrimaryEffectType,
      c.special_effect_type as SpecialEffectType
    FROM primary_cards pc
    JOIN cards c ON pc.primary_card_id = c.id
    LEFT JOIN expansions e ON c.expansion_id = e.id
    LEFT JOIN illustrators i ON c.illustrator_id = i.id
  `;

  const params: any[] = [];

  if (cardId) {
    query += ` WHERE  c.id = ?`;
    params.push(cardId, parseInt(cardId) || 0);
  }

  query += ` ORDER BY pc.name, pc.skill_name`;

  console.log(`[CARDS API] Executing primary cards query${cardId ? ` for cardId: ${cardId}` : ' (all cards)'}`);
  console.log(`[CARDS API] Primary cards query: ${query.trim().substring(0, 100)}...`);
  console.log(`[CARDS API] Query parameters: [${params.join(', ')}]`);

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('[CARDS API] Query error in getPrimaryCards:', err);
      resolve(NextResponse.json(
        { error: 'Failed to query primary cards' },
        { status: 500 }
      ));
      return;
    }

    console.log(`[CARDS API] Primary cards query returned ${rows ? rows.length : 0} rows`);

    // Clean up the data
    const cleanedCards = rows.map((card: any) => {
      const cleanedCard: any = {};
      Object.keys(card).forEach(key => {
        cleanedCard[key] = card[key] || '';
      });

      // Convert CardID to number if it's numeric
      if (cleanedCard.CardID && cleanedCard.CardID !== '' && !isNaN(cleanedCard.CardID)) {
        cleanedCard.CardID = parseInt(cleanedCard.CardID, 10);
      }

      // Handle image URL
      if (cleanedCard.ImageURL && cleanedCard.ImageURL.startsWith('https://')) {
        const urlParts = cleanedCard.ImageURL.split('/');
        const filename = urlParts[urlParts.length - 1];
        cleanedCard.ImageURL = `/cards/${filename}`;
      }

      return cleanedCard;
    });

    console.log(`[CARDS API] Returning ${cleanedCards.length} cleaned primary cards`);
    db.close();
    resolve(NextResponse.json(cleanedCards, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    }));
  });
}

function getDetailedCards(db: any, resolve: (response: NextResponse) => void, primaryId?: string | null, getVersions?: boolean) {
  if (getVersions && primaryId) {
    // Get all versions with the same name as the specified card
    getCardVersions(db, resolve, primaryId!, true);
    return;
  }

  console.log(`[CARDS API] getDetailedCards called with primaryId: ${primaryId}, getVersions: ${getVersions}`);

  let query = `
    SELECT
      c.id,
      c.name,
      c.evolution_stage as EvolutionStage,
      c.web_card_id as CardID,
      c.image_url as ImageURL,
      c.card_type as CardType,
      c.hp as HP,
      c.attribute as Type,
      c.weakness as Weakness,
      c.weakness_type as WeaknessType,
      c.resistance as Resistance,
      c.resistance_type as ResistanceType,
      c.retreat_cost as RetreatCost,
      c.collector_number as CollectorNumber,
      c.rarity as Rarity,
      c.pokemon_info as PokemonInfo,
      c.tier as Tier,
      c.score as Score,
      c.score_breakdown as ScoreBreakdown,
      c.primary_effect_type as PrimaryEffectType,
      c.special_effect_type as SpecialEffectType,
      e.name as ExpansionName,
      e.code as ExpansionCode,
      e.mark as RegulationMark,
      i.name as Illustrator,
      -- Skills (JSON-like structure)
      GROUP_CONCAT(
        CASE WHEN s.skill_number = 1 THEN
          JSON_OBJECT(
            'name', s.name,
            'cost', s.cost,
            'damage', s.damage,
            'description', s.description
          )
        END
      ) as Skill1,
      GROUP_CONCAT(
        CASE WHEN s.skill_number = 2 THEN
          JSON_OBJECT(
            'name', s.name,
            'cost', s.cost,
            'damage', s.damage,
            'description', s.description
          )
        END
      ) as Skill2,
      -- Abilities
      GROUP_CONCAT(
        JSON_OBJECT(
          'name', a.name,
          'description', a.description
        )
      ) as Abilities,
      -- Evolutions
      GROUP_CONCAT(ev.evolution) as Evolutions,
      -- Subtypes
      GROUP_CONCAT(sub.subtype) as Subtypes
    FROM cards c
    LEFT JOIN expansions e ON c.expansion_id = e.id
    LEFT JOIN illustrators i ON c.illustrator_id = i.id
    LEFT JOIN skills s ON c.id = s.card_id
    LEFT JOIN abilities a ON c.id = a.card_id
    LEFT JOIN evolutions ev ON c.id = ev.card_id
    LEFT JOIN subtypes sub ON c.id = sub.card_id
  `;

  const params: any[] = [];

  if (primaryId) {
    query += ` WHERE  c.id = ?`;
    params.push(primaryId, parseInt(primaryId) || 0);
  }

  query += `
    GROUP BY c.id, c.name, c.evolution_stage, c.web_card_id, c.image_url, c.card_type,
             c.hp, c.attribute, c.weakness, c.weakness_type, c.resistance, c.resistance_type,
             c.retreat_cost, c.collector_number, c.rarity, c.pokemon_info, c.tier, c.score,
             c.score_breakdown, c.primary_effect_type, c.special_effect_type,
             e.name, e.code, e.mark, i.name
    ORDER BY c.id
  `;

  console.log(`[CARDS API] Executing detailed cards query${primaryId ? ` for primaryId: ${primaryId}` : ' (all cards)'}`);
  console.log(`[CARDS API] Detailed cards query: ${query.trim().substring(0, 100)}...`);
  console.log(`[CARDS API] Query parameters: [${params.join(', ')}]`);

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('[CARDS API] Query error in getDetailedCards:', err);
      resolve(NextResponse.json(
        { error: 'Failed to query detailed cards' },
        { status: 500 }
      ));
      return;
    }

    console.log(`[CARDS API] Detailed cards query returned ${rows ? rows.length : 0} rows`);

    // Clean up and format the data
    const cleanedCards = rows.map((card: any) => {
      const cleanedCard: any = {};
      Object.keys(card).forEach(key => {
        if (key === 'Skill1' || key === 'Skill2' || key === 'Abilities') {
          // Parse JSON strings for complex fields
          if (card[key] && card[key] !== 'null') {
            try {
              // SQLite returns JSON as string, need to parse it
              const jsonStr = card[key].replace(/null/g, '""');
              cleanedCard[key] = JSON.parse(`[${jsonStr}]`).filter(item => item && Object.keys(item).length > 0);
            } catch (e) {
              cleanedCard[key] = [];
            }
          } else {
            cleanedCard[key] = [];
          }
        } else if (key === 'Evolutions' || key === 'Subtypes') {
          // Split comma-separated strings
          cleanedCard[key] = card[key] ? card[key].split(',').filter(item => item.trim()) : [];
        } else {
          cleanedCard[key] = card[key] || '';
        }
      });

      // Convert CardID to number
      if (cleanedCard.CardID && cleanedCard.CardID !== '' && !isNaN(cleanedCard.CardID)) {
        cleanedCard.CardID = parseInt(cleanedCard.CardID, 10);
      }

      // Keep original ImageURL for detailed view
      if (cleanedCard.ImageURL && cleanedCard.ImageURL.startsWith('https://')) {
        cleanedCard.OriginalImageURL = cleanedCard.ImageURL;
      }

      return cleanedCard;
    });

    console.log(`[CARDS API] Returning ${cleanedCards.length} cleaned detailed cards`);
    db.close();
    resolve(NextResponse.json(cleanedCards, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    }));
  });
}// Get all card versions with the same name as the specified card ID
function getCardVersions(db: any, resolve: (response: NextResponse) => void, primaryId: string, isDetail: boolean) {
  console.log(`[CARDS API] getCardVersions called with primaryId: ${primaryId}, isDetail: ${isDetail}`);

  // First, find the card name by card ID
  const findCardQuery = `
    SELECT name FROM cards
    WHERE id = ?
    LIMIT 1
  `;

  console.log(`[CARDS API] Executing findCardQuery: ${findCardQuery.trim()}`);
  console.log(`[CARDS API] Query parameters: [${primaryId}, ${parseInt(primaryId) || 0}]`);

  db.get(findCardQuery, [primaryId], (err, cardRow) => {
    if (err) {
      console.error('[CARDS API] Error finding card:', err);
      resolve(NextResponse.json(
        { error: 'Failed to find card' },
        { status: 500 }
      ));
      return;
    }

    if (!cardRow) {
      console.log(`[CARDS API] Card not found for primaryId: ${primaryId}`);
      resolve(NextResponse.json(
        { error: 'Card not found' },
        { status: 404 }
      ));
      return;
    }

    const cardName = cardRow.name;
    console.log(`[CARDS API] Found card name: ${cardName} for ID: ${primaryId}`);

    if (isDetail) {
      console.log(`[CARDS API] Getting detailed versions for card: ${cardName}`);
      // Get detailed versions
      getDetailedCardsByName(db, resolve, cardName);
    } else {
      console.log(`[CARDS API] Getting primary versions for card: ${cardName}`);
      // Get primary versions
      getPrimaryCardsByName(db, resolve, cardName);
    }
  });
}

// Get primary cards by name
function getPrimaryCardsByName(db: any, resolve: (response: NextResponse) => void, cardName: string) {
  console.log(`[CARDS API] getPrimaryCardsByName called with cardName: ${cardName}`);

  const query = `
    SELECT
      pc.primary_card_id as PrimaryID,
      pc.name as Name,
      pc.skill_name,
      pc.primary_card_id,
      pc.count as VariantCount,
      pc.rarity_card_ids,
      c.web_card_id as CardID,
      c.image_url as ImageURL,
      c.card_type as CardType,
      c.hp as HP,
      c.attribute as Type,
      c.attribute as Attribute,
      c.weakness as Weakness,
      c.weakness_type as WeaknessType,
      c.resistance as Resistance,
      c.resistance_type as ResistanceType,
      c.retreat_cost as RetreatCost,
      c.rarity as Rarity,
      c.expansion_id,
      e.name as ExpansionName,
      e.code as ExpansionCode,
      c.illustrator_id,
      i.name as Illustrator,
      c.evolution_stage as EvolutionStage,
      c.pokemon_info as Evolution,
      c.collector_number as CollectorNumber,
      c.tier as Tier,
      c.score as Score,
      c.score_breakdown as ScoreBreakdown,
      c.primary_effect_type as PrimaryEffectType,
      c.special_effect_type as SpecialEffectType
    FROM primary_cards pc
    JOIN cards c ON pc.primary_card_id = c.id
    LEFT JOIN expansions e ON c.expansion_id = e.id
    LEFT JOIN illustrators i ON c.illustrator_id = i.id
    WHERE pc.name = ?
    ORDER BY pc.name, pc.skill_name
  `;

  console.log(`[CARDS API] Executing primary cards query for cardName: ${cardName}`);
  console.log(`[CARDS API] Primary cards query: ${query.trim().substring(0, 100)}...`);

  db.all(query, [cardName], (err, rows) => {
    if (err) {
      console.error('[CARDS API] Query error in getPrimaryCardsByName:', err);
      resolve(NextResponse.json(
        { error: 'Failed to query primary cards' },
        { status: 500 }
      ));
      return;
    }

    console.log(`[CARDS API] Primary cards query returned ${rows ? rows.length : 0} rows for cardName: ${cardName}`);

    // Clean up the data
    const cleanedCards = rows.map((card: any) => {
      const cleanedCard: any = {};
      Object.keys(card).forEach(key => {
        cleanedCard[key] = card[key] || '';
      });

      // Convert CardID to number if it's numeric
      if (cleanedCard.CardID && cleanedCard.CardID !== '' && !isNaN(cleanedCard.CardID)) {
        cleanedCard.CardID = parseInt(cleanedCard.CardID, 10);
      }

      // Handle image URL
      if (cleanedCard.ImageURL && cleanedCard.ImageURL.startsWith('https://')) {
        const urlParts = cleanedCard.ImageURL.split('/');
        const filename = urlParts[urlParts.length - 1];
        cleanedCard.ImageURL = `/cards/${filename}`;
      }

      return cleanedCard;
    });

    console.log(`[CARDS API] Returning ${cleanedCards.length} cleaned primary cards`);
    db.close();
    resolve(NextResponse.json(cleanedCards, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    }));
  });
}

// Get detailed cards by name
function getDetailedCardsByName(db: any, resolve: (response: NextResponse) => void, cardName: string) {
  console.log(`[CARDS API] getDetailedCardsByName called with cardName: ${cardName}`);

  const query = `
    SELECT
      c.id,
      c.name,
      c.evolution_stage as EvolutionStage,
      c.web_card_id as CardID,
      c.image_url as ImageURL,
      c.card_type as CardType,
      c.hp as HP,
      c.attribute as Type,
      c.weakness as Weakness,
      c.weakness_type as WeaknessType,
      c.resistance as Resistance,
      c.resistance_type as ResistanceType,
      c.retreat_cost as RetreatCost,
      c.collector_number as CollectorNumber,
      c.rarity as Rarity,
      c.pokemon_info as PokemonInfo,
      c.tier as Tier,
      c.score as Score,
      c.score_breakdown as ScoreBreakdown,
      c.primary_effect_type as PrimaryEffectType,
      c.special_effect_type as SpecialEffectType,
      e.name as ExpansionName,
      e.code as ExpansionCode,
      e.mark as RegulationMark,
      i.name as Illustrator,
      -- Skills (JSON-like structure)
      GROUP_CONCAT(
        CASE WHEN s.skill_number = 1 THEN
          JSON_OBJECT(
            'name', s.name,
            'cost', s.cost,
            'damage', s.damage,
            'description', s.description
          )
        END
      ) as Skill1,
      GROUP_CONCAT(
        CASE WHEN s.skill_number = 2 THEN
          JSON_OBJECT(
            'name', s.name,
            'cost', s.cost,
            'damage', s.damage,
            'description', s.description
          )
        END
      ) as Skill2,
      -- Abilities
      GROUP_CONCAT(
        JSON_OBJECT(
          'name', a.name,
          'description', a.description
        )
      ) as Abilities,
      -- Evolutions
      GROUP_CONCAT(ev.evolution) as Evolutions,
      -- Subtypes
      GROUP_CONCAT(sub.subtype) as Subtypes
    FROM cards c
    LEFT JOIN expansions e ON c.expansion_id = e.id
    LEFT JOIN illustrators i ON c.illustrator_id = i.id
    LEFT JOIN skills s ON c.id = s.card_id
    LEFT JOIN abilities a ON c.id = a.card_id
    LEFT JOIN evolutions ev ON c.id = ev.card_id
    LEFT JOIN subtypes sub ON c.id = sub.card_id
    WHERE c.name = ?
    GROUP BY c.id, c.name, c.evolution_stage, c.web_card_id, c.image_url, c.card_type,
             c.hp, c.attribute, c.weakness, c.weakness_type, c.resistance, c.resistance_type,
             c.retreat_cost, c.collector_number, c.rarity, c.pokemon_info, c.tier, c.score,
             c.score_breakdown, c.primary_effect_type, c.special_effect_type,
             e.name, e.code, e.mark, i.name
    ORDER BY c.id
  `;

  console.log(`[CARDS API] Executing detailed cards query for cardName: ${cardName}`);
  console.log(`[CARDS API] Detailed cards query: ${query.trim().substring(0, 100)}...`);

  db.all(query, [cardName], (err, rows) => {
    if (err) {
      console.error('[CARDS API] Query error in getDetailedCardsByName:', err);
      resolve(NextResponse.json(
        { error: 'Failed to query detailed cards' },
        { status: 500 }
      ));
      return;
    }

    console.log(`[CARDS API] Detailed cards query returned ${rows ? rows.length : 0} rows for cardName: ${cardName}`);

    // Clean up and format the data
    const cleanedCards = rows.map((card: any) => {
      const cleanedCard: any = {};
      Object.keys(card).forEach(key => {
        if (key === 'Skill1' || key === 'Skill2' || key === 'Abilities') {
          // Parse JSON strings for complex fields
          if (card[key] && card[key] !== 'null') {
            try {
              // Handle comma-separated JSON objects
              const jsonStrings = card[key].split(',');
              const parsed = jsonStrings.map((jsonStr: string) => {
                try {
                  return JSON.parse(jsonStr.trim());
                } catch {
                  return null;
                }
              }).filter(item => item !== null);
              cleanedCard[key] = parsed.length > 0 ? parsed : [];
            } catch {
              cleanedCard[key] = [];
            }
          } else {
            cleanedCard[key] = [];
          }
        } else if (key === 'Evolutions' || key === 'Subtypes') {
          // Handle comma-separated simple strings
          if (card[key] && card[key] !== 'null') {
            cleanedCard[key] = card[key].split(',').map((item: string) => item.trim()).filter(item => item);
          } else {
            cleanedCard[key] = [];
          }
        } else {
          cleanedCard[key] = card[key] || '';
        }
      });

      // Convert CardID to number if it's numeric
      if (cleanedCard.CardID && cleanedCard.CardID !== '' && !isNaN(cleanedCard.CardID)) {
        cleanedCard.CardID = parseInt(cleanedCard.CardID, 10);
      }

      // Handle image URL
      if (cleanedCard.ImageURL && cleanedCard.ImageURL.startsWith('https://')) {
        const urlParts = cleanedCard.ImageURL.split('/');
        const filename = urlParts[urlParts.length - 1];
        cleanedCard.ImageURL = `/cards/${filename}`;
      }

      return cleanedCard;
    });

    db.close();
    resolve(NextResponse.json(cleanedCards, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    }));
  });
}
