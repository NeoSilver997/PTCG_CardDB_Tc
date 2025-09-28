// Test the currency detection functionality
import { getDefaultCurrencyForCard, getCurrencySymbol, getCurrencyName } from './src/utils/currency.js';

// Test cards with different languages and regions
const testCards = [
  // Chinese cards
  { Name: '皮卡丘', ExpansionCode: 'hk001', ExpansionName: '香港版', CardID: 1 } as any,
  { Name: '雷伊布', ExpansionCode: '', ExpansionName: '繁體中文', CardID: 2 } as any,
  { Name: '伊布', ExpansionCode: 'tw001', ExpansionName: '台灣版', CardID: 3 } as any,
  
  // Japanese cards  
  { Name: 'ピカチュウ', ExpansionCode: 'jp001', ExpansionName: '日本版', CardID: 4 } as any,
  { Name: 'イーブイ', ExpansionCode: '', ExpansionName: 'ポケモンカード', CardID: 5 } as any,
  
  // English cards
  { Name: 'Pikachu', ExpansionCode: 'en001', ExpansionName: 'English Edition', CardID: 6 } as any,
  { Name: 'Eevee', ExpansionCode: 'us001', ExpansionName: 'Base Set', CardID: 7 } as any,
  { Name: 'Charizard', ExpansionCode: '', ExpansionName: 'International', CardID: 8 } as any,
];

console.log('Currency Detection Test Results:');
console.log('=====================================');

testCards.forEach((card, i) => {
  const currency = getDefaultCurrencyForCard(card);
  const symbol = getCurrencySymbol(currency);
  console.log(`${i+1}. ${card.Name} → ${currency} (${symbol})`);
  console.log(`   Expansion: ${card.ExpansionName || 'None'}`);
  console.log(`   Code: ${card.ExpansionCode || 'None'}`);
  console.log('');
});

export {};