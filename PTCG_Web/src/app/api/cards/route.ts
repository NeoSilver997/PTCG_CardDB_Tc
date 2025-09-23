import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isDetail = searchParams.get('detail') === 'true';

    // Choose CSV file based on request type
    const csvFilename = isDetail ? 'cards_output_all_mega.csv' : 'mega_card.csv';
    const csvPath = path.join(process.cwd(), 'source', csvFilename);

    // Check if file exists
    if (!fs.existsSync(csvPath)) {
      return NextResponse.json(
        { error: `${csvFilename} file not found` },
        { status: 404 }
      );
    }

    // Read and parse CSV
    const csvContent = fs.readFileSync(csvPath, 'utf-8');

    const cards = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => {
        // Clean up header names to match our interface
        const headerMap: { [key: string]: string } = {
          'Name': 'Name',
          'Evolution': 'Evolution',
          'EvolutionStage': 'EvolutionStage',
          'WebCardID': 'CardID',
          'ImageURL': 'ImageURL',
          'CardType': 'CardType',
          'HP': 'HP',
          'Attribute': 'Type',
          'Ability': 'AbilityName',
          'AbilityDesc': 'AbilityEffect',
          'Skill1Name': 'Skill1Name',
          'Skill1Cost': 'Skill1Energy',
          'Skill1Damage': 'Skill1Damage',
          'Skill1Effect': 'Skill1Effect',
          'Skill2Name': 'Skill2Name',
          'Skill2Cost': 'Skill2Energy',
          'Skill2Damage': 'Skill2Damage',
          'Skill2Effect': 'Skill2Effect',
          'Weakness': 'Weakness',
          'WeaknessType': 'WeaknessType',
          'Resistance': 'Resistance',
          'ResistanceType': 'ResistanceType',
          'RetreatCost': 'RetreatCost',
          'CollectorNumber': 'CollectorNumber',
          'Rarity': 'Rarity',
          'Mark': 'RegulationMark',
          'Expansion': 'ExpansionName',
          'ExpansionCode': 'ExpansionCode',
          'Illustrator': 'Illustrator',
          'Artist': 'Artist',
          'PokemonInfo': 'PokemonInfo',
          'Subtypes': 'Subtypes',
          '主要效果類型': 'PrimaryEffectType',
          '特殊效果類型': 'SpecialEffectType',
          'Ability效果統計': 'AbilityStats',
          'Tier': 'Tier',
          'Score': 'Score',
          'ScoreBreakdown': 'ScoreBreakdown',
          'SpecialTag': 'SpecialTag'
        };
        return headerMap[header] || header;
      }
    });

    // Clean up the data
    const cleanedCards = cards.data.map((card: any) => {
      // Ensure all fields are strings and handle empty values
      const cleanedCard: any = {};
      Object.keys(card).forEach(key => {
        cleanedCard[key] = card[key] || '';
      });

      // For detailed requests, keep original ImageURL, for search requests convert to local paths
      if (cleanedCard.ImageURL && cleanedCard.ImageURL.startsWith('https://')) {
        if (isDetail) {
          // Keep original URL for detailed view
          cleanedCard.OriginalImageURL = cleanedCard.ImageURL;
        } else {
          // Extract the image filename from the URL for local path
          const urlParts = cleanedCard.ImageURL.split('/');
          const filename = urlParts[urlParts.length - 1];
          // Convert to local path: /cards/filename
          cleanedCard.ImageURL = `/cards/${filename}`;
        }
      }

      return cleanedCard;
    });

    return NextResponse.json(cleanedCards);

  } catch (error) {
    console.error('Error loading card data:', error);
    return NextResponse.json(
      { error: 'Failed to load card data' },
      { status: 500 }
    );
  }
}