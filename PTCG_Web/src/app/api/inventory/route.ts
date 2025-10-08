import { NextRequest, NextResponse } from 'next/server';

// For Vercel deployment, use in-memory storage since file system writes don't persist
// In production, this should use a database like Vercel KV, MongoDB, or Supabase
let inventoryData: any[] = [];

// Load initial inventory data (read-only for Vercel compatibility)
const loadInitialInventory = () => {
  try {
    // On Vercel, we can't read from file system reliably, so we'll start with empty array
    // In development/local, you could load from a static import or API call
    return [];
  } catch (error) {
    console.error('Error loading initial inventory:', error);
    return [];
  }
};

// Initialize inventory data
if (inventoryData.length === 0) {
  inventoryData = loadInitialInventory();
}

export async function GET() {
  try {
    return NextResponse.json(inventoryData);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to load inventory' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { CardID, quantity, condition, notes, purchaseCost, marketPrice } = body;

    if (!CardID || quantity === undefined || !condition) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate price fields if provided
    if (purchaseCost !== undefined && (isNaN(purchaseCost) || purchaseCost < 0)) {
      return NextResponse.json(
        { error: 'Purchase cost must be a valid positive number' },
        { status: 400 }
      );
    }

    if (marketPrice !== undefined && (isNaN(marketPrice) || marketPrice < 0)) {
      return NextResponse.json(
        { error: 'Market price must be a valid positive number' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Check if card already exists in inventory
    const existingIndex = inventoryData.findIndex((item: any) =>
      item.CardID === CardID && item.condition === condition
    );

    if (existingIndex >= 0) {
      // Update existing entry
      inventoryData[existingIndex].quantity = quantity;
      inventoryData[existingIndex].notes = notes || inventoryData[existingIndex].notes;
      inventoryData[existingIndex].purchaseCost = purchaseCost !== undefined ? purchaseCost : inventoryData[existingIndex].purchaseCost;
      inventoryData[existingIndex].marketPrice = marketPrice !== undefined ? marketPrice : inventoryData[existingIndex].marketPrice;
      inventoryData[existingIndex].lastUpdated = now;
    } else {
      // Add new entry
      inventoryData.push({
        CardID,
        quantity,
        condition,
        notes: notes || '',
        purchaseCost: purchaseCost || undefined,
        marketPrice: marketPrice || undefined,
        dateAdded: now,
        lastUpdated: now
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update inventory' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const CardID = searchParams.get('cardId');
    const condition = searchParams.get('condition');

    if (!CardID) {
      return NextResponse.json(
        { error: 'Card ID is required' },
        { status: 400 }
      );
    }

    if (condition) {
      // Remove specific condition entry
      inventoryData = inventoryData.filter((item: any) =>
        !(item.CardID === parseInt(CardID) && item.condition === condition)
      );
    } else {
      // Remove all entries for this card
      inventoryData = inventoryData.filter((item: any) =>
        item.CardID !== parseInt(CardID)
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete from inventory' },
      { status: 500 }
    );
  }
}