// Example: Creating a deck with the found card IDs
const deckData = {
  name: 'Charcadet Evolution Deck',
  description: 'A deck featuring multiple Charcadet cards and powerful Pokemon',
  cards: [
    { CardID: '12096', Name: '炭小侍', CardType: '寶可夢', quantity: 1 },
    { CardID: '11995', Name: '炭小侍', CardType: '寶可夢', quantity: 1 },
    { CardID: '10147', Name: '炭小侍', CardType: '寶可夢', quantity: 1 },
    { CardID: '12195', Name: '炭小侍', CardType: '寶可夢', quantity: 1 },
    { CardID: '14360', Name: '布魯皇', CardType: '寶可夢', quantity: 1 },
    { CardID: '14361', Name: '拉帝亞斯ex', CardType: '寶可夢', quantity: 1 }
  ],
  format: 'Standard'
};

// API call example:
// POST /api/decks
// Body: JSON.stringify(deckData)

export { deckData };