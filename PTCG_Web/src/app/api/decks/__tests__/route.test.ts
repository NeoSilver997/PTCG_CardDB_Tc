// Mock the file system
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
}));

jest.mock('path', () => ({
  join: jest.fn(),
}));

// Mock NextRequest and NextResponse
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn(),
  },
}));

import { POST, GET, DELETE } from '../route';

import * as fs from 'fs';
import * as path from 'path';

const mockFs = fs as jest.Mocked<typeof fs>;
const mockPath = path as jest.Mocked<typeof path>;
const mockNextResponse = require('next/server').NextResponse;

describe('/api/decks', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset mocks
    mockNextResponse.json.mockReset();

    // Mock path.join to return a test file path
    mockPath.join.mockReturnValue('/test/data/decks.json');

    // Mock fs.existsSync
    mockFs.existsSync.mockReturnValue(true);

    // Mock fs.mkdirSync
    mockFs.mkdirSync.mockImplementation(() => undefined);

    // Mock process.cwd
    jest.spyOn(process, 'cwd').mockReturnValue('/test');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('POST /api/decks - Deck Creation', () => {
    it('should create a new deck with auto-generated ID', async () => {
      // Mock empty decks file
      mockFs.readFileSync.mockReturnValue(JSON.stringify([]));
      mockFs.writeFileSync.mockImplementation(() => undefined);

      // Mock NextRequest
      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          name: 'Test Fire Deck',
          description: 'A test deck for fire type Pokemon',
          cards: [
            {
              CardID: '1',
              Name: 'Charizard V',
              CardType: '寶可夢',
              quantity: 2
            },
            {
              CardID: '2',
              Name: 'Fire Energy',
              CardType: '能量',
              quantity: 10
            }
          ],
          format: 'Standard'
        })
      };

      await POST(mockRequest as any);

      // Verify NextResponse.json was called with correct deck data
      expect(mockNextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Fire Deck',
          description: 'A test deck for fire type Pokemon',
          cards: expect.any(Array),
          pokemonCount: 1,
          energyCount: 1,
          totalCards: 12,
          isValid: false,
          id: expect.stringMatching(/^deck_\d+_[a-z0-9]+$/),
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date)
        })
      );

      // Verify file was written
      expect(mockFs.writeFileSync).toHaveBeenCalled();
    });

    it('should create a deck with provided ID when it does not exist', async () => {
      mockFs.readFileSync.mockReturnValue(JSON.stringify([]));
      mockFs.writeFileSync.mockImplementation(() => undefined);

      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          id: 'custom-deck-123',
          name: 'Custom ID Deck',
          cards: [
            {
              CardID: '1',
              Name: 'Pikachu',
              CardType: '寶可夢',
              quantity: 4
            }
          ]
        })
      };

      await POST(mockRequest as any);

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'custom-deck-123',
          name: 'Custom ID Deck',
          totalCards: 4
        })
      );
    });

    it('should update existing deck when ID matches', async () => {
      const existingDeck = {
        id: 'existing-deck-123',
        name: 'Old Name',
        description: 'Old description',
        cards: [{ CardID: '1', Name: 'Old Card', CardType: '寶可夢', quantity: 1 }],
        format: 'Standard',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
        pokemonCount: 1,
        trainerCount: 0,
        energyCount: 0,
        totalCards: 1,
        isValid: false
      };

      mockFs.readFileSync.mockReturnValue(JSON.stringify([existingDeck]));
      mockFs.writeFileSync.mockImplementation(() => undefined);

      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          id: 'existing-deck-123',
          name: 'Updated Name',
          description: 'Updated description',
          cards: [
            { CardID: '1', Name: 'Old Card', CardType: '寶可夢', quantity: 2 },
            { CardID: '2', Name: 'New Card', CardType: '能量', quantity: 5 }
          ]
        })
      };

      await POST(mockRequest as any);

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'existing-deck-123',
          name: 'Updated Name',
          description: 'Updated description',
          totalCards: 7,
          pokemonCount: 1,
          energyCount: 1
        })
      );
    });

    it('should return error when name is missing', async () => {
      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          cards: []
        })
      };

      await POST(mockRequest as any);

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { error: 'Deck name and cards are required' },
        { status: 400 }
      );
    });

    it('should return error when cards are missing', async () => {
      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          name: 'Test Deck'
        })
      };

      await POST(mockRequest as any);

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { error: 'Deck name and cards are required' },
        { status: 400 }
      );
    });
  });

  describe('GET /api/decks - Deck Retrieval', () => {
    it('should return all decks', async () => {
      const mockDecks = [
        {
          id: 'deck-1',
          name: 'Deck 1',
          cards: [],
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
          pokemonCount: 0,
          trainerCount: 0,
          energyCount: 0,
          totalCards: 0,
          isValid: false
        }
      ];

      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockDecks));

      await GET();

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'deck-1',
            name: 'Deck 1'
          })
        ])
      );
    });

    it('should return empty array when no decks exist', async () => {
      mockFs.existsSync.mockReturnValue(false);

      await GET();

      expect(mockNextResponse.json).toHaveBeenCalledWith([]);
    });
  });

  describe('DELETE /api/decks - Deck Deletion', () => {
    it('should delete a deck successfully', async () => {
      const mockDecks = [
        {
          id: 'deck-1',
          name: 'Deck 1',
          cards: [],
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
          pokemonCount: 0,
          trainerCount: 0,
          energyCount: 0,
          totalCards: 0,
          isValid: false
        },
        {
          id: 'deck-2',
          name: 'Deck 2',
          cards: [],
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
          pokemonCount: 0,
          trainerCount: 0,
          energyCount: 0,
          totalCards: 0,
          isValid: false
        }
      ];

      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockDecks));
      mockFs.writeFileSync.mockImplementation(() => undefined);

      const mockRequest = {
        url: 'http://localhost:3000/api/decks?id=deck-1'
      };

      await DELETE(mockRequest as any);

      expect(mockNextResponse.json).toHaveBeenCalledWith({ success: true });

      // Verify writeFileSync was called to save the filtered decks
      expect(mockFs.writeFileSync).toHaveBeenCalled();
    });

    it('should return error when deck ID is not provided', async () => {
      const mockRequest = {
        url: 'http://localhost:3000/api/decks'
      };

      await DELETE(mockRequest as any);

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { error: 'Deck ID is required' },
        { status: 400 }
      );
    });

    it('should return error when deck does not exist', async () => {
      mockFs.readFileSync.mockReturnValue(JSON.stringify([]));

      const mockRequest = {
        url: 'http://localhost:3000/api/decks?id=non-existent'
      };

      await DELETE(mockRequest as any);

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { error: 'Deck not found' },
        { status: 404 }
      );
    });
  });
});