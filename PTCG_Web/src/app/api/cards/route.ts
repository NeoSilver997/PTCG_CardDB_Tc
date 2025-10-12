import { NextRequest, NextResponse } from 'next/server';
const sqlite3 = require('sqlite3');
const path = require('path');

export const dynamic = 'force-dynamic';

// Database path
const dbPath = path.join(process.cwd(), '..', 'pokemon_cards.db');

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const isDetail = searchParams.get('detail') === 'true';

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
        getDetailedCards(db, resolve);
      } else {
        // Master request: return primary cards (master table)
        getPrimaryCards(db, resolve);
      }
    });
  });
}

function getPrimaryCards(db: any, resolve: (response: NextResponse) => void) {
  const query = `
    SELECT
      pc.id as PrimaryID,
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
    ORDER BY pc.name, pc.skill_name
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Query error:', err);
      resolve(NextResponse.json(
        { error: 'Failed to query primary cards' },
        { status: 500 }
      ));
      return;
    }

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

    db.close();
    resolve(NextResponse.json(cleanedCards));
  });
}

function getDetailedCards(db: any, resolve: (response: NextResponse) => void) {
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
    GROUP BY c.id, c.name, c.evolution_stage, c.web_card_id, c.image_url, c.card_type,
             c.hp, c.attribute, c.weakness, c.weakness_type, c.resistance, c.resistance_type,
             c.retreat_cost, c.collector_number, c.rarity, c.pokemon_info, c.tier, c.score,
             c.score_breakdown, c.primary_effect_type, c.special_effect_type,
             e.name, e.code, e.mark, i.name
    ORDER BY c.id
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Query error:', err);
      resolve(NextResponse.json(
        { error: 'Failed to query detailed cards' },
        { status: 500 }
      ));
      return;
    }

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

    db.close();
    resolve(NextResponse.json(cleanedCards));
  });
}