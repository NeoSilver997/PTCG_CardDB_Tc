'use client';

import { useState } from 'react';
import {
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  Copy,
  Download,
  Sword,
  Shield,
  Zap,
  Heart,
  Star,
  BookOpen,
  Package,
  Settings,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';

// Mock data for UI demonstration
const mockCards = [
  {
    id: '1',
    name: 'Pikachu VMAX',
    type: 'Lightning',
    rarity: 'Ultra Rare',
    expansion: 'SWSH01',
    image: '/cards/hk00001275.png',
    hp: 330,
    abilities: ['Max Lightning'],
    attacks: ['G-Max Volt Hurricane']
  },
  {
    id: '2',
    name: 'Charizard V',
    type: 'Fire',
    rarity: 'Ultra Rare',
    expansion: 'SWSH01',
    image: '/cards/hk00002258.png',
    hp: 210,
    abilities: ['Clutch'],
    attacks: ['Flamethrower']
  },
  {
    id: '3',
    name: 'Mewtwo V-UNION',
    type: 'Psychic',
    rarity: 'Ultra Rare',
    expansion: 'SWSH12',
    image: '/cards/hk00002524.png',
    hp: 320,
    abilities: ['Photon Barrier', 'Super Regeneration'],
    attacks: ['Psychic Sphere']
  }
];

const mockDecks = [
  {
    id: '1',
    name: 'Lightning Storm',
    format: 'Standard',
    totalCards: 60,
    pokemonCount: 15,
    trainerCount: 35,
    energyCount: 10,
    isValid: true,
    updatedAt: new Date('2024-10-01')
  },
  {
    id: '2',
    name: 'Fire Charge',
    format: 'Expanded',
    totalCards: 60,
    pokemonCount: 12,
    trainerCount: 38,
    energyCount: 10,
    isValid: true,
    updatedAt: new Date('2024-09-28')
  },
  {
    id: '3',
    name: 'Psychic Force',
    format: 'Standard',
    totalCards: 58,
    pokemonCount: 14,
    trainerCount: 34,
    energyCount: 10,
    isValid: false,
    updatedAt: new Date('2024-09-25')
  }
];

export default function UIDraft() {
  const [activeTab, setActiveTab] = useState<'search' | 'decks' | 'builder'>('search');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCard, setSelectedCard] = useState<typeof mockCards[0] | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  PTCG Modern UI Draft
                </h1>
                <p className="text-sm text-gray-600">UI Components Showcase - No Functionality</p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center space-x-1 bg-gray-100/50 rounded-xl p-1">
              {[
                { id: 'search', label: 'Card Search', icon: Search },
                { id: 'decks', label: 'Deck Manager', icon: Package },
                { id: 'builder', label: 'Deck Builder', icon: Settings }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-white shadow-sm text-blue-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'search' && (
          <div className="space-y-8">
            {/* Search Header */}
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Search className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Card Search</h2>
                  <p className="text-gray-600">Browse and discover Pokemon TCG cards</p>
                </div>
              </div>

              {/* Search Bar */}
              <div className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search cards by name, ability, or effect..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50"
                  />
                </div>
                <button className="flex items-center space-x-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
                  <Filter className="h-5 w-5" />
                  <span>Filters</span>
                </button>
              </div>
            </div>

            {/* Card Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockCards.map((card) => (
                <div
                  key={card.id}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer"
                  onClick={() => setSelectedCard(card)}
                >
                  {/* Card Image */}
                  <div className="aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <div className="w-16 h-16 mx-auto mb-2 bg-gray-300 rounded-lg flex items-center justify-center">
                        <Star className="h-8 w-8" />
                      </div>
                      <p className="text-sm font-medium">{card.name}</p>
                      <p className="text-xs text-gray-400">{card.expansion}</p>
                    </div>
                  </div>

                  {/* Card Info */}
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 mb-2">{card.name}</h3>
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                      <span className="flex items-center space-x-1">
                        <Heart className="h-4 w-4 text-red-500" />
                        <span>{card.hp} HP</span>
                      </span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        {card.rarity}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500">Abilities: {card.abilities.join(', ')}</p>
                      <p className="text-xs text-gray-500">Attacks: {card.attacks.join(', ')}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'decks' && (
          <div className="space-y-8">
            {/* Deck Manager Header */}
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-600 rounded-xl flex items-center justify-center">
                    <Package className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Deck Manager</h2>
                    <p className="text-gray-600">Manage your Pokemon TCG decks</p>
                  </div>
                </div>
                <button className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-xl hover:shadow-lg transition-all duration-200">
                  <Plus className="h-5 w-5" />
                  <span>Create Deck</span>
                </button>
              </div>
            </div>

            {/* Deck Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockDecks.map((deck) => (
                <div
                  key={deck.id}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  {/* Deck Header */}
                  <div className="p-6 border-b border-gray-100/50">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-xl font-bold text-gray-900 line-clamp-2">{deck.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        deck.format === 'Standard' ? 'bg-blue-100 text-blue-800' :
                        deck.format === 'Expanded' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {deck.format}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{deck.updatedAt.toLocaleDateString()}</span>
                      <div className="flex items-center space-x-1">
                        {deck.isValid ? (
                          <div className="flex items-center space-x-1 text-green-600">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>Valid</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1 text-red-600">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span>Invalid</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Deck Composition */}
                  <div className="p-4 bg-gray-50/50">
                    <div className="grid grid-cols-3 gap-4 text-center mb-4">
                      <div>
                        <div className="flex items-center justify-center space-x-1 mb-1">
                          <div className="w-3 h-3 bg-red-500 rounded"></div>
                          <span className="text-xs text-gray-600">Pokemon</span>
                        </div>
                        <div className="font-bold text-lg">{deck.pokemonCount}</div>
                      </div>
                      <div>
                        <div className="flex items-center justify-center space-x-1 mb-1">
                          <div className="w-3 h-3 bg-blue-500 rounded"></div>
                          <span className="text-xs text-gray-600">Trainer</span>
                        </div>
                        <div className="font-bold text-lg">{deck.trainerCount}</div>
                      </div>
                      <div>
                        <div className="flex items-center justify-center space-x-1 mb-1">
                          <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                          <span className="text-xs text-gray-600">Energy</span>
                        </div>
                        <div className="font-bold text-lg">{deck.energyCount}</div>
                      </div>
                    </div>
                    <div className="text-center">
                      <span className="text-lg font-bold text-gray-900">{deck.totalCards}/60</span>
                      <span className="text-sm text-gray-600"> cards</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-4 border-t border-gray-100/50">
                    <div className="grid grid-cols-2 gap-2">
                      <button className="flex items-center justify-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                        <Eye className="h-4 w-4" />
                        <span className="text-sm">View</span>
                      </button>
                      <button className="flex items-center justify-center space-x-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                        <Edit className="h-4 w-4" />
                        <span className="text-sm">Edit</span>
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      <button className="flex items-center justify-center px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors">
                        <Copy className="h-4 w-4" />
                      </button>
                      <button className="flex items-center justify-center px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors">
                        <Download className="h-4 w-4" />
                      </button>
                      <button className="flex items-center justify-center px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'builder' && (
          <div className="space-y-8">
            {/* Deck Builder Header */}
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <Settings className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Deck Builder</h2>
                  <p className="text-gray-600">Build your perfect Pokemon TCG deck</p>
                </div>
              </div>
            </div>

            {/* Builder Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Card Pool */}
              <div className="lg:col-span-2">
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Card Pool</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    {mockCards.map((card) => (
                      <div
                        key={card.id}
                        className="bg-gray-50 rounded-xl p-3 hover:bg-gray-100 transition-colors cursor-pointer"
                      >
                        <div className="aspect-[3/4] bg-gray-200 rounded-lg mb-2 flex items-center justify-center">
                          <Star className="h-6 w-6 text-gray-400" />
                        </div>
                        <h4 className="font-medium text-sm text-gray-900 mb-1">{card.name}</h4>
                        <p className="text-xs text-gray-500">{card.expansion}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Current Deck */}
              <div className="space-y-6">
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Current Deck</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-red-500 rounded"></div>
                        <span className="text-sm">Pokemon</span>
                      </div>
                      <span className="font-medium">0/60</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded"></div>
                        <span className="text-sm">Trainer</span>
                      </div>
                      <span className="font-medium">0/60</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded"></div>
                        <span className="text-sm">Energy</span>
                      </div>
                      <span className="font-medium">0/60</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Deck Stats</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total Cards:</span>
                      <span className="font-medium">0/60</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Cost:</span>
                      <span className="font-medium">$0.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Valid Deck:</span>
                      <span className="font-medium text-red-500">No</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Card Detail Modal */}
      {selectedCard && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">{selectedCard.name}</h3>
                <button
                  onClick={() => setSelectedCard(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl mb-4 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <Star className="h-12 w-12 mx-auto mb-2" />
                  <p className="text-sm">Card Image</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">HP:</span>
                  <span className="font-medium">{selectedCard.hp}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium">{selectedCard.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Rarity:</span>
                  <span className="font-medium">{selectedCard.rarity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Expansion:</span>
                  <span className="font-medium">{selectedCard.expansion}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}