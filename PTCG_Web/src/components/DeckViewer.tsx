'use client';

import { useState } from 'react';
import { 
  X, 
  Download, 
  Copy, 
  Edit, 
  BarChart3,
  Eye,
  EyeOff,
  Filter,
  Search,
  Zap,
  Maximize,
  Minimize,
  ZoomOut
} from 'lucide-react';
import { Deck, DeckCard } from '../types/deck';

interface DeckViewerProps {
  deck: Deck;
  onClose: () => void;
  onEdit?: () => void;
}

export default function DeckViewer({ deck, onClose, onEdit }: DeckViewerProps) {
  const [showStats, setShowStats] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'pokemon' | 'trainer' | 'energy'>('all');
  const [showImages, setShowImages] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [zoomOut, setZoomOut] = useState(false);

  // Filter cards based on search and type
  const filteredCards = deck.cards.filter(card => {
    // Search filter
    if (searchTerm && !card.Name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Type filter
    if (typeFilter !== 'all') {
      if (typeFilter === 'pokemon' && !(card.CardType.includes('寶可夢') || card.CardType.toLowerCase().includes('pokemon'))) {
        return false;
      }
      if (typeFilter === 'trainer' && !(card.CardType.includes('物品') || card.CardType.includes('支援') || card.CardType.includes('場地'))) {
        return false;
      }
      if (typeFilter === 'energy' && !card.CardType.includes('能量')) {
        return false;
      }
    }

    return true;
  });

  // Group cards by type
  const pokemonCards = deck.cards.filter(card => card.CardType.includes('寶可夢') || card.CardType.toLowerCase().includes('pokemon'));
  const trainerCards = deck.cards.filter(card => card.CardType.includes('物品') || card.CardType.includes('支援') || card.CardType.includes('場地'));
  const energyCards = deck.cards.filter(card => card.CardType.includes('能量'));

  const exportDeckList = () => {
    let deckList = `${deck.name}\n`;
    deckList += `Format: ${deck.format}\n`;
    deckList += `Total Cards: ${deck.totalCards}\n`;
    if (deck.description) {
      deckList += `Description: ${deck.description}\n`;
    }
    deckList += `\n`;

    if (pokemonCards.length > 0) {
      deckList += `Pokemon (${pokemonCards.reduce((sum, card) => sum + card.quantity, 0)}):\n`;
      pokemonCards.forEach(card => {
        deckList += `${card.quantity}x ${card.Name} ${card.ExpansionCode || ''}\n`;
      });
      deckList += '\n';
    }

    if (trainerCards.length > 0) {
      deckList += `Trainers (${trainerCards.reduce((sum, card) => sum + card.quantity, 0)}):\n`;
      trainerCards.forEach(card => {
        deckList += `${card.quantity}x ${card.Name} ${card.ExpansionCode || ''}\n`;
      });
      deckList += '\n';
    }

    if (energyCards.length > 0) {
      deckList += `Energy (${energyCards.reduce((sum, card) => sum + card.quantity, 0)}):\n`;
      energyCards.forEach(card => {
        deckList += `${card.quantity}x ${card.Name} ${card.ExpansionCode || ''}\n`;
      });
    }

    const blob = new Blob([deckList], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${deck.name}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyDeckList = async () => {
    const deckText = generateDeckListText();
    try {
      await navigator.clipboard.writeText(deckText);
      alert('Deck list copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const generateDeckListText = (): string => {
    let deckList = `${deck.name}\n`;
    deckList += `Format: ${deck.format}\n`;
    deckList += `Total Cards: ${deck.totalCards}\n\n`;

    if (pokemonCards.length > 0) {
      deckList += `Pokemon (${pokemonCards.reduce((sum, card) => sum + card.quantity, 0)}):\n`;
      pokemonCards.forEach(card => {
        deckList += `${card.quantity}x ${card.Name} ${card.ExpansionCode || ''}\n`;
      });
      deckList += '\n';
    }

    if (trainerCards.length > 0) {
      deckList += `Trainers (${trainerCards.reduce((sum, card) => sum + card.quantity, 0)}):\n`;
      trainerCards.forEach(card => {
        deckList += `${card.quantity}x ${card.Name} ${card.ExpansionCode || ''}\n`;
      });
      deckList += '\n';
    }

    if (energyCards.length > 0) {
      deckList += `Energy (${energyCards.reduce((sum, card) => sum + card.quantity, 0)}):\n`;
      energyCards.forEach(card => {
        deckList += `${card.quantity}x ${card.Name} ${card.ExpansionCode || ''}\n`;
      });
    }

    return deckList;
  };

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 ${isFullScreen ? 'p-0' : ''}`}>
      <div className={`bg-white rounded-xl w-full h-full overflow-hidden shadow-2xl flex flex-col ${isFullScreen ? 'max-w-none max-h-none rounded-none' : 'max-w-6xl max-h-[95vh]'}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{deck.name}</h1>
            <div className="flex items-center space-x-4 mt-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                deck.format === 'Standard' ? 'bg-blue-100 text-blue-800' :
                deck.format === 'Expanded' ? 'bg-green-100 text-green-800' :
                'bg-purple-100 text-purple-800'
              }`}>
                {deck.format}
              </span>
              <span className="text-sm text-gray-600">
                {deck.totalCards}/60 cards
              </span>
              <div className="flex items-center space-x-1">
                {deck.isValid ? (
                  <div className="flex items-center space-x-1 text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Valid</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1 text-red-600">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-sm">Invalid</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setZoomOut(!zoomOut)}
              className={`p-2 rounded-lg transition-colors ${
                zoomOut 
                  ? 'bg-purple-500 text-white hover:bg-purple-600' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              title={zoomOut ? 'Normal View' : 'Zoom Out View'}
            >
              <ZoomOut className="h-5 w-5" />
            </button>
            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className={`p-2 rounded-lg transition-colors ${
                isFullScreen 
                  ? 'bg-indigo-500 text-white hover:bg-indigo-600' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              title={isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
            >
              {isFullScreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
            </button>
            <button
              onClick={() => setShowStats(!showStats)}
              className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              title="Toggle Statistics"
            >
              <BarChart3 className="h-5 w-5" />
            </button>
            <button
              onClick={copyDeckList}
              className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              title="Copy Deck List"
            >
              <Copy className="h-5 w-5" />
            </button>
            <button
              onClick={exportDeckList}
              className="p-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              title="Export Deck"
            >
              <Download className="h-5 w-5" />
            </button>
            {onEdit && (
              <button
                onClick={onEdit}
                className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                title="Edit Deck"
              >
                <Edit className="h-5 w-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Description */}
        {deck.description && (
          <div className="px-6 py-3 bg-gray-50 border-b">
            <p className="text-gray-700">{deck.description}</p>
          </div>
        )}

        {/* Deck Composition Summary */}
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="flex items-center justify-center space-x-2 mb-1">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span className="text-sm text-gray-600">Pokemon</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{deck.pokemonCount}</div>
            </div>
            <div>
              <div className="flex items-center justify-center space-x-2 mb-1">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span className="text-sm text-gray-600">Trainers</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{deck.trainerCount}</div>
            </div>
            <div>
              <div className="flex items-center justify-center space-x-2 mb-1">
                <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                <span className="text-sm text-gray-600">Energy</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{deck.energyCount}</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 border-b bg-gray-50">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search cards..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="pokemon">Pokemon</option>
              <option value="trainer">Trainers</option>
              <option value="energy">Energy</option>
            </select>
            <button
              onClick={() => setShowImages(!showImages)}
              className={`p-2 rounded-lg transition-colors ${
                showImages 
                  ? 'bg-blue-500 text-white hover:bg-blue-600' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              title={showImages ? 'Hide Images' : 'Show Images'}
            >
              {showImages ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Card List */}
        <div className="flex-1 overflow-y-auto">
          {showImages ? (
            <div className="p-6">
              <div className={`grid gap-4 ${zoomOut ? 'grid-cols-8' : 'grid-cols-4'}`}>
                {filteredCards.map(card => (
                  <div
                    key={card.CardID}
                    className={`bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow ${zoomOut ? 'transform scale-75' : ''}`}
                  >
                    <div className="aspect-[5/7] bg-gray-100 overflow-hidden relative">
                      {card.ImageURL ? (
                        <img
                          src={card.ImageURL}
                          alt={card.Name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <div className="text-center">
                            <div className="text-4xl mb-2">🎴</div>
                            <div className="text-xs">{card.Name}</div>
                          </div>
                        </div>
                      )}
                      <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white text-sm font-bold px-2 py-1 rounded">
                        {card.quantity}x
                      </div>
                    </div>
                    <div className={`p-3 ${zoomOut ? 'p-2' : ''}`}>
                      <h3 className={`font-medium text-gray-900 line-clamp-2 mb-1 ${zoomOut ? 'text-xs' : 'text-sm'}`}>{card.Name}</h3>
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>{card.CardType}</span>
                        {card.ExpansionCode && <span>{card.ExpansionCode}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-6">
              {/* Pokemon Section */}
              {pokemonCards.filter(card => 
                !searchTerm || card.Name.toLowerCase().includes(searchTerm.toLowerCase())
              ).length > 0 && (typeFilter === 'all' || typeFilter === 'pokemon') && (
                <div className="mb-8">
                  <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center">
                    <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
                    Pokemon ({pokemonCards.filter(card => 
                      !searchTerm || card.Name.toLowerCase().includes(searchTerm.toLowerCase())
                    ).reduce((sum, card) => sum + card.quantity, 0)})
                  </h3>
                  <div className="space-y-2">
                    {pokemonCards
                      .filter(card => !searchTerm || card.Name.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map(card => (
                        <DeckListItem key={card.CardID} card={card} />
                      ))}
                  </div>
                </div>
              )}

              {/* Trainer Section */}
              {trainerCards.filter(card => 
                !searchTerm || card.Name.toLowerCase().includes(searchTerm.toLowerCase())
              ).length > 0 && (typeFilter === 'all' || typeFilter === 'trainer') && (
                <div className="mb-8">
                  <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center">
                    <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
                    Trainers ({trainerCards.filter(card => 
                      !searchTerm || card.Name.toLowerCase().includes(searchTerm.toLowerCase())
                    ).reduce((sum, card) => sum + card.quantity, 0)})
                  </h3>
                  <div className="space-y-2">
                    {trainerCards
                      .filter(card => !searchTerm || card.Name.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map(card => (
                        <DeckListItem key={card.CardID} card={card} />
                      ))}
                  </div>
                </div>
              )}

              {/* Energy Section */}
              {energyCards.filter(card => 
                !searchTerm || card.Name.toLowerCase().includes(searchTerm.toLowerCase())
              ).length > 0 && (typeFilter === 'all' || typeFilter === 'energy') && (
                <div className="mb-8">
                  <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center">
                    <div className="w-4 h-4 bg-yellow-500 rounded mr-2"></div>
                    Energy ({energyCards.filter(card => 
                      !searchTerm || card.Name.toLowerCase().includes(searchTerm.toLowerCase())
                    ).reduce((sum, card) => sum + card.quantity, 0)})
                  </h3>
                  <div className="space-y-2">
                    {energyCards
                      .filter(card => !searchTerm || card.Name.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map(card => (
                        <DeckListItem key={card.CardID} card={card} />
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Statistics Panel */}
        {showStats && (
          <div className="border-t bg-gray-50 p-6">
            <div className="grid grid-cols-4 gap-6">
              <div className="bg-white p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Deck Info</h4>
                <div className="space-y-2 text-sm">
                  <div>Total Cards: {deck.totalCards}</div>
                  <div>Created: {new Date(deck.createdAt).toLocaleDateString()}</div>
                  <div>Updated: {new Date(deck.updatedAt).toLocaleDateString()}</div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Composition</h4>
                <div className="space-y-2 text-sm">
                  <div>Pokemon: {deck.pokemonCount}</div>
                  <div>Trainers: {deck.trainerCount}</div>
                  <div>Energy: {deck.energyCount}</div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Rarity Distribution</h4>
                <div className="space-y-1 text-sm max-h-20 overflow-y-auto">
                  {Object.entries(
                    deck.cards.reduce((acc, card) => {
                      acc[card.Rarity] = (acc[card.Rarity] || 0) + card.quantity;
                      return acc;
                    }, {} as { [key: string]: number })
                  ).map(([rarity, count]) => (
                    <div key={rarity} className="flex justify-between">
                      <span>{rarity}:</span>
                      <span>{count}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Energy Types</h4>
                <div className="space-y-1 text-sm max-h-20 overflow-y-auto">
                  {Object.entries(
                    deck.cards
                      .filter(card => card.Type)
                      .reduce((acc, card) => {
                        acc[card.Type] = (acc[card.Type] || 0) + card.quantity;
                        return acc;
                      }, {} as { [key: string]: number })
                  ).slice(0, 5).map(([type, count]) => (
                    <div key={type} className="flex justify-between">
                      <span>{type}:</span>
                      <span>{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface DeckListItemProps {
  card: DeckCard;
}

function DeckListItem({ card }: DeckListItemProps) {
  return (
    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-10 bg-gray-100 rounded overflow-hidden flex-shrink-0">
          {card.ImageURL ? (
            <img
              src={card.ImageURL}
              alt={card.Name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
              🎴
            </div>
          )}
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{card.Name}</h4>
          <div className="flex items-center space-x-2 text-xs text-gray-600">
            <span>{card.CardType}</span>
            {card.ExpansionCode && <span>• {card.ExpansionCode}</span>}
            {card.HP && <span>• HP: {card.HP}</span>}
            {card.Tier && (
              <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                card.Tier === 'S+' ? 'bg-red-500 text-white' :
                card.Tier === 'S' ? 'bg-orange-500 text-white' :
                card.Tier === 'A+' ? 'bg-yellow-500 text-white' :
                card.Tier === 'A' ? 'bg-green-500 text-white' :
                'bg-gray-500 text-white'
              }`}>
                {card.Tier}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <span className="text-lg font-bold text-gray-900">{card.quantity}x</span>
      </div>
    </div>
  );
}