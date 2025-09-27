'use client';

import { useState, useEffect } from 'react';
import { 
  Plus,
  Edit,
  Trash2,
  Download,
  Upload,
  Copy,
  Eye,
  Calendar,
  Users,
  BarChart3,
  FileText,
  Search,
  Filter,
  Star,
  Zap,
  Shield,
  Sword
} from 'lucide-react';
import { Deck } from '../types/deck';
import DeckViewer from './DeckViewer';
import { useI18n } from '../i18n/context';

interface DeckManagerProps {
  onCreateDeck: () => void;
  onEditDeck: (deck: Deck) => void;
}

export default function DeckManager({ onCreateDeck, onEditDeck }: DeckManagerProps) {
  const { t } = useI18n();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [formatFilter, setFormatFilter] = useState<'All' | 'Standard' | 'Expanded' | 'Unlimited'>('All');
  const [sortBy, setSortBy] = useState<'name' | 'updated' | 'created' | 'cards'>('updated');
  const [viewingDeck, setViewingDeck] = useState<Deck | null>(null);

  useEffect(() => {
    loadDecks();
  }, []);

  const loadDecks = async () => {
    try {
      const response = await fetch('/api/decks');
      if (response.ok) {
        const serverDecks = await response.json();
        setDecks(serverDecks);
      } else {
        console.error('Failed to load decks from server');
        // Fallback to localStorage
        if (typeof window !== 'undefined') {
          const savedDecks = JSON.parse(localStorage.getItem('ptcg_decks') || '[]');
          setDecks(savedDecks);
        }
      }
    } catch (error) {
      console.error('Error loading decks:', error);
      // Fallback to localStorage
      if (typeof window !== 'undefined') {
        const savedDecks = JSON.parse(localStorage.getItem('ptcg_decks') || '[]');
        setDecks(savedDecks);
      }
    }
  };

  const deleteDeck = async (deckId: string) => {
    if (typeof window === 'undefined') return;
    if (confirm('Are you sure you want to delete this deck?')) {
      try {
        const response = await fetch(`/api/decks?id=${deckId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          // Remove from local state
          const updatedDecks = decks.filter(deck => deck.id !== deckId);
          setDecks(updatedDecks);
        } else {
          console.error('Failed to delete deck from server');
          // Fallback to local deletion
          const updatedDecks = decks.filter(deck => deck.id !== deckId);
          setDecks(updatedDecks);
          localStorage.setItem('ptcg_decks', JSON.stringify(updatedDecks));
        }
      } catch (error) {
        console.error('Error deleting deck:', error);
        // Fallback to local deletion
        const updatedDecks = decks.filter(deck => deck.id !== deckId);
        setDecks(updatedDecks);
        localStorage.setItem('ptcg_decks', JSON.stringify(updatedDecks));
      }
    }
  };

  const duplicateDeck = (deck: Deck) => {
    if (typeof window === 'undefined') return;
    const newDeck = {
      ...deck,
      id: `deck_${Date.now()}`,
      name: `${deck.name} (Copy)`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const updatedDecks = [...decks, newDeck];
    setDecks(updatedDecks);
    localStorage.setItem('ptcg_decks', JSON.stringify(updatedDecks));
  };

  const exportDeck = (deck: Deck) => {
    const deckText = generateDeckList(deck);
    const blob = new Blob([deckText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${deck.name}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateDeckList = (deck: Deck): string => {
    let deckList = `${deck.name}\n`;
    deckList += `Format: ${deck.format}\n`;
    deckList += `Total Cards: ${deck.totalCards}\n\n`;

    const pokemonCards = deck.cards.filter(card => card.CardType.includes('寶可夢') || card.CardType.toLowerCase().includes('pokemon'));
    const trainerCards = deck.cards.filter(card => card.CardType.includes('物品') || card.CardType.includes('支援') || card.CardType.includes('場地'));
    const energyCards = deck.cards.filter(card => card.CardType.includes('能量'));

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

  const filteredDecks = decks
    .filter(deck => {
      // Search filter
      if (searchTerm && !deck.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !deck.description.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Format filter
      if (formatFilter !== 'All' && deck.format !== formatFilter) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'cards':
          return b.totalCards - a.totalCards;
        case 'updated':
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.deckManager}</h1>
          <p className="text-gray-600">{t.manageDecks}</p>
        </div>
        <button
          onClick={onCreateDeck}
          className="flex items-center space-x-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>{t.createNewDeck}</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder={t.searchDecks}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={formatFilter}
          onChange={(e) => setFormatFilter(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="All">{t.allFormats}</option>
          <option value="Standard">{t.standard}</option>
          <option value="Expanded">{t.expanded}</option>
          <option value="Unlimited">{t.unlimited}</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="updated">{t.lastUpdated}</option>
          <option value="created">{t.dateCreated}</option>
          <option value="name">{t.cardName}</option>
          <option value="cards">{t.cardCount}</option>
        </select>
      </div>

      {/* Deck Grid */}
      {filteredDecks.length === 0 ? (
        <div className="text-center py-12">
          <div className="mb-4">
            <Sword className="h-16 w-16 text-gray-300 mx-auto" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">{t.noDecksFound}</h3>
          <p className="text-gray-600 mb-6">
            {decks.length === 0 
              ? t.noDecksYet
              : t.noMatchingDecks}
          </p>
          {decks.length === 0 && (
            <button
              onClick={onCreateDeck}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              {t.createFirstDeck}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDecks.map(deck => (
            <DeckCard
              key={deck.id}
              deck={deck}
              onEdit={() => onEditDeck(deck)}
              onView={() => setViewingDeck(deck)}
              onDelete={() => deleteDeck(deck.id)}
              onDuplicate={() => duplicateDeck(deck)}
              onExport={() => exportDeck(deck)}
            />
          ))}
        </div>
      )}

      {/* Deck Viewer Modal */}
      {viewingDeck && (
        <DeckViewer
          deck={viewingDeck}
          onClose={() => setViewingDeck(null)}
          onEdit={() => {
            setViewingDeck(null);
            onEditDeck(viewingDeck);
          }}
        />
      )}
    </div>
  );
}

interface DeckCardProps {
  deck: Deck;
  onEdit: () => void;
  onView: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onExport: () => void;
}

function DeckCard({ deck, onEdit, onView, onDelete, onDuplicate, onExport }: DeckCardProps) {
  const { t } = useI18n();
  const formatColor = {
    'Standard': 'bg-blue-100 text-blue-800',
    'Expanded': 'bg-green-100 text-green-800',
    'Unlimited': 'bg-purple-100 text-purple-800'
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-xl font-bold text-gray-900 line-clamp-2">{deck.name}</h3>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${formatColor[deck.format]}`}>
            {deck.format}
          </span>
        </div>
        {deck.description && (
          <p className="text-gray-600 text-sm line-clamp-2 mb-3">{deck.description}</p>
        )}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{new Date(deck.updatedAt).toLocaleDateString()}</span>
          <div className="flex items-center space-x-1">
            {deck.isValid ? (
              <div className="flex items-center space-x-1 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>{t.valid}</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1 text-red-600">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>{t.invalid}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Deck Composition */}
      <div className="p-4 bg-gray-50">
        <div className="grid grid-cols-3 gap-4 text-center mb-4">
          <div>
            <div className="flex items-center justify-center space-x-1 mb-1">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span className="text-xs text-gray-600">{t.pokemon}</span>
            </div>
            <div className="font-bold text-lg">{deck.pokemonCount}</div>
          </div>
          <div>
            <div className="flex items-center justify-center space-x-1 mb-1">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-xs text-gray-600">{t.trainer}</span>
            </div>
            <div className="font-bold text-lg">{deck.trainerCount}</div>
          </div>
          <div>
            <div className="flex items-center justify-center space-x-1 mb-1">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span className="text-xs text-gray-600">{t.energy}</span>
            </div>
            <div className="font-bold text-lg">{deck.energyCount}</div>
          </div>
        </div>
        <div className="text-center">
          <span className="text-lg font-bold text-gray-900">{deck.totalCards}/60</span>
          <span className="text-sm text-gray-600"> {t.cards}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-gray-100">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onView}
            className="flex items-center justify-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Eye className="h-4 w-4" />
            <span className="text-sm">{t.view}</span>
          </button>
          <button
            onClick={onEdit}
            className="flex items-center justify-center space-x-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Edit className="h-4 w-4" />
            <span className="text-sm">{t.edit}</span>
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-2">
          <button
            onClick={onDuplicate}
            className="flex items-center justify-center px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
            title={t.duplicate}
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            onClick={onExport}
            className="flex items-center justify-center px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
            title={t.exportDeck}
          >
            <Download className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            className="flex items-center justify-center px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
            title={t.delete}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}