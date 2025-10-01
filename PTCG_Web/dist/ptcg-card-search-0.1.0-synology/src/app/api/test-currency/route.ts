import { NextRequest, NextResponse } from 'next/server';
import { getDefaultCurrencyForCard, getCurrencySymbol, getCurrencyName } from '../../../utils/currency';
import { PTCGCard } from '../../../types/card';

export async function GET() {
  // Test data for currency detection
  const testCards: { description: string; card: Partial<PTCGCard> }[] = [
    {
      description: "Chinese card (Traditional characters)",
      card: {
        Name: "皮卡丘",
        ExpansionName: "繁體中文版",
        ExpansionCode: "tc"
      }
    },
    {
      description: "Japanese card (Hiragana/Katakana)",
      card: {
        Name: "ピカチュウ",
        ExpansionName: "拡張パック",
        ExpansionCode: "s1H"
      }
    },
    {
      description: "English card",
      card: {
        Name: "Pikachu",
        ExpansionName: "Base Set",
        ExpansionCode: "BS"
      }
    },
    {
      description: "Hong Kong expansion code",
      card: {
        Name: "Test Card",
        ExpansionName: "Test Expansion",
        ExpansionCode: "HK001"
      }
    },
    {
      description: "Japanese expansion code",
      card: {
        Name: "Test Card",
        ExpansionName: "Test Expansion",
        ExpansionCode: "JP001"
      }
    },
    {
      description: "Mixed Chinese characters in expansion",
      card: {
        Name: "Charizard",
        ExpansionName: "火龍系列",
        ExpansionCode: "DRG"
      }
    }
  ];

  const results = testCards.map(({ description, card }) => {
    const currency = getDefaultCurrencyForCard(card as PTCGCard);
    const symbol = getCurrencySymbol(currency);
    const name = getCurrencyName(currency);
    
    return {
      description,
      card: {
        Name: card.Name,
        ExpansionName: card.ExpansionName,
        ExpansionCode: card.ExpansionCode
      },
      detectedCurrency: currency,
      symbol,
      currencyName: name,
      expectedCurrency: description.includes('Chinese') || description.includes('Hong Kong') || description.includes('Mixed Chinese') ? 'HKD' : 
                       description.includes('Japanese') ? 'JPY' : 'USD',
      success: (
        (description.includes('Chinese') || description.includes('Hong Kong') || description.includes('Mixed Chinese')) && currency === 'HKD' ||
        description.includes('Japanese') && currency === 'JPY' ||
        description.includes('English') && currency === 'USD'
      )
    };
  });

  const allPassed = results.every(r => r.success);

  return NextResponse.json({
    testResults: results,
    summary: {
      totalTests: results.length,
      passed: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      allPassed,
      timestamp: new Date().toISOString()
    }
  });
}