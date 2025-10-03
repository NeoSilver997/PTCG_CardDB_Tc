import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

export const dynamic = 'force-dynamic';

const dbPath = '/app/PTCG_Web/public/ptcg_cards.db';

const getDb = () => {
  try {
    return new Database(dbPath, { readonly: true });
  } catch (error) {
    console.error("Failed to connect to database:", error);
    throw new Error("Failed to connect to database.");
  }
};

// Helper function to get distinct, non-empty values from a column
const getDistinctValues = (db: Database.Database, columnName: string): { value: string; label: string; }[] => {
    try {
        const rows = db.prepare(`SELECT DISTINCT ${columnName} FROM cards WHERE ${columnName} IS NOT NULL AND ${columnName} != ''`).all();
        return rows.map((row: any) => ({
            value: row[columnName],
            label: row[columnName]
        }));
    } catch (e) {
        console.error(`Error fetching distinct values for ${columnName}:`, e);
        return [];
    }
};

// Helper function to get distinct values from comma-separated strings
const getDistinctFromCommaSeparated = (db: Database.Database, columnName: string): { value: string; label: string; count: number }[] => {
    try {
        const rows = db.prepare(`SELECT ${columnName} FROM cards WHERE ${columnName} IS NOT NULL AND ${columnName} != ''`).all();
        const valueMap = new Map<string, number>();

        rows.forEach((row: any) => {
            const values = row[columnName].split(',').map((v: string) => v.trim()).filter(Boolean);
            values.forEach((value: string) => {
                valueMap.set(value, (valueMap.get(value) || 0) + 1);
            });
        });

        return Array.from(valueMap.entries())
            .map(([value, count]) => ({ value, label: value, count }))
            .sort((a, b) => b.count - a.count);
    } catch (e) {
        console.error(`Error fetching distinct comma-separated values for ${columnName}:`, e);
        return [];
    }
};

export async function GET(request: NextRequest) {
  const db = getDb();
  try {
    const abilities = getDistinctFromCommaSeparated(db, 'AbilityStats');
    const effectTypes = getDistinctFromCommaSeparated(db, 'PrimaryEffectType');
    const cardTypes = getDistinctValues(db, 'CardType');
    const rarities = getDistinctValues(db, 'Rarity');
    const tiers = getDistinctValues(db, 'Tier');
    const attributes = getDistinctValues(db, 'Type');
    const regulations = getDistinctValues(db, 'RegulationMark');
    const expansions = db.prepare(`
        SELECT DISTINCT ExpansionName, ExpansionCode
        FROM cards
        WHERE ExpansionName IS NOT NULL AND ExpansionName != '' AND ExpansionCode IS NOT NULL AND ExpansionCode != ''
    `).all().map((row: any) => ({
        value: `${row.ExpansionName}|${row.ExpansionCode}`,
        label: `${row.ExpansionName} (${row.ExpansionCode})`
    }));

    const weaknessTypes = getDistinctValues(db, 'WeaknessType');
    const resistanceTypes = getDistinctValues(db, 'ResistanceType');

    return NextResponse.json({
      abilities,
      effectTypes,
      cardTypes,
      rarities,
      tiers,
      attributes,
      regulations,
      expansions,
      weaknessTypes,
      resistanceTypes
    });
  } catch (error) {
    console.error('Error fetching filter options:', error);
    return NextResponse.json(
      { error: 'Failed to load filter options' },
      { status: 500 }
    );
  } finally {
    if (db) {
      db.close();
    }
  }
}