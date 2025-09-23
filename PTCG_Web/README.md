# Pokemon TCG Deck Builder

A comprehensive web application for building, managing, and analyzing Pokemon Trading Card Game (PTCG) decks with advanced search, import/export, and viewing capabilities.

## Features

- **Deck Building**: Intuitive drag-and-drop interface for creating custom decks
- **Advanced Search**: Search cards by name, ability, effect, or card type
- **Smart Filtering**: Filter by abilities, effect types, card types, rarity, tiers, and attributes
- **Import/Export**: Support for both English and Chinese deck list formats
- **Deck Management**: Create, edit, duplicate, and delete decks with local storage
- **Editable Deck Names**: Inline editing of deck names
- **Real-time Validation**: Automatic deck validation with error and warning feedback
- **Full-Screen Viewing**: Immersive deck viewing experience
- **Zoom-Out Mode**: Compact view showing all cards with quantities
- **Card Details**: Comprehensive card information with related cards discovery
- **Statistics Dashboard**: Detailed deck composition and performance analytics
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Technology Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Data Processing**: PapaParse for CSV handling
- **State Management**: React hooks with localStorage persistence
- **Testing**: Jest and React Testing Library

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ptcg-deck-builder
```

2. Install dependencies:
```bash
npm install
```

3. Place your card data CSV file in the parent directory:
```
cards_output_all_mega_with_effects_smart_merged_final_success_with_ability_stats_rated_with_damage.csv
```

4. Download card images locally (optional - images are included):
```bash
node download-images.js
```

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Local Images

The application uses local card images for offline functionality:

- **Image Storage**: Card images are stored in `public/cards/` directory
- **Automatic Download**: Run `node download-images.js` to download all card images locally
- **Fallback**: SVG placeholder is shown if an image is not available
- **Offline Support**: Application works completely offline once images are downloaded

### Image Download Script

The `download-images.js` script:
- Downloads 2,335+ card images from the official PTCG website
- Converts external URLs to local paths (`/cards/filename.png`)
- Includes error handling and progress reporting
- Respects server rate limits with delays between downloads

## Project Structure

```
src/
├── app/
│   ├── api/cards/route.ts        # API endpoint for card data
│   ├── deck-builder/page.tsx     # Deck builder and manager page
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Main landing page
├── components/
│   ├── DeckBuilder.tsx           # Main deck building interface
│   ├── DeckManager.tsx           # Deck management and listing
│   ├── DeckViewer.tsx            # Deck viewing with full-screen support
│   ├── CardDetailModal.tsx       # Card detail modal with related cards
│   ├── CardGrid.tsx              # Card grid display
│   ├── CardItem.tsx              # Individual card component
│   └── SearchFilters.tsx         # Search and filter controls
└── types/
    ├── card.ts                   # Card TypeScript interfaces
    └── deck.ts                   # Deck and validation types
```

## Card Data Format

The application expects a CSV file with the following columns:
- Name, Evolution, CardID, ImageURL
- CardType, HP, Type, Weakness, Resistance
- Skill1Name, Skill1Energy, Skill1Damage, Skill1Effect
- Skill2Name, Skill2Energy, Skill2Damage, Skill2Effect
- AbilityName, AbilityEffect
- PrimaryEffectType, SpecialEffectType, AbilityStats
- Tier, Score, ScoreBreakdown

## API Endpoints

### GET /api/cards

Returns all card data in JSON format.

**Response:**
```json
[
  {
    "Name": "Charizard V",
    "CardType": "寶可夢",
    "AbilityStats": "傷害輸出, 飛行支援",
    "PrimaryEffectType": "火焰輸出, 能量加速",
    "Tier": "S",
    "Score": "24.50",
    ...
  }
]
```

## Deck Import Formats

The application supports importing deck lists in multiple formats:

### English Format
```
Fire Deck
Format: Standard

Pokemon (20):
4x Charizard V
3x Professor's Research

Trainers (15):
4x Professor's Research

Energy (25):
10x Fire Energy
```

### Chinese Format
```
火系牌組

寶可夢 (20):
炭小侍 3張
紅蓮鎧騎 2張

訓練家 (15):
博士的研究（大木博士） 4張

能量 (25):
基本火能量 6張
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run test suite
- `npm run lint` - Run ESLint

### Testing

The project includes comprehensive tests for deck building functionality:
- Import functionality for English and Chinese formats
- Bracket removal for card name matching
- Error handling and edge cases
- Component integration tests

```bash
npm test
```

### Adding New Features

1. Create components in `src/components/`
2. Add types to `src/types/` directory
3. Update deck builder logic in `src/components/DeckBuilder.tsx`
4. Add tests for new functionality
5. Update this README

## Key Components

### DeckBuilder
- Main deck construction interface
- Card search and filtering
- Import/export functionality
- Real-time deck validation
- Count updates and statistics

### DeckViewer
- Full-screen deck viewing
- Zoom-out mode for overview
- Export functionality
- Statistics display

### DeckManager
- Deck listing and management
- Create, edit, duplicate, delete operations
- Local storage persistence

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License.