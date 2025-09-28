'use client';

import { useState, useEffect } from 'react';
import { useInventory } from '../../hooks/useInventory';
import { getCurrencySymbol } from '../../utils/currency';

interface MarketPrice {
  price: number;
  currency: string;
}

export default function DebugBadges() {
  const [latestMarketPrice, setLatestMarketPrice] = useState<MarketPrice | null>(null);
  const [inventoryQty, setInventoryQty] = useState(0);
  const [debugLog, setDebugLog] = useState<string[]>([]);
  
  const { getTotalQuantity, loading } = useInventory();
  
  const cardId = 14396;

  const addLog = (message: string) => {
    setDebugLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    console.log(message);
  };

  useEffect(() => {
    const fetchData = async () => {
      addLog(`🔍 Starting fetch for card ${cardId}`);
      
      try {
        // Fetch market price
        const priceResponse = await fetch(`/api/market-prices?cardId=${cardId}`);
        addLog(`💰 Price API response status: ${priceResponse.status}`);
        
        if (priceResponse.ok) {
          const priceData = await priceResponse.json();
          addLog(`💰 Price data: ${JSON.stringify(priceData)}`);
          
          if (priceData.prices && priceData.prices.length > 0) {
            const latest = priceData.prices[0];
            setLatestMarketPrice({ price: latest.price, currency: latest.currency });
            addLog(`✅ Price set: ${latest.currency} ${latest.price}`);
          } else {
            addLog('❌ No price data found');
          }
        } else {
          addLog(`❌ Price API failed: ${priceResponse.status}`);
        }
        
        // Check inventory loading state
        addLog(`📦 Inventory loading: ${loading}`);
        
        if (!loading) {
          const qty = getTotalQuantity(cardId);
          setInventoryQty(qty);
          addLog(`📦 Inventory quantity: ${qty}`);
        } else {
          addLog('📦 Waiting for inventory to load...');
          setTimeout(() => {
            const qty = getTotalQuantity(cardId);
            setInventoryQty(qty);
            addLog(`📦 Inventory quantity (delayed): ${qty}`);
          }, 1000);
        }
        
      } catch (error: any) {
        addLog(`❌ Error: ${error.message}`);
      }
    };
    
    fetchData();
  }, [cardId, loading, getTotalQuantity]);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Debug Badge System</h1>
        
        {/* Current State Display */}
        <div className="bg-white rounded-lg p-6 shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">Current State</h2>
          <p><strong>Card ID:</strong> {cardId}</p>
          <p><strong>Latest Market Price:</strong> {latestMarketPrice ? JSON.stringify(latestMarketPrice) : 'null'}</p>
          <p><strong>Inventory Qty:</strong> {inventoryQty}</p>
          <p><strong>Inventory Loading:</strong> {loading ? 'true' : 'false'}</p>
        </div>

        {/* Badge Rendering Test */}
        <div className="bg-white rounded-lg p-6 shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">Badge Rendering Test</h2>
          <div className="flex space-x-4">
            {latestMarketPrice ? (
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
                <span>💰</span>
                <span>{getCurrencySymbol(latestMarketPrice.currency)}{latestMarketPrice.price.toLocaleString()}</span>
              </div>
            ) : (
              <div className="bg-gray-200 text-gray-600 px-3 py-1 rounded-full text-sm">No Price Data</div>
            )}
            
            {inventoryQty > 0 ? (
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
                <span>📦</span>
                <span>{inventoryQty} card{inventoryQty !== 1 ? 's' : ''}</span>
              </div>
            ) : (
              <div className="bg-gray-200 text-gray-600 px-3 py-1 rounded-full text-sm">No Inventory</div>
            )}
          </div>
        </div>

        {/* Debug Log */}
        <div className="bg-white rounded-lg p-6 shadow-md">
          <h2 className="text-xl font-semibold mb-4">Debug Log</h2>
          <div className="bg-gray-100 p-4 rounded max-h-96 overflow-y-auto">
            {debugLog.map((log, index) => (
              <div key={index} className="text-sm font-mono mb-1">{log}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}