'use client';

import React from 'react';
import { useInventory } from '../hooks/useInventory';
import { Package, Plus } from 'lucide-react';

interface InventoryButtonProps {
  cardId: number;
  onOpenInventory?: () => void;
  compact?: boolean;
}

export default function InventoryButton({ 
  cardId, 
  onOpenInventory, 
  compact = false 
}: InventoryButtonProps) {
  const { getTotalQuantity, isCardOwned } = useInventory();
  
  const totalQuantity = getTotalQuantity(cardId);
  const isOwned = isCardOwned(cardId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onOpenInventory?.();
  };

  if (compact) {
    return (
      <button
        onClick={handleClick}
        className={`p-2 rounded-lg transition-colors shadow-lg border-2 ${
          isOwned
            ? 'bg-green-600 text-white border-green-400'
            : 'bg-red-500 text-white border-red-300 hover:bg-red-600'
        }`}
        title={isOwned ? `Owned: ${totalQuantity}` : 'Add to inventory'}
        style={{ minWidth: '32px', minHeight: '32px' }}
      >
        {isOwned ? (
          <div className="flex items-center space-x-1">
            <Package className="w-3 h-3" />
            <span className="text-xs font-bold">{totalQuantity}</span>
          </div>
        ) : (
          <Plus className="w-3 h-3" />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
        isOwned
          ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
          : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
      }`}
    >
      <Package className="w-4 h-4" />
      <span className="text-sm font-medium">
        {isOwned ? `Owned: ${totalQuantity}` : 'Add to Inventory'}
      </span>
    </button>
  );
}