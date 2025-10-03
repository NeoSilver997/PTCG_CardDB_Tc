import '@testing-library/jest-dom'

// Mock the useInventory hook globally to avoid network errors in tests
jest.mock('./src/hooks/useInventory', () => ({
  useInventory: () => ({
    inventory: [],
    loading: false,
    error: null,
    addToInventory: jest.fn().mockResolvedValue(true),
    removeFromInventory: jest.fn().mockResolvedValue(true),
    getCardInventory: jest.fn(() => []),
    getTotalQuantity: jest.fn(() => 0),
    isCardOwned: jest.fn(() => false),
    getInventoryStats: jest.fn(() => ({
      totalCards: 0,
      uniqueCards: 0,
      totalPurchaseCost: 0,
      totalMarketValue: 0,
      totalProfit: 0,
      averageCardValue: 0,
    })),
    reloadInventory: jest.fn(),
  }),
}));