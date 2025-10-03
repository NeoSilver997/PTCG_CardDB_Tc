import { render, screen, waitFor } from '../../test-utils/test-utils';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import Home from '../page';

// Mock the fetch API
global.fetch = jest.fn();

const mockCardsResponsePage1 = {
  cards: [
    { CardID: 1, Name: 'Pikachu', CardType: 'Pokémon' },
    { CardID: 2, Name: 'Charizard', CardType: 'Pokémon' },
  ],
  total: 2,
  page: 1,
  limit: 50,
};

const mockEmptyCardsResponse = {
  cards: [],
  total: 0,
  page: 1,
  limit: 50,
};

const mockFiltersResponse = {
  abilities: [{ value: 'Static', label: 'Static', count: 1 }],
  effectTypes: [{ value: 'Attack', label: 'Attack', count: 1 }],
  cardTypes: [{ value: 'Pokémon', label: 'Pokémon' }],
  rarities: [{ value: 'Rare', label: 'Rare' }],
  tiers: [{ value: 'S', label: 'S' }],
  attributes: [{ value: 'Lightning', label: 'Lightning' }],
  regulations: [{ value: 'F', label: 'F' }],
  expansions: [{ value: 'Base Set|BS', label: 'Base Set (BS)' }],
  weaknessTypes: [{ value: 'Fighting', label: 'Fighting' }],
  resistanceTypes: [{ value: 'Metal', label: 'Metal' }],
};

describe('Home Component', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      const urlObj = new URL(url, 'http://localhost');
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
        if (urlObj.searchParams.get('searchTerm') === 'notfound') {
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve(mockEmptyCardsResponse),
            });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCardsResponsePage1),
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

    const resultsDisplay = screen.getAllByText(`${mockCardsResponsePage1.total} Results`);
    expect(resultsDisplay.length).toBeGreaterThan(0);
  });

  test('refetches cards when search term is changed', async () => {
    const user = userEvent.setup();
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('Pikachu')).toBeInTheDocument();
    });

    (global.fetch as jest.Mock).mockClear();

     (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/cards')) {
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ cards: [{ CardID: 1, Name: 'Pikachu', CardType: 'Pokémon' }], total: 1, page: 1, limit: 50 }),
            });
        }
        if (url.includes('/api/market-prices') || url.includes('/api/cards/filters')) {
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve({}),
            });
          }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });


    const searchInput = screen.getByPlaceholderText(/search cards by name/i);
    await user.type(searchInput, 'Pikachu');

    await waitFor(() => {
      const fetchCalls = (global.fetch as jest.Mock).mock.calls;
      const lastCardsApiCall = fetchCalls.filter(call => call[0].includes('/api/cards')).pop();
      expect(lastCardsApiCall[0]).toContain('searchTerm=Pikachu');
    });
  });

  test('refetches cards when a filter is changed', async () => {
    const user = userEvent.setup();
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('Pikachu')).toBeInTheDocument();
    });

    (global.fetch as jest.Mock).mockClear();

    const rarityFilter = screen.getByLabelText('Rarity');
    await user.selectOptions(rarityFilter, 'Rare');

    await waitFor(() => {
      const fetchCalls = (global.fetch as jest.Mock).mock.calls;
      const cardsApiCall = fetchCalls.find(call => call[0].includes('/api/cards'));
      expect(cardsApiCall[0]).toContain('rarity=Rare');
    });
  });
});