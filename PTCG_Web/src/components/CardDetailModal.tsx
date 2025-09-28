'use client';

import { X, ExternalLink, ChevronLeft, ChevronRight, Package, Plus, DollarSign } from 'lucide-react';
import { PTCGCard } from '../types/card';
import { useState, useMemo, useEffect } from 'react';
import { useI18n } from '../i18n/context';
import { useInventory } from '../hooks/useInventory';
import { CARD_CONDITIONS } from '../types/inventory';
import { getDefaultCurrencyForCard, getCurrencySymbol } from '../utils/currency';

interface CardDetailModalProps {
  card: PTCGCard;
  relatedCards: PTCGCard[];
  onClose: () => void;
  onCardClick: (card: PTCGCard) => void;
  allCards: PTCGCard[]; // Add allCards prop for evolution chain
  onAddToDeck?: (card: PTCGCard, quantity?: number) => void; // Add deck functionality
}

export default function CardDetailModal({
  card,
  relatedCards,
  onClose,
  onCardClick,
  allCards,
  onAddToDeck
}: CardDetailModalProps) {
  const { t } = useI18n();
  const [detailedCards, setDetailedCards] = useState<PTCGCard[]>([]);
  const [versionPage, setVersionPage] = useState(0);
  const [selectedVersion, setSelectedVersion] = useState<PTCGCard>(card);
  const [addQuantity, setAddQuantity] = useState(1);
  const [inventoryQuantity, setInventoryQuantity] = useState(1);
  const [inventoryCondition, setInventoryCondition] = useState('near-mint');
  const [inventoryNotes, setInventoryNotes] = useState('');
  const [purchaseCost, setPurchaseCost] = useState<number | undefined>(undefined);
  const [marketPrice, setMarketPrice] = useState<number | undefined>(undefined);
  
  // Market price form state
  const [showMarketPriceForm, setShowMarketPriceForm] = useState(false);
  const [marketPriceForm, setMarketPriceForm] = useState({
    price: 0,
    currency: 'HKD', // Default to HKD
    condition: 'Near Mint',
    source: ''
  });
  const [addingPrice, setAddingPrice] = useState(false);
  
  // Market price and inventory data for header display
  const [latestMarketPrice, setLatestMarketPrice] = useState<{price: number, currency: string} | null>(null);
  const [inventoryQty, setInventoryQty] = useState<number>(0);
  
  // Card-only view state
  const [cardOnlyView, setCardOnlyView] = useState(false);
  
  const versionsPerPage = 8;

  // Inventory functionality
  const { addToInventory, getTotalQuantity, isCardOwned, loading: inventoryLoading } = useInventory();
  const totalOwned = getTotalQuantity(selectedVersion.CardID);
  const isOwned = isCardOwned(selectedVersion.CardID);

  // Market price submission function
  const handleAddMarketPrice = async () => {
    if (!marketPriceForm.price || marketPriceForm.price <= 0) {
      alert('Please enter a valid price');
      return;
    }

    setAddingPrice(true);
    try {
      const response = await fetch('/api/market-prices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cardId: selectedVersion.CardID,
          price: marketPriceForm.price,
          currency: marketPriceForm.currency,
          condition: marketPriceForm.condition,
          source: marketPriceForm.source || undefined
        }),
      });

      if (response.ok) {
        // Reset form
        setMarketPriceForm({
          price: 0,
          currency: getDefaultCurrencyForCard(selectedVersion),
          condition: 'Near Mint',
          source: ''
        });
        setShowMarketPriceForm(false);
        alert('Market price added successfully!');
      } else {
        alert('Failed to add market price');
      }
    } catch (error) {
      console.error('Error adding market price:', error);
      alert('Error adding market price');
    } finally {
      setAddingPrice(false);
    }
  };

  // Helper function to check if a card is basic energy
  const isBasicEnergy = (card: PTCGCard): boolean => {
    const basicEnergyNames = [
      '草能量', '炎能量', '水能量', '雷能量', '超能量', '鬥能量', '惡能量', '鋼能量', '妖精能量',
      'Grass Energy', 'Fire Energy', 'Water Energy', 'Lightning Energy', 'Psychic Energy', 
      'Fighting Energy', 'Darkness Energy', 'Metal Energy', 'Fairy Energy'
    ];
    
    return card.CardType.includes('能量') && 
           (basicEnergyNames.includes(card.Name) || card.Name.includes('基本') || card.Name.includes('Basic'));
  };

  // Load detailed card data for version information
  useEffect(() => {
    const loadDetailedCards = async () => {
      try {
        const response = await fetch('/api/cards?detail=true');
        const data = await response.json();
        setDetailedCards(data);
      } catch (error) {
        console.error('Failed to load detailed card data:', error);
      }
    };

    loadDetailedCards();
  }, []);

  // Fetch market price and inventory data for header display
  useEffect(() => {
    const fetchPriceAndInventoryData = async () => {
      try {
        console.log('🔍 Fetching price/inventory for card:', selectedVersion.CardID, selectedVersion.Name);
        
        // Fetch latest market price
        const priceResponse = await fetch(`/api/market-prices?cardId=${selectedVersion.CardID}`);
        if (priceResponse.ok) {
          const priceData = await priceResponse.json();
          console.log('💰 Price data received:', priceData);
          if (priceData.prices && priceData.prices.length > 0) {
            const latest = priceData.prices[0]; // Prices are sorted by date descending
            setLatestMarketPrice({ price: latest.price, currency: latest.currency });
            console.log('✅ Latest price set:', latest.price, latest.currency);
          } else {
            setLatestMarketPrice(null);
            console.log('❌ No price data found');
          }
        } else {
          setLatestMarketPrice(null);
          console.log('❌ Price API failed:', priceResponse.status);
        }
        
      } catch (error) {
        console.error('Error fetching price data:', error);
        setLatestMarketPrice(null);
      }
    };
    
    fetchPriceAndInventoryData();
  }, [selectedVersion.CardID, selectedVersion.Name]);

  // Separate effect for inventory quantity that runs when inventory hook is ready
  useEffect(() => {
    if (!inventoryLoading) {
      const qty = getTotalQuantity(selectedVersion.CardID);
      setInventoryQty(qty);
      console.log('📦 Inventory quantity updated:', qty, 'for card:', selectedVersion.CardID);
    }
  }, [selectedVersion.CardID, getTotalQuantity, inventoryLoading]);

  // Add render debugging
  console.log('🎯 CardDetailModal render - Price:', latestMarketPrice, 'Inventory:', inventoryQty);

  // Update inventory info when selected version changes
  useEffect(() => {
    setSelectedVersion(card);
  }, [card]);

  const getTierColor = (tier?: string) => {
    switch (tier) {
      case 'S+': return 'bg-red-500 text-white';
      case 'S': return 'bg-orange-500 text-white';
      case 'A+': return 'bg-yellow-500 text-white';
      case 'A': return 'bg-green-500 text-white';
      case 'B+': return 'bg-blue-500 text-white';
      case 'B': return 'bg-indigo-500 text-white';
      case 'C+': return 'bg-purple-500 text-white';
      case 'C': return 'bg-gray-500 text-white';
      case 'D': return 'bg-gray-600 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'fire': return '🔥';
      case 'water': return '💧';
      case 'grass': return '🌱';
      case 'electric': return '⚡';
      case 'psychic': return '🔮';
      case 'fighting': return '👊';
      case 'darkness': return '🌑';
      case 'metal': return '⚙️';
      case 'fairy': return '✨';
      case 'dragon': return '🐉';
      case 'colorless': return '⚪';
      default: return '🎴';
    }
  };

  const renderEnergyCost = (energyCost: string) => {
    if (!energyCost || energyCost.trim() === '') return null;

    const energyTypes = energyCost.split(',').map(type => type.trim());
    
    return (
      <div className="flex items-center space-x-1">
        {energyTypes.map((energyType, index) => {
          const energyImageUrl = `/energy/${energyType}.png`;
          return (
            <div
              key={index}
              className="w-8 h-8 rounded-full bg-white border border-gray-300 shadow-sm overflow-hidden"
              title={energyType}
            >
              <img
                src={energyImageUrl}
                alt={energyType}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to emoji if image fails to load
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.innerHTML = getTypeIcon(energyType);
                }}
              />
            </div>
          );
        })}
      </div>
    );
  };

  const renderColorlessEnergyCost = (energyCost: string) => {
    if (!energyCost || energyCost.trim() === '') return null;

    // For retreat cost, it's a number representing how many colorless energy are needed
    const energyCount = parseInt(energyCost.trim(), 10);

    if (isNaN(energyCount) || energyCount <= 0) return null;

    return (
      <div className="flex items-center space-x-1">
        {Array.from({ length: energyCount }, (_, index) => {
          const energyImageUrl = `/energy/Colorless.png`;
          return (
            <div
              key={index}
              className="w-8 h-8 rounded-full bg-white border border-gray-300 shadow-sm overflow-hidden"
              title="Colorless"
            >
              <img
                src={energyImageUrl}
                alt="Colorless"
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to emoji if image fails to load
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.innerHTML = '⚪';
                }}
              />
            </div>
          );
        })}
      </div>
    );
  };

  const renderEnergyIcon = (energyType: string) => {
    if (!energyType || energyType.trim() === '') return null;

    const energyImageUrl = `/energy/${energyType}.png`;
    return (
      <div
        className="w-8 h-8 rounded-full bg-white border border-gray-300 shadow-sm overflow-hidden inline-block"
        title={energyType}
      >
        <img
          src={energyImageUrl}
          alt={energyType}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to emoji if image fails to load
            e.currentTarget.style.display = 'none';
            e.currentTarget.parentElement!.innerHTML = getTypeIcon(energyType);
          }}
        />
      </div>
    );
  };

  const evolutionChain = useMemo(() => {
    const getEvolutionChain = (currentCard: PTCGCard): PTCGCard[] => {
      console.log('🔄 Evolution Chain Debug for:', currentCard.Name);
      console.log('📝 Evolution field:', currentCard.Evolution);
      console.log('📊 Total cards in database:', allCards.length);

      if (!currentCard.Evolution || !allCards.length) {
        console.log('❌ No evolution field or no cards in database, returning current card');
        return [currentCard];
      }

      // Parse the evolution chain from the Evolution field
      // Format: "妙蛙種子 → 妙蛙草 → 妙蛙花 → 超級妙蛙花ex → 妙蛙花ex"
      const evolutionNames = currentCard.Evolution.split('→').map(name => name.trim()).filter(name => name.length > 0);
      console.log('🔍 Parsed evolution names:', evolutionNames);

      const chain: PTCGCard[] = [];

      // Find cards for each evolution stage
      evolutionNames.forEach(evolutionName => {
        console.log(`🔎 Searching for: "${evolutionName}"`);
        
        // Find all cards with this exact name (excluding energy cards)
        const matchingCards = allCards.filter(c =>
          c.Name === evolutionName &&
          !c.CardType.includes('能量')
        );
        
        console.log(`📋 Found ${matchingCards.length} matching cards for "${evolutionName}"`);
        if (matchingCards.length > 0) {
          console.log('🎯 Matching cards:', matchingCards.map(c => ({ name: c.Name, score: c.Score, type: c.CardType })));
        }

        // Add the best card (prioritize higher scores), but avoid duplicates
        if (matchingCards.length > 0) {
          const bestCard = matchingCards.sort((a, b) => (parseFloat(b.Score || '0') - parseFloat(a.Score || '0')))[0];
          console.log(`⭐ Selected best card: ${bestCard.Name} (Score: ${bestCard.Score})`);
          
          // Only add if we don't already have a card with this name
          if (!chain.some(c => c.Name === bestCard.Name)) {
            chain.push(bestCard);
            console.log(`✅ Added to chain: ${bestCard.Name}`);
          } else {
            console.log(`⏭️ Skipped duplicate: ${bestCard.Name}`);
          }
        } else {
          console.log(`❌ No cards found for: "${evolutionName}"`);
        }
      });

      console.log('🔗 Chain before filtering:', chain.map(c => c.Name));

      // If no evolution chain found, return just the current card
      const result = chain.length > 0 ? chain : [currentCard];
      console.log('📋 Result before current card filter:', result.map(c => c.Name));
      
      // Filter out the current card from the evolution chain display
      // Only show cards that are different from the current card
      const filteredResult = result.filter(chainCard => chainCard.Name !== currentCard.Name);
      console.log('🎯 Final filtered result:', filteredResult.map(c => c.Name));
      console.log('📏 Final chain length:', filteredResult.length);
      
      // If no other evolutions exist, don't show the evolution chain
      return filteredResult;
    };

    return getEvolutionChain(card);
  }, [card, allCards]);

  const otherVersions = useMemo(() => {
    // Find all cards with the same name but different CardID (different versions)
    // Use a Set to ensure unique WebCardIDs (CardID) and avoid duplicates
    const seenCardIDs = new Set<string>();
    seenCardIDs.add(String(card.CardID)); // Exclude the current card

    return detailedCards.filter(c => {
      if (c.Name === card.Name &&
          c.CardID !== card.CardID &&
          c.ImageURL &&
          !seenCardIDs.has(String(c.CardID))) {
        seenCardIDs.add(String(c.CardID));
        return true;
      }
      return false;
    });
  }, [card, detailedCards]);

  const renderScoreBreakdownChart = (breakdown: string) => {
    if (!breakdown) return null;

    // Parse the breakdown string like "Base:5.0|Meta:0.0|Exp:3.0|Func:4.0|Syn:0.0|"
    const components = breakdown.split('|').filter(item => item.trim() !== '');
    const parsedData = components.map(item => {
      const [label, value] = item.split(':');
      return {
        label: label.trim(),
        value: parseFloat(value) || 0
      };
    }).filter(item => item.value > 0); // Only show components with values > 0

    if (parsedData.length === 0) return null;

    // Find max value for scaling
    const maxValue = Math.max(...parsedData.map(item => item.value));

    return (
      <div className="space-y-3">
        <div className="text-lg font-medium text-gray-700 mb-4">Score Breakdown</div>
        {parsedData.map((item, index) => {
          const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
          return (
            <div key={index} className="flex items-center space-x-4">
              <div className="w-20 text-sm text-gray-600 font-medium">{item.label}</div>
              <div className="flex-1 bg-gray-200 rounded-full h-4">
                <div
                  className="bg-blue-500 h-4 rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
              <div className="w-10 text-sm text-gray-600 font-medium text-right">{item.value}</div>
            </div>
          );
        })}
        <div className="text-sm text-gray-500 mt-3">
          Total Score: {parsedData.reduce((sum, item) => sum + item.value, 0).toFixed(1)}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-6 z-50">
      <div className="bg-white rounded-xl max-w-7xl w-full max-h-[95vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-6 lg:p-8 border-b">
          <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4 flex-1 min-w-0">
            <h2 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">{card.Name}</h2>
            {card.Type && (
              <span className="text-xl sm:text-2xl lg:text-3xl flex-shrink-0" title={card.Type}>
                {renderEnergyCost(card.Type)}
              </span>
            )}
            {card.Skill1Energy && (
              <span className="hidden sm:inline flex-shrink-0">
                {renderEnergyCost(card.Skill1Energy)}
              </span>
            )}
            {card.Tier && (
              <span className={`px-2 sm:px-3 lg:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm lg:text-base font-semibold flex-shrink-0 ${getTierColor(card.Tier)}`}>
                {card.Tier}
              </span>
            )}
            {/* Market Price Display */}
            {latestMarketPrice && (
              <div className="hidden sm:flex items-center space-x-2 bg-green-50 px-2 lg:px-3 py-1 lg:py-2 rounded-lg border border-green-200 flex-shrink-0">
                <DollarSign className="h-3 w-3 lg:h-4 lg:w-4 text-green-600" />
                <span className="text-xs lg:text-sm font-semibold text-green-800">
                  {getCurrencySymbol(latestMarketPrice.currency)}{latestMarketPrice.price.toLocaleString()}
                </span>
              </div>
            )}
            {/* Inventory Quantity Display */}
            {inventoryQty > 0 && (
              <div className="hidden sm:flex items-center space-x-2 bg-blue-50 px-2 lg:px-3 py-1 lg:py-2 rounded-lg border border-blue-200 flex-shrink-0">
                <Package className="h-3 w-3 lg:h-4 lg:w-4 text-blue-600" />
                <span className="text-xs lg:text-sm font-semibold text-blue-800">
                  {inventoryQty} {inventoryQty === 1 ? 'card' : 'cards'}
                </span>
              </div>
            )}
          </div>
          {/* Mobile Market Price and Inventory (stacked below on mobile) */}
          <div className="flex sm:hidden items-center space-x-2 mt-2">
            {latestMarketPrice && (
              <div className="flex items-center space-x-1 bg-green-50 px-2 py-1 rounded border border-green-200">
                <DollarSign className="h-3 w-3 text-green-600" />
                <span className="text-xs font-semibold text-green-800">
                  {getCurrencySymbol(latestMarketPrice.currency)}{latestMarketPrice.price.toLocaleString()}
                </span>
              </div>
            )}
            {inventoryQty > 0 && (
              <div className="flex items-center space-x-1 bg-blue-50 px-2 py-1 rounded border border-blue-200">
                <Package className="h-3 w-3 text-blue-600" />
                <span className="text-xs font-semibold text-blue-800">
                  {inventoryQty}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <button
              onClick={() => setCardOnlyView(!cardOnlyView)}
              className="px-3 py-1 text-xs sm:text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors font-medium"
              title={cardOnlyView ? "Show Full Details" : "Card Only View"}
            >
              {cardOnlyView ? "Full" : "Card Only"}
            </button>
            <button
              onClick={onClose}
              className="p-2 sm:p-3 hover:bg-gray-100 rounded-full transition-colors ml-2"
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7" />
            </button>
          </div>
        </div>

        <div className={`flex flex-col xl:flex-row max-h-[calc(95vh-120px)] overflow-y-auto ${
          cardOnlyView ? 'justify-center items-center' : ''
        }`}>
          {/* Card Image and Basic Info */}
          <div className={`${
            cardOnlyView 
              ? 'w-full max-w-md mx-auto p-4 flex justify-center' 
              : 'xl:w-2/5 p-8'
          }`}>
            <div className="aspect-[5/7] bg-gray-100 rounded-xl overflow-hidden mb-6 shadow-lg">
              {selectedVersion.ImageURL ? (
                <img
                  src={selectedVersion.ImageURL}
                  alt={selectedVersion.Name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder-card.svg';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <div className="text-7xl mb-6">🎴</div>
                    <div className="text-xl">No Image Available</div>
                  </div>
                </div>
              )}
            </div>

            {/* Basic Stats */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-6 text-base">
                <div>
                  <span className="text-gray-600 font-medium">Type:</span>
                  <div className="font-semibold text-lg">{card.CardType}</div>
                </div>
                <div>
                  <span className="text-gray-600 font-medium">Rarity:</span>
                  <div className="font-semibold text-lg">{card.Rarity}</div>
                </div>
                {card.CardType.includes('寶可夢') && (
                  <div>
                    <span className="text-gray-600 font-medium">HP:</span>
                    <div className="font-semibold text-lg">{card.HP || 'N/A'}</div>
                  </div>
                )}
                {card.CardType.includes('寶可夢') && (
                  <div>
                    <span className="text-gray-600 font-medium">Evolution:</span>
                    <div className="font-semibold text-lg">{card.Evolution}</div>
                  </div>
                )}
                {card.CardType.includes('寶可夢')  && (
                  <div className="group relative">
                    <span className="text-gray-600 font-medium">Weakness:</span>
                    <div className="font-semibold text-lg flex items-center space-x-2">
                      <span className="text-red-600">{card.Weakness}</span>
                      {card.WeaknessType && (
                        <div className="flex items-center space-x-1">
                          {renderEnergyCost(card.WeaknessType)}
                        </div>
                      )}
                    </div>
                    <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
                      Takes extra damage from this type
                    </div>
                  </div>
                )}
                {card.CardType.includes('寶可夢')  && (
                  <div className="group relative">
                    <span className="text-gray-600 font-medium">Resistance:</span>
                    <div className="font-semibold text-lg flex items-center space-x-2">
                      <span className="text-green-600">{card.Resistance}</span>
                      {card.ResistanceType && (
                        <div className="flex items-center space-x-1">
                          {renderEnergyCost(card.ResistanceType)}
                        </div>
                      )}
                    </div>
                    <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
                      Takes less damage from this type
                    </div>
                  </div>
                )}
                {card.RetreatCost && card.CardType.includes('寶可夢') && (
                  <div>
                    <span className="text-gray-600 font-medium">Retreat Cost:</span>
                    <div className="font-semibold text-lg flex items-center space-x-2">
                      {renderColorlessEnergyCost(card.RetreatCost)}
                    </div>
                  </div>
                )}
                {card.CardType.includes('寶可夢') && card.Tier && (
                  <div>
                    <span className="text-gray-600 font-medium">Tier:</span>
                    <div className="font-semibold text-lg">
                      <span className={`px-2 py-1 rounded-full text-sm font-bold ${getTierColor(card.Tier)}`}>
                        {card.Tier}
                      </span>
                    </div>
                  </div>
                )}
                {card.CardType.includes('寶可夢') && card.Score && (
                  <div>
                    <span className="text-gray-600 font-medium">Score:</span>
                    <div className="font-semibold text-lg text-blue-600">{card.Score}</div>
                  </div>
                )}
                {card.CardType.includes('寶可夢') && card.SpecialTag && (
                  <div>
                    <span className="text-gray-600 font-medium">Special Tag:</span>
                    <div className="font-semibold text-lg">
                      <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-sm font-medium">
                        {card.SpecialTag}
                      </span>
                    </div>
                  </div>
                )}
                {card.Illustrator && (
                  <div>
                    <span className="text-gray-600 font-medium">Illustrator:</span>
                    <div className="font-semibold text-lg">{card.Illustrator}</div>
                  </div>
                )}
                {card.RegulationMark && (
                  <div>
                    <span className="text-gray-600 font-medium">Regulation:</span>
                    <div className="font-semibold text-lg">{card.RegulationMark}</div>
                  </div>
                )}
              </div>

              {/* Add to Deck Controls */}
              {onAddToDeck && (
                <div className="pt-4 border-t">
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">{t.addToDeck}</h3>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <label htmlFor="quantity" className="text-sm font-medium text-gray-700">
                          Quantity:
                        </label>
                        <select
                          id="quantity"
                          value={addQuantity}
                          onChange={(e) => setAddQuantity(Number(e.target.value))}
                          className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value={1}>1</option>
                          <option value={2}>2</option>
                          <option value={3}>3</option>
                          <option value={4}>4</option>
                          {isBasicEnergy(selectedVersion) && (
                            <>
                              <option value={5}>5</option>
                              <option value={6}>6</option>
                              <option value={7}>7</option>
                              <option value={8}>8</option>
                              <option value={9}>9</option>
                              <option value={10}>10</option>
                              <option value={15}>15</option>
                              <option value={20}>20</option>
                            </>
                          )}
                        </select>
                      </div>
                      <button
                        onClick={() => onAddToDeck(selectedVersion, addQuantity)}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                      >
                        <span>{t.addToDeck}</span>
                      </button>
                    </div>
                    <div className="text-xs text-gray-600 mt-2">
                      {selectedVersion.ExpansionCode && (
                        <div>Adding: {selectedVersion.Name} ({selectedVersion.ExpansionCode})</div>
                      )}
                      {isBasicEnergy(selectedVersion) && (
                        <div className="text-green-600 font-medium">⚡ Basic Energy - No limit (unlike other cards)</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Add to Inventory Controls */}
              <div className="pt-4 border-t">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">{t.manageInventory}</h3>
                    {isOwned && (
                      <div className="flex items-center space-x-1 text-green-600">
                        <Package className="h-4 w-4" />
                        <span className="text-sm font-medium">Owned: {totalOwned}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    {/* Quantity and Condition Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col space-y-1">
                        <label htmlFor="inventoryQuantity" className="text-sm font-medium text-gray-700">
                          {t.quantity}
                        </label>
                        <select
                          id="inventoryQuantity"
                          value={inventoryQuantity}
                          onChange={(e) => setInventoryQuantity(Number(e.target.value))}
                          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                          {Array.from({length: 20}, (_, i) => i + 1).map(num => (
                            <option key={num} value={num}>{num}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="flex flex-col space-y-1">
                        <label htmlFor="inventoryCondition" className="text-sm font-medium text-gray-700">
                          {t.condition}
                        </label>
                        <select
                          id="inventoryCondition"
                          value={inventoryCondition}
                          onChange={(e) => setInventoryCondition(e.target.value)}
                          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                          {CARD_CONDITIONS.map(conditionObj => (
                            <option key={conditionObj.value} value={conditionObj.value}>
                              {conditionObj.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Price Fields Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col space-y-1">
                        <label htmlFor="purchaseCost" className="text-sm font-medium text-gray-700">
                          Purchase Cost ($)
                        </label>
                        <input
                          type="number"
                          id="purchaseCost"
                          value={purchaseCost || ''}
                          onChange={(e) => setPurchaseCost(e.target.value ? parseFloat(e.target.value) : undefined)}
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div className="flex flex-col space-y-1">
                        <label htmlFor="marketPrice" className="text-sm font-medium text-gray-700">
                          Market Price ($)
                        </label>
                        <input
                          type="number"
                          id="marketPrice"
                          value={marketPrice || ''}
                          onChange={(e) => setMarketPrice(e.target.value ? parseFloat(e.target.value) : undefined)}
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    
                    {/* Notes */}
                    <div className="flex flex-col space-y-1">
                      <label htmlFor="inventoryNotes" className="text-sm font-medium text-gray-700">
                        {t.notes} (Optional)
                      </label>
                      <textarea
                        id="inventoryNotes"
                        value={inventoryNotes}
                        onChange={(e) => setInventoryNotes(e.target.value)}
                        placeholder="Add notes about this card..."
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                        rows={2}
                      />
                    </div>
                    
                    {/* Add Button */}
                    <button
                      onClick={async () => {
                        const success = await addToInventory(
                          selectedVersion.CardID, 
                          inventoryQuantity, 
                          inventoryCondition, 
                          inventoryNotes,
                          purchaseCost,
                          marketPrice
                        );
                        if (success) {
                          setInventoryNotes('');
                          setInventoryQuantity(1);
                          setPurchaseCost(undefined);
                          setMarketPrice(undefined);
                        }
                      }}
                      disabled={inventoryLoading}
                      className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>{inventoryLoading ? 'Adding...' : t.addToInventory}</span>
                    </button>
                    
                    <div className="text-xs text-gray-600">
                      <div>Adding: {selectedVersion.Name}</div>
                      {selectedVersion.ExpansionCode && (
                        <div>Set: {selectedVersion.ExpansionCode}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Market Price Section */}
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                    <DollarSign className="h-5 w-5 text-purple-600" />
                    <span>Market Price</span>
                  </h3>
                  <button
                    onClick={() => setShowMarketPriceForm(!showMarketPriceForm)}
                    className="px-3 py-1 bg-purple-500 hover:bg-purple-600 text-white text-sm rounded-lg transition-colors flex items-center space-x-1"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add Price</span>
                  </button>
                </div>

                {showMarketPriceForm && (
                  <div className="bg-purple-50 rounded-lg p-4 space-y-3 mb-4">
                    <div className="grid grid-cols-2 gap-3">
                      {/* Price */}
                      <div className="flex flex-col space-y-1">
                        <label className="text-sm font-medium text-gray-700">Price *</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={marketPriceForm.price}
                          onChange={(e) => setMarketPriceForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="0.00"
                        />
                      </div>

                      {/* Currency */}
                      <div className="flex flex-col space-y-1">
                        <label className="text-sm font-medium text-gray-700">Currency</label>
                        <select
                          value={marketPriceForm.currency}
                          onChange={(e) => setMarketPriceForm(prev => ({ ...prev, currency: e.target.value }))}
                          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="USD">{getCurrencySymbol('USD')} USD</option>
                          <option value="HKD">{getCurrencySymbol('HKD')} HKD</option>
                          <option value="JPY">{getCurrencySymbol('JPY')} JPY</option>
                          <option value="EUR">{getCurrencySymbol('EUR')} EUR</option>
                          <option value="GBP">{getCurrencySymbol('GBP')} GBP</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {/* Condition */}
                      <div className="flex flex-col space-y-1">
                        <label className="text-sm font-medium text-gray-700">Condition *</label>
                        <select
                          value={marketPriceForm.condition}
                          onChange={(e) => setMarketPriceForm(prev => ({ ...prev, condition: e.target.value }))}
                          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="Near Mint">Near Mint</option>
                          <option value="Lightly Played">Lightly Played</option>
                          <option value="Moderately Played">Moderately Played</option>
                          <option value="Heavily Played">Heavily Played</option>
                          <option value="Damaged">Damaged</option>
                        </select>
                      </div>

                      {/* Source */}
                      <div className="flex flex-col space-y-1">
                        <label className="text-sm font-medium text-gray-700">Source (Optional)</label>
                        <input
                          type="text"
                          value={marketPriceForm.source}
                          onChange={(e) => setMarketPriceForm(prev => ({ ...prev, source: e.target.value }))}
                          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="e.g., eBay, TCGPlayer, Local Store"
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      <button
                        onClick={handleAddMarketPrice}
                        disabled={addingPrice || !marketPriceForm.price || marketPriceForm.price <= 0}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                      >
                        <DollarSign className="h-4 w-4" />
                        <span>{addingPrice ? 'Adding...' : 'Add Price'}</span>
                      </button>
                      <button
                        onClick={() => setShowMarketPriceForm(false)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="text-sm text-gray-600">
                  <p>Add market prices to help track card values over time.</p>
                  <p className="mt-1">
                    <a href="/market" className="text-purple-600 hover:text-purple-800 underline">
                      View all market prices →
                    </a>
                  </p>
                </div>
              </div>

              {/* Additional Details */}
              {(selectedVersion.ExpansionName || selectedVersion.ExpansionCode || selectedVersion.Illustrator || selectedVersion.Artist || selectedVersion.SpecialTag) && (
                <div className="pt-4 border-t space-y-3">
                  {selectedVersion.ExpansionName && (
                    <div>
                      <span className="text-gray-600 text-base font-medium">Expansion:</span>
                      <div className="font-semibold text-lg">{selectedVersion.ExpansionName}</div>
                      {selectedVersion.ExpansionCode && (
                        <div className="text-sm text-gray-500">Code: {selectedVersion.ExpansionCode}</div>
                      )}
                    </div>
                  )}
                  {(selectedVersion.Illustrator || selectedVersion.Artist) && (
                    <div>
                      <span className="text-gray-600 text-base font-medium">Artist:</span>
                      <div className="font-semibold text-lg">{selectedVersion.Illustrator || selectedVersion.Artist}</div>
                    </div>
                  )}
                  {selectedVersion.SpecialTag && (
                    <div>
                      <span className="text-gray-600 text-base font-medium">Special Tag:</span>
                      <div className="font-semibold text-lg">{selectedVersion.SpecialTag}</div>
                    </div>
                  )}
                </div>
              )}

              {selectedVersion.Score && (
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-600 text-base font-medium">Score:</span>
                    <span className="font-bold text-2xl">{selectedVersion.Score}</span>
                  </div>
                  {selectedVersion.ScoreBreakdown && renderScoreBreakdownChart(selectedVersion.ScoreBreakdown)}
                </div>
              )}

              {selectedVersion.ImageURL && (
                <div className="pt-4 border-t">
                  <a
                    href={selectedVersion.ImageURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-3 text-blue-600 hover:text-blue-800 text-base font-medium"
                  >
                    <ExternalLink className="h-5 w-5" />
                    <span>View Full Image</span>
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Card Details */}
          <div className="xl:w-3/5 p-8 border-t xl:border-t-0 xl:border-l">
            {/* Skills */}
            <div className="mb-8">

              {/* Skill 1 */}
              {(card.Skill1Name || card.Skill1Effect) && (
                <div className="mb-6 p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 text-xl mb-2">{card.Skill1Name || 'Skill 1'}</h4>
                      <div className="flex items-center space-x-4 text-sm">
                        {card.Skill1Energy && renderEnergyCost(card.Skill1Energy)}
                        {card.Skill1Damage && (
                          <div className="flex items-center space-x-2">
                            <span className="text-red-600 font-semibold text-lg">💥</span>
                            <span className="font-bold text-red-600">{card.Skill1Damage}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        Attack
                      </div>
                    </div>
                  </div>
                  {card.Skill1Effect && (
                    <div className="bg-white p-4 rounded-lg border-l-4 border-blue-500">
                      <p className="text-gray-700 text-base leading-relaxed">{card.Skill1Effect}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Skill 2 */}
              {(card.Skill2Name || card.Skill2Effect) && (
                <div className="mb-6 p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 text-xl mb-2">{card.Skill2Name || 'Skill 2'}</h4>
                      <div className="flex items-center space-x-4 text-sm">
                        {card.Skill2Energy && renderEnergyCost(card.Skill2Energy)}
                        {card.Skill2Damage && (
                          <div className="flex items-center space-x-2">
                            <span className="text-red-600 font-semibold text-lg">💥</span>
                            <span className="font-bold text-red-600">{card.Skill2Damage}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        Attack
                      </div>
                    </div>
                  </div>
                  {card.Skill2Effect && (
                    <div className="bg-white p-4 rounded-lg border-l-4 border-purple-500">
                      <p className="text-gray-700 text-base leading-relaxed">{card.Skill2Effect}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Ability */}
            {(card.AbilityName || card.AbilityEffect) && (
              <div className="mb-8">
                <div className="p-6 bg-blue-50 rounded-xl">
                  {card.AbilityName && (
                    <h4 className="font-semibold text-blue-900 mb-3 text-xl">{card.AbilityName}</h4>
                  )}
                  {card.AbilityEffect && (
                    <p className="text-blue-800 text-base leading-relaxed">{card.AbilityEffect}</p>
                  )}
                </div>
              </div>
            )}

            {/* Effect Classifications */}
            {(card.PrimaryEffectType || card.SpecialEffectType || card.AbilityStats) && (
              <div className="mb-8">
                <div className="space-y-4">
                  {card.PrimaryEffectType && (
                    <div>
                      <span className="text-base text-gray-600 font-medium">Primary Effects:</span>
                      <div className="flex flex-wrap gap-3 mt-2">
                        {card.PrimaryEffectType.split(',').map((effect, index) => (
                          <span
                            key={index}
                            className="inline-block bg-green-100 text-green-800 text-sm px-4 py-2 rounded-full font-medium"
                          >
                            {effect.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {card.SpecialEffectType && card.SpecialEffectType !== '無' && (
                    <div>
                      <span className="text-base text-gray-600 font-medium">Special Effects:</span>
                      <div className="flex flex-wrap gap-3 mt-2">
                        {card.SpecialEffectType.split(',').map((effect, index) => (
                          <span
                            key={index}
                            className="inline-block bg-purple-100 text-purple-800 text-sm px-4 py-2 rounded-full font-medium"
                          >
                            {effect.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {card.AbilityStats && card.AbilityStats !== '無' && (
                    <div>
                      <span className="text-base text-gray-600 font-medium">Ability Stats:</span>
                      <div className="flex flex-wrap gap-3 mt-2">
                        {card.AbilityStats.split(',').map((ability, index) => (
                          <span
                            key={index}
                            className="inline-block bg-blue-100 text-blue-800 text-sm px-4 py-2 rounded-full font-medium"
                          >
                            {ability.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Card Versions */}
            {otherVersions.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Card Versions</h3>
                  <span className="text-sm text-gray-600 font-medium">{otherVersions.length + 1} total versions</span>
                </div>

                {/* Version Grid with Pagination */}
                <div className="grid grid-cols-4 gap-4 mb-4">
                  {/* Current card version */}
                  <div 
                    className={`relative group cursor-pointer ${selectedVersion.CardID === card.CardID ? 'ring-2 ring-blue-500' : ''}`} 
                    onClick={() => setSelectedVersion(card)}
                  >
                    <div className={`aspect-[5/7] bg-blue-100 border-2 rounded-lg overflow-hidden ${
                      selectedVersion.CardID === card.CardID ? 'border-blue-500' : 'border-blue-300 hover:border-blue-400'
                    }`}>
                      {card.OriginalImageURL || card.ImageURL ? (
                        <img
                          src={card.OriginalImageURL || card.ImageURL}
                          alt={card.Name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder-card.svg';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <div className="text-center">
                            <div className="text-4xl mb-2">🎴</div>
                            <div className="text-xs">Current</div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className={`absolute bottom-0 left-0 right-0 text-white text-xs py-1 px-2 text-center font-medium ${
                      selectedVersion.CardID === card.CardID ? 'bg-blue-500' : 'bg-blue-400'
                    }`}>
                      {card.ExpansionCode || 'Current'}
                      {selectedVersion.CardID === card.CardID && <span className="ml-1">✓</span>}
                    </div>
                  </div>

                  {/* Other versions with pagination */}
                  {otherVersions.slice(versionPage * (versionsPerPage - 1), (versionPage + 1) * (versionsPerPage - 1)).map((versionCard, index) => (
                    <div
                      key={versionCard.CardID}
                      className={`relative group cursor-pointer ${selectedVersion.CardID === versionCard.CardID ? 'ring-2 ring-blue-500' : ''}`}
                      onClick={() => setSelectedVersion(versionCard)}
                    >
                      <div className={`aspect-[5/7] bg-gray-100 border-2 rounded-lg overflow-hidden transition-colors ${
                        selectedVersion.CardID === versionCard.CardID ? 'border-blue-500' : 'border-gray-300 hover:border-gray-400'
                      }`}>
                        {versionCard.OriginalImageURL || versionCard.ImageURL ? (
                          <img
                            src={versionCard.OriginalImageURL || versionCard.ImageURL}
                            alt={versionCard.Name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder-card.svg';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <div className="text-center">
                              <div className="text-4xl mb-2">🎴</div>
                              <div className="text-xs">V{versionPage * (versionsPerPage - 1) + index + 2}</div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className={`absolute bottom-0 left-0 right-0 text-white text-xs py-1 px-2 text-center font-medium ${
                        selectedVersion.CardID === versionCard.CardID ? 'bg-blue-500' : 'bg-gray-700'
                      }`}>
                        {versionCard.ExpansionName + "(" + versionCard.ExpansionCode + ") - "+ versionCard.CollectorNumber || `V${versionPage * (versionsPerPage - 1) + index + 2}`}
                        {selectedVersion.CardID === versionCard.CardID && <span className="ml-1">✓</span>}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination Controls */}
                {otherVersions.length >= versionsPerPage && (
                  <div className="flex items-center justify-center space-x-2">
                    <button
                      onClick={() => setVersionPage(Math.max(0, versionPage - 1))}
                      disabled={versionPage === 0}
                      className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>

                    <span className="text-sm text-gray-600 px-3">
                      Page {versionPage + 1} of {Math.ceil((otherVersions.length + 1) / versionsPerPage)}
                    </span>

                    <button
                      onClick={() => setVersionPage(Math.min(Math.ceil((otherVersions.length + 1) / versionsPerPage) - 1, versionPage + 1))}
                      disabled={versionPage >= Math.ceil((otherVersions.length + 1) / versionsPerPage) - 1}
                      className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Evolution Chain Progression */}
            {card.Evolution && evolutionChain.length > 0 && (
              <div className="mb-8">

                {/* Evolution Chain Text Display */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
                  <div className="text-center">
                    <div className="text-lg font-medium text-gray-800">
                      {evolutionChain.map((chainCard, index) => (
                        <span key={chainCard.Name + index}>
                          <span
                            className={`cursor-pointer hover:text-blue-600 transition-colors ${
                              chainCard.Name === card.Name ? 'font-bold text-blue-700' : ''
                            }`}
                            onClick={() => onCardClick(chainCard)}
                          >
                            {chainCard.Name}
                          </span>
                          {index < evolutionChain.length - 1 && (
                            <span className="text-gray-500 mx-2">→</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Related Cards */}
            {relatedCards.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{t.relatedCards}</h3>
                <div className="grid grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">{relatedCards.map((relatedCard) => (
                    <div
                      key={relatedCard.CardID}
                      className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-all duration-200 shadow-sm hover:shadow-md group"
                    >
                      <div 
                        className="aspect-[5/7] bg-gray-200 rounded-lg mb-3 overflow-hidden cursor-pointer"
                        onClick={() => onCardClick(relatedCard)}
                      >
                        {relatedCard.ImageURL ? (
                          <img
                            src={relatedCard.ImageURL}
                            alt={relatedCard.Name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-lg">
                            🎴
                          </div>
                        )}
                      </div>
                      <h4 
                        className="font-medium text-gray-900 text-sm leading-tight line-clamp-2 mb-2 cursor-pointer hover:text-blue-600"
                        onClick={() => onCardClick(relatedCard)}
                      >
                        {relatedCard.Name}
                      </h4>
                      <div className="flex items-center justify-between mb-2">
                        {relatedCard.Tier && (
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getTierColor(relatedCard.Tier)}`}>
                            {relatedCard.Tier}
                          </span>
                        )}
                        {relatedCard.Score && (
                          <span className="text-xs text-gray-600 font-medium">
                            {relatedCard.Score}
                          </span>
                        )}
                      </div>
                      {onAddToDeck && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddToDeck(relatedCard, 1);
                          }}
                          className="w-full bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium py-1.5 px-2 rounded transition-colors"
                        >
                          {t.addToDeck}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}