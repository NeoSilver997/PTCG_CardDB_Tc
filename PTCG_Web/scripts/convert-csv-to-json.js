const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

function convertCsvToJson(csvPath, jsonPath, headerMap = {}) {
  try {
    console.log(`Converting ${csvPath} to ${jsonPath}`);

    // Read CSV file
    const csvContent = fs.readFileSync(csvPath, 'utf-8');

    // Parse CSV
    const result = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => headerMap[header] || header
    });

    // Clean up the data
    const cleanedData = result.data.map((item) => {
      const cleanedItem = {};
      Object.keys(item).forEach(key => {
        cleanedItem[key] = item[key] || '';
      });

      // Convert CardID to number if it exists
      if (cleanedItem.CardID && cleanedItem.CardID !== '') {
        cleanedItem.CardID = parseInt(cleanedItem.CardID, 10);
      }

      return cleanedItem;
    });

    // Write JSON file
    fs.writeFileSync(jsonPath, JSON.stringify(cleanedData, null, 2));
    console.log(`Converted ${cleanedData.length} records`);

  } catch (error) {
    console.error(`Error converting ${csvPath}:`, error);
  }
}

// Header mapping for CSV columns
const headerMap = {
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

// Convert both CSV files
const sourceDir = path.join(__dirname, '..', 'source');
const dataDir = path.join(__dirname, '..', 'src', 'data');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

convertCsvToJson(
  path.join(sourceDir, 'mega_card.csv'),
  path.join(dataDir, 'mega_card.json'),
  headerMap
);

convertCsvToJson(
  path.join(sourceDir, 'cards_output_all_mega.csv'),
  path.join(dataDir, 'cards_output_all_mega.json'),
  headerMap
);

console.log('CSV to JSON conversion completed!');