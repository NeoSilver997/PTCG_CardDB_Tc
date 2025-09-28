import { NextRequest, NextResponse } from 'next/server';
import { MarketPrice } from '../../../types/market';
import fs from 'fs';
import path from 'path';

const MARKET_PRICES_FILE = path.join(process.cwd(), 'data', 'market-prices.json');

interface MarketPriceData {
  [cardId: string]: MarketPrice[];
}

// Helper function to ensure the data directory and file exist
function ensureMarketPricesFile() {
  const dataDir = path.dirname(MARKET_PRICES_FILE);
  
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  if (!fs.existsSync(MARKET_PRICES_FILE)) {
    fs.writeFileSync(MARKET_PRICES_FILE, JSON.stringify({}));
  }
}

// Helper function to load market prices
function loadMarketPrices(): MarketPriceData {
  try {
    ensureMarketPricesFile();
    const data = fs.readFileSync(MARKET_PRICES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading market prices:', error);
    return {};
  }
}

// Helper function to save market prices
function saveMarketPrices(data: MarketPriceData) {
  try {
    ensureMarketPricesFile();
    fs.writeFileSync(MARKET_PRICES_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving market prices:', error);
    throw error;
  }
}

// GET - Get all market prices or prices for a specific card
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cardId = searchParams.get('cardId');
    const marketPricesData = loadMarketPrices();

    // If cardId is provided, return prices for that specific card
    if (cardId) {
      const cardIdStr = cardId.toString();
      const cardPrices = marketPricesData[cardIdStr] || [];
      return NextResponse.json({
        cardId: parseInt(cardId),
        prices: cardPrices,
        totalPrices: cardPrices.length
      });
    }

    // Otherwise return all market prices
    
    // Transform the data to include card IDs and calculate averages
    const marketCards = Object.entries(marketPricesData).map(([cardIdStr, prices]) => {
      const cardId = parseInt(cardIdStr);
      
      // Sort prices by date (newest first)
      const sortedPrices = prices.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      // Calculate average price from recent prices (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentPrices = sortedPrices.filter(price => 
        new Date(price.date) >= thirtyDaysAgo
      );
      
      const averagePrice = recentPrices.length > 0
        ? recentPrices.reduce((sum, price) => sum + price.price, 0) / recentPrices.length
        : sortedPrices[0]?.price || 0;
      
      // Calculate price change
      let priceChange: { amount: number; percentage: number; direction: 'up' | 'down' | 'stable' } | null = null;
      if (sortedPrices.length >= 2) {
        const currentPrice = sortedPrices[0].price;
        const previousPrice = sortedPrices[1].price;
        const change = currentPrice - previousPrice;
        const percentage = (change / previousPrice) * 100;
        
        priceChange = {
          amount: change,
          percentage,
          direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
        };
      }
      
      return {
        CardID: cardId,
        marketPrices: sortedPrices,
        averagePrice,
        priceChange,
        priceUpdated: sortedPrices[0]?.updatedAt
      };
    });
    
    return NextResponse.json(marketCards);
  } catch (error) {
    console.error('Error fetching market prices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market prices' },
      { status: 500 }
    );
  }
}

// POST - Add a new market price
export async function POST(request: NextRequest) {
  try {
    const newPrice: MarketPrice = await request.json();
    
    // Validate required fields
    if (!newPrice.cardId || !newPrice.price || !newPrice.currency || !newPrice.condition) {
      return NextResponse.json(
        { error: 'Missing required fields: cardId, price, currency, condition' },
        { status: 400 }
      );
    }
    
    // Validate price is positive
    if (newPrice.price <= 0) {
      return NextResponse.json(
        { error: 'Price must be greater than 0' },
        { status: 400 }
      );
    }
    
    const marketPricesData = loadMarketPrices();
    const cardIdStr = newPrice.cardId.toString();
    
    // Initialize array for this card if it doesn't exist
    if (!marketPricesData[cardIdStr]) {
      marketPricesData[cardIdStr] = [];
    }
    
    // Add timestamps
    const now = new Date().toISOString();
    const priceWithTimestamp = {
      ...newPrice,
      date: now,
      updatedAt: now
    };
    
    // Add the new price to the beginning of the array (most recent first)
    marketPricesData[cardIdStr].unshift(priceWithTimestamp);
    
    // Keep only the last 50 prices per card to prevent excessive storage
    marketPricesData[cardIdStr] = marketPricesData[cardIdStr].slice(0, 50);
    
    // Save the updated data
    saveMarketPrices(marketPricesData);
    
    return NextResponse.json(priceWithTimestamp, { status: 201 });
  } catch (error) {
    console.error('Error adding market price:', error);
    return NextResponse.json(
      { error: 'Failed to add market price' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a specific market price
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cardId = searchParams.get('cardId');
    const priceDate = searchParams.get('date');
    
    if (!cardId) {
      return NextResponse.json(
        { error: 'Missing cardId parameter' },
        { status: 400 }
      );
    }
    
    const marketPricesData = loadMarketPrices();
    const cardIdStr = cardId.toString();
    
    if (!marketPricesData[cardIdStr]) {
      return NextResponse.json(
        { error: 'No prices found for this card' },
        { status: 404 }
      );
    }
    
    if (priceDate) {
      // Delete a specific price entry
      marketPricesData[cardIdStr] = marketPricesData[cardIdStr].filter(
        price => price.date !== priceDate
      );
      
      // If no prices left for this card, remove the card entry entirely
      if (marketPricesData[cardIdStr].length === 0) {
        delete marketPricesData[cardIdStr];
      }
    } else {
      // Delete all prices for this card
      delete marketPricesData[cardIdStr];
    }
    
    saveMarketPrices(marketPricesData);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting market price:', error);
    return NextResponse.json(
      { error: 'Failed to delete market price' },
      { status: 500 }
    );
  }
}