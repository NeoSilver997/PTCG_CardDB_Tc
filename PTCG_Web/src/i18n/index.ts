// Internationalization utility
export type SupportedLanguage = 'en' | 'zh' | 'zh-tw';

export interface TranslationStrings {
  // Common
  loading: string;
  error: string;
  close: string;
  cancel: string;
  save: string;
  delete: string;
  edit: string;
  view: string;
  clear: string;
  search: string;
  filters: string;
  all: string;
  none: string;
  
  // Card related
  cardName: string;
  cardType: string;
  rarity: string;
  tier: string;
  attribute: string;
  ability: string;
  effectType: string;
  hp: string;
  score: string;
  evolution: string;
  regulationMark: string;
  expansion: string;
  weaknessType: string;
  resistanceType: string;
  retreatCost: string;
  relatedCards: string;
  viewDetails: string;
  closeDetails: string;
  otherVersions: string;
  noCards: string;
  noCardsFound: string;
  cardsFound: string;
  
  // Deck related
  deckBuilder: string;
  deckManager: string;
  deckViewer: string;
  cardLibrary: string;
  currentDeck: string;
  deckName: string;
  deckDescription: string;
  saveDeck: string;
  loadDeck: string;
  clearDeck: string;
  createDeck: string;
  editDeck: string;
  deleteDeck: string;
  duplicateDeck: string;
  exportDeck: string;
  copyDeckCode: string;
  viewDeck: string;
  totalCards: string;
  pokemonCards: string;
  trainerCards: string;
  energyCards: string;
  format: string;
  noDecks: string;
  deckStats: string;
  createNewDeck: string;
  manageDecks: string;
  searchDecks: string;
  allFormats: string;
  lastUpdated: string;
  dateCreated: string;
  cardCount: string;
  noDecksFound: string;
  noDecksYet: string;
  noMatchingDecks: string;
  createFirstDeck: string;
  valid: string;
  invalid: string;
  duplicate: string;
  
  // Filter options
  allAbilities: string;
  allEffectTypes: string;
  allCardTypes: string;
  allRarities: string;
  allTiers: string;
  allAttributes: string;
  allRegulations: string;
  allExpansions: string;
  allWeaknessTypes: string;
  allResistanceTypes: string;
  ownershipStatus: string;
  allCards: string;
  ownedOnly: string;
  unownedOnly: string;
  priceRange: string;
  allPrices: string;
  underTen: string;
  tenToFifty: string;
  overFifty: string;
  noPriceData: string;
  
  // Actions
  add: string;
  remove: string;
  addToDeck: string;
  removeFromDeck: string;
  quantity: string;
  
  // Messages
  enterDeckName: string;
  saveSuccess: string;
  saveFail: string;
  saveError: string;
  deleteConfirm: string;
  
  // Inventory
  inventory: string;
  myInventory: string;
  inventoryManager: string;
  addToInventory: string;
  removeFromInventory: string;
  manageInventory: string;
  inventoryEmpty: string;
  inventoryStats: string;
  totalOwned: string;
  uniqueCards: string;
  inventoryValue: string;
  condition: string;
  notes: string;
  dateAdded: string;
  
  // Navigation
  cardSearch: string;
  results: string;
  home: string;
  cards: string;
  decks: string;
  settings: string;
  nav: {
    home: string;
    deckBuilder: string;
    inventory: string;
    market: string;
  };
  
  // Deck formats
  standard: string;
  expanded: string;
  unlimited: string;
  
  // Card types (for display)
  pokemon: string;
  trainer: string;
  energy: string;
  basic: string;
  stage1: string;
  stage2: string;
  
  // Special features
  noRetreat: string;
  noResistance: string;
  noWeakness: string;
  specialPokemonType: string;
  
  // Misc
  created: string;
  updated: string;
  sortBy: string;
  searchPlaceholder: string;
  adjustFilters: string;
  tryAdjusting: string;
}