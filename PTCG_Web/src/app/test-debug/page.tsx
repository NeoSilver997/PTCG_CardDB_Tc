'use client';

import { useState, useEffect } from 'react';
import { useInventory } from '../../hooks/useInventory';
import { getCurrencySymbol } from '../../utils/currency';

interface TestResult {
  cardId: number;
  marketPrice: any;
  inventoryQty: number;
  error?: string;
}

export default function TestPriceInventory() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const { getTotalQuantity, loading: inventoryLoading } = useInventory();
  
  const testCards = [14396, 14456, 14300]; // Cards with known data

  const testCard = async (cardId: number) => {
    console.log(`Testing card ${cardId}`);
    
    try {
      // Test market price API
      const priceResponse = await fetch(`/api/market-prices?cardId=${cardId}`);
      let marketPrice = null;
      
      if (priceResponse.ok) {
        const priceData = await priceResponse.json();
        marketPrice = priceData;
        console.log(`Price data for ${cardId}:`, priceData);
      } else {
        console.log(`Price API failed for ${cardId}:`, priceResponse.status);
      }
      
      // Test inventory
      const inventoryQty = getTotalQuantity(cardId);
      console.log(`Inventory for ${cardId}:`, inventoryQty);
      
      return {
        cardId,
        marketPrice,
        inventoryQty,
      };
    } catch (error) {
      console.error(`Error testing card ${cardId}:`, error);
      return {
        cardId,
        marketPrice: null,
        inventoryQty: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  const runTests = async () => {
    setLoading(true);
    setResults([]);
    
    console.log('🧪 Starting tests...');
    console.log('📊 Inventory loading state:', inventoryLoading);
    
    const testResults: TestResult[] = [];
    for (const cardId of testCards) {
      const result = await testCard(cardId);
      testResults.push(result);
    }
    
    setResults(testResults);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Price & Inventory Test Debug</h1>
        
        <div className="bg-white rounded-lg p-6 shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">System Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="p-4 bg-gray-50 rounded">
              <h3 className="font-semibold">Inventory Hook</h3>
              <p>Loading: {inventoryLoading ? 'Yes' : 'No'}</p>
            </div>
          </div>
          
          <button
            onClick={runTests}
            disabled={loading}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {loading ? 'Running Tests...' : 'Run Tests'}
          </button>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-md">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          
          {results.length === 0 ? (
            <p className="text-gray-500">No test results yet. Click &quot;Run Tests&quot; to start.</p>
          ) : (
            <div className="space-y-4">
              {results.map((result) => (
                <div key={result.cardId} className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg">Card ID: {result.cardId}</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div className="p-3 bg-green-50 rounded">
                      <h4 className="font-semibold text-green-800">Market Price</h4>
                      {result.marketPrice?.prices?.length > 0 ? (
                        <div>
                          <p className="text-green-700">
                            {getCurrencySymbol(result.marketPrice.prices[0].currency)}
                            {result.marketPrice.prices[0].price}
                          </p>
                          <p className="text-sm text-green-600">
                            {result.marketPrice.prices[0].condition} • {result.marketPrice.prices[0].date}
                          </p>
                        </div>
                      ) : (
                        <p className="text-gray-500">No price data</p>
                      )}
                    </div>
                    
                    <div className="p-3 bg-blue-50 rounded">
                      <h4 className="font-semibold text-blue-800">Inventory</h4>
                      <p className="text-blue-700">
                        {result.inventoryQty} {result.inventoryQty === 1 ? 'card' : 'cards'}
                      </p>
                    </div>
                  </div>
                  
                  {result.error && (
                    <div className="mt-2 p-3 bg-red-50 rounded">
                      <p className="text-red-700">Error: {result.error}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}