'use client';

import React from 'react';
import { useInventory } from '../contexts/InventoryContext';
import { Package, Plus } from 'lucide-react';

interface InventoryButtonProps {
  cardId: number;
  onOpenInventory?: () => void;
  onAddToInventory?: (cardId: number) => Promise<boolean>;
  compact?: boolean;
}

export default function InventoryButton({ 
  cardId, 
  onOpenInventory, 
  onAddToInventory,
  compact = false 
}: InventoryButtonProps) {
  const { getTotalQuantity, isCardOwned } = useInventory();
  const [loading, setLoading] = React.useState(false);
  
  const totalQuantity = getTotalQuantity(cardId);
  const isOwned = isCardOwned(cardId);

  // Temporary debug display
  if (loading) {
    return <div className="text-xs text-gray-500">Loading...</div>;
  }

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isOwned) {
      // If already owned, open inventory details
      onOpenInventory?.();
    } else if (onAddToInventory) {
      // If not owned and we have add function, add to inventory
      setLoading(true);
      try {
        await onAddToInventory(cardId);
      } catch (error) {
        console.error('Failed to add to inventory:', error);
      } finally {
        setLoading(false);
      }
    } else {
      // Fallback to opening inventory if no add function provided
      onOpenInventory?.();
    }
  };

  if (compact) {
    return (
      <button
        onClick={handleClick}
        disabled={loading}
        className={`p-2 rounded-lg transition-colors shadow-lg border-2 ${
          isOwned
            ? 'bg-green-600 text-white border-green-400'
            : loading
            ? 'bg-gray-500 text-white border-gray-300'
            : 'bg-red-500 text-white border-red-300 hover:bg-red-600'
        }`}
        title={isOwned ? `Owned: ${totalQuantity}` : loading ? 'Adding...' : 'Add to inventory'}
        style={{ minWidth: '32px', minHeight: '32px' }}
      >
        {isOwned ? (
          <div className="flex items-center space-x-1">
            <Package className="w-3 h-3" />
            <span className="text-xs font-bold">{totalQuantity}</span>
          </div>
        ) : loading ? (
          <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <Plus className="w-3 h-3" />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
        isOwned
          ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
          : loading
          ? 'bg-gray-50 text-gray-400 border border-gray-200 cursor-not-allowed'
          : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
      }`}
    >
      <Package className="w-4 h-4" />
      <span className="text-sm font-medium">
        {loading ? 'Adding...' : isOwned ? `Owned: ${totalQuantity}` : 'Add to Inventory'}
      </span>
    </button>
  );
}