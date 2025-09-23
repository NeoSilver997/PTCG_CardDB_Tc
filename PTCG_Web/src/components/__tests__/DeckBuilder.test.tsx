import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import '@testing-library/jest-dom';
import DeckBuilder from '../DeckBuilder';

// Mock data for testing
const mockCards = [
  {
    Name: 'Charizard V',
    Evolution: 'Charizard',
    EvolutionStage: 'Basic',
    CardID: 1,
    ImageURL: '/cards/charizard-v.png',
    OriginalImageURL: '/cards/charizard-v-original.png',
    CardType: '寶可夢',
    HP: '210',
    Type: '火',
    Weakness: '水',
    WeaknessType: '水',
    Resistance: '',
    ResistanceType: '',
    Skill1Name: 'Fire Spin',
    Skill1Energy: '火火無',
    Skill1Damage: '50',
    Skill1Effect: 'Discard 2 Energy from this Pokemon',
    Skill2Name: 'Flare Blitz',
    Skill2Energy: '火火火無',
    Skill2Damage: '150',
    Skill2Effect: 'This Pokemon also does 50 damage to itself',
    AbilityName: 'Battle Sense',
    AbilityEffect: 'Once during your turn, you may look at the top 3 cards of your deck',
    RetreatCost: '3',
    Illustrator: 'Mitsuhiro Arita',
    Rarity: 'Rare Holo',
    ExpansionCode: 'SWSH1',
    ExpansionName: 'Sword & Shield Base Set',
    CollectorNumber: '020/202',
    RegulationMark: 'D',
    Artist: 'Mitsuhiro Arita',
    SpecialTag: '',
    PrimaryEffectType: '攻擊',
    SpecialEffectType: '無',
    AbilityStats: '火焰',
    Tier: 'S'
  },
  {
    Name: 'Professor\'s Research',
    Evolution: '',
    EvolutionStage: '',
    CardID: 2,
    ImageURL: '/cards/professors-research.png',
    OriginalImageURL: '/cards/professors-research-original.png',
    CardType: '訓練家',
    HP: '',
    Type: '無',
    Weakness: '',
    WeaknessType: '',
    Resistance: '',
    ResistanceType: '',
    Skill1Name: '',
    Skill1Energy: '',
    Skill1Damage: '',
    Skill1Effect: '',
    Skill2Name: '',
    Skill2Energy: '',
    Skill2Damage: '',
    Skill2Effect: '',
    AbilityName: '',
    AbilityEffect: 'Discard your hand and draw 7 cards',
    RetreatCost: '',
    Illustrator: 'Hideki Ishikawa',
    Rarity: 'Uncommon',
    ExpansionCode: 'SWSH1',
    ExpansionName: 'Sword & Shield Base Set',
    CollectorNumber: '178/202',
    RegulationMark: 'D',
    Artist: 'Hideki Ishikawa',
    SpecialTag: '',
    PrimaryEffectType: '支援',
    SpecialEffectType: '無',
    AbilityStats: '無',
    Tier: 'N/A'
  },
  {
    Name: 'Fire Energy',
    Evolution: '',
    EvolutionStage: '',
    CardID: 3,
    ImageURL: '/cards/fire-energy.png',
    OriginalImageURL: '/cards/fire-energy-original.png',
    CardType: '基本能量',
    HP: '',
    Type: '火',
    Weakness: '',
    WeaknessType: '',
    Resistance: '',
    ResistanceType: '',
    Skill1Name: '',
    Skill1Energy: '',
    Skill1Damage: '',
    Skill1Effect: '',
    Skill2Name: '',
    Skill2Energy: '',
    Skill2Damage: '',
    Skill2Effect: '',
    AbilityName: '',
    AbilityEffect: '',
    RetreatCost: '',
    Illustrator: '',
    Rarity: 'Common',
    ExpansionCode: 'SWSH1',
    ExpansionName: 'Sword & Shield Base Set',
    CollectorNumber: '009/202',
    RegulationMark: 'D',
    Artist: '',
    SpecialTag: '',
    PrimaryEffectType: '無',
    SpecialEffectType: '無',
    AbilityStats: '無',
    Tier: 'N/A'
  },
  {
    Name: '炭小侍',
    Evolution: 'Charcoal Servant',
    EvolutionStage: 'Basic',
    CardID: 4,
    ImageURL: '/cards/charcoal-servant.png',
    OriginalImageURL: '/cards/charcoal-servant-original.png',
    CardType: '寶可夢',
    HP: '70',
    Type: '火',
    Weakness: '水',
    WeaknessType: '水',
    Resistance: '',
    ResistanceType: '',
    Skill1Name: 'Fire Fang',
    Skill1Energy: '火無',
    Skill1Damage: '20',
    Skill1Effect: 'Flip a coin. If heads, discard an Energy from your opponent\'s Active Pokemon',
    Skill2Name: '',
    Skill2Energy: '',
    Skill2Damage: '',
    Skill2Effect: '',
    AbilityName: 'Charcoal Burn',
    AbilityEffect: 'Once during your turn, you may discard a Fire Energy from your hand. If you do, draw 2 cards',
    RetreatCost: '1',
    Illustrator: 'Mizue',
    Rarity: 'Common',
    ExpansionCode: 'SWSH4',
    ExpansionName: 'Vivid Voltage',
    CollectorNumber: '096/185',
    RegulationMark: 'E',
    Artist: 'Mizue',
    SpecialTag: '',
    PrimaryEffectType: '支援',
    SpecialEffectType: '無',
    AbilityStats: '火焰',
    Tier: '2'
  }
];

// Mock window.alert
const mockAlert = jest.fn();
global.alert = mockAlert;

// Mock console.error
const mockConsoleError = jest.fn();
global.console.error = mockConsoleError;

describe('DeckBuilder Import Functionality', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders import modal when import button is clicked', async () => {
    render(<DeckBuilder initialCards={mockCards} onClose={mockOnClose} />);

    // Click the import button (upload icon) - find by title attribute
    const importButton = screen.getByTitle('Import Deck');
    fireEvent.click(importButton);

    // Check if import modal is displayed - look for the modal header
    expect(screen.getByRole('heading', { name: 'Import Deck' })).toBeInTheDocument();
    expect(screen.getByText('Paste your deck list below')).toBeInTheDocument();
  });

  test('imports deck with English format successfully', async () => {
    const englishDeckList = `Fire Deck
Format: Standard

Pokemon (20):
4x Charizard V
3x Professor's Research
2x Fire Energy

Trainers (15):
4x Professor's Research

Energy (25):
10x Fire Energy`;

    render(<DeckBuilder initialCards={mockCards} onClose={mockOnClose} />);

    // Open import modal
    const importButton = screen.getByTitle('Import Deck');
    fireEvent.click(importButton);

    // Get the textarea and paste the deck list
    const textarea = screen.getByPlaceholderText(/Example formats supported/i);
    fireEvent.change(textarea, { target: { value: englishDeckList } });

    // Click import button - find the one in the modal (second one)
    const importDeckButtons = screen.getAllByRole('button', { name: 'Import Deck' });
    fireEvent.click(importDeckButtons[1]);

    // Wait for the import to complete and check the alert
    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith(
        expect.stringContaining('Deck imported successfully!')
      );
    });
  });

  test('imports deck with Chinese format successfully', async () => {
    const chineseDeckList = `火系牌組

寶可夢 (20):
炭小侍 3張
紅蓮鎧騎 2張

訓練家 (15):
博士的研究（大木博士） 4張

能量 (25):
基本火能量 6張`;

    render(<DeckBuilder initialCards={mockCards} onClose={mockOnClose} />);

    // Open import modal
    const importButton = screen.getByTitle('Import Deck');
    fireEvent.click(importButton);

    // Get the textarea and paste the deck list
    const textarea = screen.getByPlaceholderText(/Example formats supported/i);
    fireEvent.change(textarea, { target: { value: chineseDeckList } });

    // Click import button - find the one in the modal (second one)
    const importDeckButtons = screen.getAllByRole('button', { name: 'Import Deck' });
    fireEvent.click(importDeckButtons[1]);

    // Wait for the import to complete and check the alert
    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith(
        expect.stringContaining('Deck imported successfully!')
      );
    });
  });

  test('removes brackets from card names during import', async () => {
    // Add a card with brackets to the mock data
    const mockCardsWithBrackets = [
      ...mockCards,
      {
        Name: '基本火能量', // This should match "基本【火】能量" after bracket removal
        Evolution: '',
        EvolutionStage: '',
        CardID: 5,
        ImageURL: '/cards/fire-energy.png',
        OriginalImageURL: '/cards/fire-energy-original.png',
        CardType: '能量',
        HP: '',
        Type: '火',
        Weakness: '',
        WeaknessType: '',
        Resistance: '',
        ResistanceType: '',
        Skill1Name: '',
        Skill1Energy: '',
        Skill1Damage: '',
        Skill1Effect: '',
        Skill2Name: '',
        Skill2Energy: '',
        Skill2Damage: '',
        Skill2Effect: '',
        AbilityName: '',
        AbilityEffect: '',
        RetreatCost: '',
        Illustrator: '',
        Rarity: 'Common',
        ExpansionCode: 'BASE',
        ExpansionName: 'Base Set',
        CollectorNumber: '098/102',
        RegulationMark: 'A',
        Artist: '',
        SpecialTag: '',
        PrimaryEffectType: '',
        SpecialEffectType: '',
        AbilityStats: '',
        Tier: 'C'
      }
    ];

    const deckWithBrackets = `Test Deck

能量 (25):
基本【火】能量 6張`;

    render(<DeckBuilder initialCards={mockCardsWithBrackets} onClose={mockOnClose} />);

    // Open import modal
    const importButton = screen.getByTitle('Import Deck');
    fireEvent.click(importButton);

    // Get the textarea and paste the deck list
    const textarea = screen.getByPlaceholderText(/Example formats supported/i);
    fireEvent.change(textarea, { target: { value: deckWithBrackets } });

    // Click import button - find the one in the modal (second one)
    const importDeckButtons = screen.getAllByRole('button', { name: 'Import Deck' });
    fireEvent.click(importDeckButtons[1]);

    // Wait for the import to complete and check the alert
    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith(
        expect.stringContaining('Deck imported successfully!')
      );
    });
  });

  test('handles unmatched cards gracefully', async () => {
    const deckWithUnmatchedCards = `Test Deck

Pokemon (20):
4x NonExistent Card
2x Charizard V`;

    render(<DeckBuilder initialCards={mockCards} onClose={mockOnClose} />);

    // Open import modal
    const importButton = screen.getByTitle('Import Deck');
    fireEvent.click(importButton);

    // Get the textarea and paste the deck list
    const textarea = screen.getByPlaceholderText(/Example formats supported/i);
    fireEvent.change(textarea, { target: { value: deckWithUnmatchedCards } });

    // Click import button - find the one in the modal (second one)
    const importDeckButtons = screen.getAllByRole('button', { name: 'Import Deck' });
    fireEvent.click(importDeckButtons[1]);

    // Wait for the import to complete and check the alert shows unmatched cards
    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith(
        expect.stringContaining('Unmatched cards:')
      );
    });
  });

  test('handles empty deck list', async () => {
    render(<DeckBuilder initialCards={mockCards} onClose={mockOnClose} />);

    // Open import modal
    const importButton = screen.getByTitle('Import Deck');
    fireEvent.click(importButton);

    // Click import button without entering any text - find the one in the modal (second one)
    const importDeckButtons = screen.getAllByRole('button', { name: 'Import Deck' });
    fireEvent.click(importDeckButtons[1]);

    // Should show alert asking for deck list
    expect(mockAlert).toHaveBeenCalledWith('Please paste a deck list to import.');
  });

  test('handles parsing errors gracefully', async () => {
    const invalidDeckList = `Invalid Format
This is not a valid deck list format at all!`;

    render(<DeckBuilder initialCards={mockCards} onClose={mockOnClose} />);

    // Open import modal
    const importButton = screen.getByTitle('Import Deck');
    fireEvent.click(importButton);

    // Get the textarea and paste invalid content
    const textarea = screen.getByPlaceholderText(/Example formats supported/i);
    fireEvent.change(textarea, { target: { value: invalidDeckList } });

    // Click import button - find the one in the modal (second one)
    const importDeckButtons = screen.getAllByRole('button', { name: 'Import Deck' });
    fireEvent.click(importDeckButtons[1]);

    // Should handle the error gracefully
    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith(
        expect.stringContaining('Deck imported successfully!')
      );
    });
  });

  test('closes import modal when cancel is clicked', () => {
    render(<DeckBuilder initialCards={mockCards} onClose={mockOnClose} />);

    // Open import modal
    const importButton = screen.getByTitle('Import Deck');
    fireEvent.click(importButton);

    // Verify modal is open
    expect(screen.getByRole('heading', { name: 'Import Deck' })).toBeInTheDocument();

    // Click cancel button
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelButton);

    // Modal should be closed
    expect(screen.queryByRole('heading', { name: 'Import Deck' })).not.toBeInTheDocument();
  });

  test('closes import modal when X button is clicked', () => {
    render(<DeckBuilder initialCards={mockCards} onClose={mockOnClose} />);

    // Open import modal
    const importButton = screen.getByTitle('Import Deck');
    fireEvent.click(importButton);

    // Verify modal is open
    expect(screen.getByRole('heading', { name: 'Import Deck' })).toBeInTheDocument();

    // Click X button - find the close button in the modal header (should be the first button after opening modal)
    const allButtons = screen.getAllByRole('button');
    // The X button is typically the button with hover:bg-gray-100 class in the modal header
    const xButton = allButtons.find(button => 
      button.className.includes('hover:bg-gray-100') && 
      button.closest('[class*="fixed"][class*="inset-0"]') // Make sure it's in the modal
    );
    if (xButton) {
      fireEvent.click(xButton);
    }

    // Modal should be closed
    expect(screen.queryByRole('heading', { name: 'Import Deck' })).not.toBeInTheDocument();
  });
});