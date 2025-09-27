import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';

// Test route to check inventory functionality
export async function GET(request: NextRequest) {
  try {
    // Check if data directory exists
    const dataDir = path.join(process.cwd(), 'data');
    const inventoryPath = path.join(dataDir, 'inventory.json');
    
    const inventoryExists = fs.existsSync(inventoryPath);
    
    let inventory = [];
    if (inventoryExists) {
      const inventoryData = fs.readFileSync(inventoryPath, 'utf-8');
      inventory = JSON.parse(inventoryData);
    }
    
    return NextResponse.json({
      success: true,
      inventoryExists,
      inventoryCount: inventory.length,
      dataDirectory: dataDir,
      message: 'Inventory system is working correctly'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}