'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
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
  X,
  Grid,
  List,
  ArrowLeft,
  Home,
  BarChart3,
  CheckCircle
} from 'lucide-react';

// Mock data for demonstration
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
    updatedAt: new Date('2024-10-01'),
    description: 'Aggressive Lightning-type deck focused on fast KO',
    keyCards: ['Pikachu VMAX', 'Raichu V', 'Lightning Energy']
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
    updatedAt: new Date('2024-09-28'),
    description: 'Control deck using Fire-type Pokemon and disruption',
    keyCards: ['Charizard V', 'Arcanine', 'Fire Energy']
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
    updatedAt: new Date('2024-09-25'),
    description: 'Psychic-type deck with strong finishers',
    keyCards: ['Mewtwo V-UNION', 'Mr. Mime', 'Psychic Energy']
  }
];

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
    attacks: ['G-Max Volt Hurricane'],
    price: 45.99
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
    attacks: ['Flamethrower'],
    price: 32.50
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
    attacks: ['Psychic Sphere'],
    price: 89.99
  },
  {
    id: '4',
    name: 'Blastoise V',
    type: 'Water',
    rarity: 'Ultra Rare',
    expansion: 'SWSH01',
    image: '/cards/hk00003082.png',
    hp: 220,
    abilities: ['Solid Shell'],
    attacks: ['Hydro Pump'],
    price: 28.75
  },
  {
    id: '5',
    name: 'Venusaur V',
    type: 'Grass',
    rarity: 'Ultra Rare',
    expansion: 'SWSH01',
    image: '/cards/hk00003112.png',
    hp: 230,
    abilities: ['Overgrow'],
    attacks: ['Solar Beam'],
    price: 31.20
  }
];

// Navigation types
type ViewType = 'manager' | 'builder' | 'cards';

export default function NewDeckUI() {
  const [currentView, setCurrentView] = useState<ViewType>('manager');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeck, setSelectedDeck] = useState<typeof mockDecks[0] | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterRarity, setFilterRarity] = useState('All');
  const [filterType, setFilterType] = useState('All');

  // Filtered cards based on search and filters
  const filteredCards = mockCards.filter(card => {
    const matchesSearch = card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         card.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         card.expansion.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRarity = filterRarity === 'All' || card.rarity === filterRarity;
    const matchesType = filterType === 'All' || card.type === filterType;

    return matchesSearch && matchesRarity && matchesType;
  });

  const navigationItems = [
    { id: 'manager' as ViewType, label: 'Deck Manager', icon: Package, description: 'Manage your decks' },
    { id: 'builder' as ViewType, label: 'Deck Builder', icon: Settings, description: 'Build new decks' },
    { id: 'cards' as ViewType, label: 'Card Library', icon: Grid, description: 'Browse all cards' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header with Navigation */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Package className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Deck Studio
                </h1>
                <p className="text-sm text-gray-600">Comprehensive deck management system</p>
              </div>
            </div>

            {/* Navigation Pills */}
            <div className="flex items-center space-x-2 bg-gray-100/50 rounded-xl p-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentView(item.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                      currentView === item.id
                        ? 'bg-white shadow-sm text-blue-600'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                    }`}
                    title={item.description}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Back to Home */}
            <a
              href="/"
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Home className="h-4 w-4" />
              <span>Home</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {currentView === 'manager' && (
          <DeckManagerView
            decks={mockDecks}
            onCreateDeck={() => setCurrentView('builder')}
            onEditDeck={(deck) => {
              setSelectedDeck(deck);
              setCurrentView('builder');
            }}
            onViewCards={() => setCurrentView('cards')}
          />
        )}

        {currentView === 'builder' && (
          <DeckBuilderView
            selectedDeck={selectedDeck}
            onBack={() => {
              setSelectedDeck(null);
              setCurrentView('manager');
            }}
            onViewCards={() => setCurrentView('cards')}
          />
        )}

        {currentView === 'cards' && (
          <CardLibraryView
            cards={filteredCards}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            filterRarity={filterRarity}
            onFilterRarityChange={setFilterRarity}
            filterType={filterType}
            onFilterTypeChange={setFilterType}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onBack={() => setCurrentView('manager')}
          />
        )}
      </div>
    </div>
  );
}

// Deck Manager Component
function DeckManagerView({
  decks,
  onCreateDeck,
  onEditDeck,
  onViewCards
}: {
  decks: typeof mockDecks;
  onCreateDeck: () => void;
  onEditDeck: (deck: typeof mockDecks[0]) => void;
  onViewCards: () => void;
}) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-600 rounded-xl flex items-center justify-center">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Deck Manager</h2>
              <p className="text-gray-600">Manage and organize your Pokemon TCG decks</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onViewCards}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              <Grid className="h-4 w-4" />
              <span>Browse Cards</span>
            </button>
            <button
              onClick={onCreateDeck}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-xl hover:shadow-lg transition-all duration-200"
            >
              <Plus className="h-5 w-5" />
              <span>Create Deck</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Decks</p>
              <p className="text-2xl font-bold text-gray-900">{decks.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Valid Decks</p>
              <p className="text-2xl font-bold text-gray-900">{decks.filter(d => d.isValid).length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg. Cards</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(decks.reduce((sum, d) => sum + d.totalCards, 0) / decks.length)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Star className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Formats</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(decks.map(d => d.format)).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Deck Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {decks.map((deck) => (
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
              {deck.description && (
                <p className="text-gray-600 text-sm line-clamp-2 mb-3">{deck.description}</p>
              )}
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

            {/* Key Cards */}
            <div className="px-4 py-3 bg-blue-50/50 border-t border-gray-100/50">
              <p className="text-xs text-gray-600 mb-2">Key Cards:</p>
              <div className="flex flex-wrap gap-1">
                {deck.keyCards.slice(0, 3).map((card, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-white rounded text-xs font-medium text-gray-700"
                  >
                    {card}
                  </span>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-gray-100/50">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onEditDeck(deck)}
                  className="flex items-center justify-center space-x-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Edit className="h-4 w-4" />
                  <span className="text-sm">Edit</span>
                </button>
                <button className="flex items-center justify-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                  <Eye className="h-4 w-4" />
                  <span className="text-sm">View</span>
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
  );
}

// Deck Builder Component
function DeckBuilderView({
  selectedDeck,
  onBack,
  onViewCards
}: {
  selectedDeck: typeof mockDecks[0] | null;
  onBack: () => void;
  onViewCards: () => void;
}) {
  const [builderSearchTerm, setBuilderSearchTerm] = useState('');
  const [currentDeck, setCurrentDeck] = useState(selectedDeck || {
    id: 'new',
    name: 'New Deck',
    format: 'Standard',
    totalCards: 0,
    pokemonCount: 0,
    trainerCount: 0,
    energyCount: 0,
    isValid: false,
    updatedAt: new Date(),
    description: '',
    keyCards: []
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
              <Settings className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {selectedDeck ? `Editing: ${selectedDeck.name}` : 'Deck Builder'}
              </h2>
              <p className="text-gray-600">Build your perfect Pokemon TCG deck</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onViewCards}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              <Grid className="h-4 w-4" />
              <span>Browse Cards</span>
            </button>
            <button className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-xl hover:shadow-lg transition-all duration-200">
              <Download className="h-5 w-5" />
              <span>Save Deck</span>
            </button>
          </div>
        </div>
      </div>

      {/* Builder Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Card Search & Pool */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search Interface */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Search className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Card Search</h3>
                <p className="text-gray-600">Find and add cards to your deck</p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search cards by name, ability, or type..."
                  value={builderSearchTerm}
                  onChange={(e) => setBuilderSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50"
                />
              </div>
              <button className="flex items-center space-x-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
                <Filter className="h-5 w-5" />
                <span>Filters</span>
              </button>
            </div>
          </div>

          {/* Card Pool */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Available Cards</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
              {mockCards.filter(card =>
                card.name.toLowerCase().includes(builderSearchTerm.toLowerCase())
              ).map((card) => (
                <div
                  key={card.id}
                  className="bg-gray-50 rounded-xl p-3 hover:bg-gray-100 transition-colors cursor-pointer border border-gray-200"
                >
                  <div className="aspect-[3/4] bg-gray-200 rounded-lg mb-2 flex items-center justify-center">
                    <Star className="h-6 w-6 text-gray-400" />
                  </div>
                  <h4 className="font-medium text-sm text-gray-900 mb-1">{card.name}</h4>
                  <p className="text-xs text-gray-500">{card.expansion}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs font-medium text-gray-600">${card.price}</span>
                    <button className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors">
                      Add
                    </button>
                  </div>
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
                <span className="font-medium">{currentDeck.pokemonCount}/60</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded"></div>
                  <span className="text-sm">Trainer</span>
                </div>
                <span className="font-medium">{currentDeck.trainerCount}/60</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded"></div>
                  <span className="text-sm">Energy</span>
                </div>
                <span className="font-medium">{currentDeck.energyCount}/60</span>
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Deck Stats</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total Cards:</span>
                <span className="font-medium">{currentDeck.totalCards}/60</span>
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
  );
}

// Card Library Component
function CardLibraryView({
  cards,
  searchTerm,
  onSearchChange,
  filterRarity,
  onFilterRarityChange,
  filterType,
  onFilterTypeChange,
  viewMode,
  onViewModeChange,
  onBack
}: {
  cards: typeof mockCards;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filterRarity: string;
  onFilterRarityChange: (rarity: string) => void;
  filterType: string;
  onFilterTypeChange: (type: string) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Grid className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Card Library</h2>
              <p className="text-gray-600">Browse and discover all available cards</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => onViewModeChange('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => onViewModeChange('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Search className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Search & Filter</h3>
            <p className="text-gray-600">Find the perfect cards for your deck</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-64">
            <input
              type="text"
              placeholder="Search cards..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterRarity}
            onChange={(e) => onFilterRarityChange(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Rarities</option>
            <option value="Ultra Rare">Ultra Rare</option>
            <option value="Rare">Rare</option>
            <option value="Uncommon">Uncommon</option>
            <option value="Common">Common</option>
          </select>
          <select
            value={filterType}
            onChange={(e) => onFilterTypeChange(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Types</option>
            <option value="Lightning">Lightning</option>
            <option value="Fire">Fire</option>
            <option value="Water">Water</option>
            <option value="Grass">Grass</option>
            <option value="Psychic">Psychic</option>
          </select>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          Showing {cards.length} card{cards.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Card Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {cards.map((card) => (
            <div
              key={card.id}
              className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer"
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
                <div className="space-y-1 mb-3">
                  <p className="text-xs text-gray-500">Type: {card.type}</p>
                  <p className="text-xs text-gray-500">Expansion: {card.expansion}</p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-green-600">${card.price}</span>
                  <button className="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors">
                    Add to Deck
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {cards.map((card) => (
            <div
              key={card.id}
              className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 p-4 hover:shadow-lg transition-all duration-200 cursor-pointer"
            >
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                  <Star className="h-8 w-8 text-gray-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">{card.name}</h3>
                  <p className="text-sm text-gray-600">{card.type} • {card.expansion} • {card.rarity}</p>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="text-sm text-gray-500">{card.hp} HP</span>
                    <span className="text-sm font-medium text-green-600">${card.price}</span>
                  </div>
                </div>
                <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                  Add to Deck
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}