'use client';

import React, { useState } from 'react';
import { PTCGCard } from '../types/card';
import { InventoryCard, CARD_CONDITIONS } from '../types/inventory';
import { useInventory } from '../hooks/useInventory';
import { useI18n } from '../i18n/context';
import { Package, Plus, Minus, Edit2, Trash2, Save, X } from 'lucide-react';

interface InventoryManagerProps {
  card: PTCGCard;
  onClose: () => void;
}

export default function InventoryManager({ card, onClose }: InventoryManagerProps) {
  const { t } = useI18n();
  const { 
    getCardInventory, 
    addToInventory, 
    removeFromInventory, 
    loading,
    error
  } = useInventory();

  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState<number>(1);
  const [editCondition, setEditCondition] = useState<string>('near-mint');
  const [editNotes, setEditNotes] = useState<string>('');
  const [isAdding, setIsAdding] = useState(false);

  const cardInventory = getCardInventory(card.CardID);
  const totalQuantity = cardInventory.reduce((sum, item) => sum + item.quantity, 0);

  const handleAddNew = () => {
    setIsAdding(true);
    setEditQuantity(1);
    setEditCondition('near-mint');
    setEditNotes('');
  };

  const handleSaveNew = async () => {
    const success = await addToInventory(card.CardID, editQuantity, editCondition, editNotes);
    if (success) {
      setIsAdding(false);
    }
  };

  const handleEdit = (item: InventoryCard) => {
    setIsEditing(`${item.CardID}-${item.condition}`);
    setEditQuantity(item.quantity);
    setEditCondition(item.condition);
    setEditNotes(item.notes || '');
  };

  const handleSaveEdit = async (item: InventoryCard) => {
    const success = await addToInventory(card.CardID, editQuantity, editCondition, editNotes);
    if (success) {
      setIsEditing(null);
    }
  };

  const handleDelete = async (item: InventoryCard) => {
    if (confirm(t.deleteConfirm)) {
      await removeFromInventory(card.CardID, item.condition);
    }
  };

  const getConditionLabel = (condition: string) => {
    const conditionObj = CARD_CONDITIONS.find(c => c.value === condition);
    return conditionObj?.label || condition;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2">{t.loading}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Package className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold">{t.cardLibrary}</h2>
              <p className="text-sm text-gray-600">{card.Name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {/* Card Info */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-shrink-0">
              <img
                src={card.ImageURL}
                alt={card.Name}
                className="w-32 h-44 object-cover rounded-lg border"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder-card.png';
                }}
              />
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="text-lg font-semibold">{card.Name}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <p><span className="font-medium">{t.cardType}:</span> {card.CardType}</p>
                <p><span className="font-medium">{t.rarity}:</span> {card.Rarity}</p>
                <p><span className="font-medium">{t.expansion}:</span> {card.ExpansionName}</p>
                <p><span className="font-medium">ID:</span> {card.CardID}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-blue-800">
                  {t.totalCards}: {totalQuantity}
                </p>
              </div>
            </div>
          </div>

          {/* Inventory List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold">Inventory Details</h4>
              <button
                onClick={handleAddNew}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                <span>{t.add}</span>
              </button>
            </div>

            {/* Add New Form */}
            {isAdding && (
              <div className="bg-gray-50 p-4 rounded-lg border">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">{t.quantity}</label>
                    <input
                      type="number"
                      min="1"
                      value={editQuantity}
                      onChange={(e) => setEditQuantity(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Condition</label>
                    <select
                      value={editCondition}
                      onChange={(e) => setEditCondition(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      {CARD_CONDITIONS.map(condition => (
                        <option key={condition.value} value={condition.value}>
                          {condition.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2 lg:col-span-1">
                    <label className="block text-sm font-medium mb-1">Notes</label>
                    <input
                      type="text"
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="Optional notes..."
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div className="flex items-end space-x-2">
                    <button
                      onClick={handleSaveNew}
                      className="flex items-center space-x-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700"
                    >
                      <Save className="w-4 h-4" />
                      <span>{t.save}</span>
                    </button>
                    <button
                      onClick={() => setIsAdding(false)}
                      className="flex items-center space-x-1 bg-gray-500 text-white px-3 py-2 rounded-lg hover:bg-gray-600"
                    >
                      <X className="w-4 h-4" />
                      <span>{t.cancel}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Existing Inventory Items */}
            {cardInventory.length === 0 && !isAdding ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No cards in inventory</p>
                <p className="text-sm">Click "Add" to add this card to your inventory</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cardInventory.map((item) => {
                  const editKey = `${item.CardID}-${item.condition}`;
                  const isEditingThis = isEditing === editKey;

                  return (
                    <div key={editKey} className="bg-gray-50 p-4 rounded-lg border">
                      {isEditingThis ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">{t.quantity}</label>
                            <input
                              type="number"
                              min="1"
                              value={editQuantity}
                              onChange={(e) => setEditQuantity(parseInt(e.target.value) || 1)}
                              className="w-full px-3 py-2 border rounded-lg"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Condition</label>
                            <select
                              value={editCondition}
                              onChange={(e) => setEditCondition(e.target.value)}
                              className="w-full px-3 py-2 border rounded-lg"
                            >
                              {CARD_CONDITIONS.map(condition => (
                                <option key={condition.value} value={condition.value}>
                                  {condition.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Notes</label>
                            <input
                              type="text"
                              value={editNotes}
                              onChange={(e) => setEditNotes(e.target.value)}
                              className="w-full px-3 py-2 border rounded-lg"
                            />
                          </div>
                          <div className="flex items-end space-x-2">
                            <button
                              onClick={() => handleSaveEdit(item)}
                              className="flex items-center space-x-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setIsEditing(null)}
                              className="flex items-center space-x-1 bg-gray-500 text-white px-3 py-2 rounded-lg hover:bg-gray-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                              <p className="text-sm text-gray-600">{t.quantity}</p>
                              <p className="font-semibold">{item.quantity}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Condition</p>
                              <p className="font-semibold">{getConditionLabel(item.condition)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Notes</p>
                              <p className="text-sm">{item.notes || '—'}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEdit(item)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(item)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                      <div className="mt-2 text-xs text-gray-500">
                        Added: {new Date(item.dateAdded).toLocaleDateString()}
                        {item.lastUpdated !== item.dateAdded && (
                          <span> • Updated: {new Date(item.lastUpdated).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}