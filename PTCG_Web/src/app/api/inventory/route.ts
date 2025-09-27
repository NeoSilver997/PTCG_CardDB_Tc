import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const INVENTORY_FILE = path.join(process.cwd(), 'data', 'inventory.json');

// Ensure data directory exists
const ensureDataDirectory = () => {
  const dataDir = path.dirname(INVENTORY_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

// Load inventory from file
const loadInventory = () => {
  ensureDataDirectory();
  try {
    if (fs.existsSync(INVENTORY_FILE)) {
      const data = fs.readFileSync(INVENTORY_FILE, 'utf-8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error loading inventory:', error);
    return [];
  }
};

// Save inventory to file
const saveInventory = (inventory: any[]) => {
  ensureDataDirectory();
  try {
    fs.writeFileSync(INVENTORY_FILE, JSON.stringify(inventory, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving inventory:', error);
    return false;
  }
};

export async function GET() {
  try {
    const inventory = loadInventory();
    return NextResponse.json(inventory);
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
    const { CardID, quantity, condition, notes } = body;

    if (!CardID || quantity === undefined || !condition) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const inventory = loadInventory();
    const now = new Date().toISOString();
    
    // Check if card already exists in inventory
    const existingIndex = inventory.findIndex((item: any) => 
      item.CardID === CardID && item.condition === condition
    );

    if (existingIndex >= 0) {
      // Update existing entry
      inventory[existingIndex].quantity = quantity;
      inventory[existingIndex].notes = notes || inventory[existingIndex].notes;
      inventory[existingIndex].lastUpdated = now;
    } else {
      // Add new entry
      inventory.push({
        CardID,
        quantity,
        condition,
        notes: notes || '',
        dateAdded: now,
        lastUpdated: now
      });
    }

    const success = saveInventory(inventory);
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to save inventory' },
        { status: 500 }
      );
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

    const inventory = loadInventory();
    let newInventory;

    if (condition) {
      // Remove specific condition entry
      newInventory = inventory.filter((item: any) => 
        !(item.CardID === parseInt(CardID) && item.condition === condition)
      );
    } else {
      // Remove all entries for this card
      newInventory = inventory.filter((item: any) => 
        item.CardID !== parseInt(CardID)
      );
    }

    const success = saveInventory(newInventory);
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to save inventory' },
        { status: 500 }
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