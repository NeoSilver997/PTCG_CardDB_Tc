import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import '@testing-library/jest-dom';
import Home from '../page';

// Mock the fetch API
global.fetch = jest.fn();

const mockCards = [
  {
    CardID: '1',
    Name: '六尾',
    CardType: '基本寶可夢',
    Type: '火',
    Rarity: 'Common',
    Tier: '1',
    AbilityStats: '火焰',
    PrimaryEffectType: '攻擊',
    SpecialEffectType: '無',
    Skill1Effect: '火球攻擊',
    Skill2Effect: '',
    AbilityEffect: '火焰能力'
  },
  {
    CardID: '2',
    Name: '基本火能量',
    CardType: '基本能量',
    Type: '火',
    Rarity: 'Common',
    Tier: 'N/A',
    AbilityStats: '無',
    PrimaryEffectType: '無',
    SpecialEffectType: '無',
    Skill1Effect: '',
    Skill2Effect: '',
    AbilityEffect: ''
  },
  {
    CardID: '3',
    Name: '基本水能量',
    CardType: '基本能量',
    Type: '水',
    Rarity: 'Common',
    Tier: 'N/A',
    AbilityStats: '無',
    PrimaryEffectType: '無',
    SpecialEffectType: '無',
    Skill1Effect: '',
    Skill2Effect: '',
    AbilityEffect: ''
  }
];

describe('Home Component', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockResolvedValue({
      json: jest.fn().mockResolvedValue(mockCards)
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders loading state initially', () => {
    render(<Home />);
    expect(screen.getByText('Loading PTCG cards...')).toBeInTheDocument();
  });

  test('loads and displays cards', async () => {
    await act(async () => {
      render(<Home />);
    });

    await waitFor(() => {
      expect(screen.getByText('六尾')).toBeInTheDocument();
    });

    // Should not display energy cards
    expect(screen.queryByText('基本火能量')).not.toBeInTheDocument();
    expect(screen.queryByText('基本水能量')).not.toBeInTheDocument();
  });

  test('filters cards by search term and excludes energy cards', async () => {
    await act(async () => {
      render(<Home />);
    });

    await waitFor(() => {
      expect(screen.getByText('六尾')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search cards by name, ability, or effect...');
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: '六尾' } });
    });

    await waitFor(() => {
      expect(screen.getByText('六尾')).toBeInTheDocument();
      expect(screen.queryByText('基本火能量')).not.toBeInTheDocument();
      expect(screen.queryByText('基本水能量')).not.toBeInTheDocument();
    });
  });

  test('displays correct card count excluding energy cards', async () => {
    await act(async () => {
      render(<Home />);
    });

    await waitFor(() => {
      expect(screen.getByText('六尾')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search cards by name, ability, or effect...');
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: '六尾' } });
    });

    await waitFor(() => {
      // Should show 1 card found (only 六尾, excluding energy cards)
      expect(screen.getByText('1 cards found')).toBeInTheDocument();
    });
  });
});