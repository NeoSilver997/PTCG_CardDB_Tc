import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

export async function GET(request: NextRequest) {
  try {
    // Path to the merged CSV file
    const csvPath = path.join(process.cwd(), '..', 'cards_output_all_mega_with_effects_smart_merged_final_success_with_ability_stats_rated_with_damage.csv');

    // Check if file exists
    if (!fs.existsSync(csvPath)) {
      return NextResponse.json(
        { error: 'Card data file not found' },
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
          'CardID': 'CardID',
          'ImageURL': 'ImageURL',
          'CardType': 'CardType',
          'HP': 'HP',
          'Type': 'Type',
          'Weakness': 'Weakness',
          'Resistance': 'Resistance',
          'Skill1Name': 'Skill1Name',
          'Skill1Energy': 'Skill1Energy',
          'Skill1Damage': 'Skill1Damage',
          'Skill1Effect': 'Skill1Effect',
          'Skill2Name': 'Skill2Name',
          'Skill2Energy': 'Skill2Energy',
          'Skill2Damage': 'Skill2Damage',
          'Skill2Effect': 'Skill2Effect',
          'AbilityName': 'AbilityName',
          'AbilityEffect': 'AbilityEffect',
          'RetreatCost': 'RetreatCost',
          'Illustrator': 'Illustrator',
          'Rarity': 'Rarity',
          'ExpansionCode': 'ExpansionCode',
          'ExpansionName': 'ExpansionName',
          'RegulationMark': 'RegulationMark',
          'Artist': 'Artist',
          'SpecialTag': 'SpecialTag',
          '主要效果類型': 'PrimaryEffectType',
          '特殊效果類型': 'SpecialEffectType',
          'Ability效果統計': 'AbilityStats',
          'Tier': 'Tier',
          'Score': 'Score',
          'ScoreBreakdown': 'ScoreBreakdown'
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

      // Convert image URLs to local paths
      if (cleanedCard.ImageURL && cleanedCard.ImageURL.startsWith('https://')) {
        // Extract the image filename from the URL
        const urlParts = cleanedCard.ImageURL.split('/');
        const filename = urlParts[urlParts.length - 1];
        // Convert to local path: /cards/filename
        cleanedCard.ImageURL = `/cards/${filename}`;
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