# PTCG Card Search

A modern web application for searching and exploring Pokemon Trading Card Game (PTCG) cards by abilities and effects.

## Features

- **Advanced Search**: Search cards by name, ability, or effect descriptions
- **Ability Filtering**: Filter cards by specific abilities and their statistics
- **Effect Type Filtering**: Browse cards by primary and special effect classifications
- **Attribute Filtering**: Filter cards by Pokemon types (Grass, Fire, Water, etc.)
- **Detailed Card View**: Comprehensive card information with score breakdown charts
- **Card Details**: View detailed card information including skills, abilities, and stats
- **Related Cards**: Discover cards with similar abilities and effects
- **Tier System**: Cards are rated with a comprehensive scoring system
- **Responsive Design**: Works on desktop and mobile devices

## Technology Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Data Processing**: PapaParse for CSV handling

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ptcg-card-search
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
│   ├── api/cards/route.ts    # API endpoint for card data
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Main page
├── components/
│   ├── CardDetailModal.tsx   # Card detail modal
│   ├── CardGrid.tsx          # Card grid display
│   ├── CardItem.tsx          # Individual card component
│   └── SearchFilters.tsx     # Search and filter controls
└── types/
    └── card.ts               # TypeScript interfaces
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
    "Name": "Card Name",
    "CardType": "寶可夢",
    "AbilityStats": "傷害效果, 傷害減免",
    "PrimaryEffectType": "傷害輸出, 防禦效果",
    "Tier": "A+",
    "Score": "22.00",
    ...
  }
]
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### Adding New Features

1. Create components in `src/components/`
2. Add types to `src/types/card.ts`
3. Update the main page in `src/app/page.tsx`
4. Add API routes in `src/app/api/`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.