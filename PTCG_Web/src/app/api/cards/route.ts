import { NextRequest, NextResponse } from 'next/server';
// Import pre-processed JSON data instead of reading CSV at runtime
import megaCardData from '../../../data/mega_card.json';
import detailedCardData from '../../../data/cards_output_all_mega.json';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isDetail = searchParams.get('detail') === 'true';

    // Use pre-loaded JSON data instead of reading CSV files
    const cards = isDetail ? detailedCardData : megaCardData;

    console.log('API Request:', {
      isDetail,
      dataSource: isDetail ? 'detailed' : 'compact',
      cardCount: cards.length
    });

    return NextResponse.json(cards);

  } catch (error) {
    console.error('Error loading card data:', error);
    return NextResponse.json(
      { error: 'Failed to load card data', details: error.message },
      { status: 500 }
    );
  }
}