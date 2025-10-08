import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isDetail = searchParams.get('detail') === 'true';

    // Fetch data from public folder URLs instead of static imports
    const dataUrl = isDetail
      ? `${request.nextUrl.origin}/cards_output_all_mega.json`
      : `${request.nextUrl.origin}/mega_card.json`;

    console.log('API Request:', {
      isDetail,
      dataSource: isDetail ? 'detailed' : 'compact',
      dataUrl
    });

    const response = await fetch(dataUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
    }

    const cards = await response.json();

    console.log('Data loaded successfully:', {
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