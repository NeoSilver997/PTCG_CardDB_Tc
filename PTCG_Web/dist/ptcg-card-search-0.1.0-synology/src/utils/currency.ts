import { PTCGCard } from '../types/card';

/**
 * Determines the default currency for a card based on its language/region
 * @param card - The PTCG card to analyze
 * @returns The appropriate currency code (HKD, JPY, or USD)
 */
export function getDefaultCurrencyForCard(card: PTCGCard): string {
  // Check for Chinese characters in card name or expansion name
  const hasChineseCharacters = (text: string): boolean => {
    return /[\u4e00-\u9fff\u3400-\u4dbf\u20000-\u2a6df\u2a700-\u2b73f\u2b740-\u2b81f\u2ceb0-\u2ebef]/.test(text);
  };

  // Check for Japanese characters (Hiragana, Katakana, Kanji)
  const hasJapaneseCharacters = (text: string): boolean => {
    return /[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf\u3400-\u4dbf]/.test(text);
  };

  // Priority order for detection:
  // 1. Check expansion code for region indicators
  // 2. Check card name for language characters
  // 3. Check expansion name for language characters

  const expansionCode = card.ExpansionCode?.toLowerCase() || '';
  const cardName = card.Name || '';
  const expansionName = card.ExpansionName || '';

  // Check expansion code for Hong Kong/Chinese indicators
  if (expansionCode.includes('hk') || expansionCode.includes('tw') || expansionCode.includes('cn')) {
    return 'HKD';
  }

  // Check expansion code for Japanese indicators
  if (expansionCode.includes('jp') || expansionCode.includes('ja')) {
    return 'JPY';
  }

  // Check expansion code for English/US indicators
  if (expansionCode.includes('en') || expansionCode.includes('us') || expansionCode.includes('na')) {
    return 'USD';
  }

  // Check card name for language characters
  if (hasChineseCharacters(cardName) && !hasJapaneseCharacters(cardName)) {
    return 'HKD';
  }

  if (hasJapaneseCharacters(cardName)) {
    return 'JPY';
  }

  // Check expansion name for language characters
  if (hasChineseCharacters(expansionName) && !hasJapaneseCharacters(expansionName)) {
    return 'HKD';
  }

  if (hasJapaneseCharacters(expansionName)) {
    return 'JPY';
  }

  // Additional checks for common Chinese/Japanese expansion patterns
  const chineseExpansions = ['繁體', '简体', '中文', '香港', '台湾', '大陆'];
  const japaneseExpansions = ['日本', '日文', 'ポケモン'];

  for (const pattern of chineseExpansions) {
    if (expansionName.includes(pattern)) {
      return 'HKD';
    }
  }

  for (const pattern of japaneseExpansions) {
    if (expansionName.includes(pattern)) {
      return 'JPY';
    }
  }

  // Default to HKD for unrecognized cards
  return 'HKD';
}

/**
 * Gets the currency symbol for display
 * @param currency - Currency code (HKD, JPY, USD, etc.)
 * @returns The currency symbol
 */
export function getCurrencySymbol(currency: string): string {
  const symbols: { [key: string]: string } = {
    'USD': '$',
    'HKD': 'HK$',
    'JPY': '¥',
    'EUR': '€',
    'GBP': '£'
  };
  return symbols[currency] || currency;
}

/**
 * Gets the currency name for display
 * @param currency - Currency code
 * @returns The currency name
 */
export function getCurrencyName(currency: string): string {
  const names: { [key: string]: string } = {
    'USD': 'US Dollar',
    'HKD': 'Hong Kong Dollar',
    'JPY': 'Japanese Yen',
    'EUR': 'Euro',
    'GBP': 'British Pound'
  };
  return names[currency] || currency;
}