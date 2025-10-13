import { useState } from 'react';
import { PTCGCard } from '../types/card';
import CardDetailModal from '../components/CardDetailModal';

// Test card with known data
const testCard: PTCGCard = {
  PrimaryID: 14396,
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

export default function TestCardDetail() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Test Card Detail Modal</h1>
        
        <div className="bg-white rounded-lg p-6 shadow-md">
          <h2 className="text-xl font-semibold mb-4">Test Card: {testCard.Name}</h2>
          <p className="mb-4">Card ID: {testCard.CardID}</p>
          <p className="mb-4">This card should have market price (HK$75) and inventory (1 card)</p>
          
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Open Card Detail Modal
          </button>
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