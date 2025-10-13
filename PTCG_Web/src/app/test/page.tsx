'use client';

import { useState } from 'react';
import { PTCGCard } from '../../types/card';
import CardDetailModal from '../../components/CardDetailModal';

const testCard: PTCGCard = {
  CardID: 14396,
  Name: "頂尖捕捉器",
  Evolution: "",
  EvolutionStage: "",
  ImageURL: "",
  CardType: "Trainer",
  HP: "",
  Type: "",
  Attribute: "",
  Weakness: "",
  WeaknessType: "",
  Resistance: "",
  ResistanceType: "",
  Skill1Name: "",
  Skill1Energy: "",
  Skill1Damage: "",
  Skill1Effect: "",
  Skill2Name: "",
  Skill2Energy: "",
  Skill2Damage: "",
  Skill2Effect: "",
  AbilityName: "",
  AbilityEffect: "",
  RetreatCost: 0,
  Illustrator: "",
  Rarity: "Uncommon",
  ExpansionCode: "TC001",
  ExpansionName: "Test Expansion",
  CollectorNumber: "001",
  RegulationMark: "A",
  Artist: "",
  SpecialTag: "",
  PrimaryEffectType: "",
  SpecialEffectType: "",
  AbilityStats: ""
};

export default function TestPage() {
  const [showModal, setShowModal] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');

  const testAPI = async () => {
    try {
      const priceRes = await fetch('/api/market-prices?cardId=14396');
      const priceData = await priceRes.json();
      
      const invRes = await fetch('/api/inventory');
      const invData = await invRes.json();
      
      setDebugInfo(JSON.stringify({ prices: priceData, inventory: invData }, null, 2));
    } catch (error) {
      setDebugInfo('Error: ' + error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Test Card Detail Modal</h1>
        
        <div className="bg-white rounded-lg p-6 shadow-md">
          <h2 className="text-xl font-semibold mb-4">Test Card: {testCard.Name}</h2>
          <p className="mb-4">Card ID: {testCard.CardID}</p>
          <p className="mb-4">This card should show HK$75 and 1 card in inventory</p>
          
          <div className="space-x-4 mb-4">
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Open Card Detail Modal
            </button>
            
            <button
              onClick={testAPI}
              className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors"
            >
              Test API
            </button>
          </div>

          {debugInfo && (
            <div className="mt-4 p-4 bg-gray-100 rounded">
              <h3 className="font-semibold mb-2">API Debug Info:</h3>
              <pre className="text-xs overflow-auto">{debugInfo}</pre>
            </div>
          )}
        </div>

        {showModal && (
          <CardDetailModal
            card={testCard}
            relatedCards={[]}
            onClose={() => setShowModal(false)}
            onCardClick={() => {}}
            allCards={[testCard]}
          />
        )}
      </div>
    </div>
  );
}