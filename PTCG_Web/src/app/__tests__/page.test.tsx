import { render, screen, waitFor } from '../../test-utils/test-utils';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import Home from '../page';

// Mock the fetch API
global.fetch = jest.fn();

// Mock the useInventory hook
jest.mock('../../hooks/useInventory', () => ({
  useInventory: () => ({
    inventory: {},
    addToInventory: jest.fn(),
    getCardInventory: jest.fn(() => ({})),
    getTotalQuantity: jest.fn(() => 0),
  }),
}));

const mockCards = [
  { CardID: 1, Name: 'Pikachu', CardType: 'Pokémon', Rarity: 'Common', ExpansionName: 'Base Set', ExpansionCode: 'BS' },
  { CardID: 2, Name: 'Charizard', CardType: 'Pokémon', Rarity: 'Rare', ExpansionName: 'Base Set', ExpansionCode: 'BS' },
  { CardID: 3, Name: 'Potion', CardType: 'Item', Rarity: 'Common', ExpansionName: 'Base Set', ExpansionCode: 'BS' },
];

const mockFiltersResponse = {
  abilities: [{ value: 'Static', label: 'Static', count: 1 }],
  effectTypes: [{ value: 'Attack', label: 'Attack', count: 1 }],
  cardTypes: [{ value: 'Pokémon', label: 'Pokémon' }, { value: 'Item', label: 'Item' }],
  rarities: [{ value: 'Common', label: 'Common' }, { value: 'Rare', label: 'Rare' }],
  tiers: [],
  attributes: [],
  regulations: [],
  expansions: [{ value: 'Base Set|BS', label: 'Base Set (BS)' }],
  weaknessTypes: [],
  resistanceTypes: [],
};

describe('Home Component', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/cards/filters')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockFiltersResponse),
        });
      }
      if (url.includes('/api/market-prices')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        });
      }
      if (url.includes('/api/cards')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCards),
        });
      }
      return Promise.reject(new Error(`Unhandled fetch request: ${url}`));
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders loading state initially and then displays cards', async () => {
    render(<Home />);
    expect(screen.getByText('Loading PTCG cards...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Pikachu')).toBeInTheDocument();
      expect(screen.getByText('Charizard')).toBeInTheDocument();
    });

    expect(screen.queryByText('Loading PTCG cards...')).not.toBeInTheDocument();
    expect(screen.getAllByText(/3 Results/i).length).toBeGreaterThan(0);
  });

  test('filters cards when search term is changed', async () => {
    const user = userEvent.setup();
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('Pikachu')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search cards by name/i);
    await user.type(searchInput, 'Pikachu');


    await waitFor(() => {
      expect(screen.getByText('Pikachu')).toBeInTheDocument();
      expect(screen.queryByText('Charizard')).not.toBeInTheDocument();
      expect(screen.queryByText('Potion')).not.toBeInTheDocument();
    });

    expect(screen.getAllByText(/1 Results/i).length).toBeGreaterThan(0);
  });

  test('filters cards when a filter is changed', async () => {
    const user = userEvent.setup();
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('Pikachu')).toBeInTheDocument();
    });

    const rarityFilter = await screen.findByLabelText('Rarity');
    await user.selectOptions(rarityFilter, 'Rare');

    act(() => {
        jest.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(screen.queryByText('Pikachu')).not.toBeInTheDocument();
      expect(screen.getByText('Charizard')).toBeInTheDocument();
      expect(screen.queryByText('Potion')).not.toBeInTheDocument();
    });

    expect(screen.getAllByText(/1 Results/i).length).toBeGreaterThan(0);
  });
});