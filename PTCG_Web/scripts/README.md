# Pokemon TCG Construction Deck Importer

This tool scrapes official Pokemon construction decks from the Asia Pokemon website and imports them into your PTCG web application.

## Features

- 🔍 **Automated Scraping**: Extracts construction deck information from official sources
- 🎯 **Smart Card Matching**: Matches scraped card names with your existing card database
- 📊 **Detailed Reports**: Provides import statistics and unmatched card reports
- 🌐 **Web Interface**: Admin panel for easy deck import management
- 🔧 **Flexible**: Supports both automated scraping and manual deck definitions

## Files Structure

```
scripts/
├── pokemon_deck_scraper.py          # Basic scraper (web scraping approach)
├── enhanced_deck_importer.py        # Enhanced version with database matching
├── run_deck_import.py               # Simple runner script
├── requirements.txt                 # Python dependencies
└── construction_decks.json          # Generated deck data (after running script)

src/app/
├── api/import-decks/route.ts         # API endpoint for importing decks
└── admin/import-decks/page.tsx       # Admin interface for deck management
```

## Quick Start

### 1. Install Python Dependencies

```bash
cd scripts
pip install -r requirements.txt
```

### 2. Run the Deck Importer

```bash
# Simple method - run the enhanced importer
python run_deck_import.py
```

Or manually:

```bash
# Enhanced version with database matching
python enhanced_deck_importer.py
```

### 3. Import into Web Application

1. Start your Next.js development server:
   ```bash
   npm run dev
   ```

2. Visit the admin panel:
   ```
   http://localhost:3001/admin/import-decks
   ```

3. Click "Import Decks" to import the scraped deck data

## What Gets Imported

The script imports official Pokemon construction decks including:

- **挑戰牌組 超級耿鬼ex** (Challenge Deck Super Gengar ex)
- **挑戰牌組 超級蒂安希ex** (Challenge Deck Super Diancie ex)
- **ex初階牌組 噴火龍** (Starter ex Deck Charizard)
- **ex初階牌組 皮卡丘** (Starter ex Deck Pikachu)
- **戰術牌組 魔幻假面喵ex** (Tactical Deck Meowscarada ex)
- **戰術牌組 太晶噴火龍ex** (Tactical Deck Tera Charizard ex)

Each deck includes:
- Complete card list with quantities
- Card type and rarity information (where available)
- Deck description and metadata
- Import statistics and match confidence scores

## Generated Files

After running the import script, you'll get:

- **`construction_decks.json`** - Main deck data file (ready for web app import)
- **`unmatched_cards.csv`** - Cards that couldn't be matched with your database
- **`import_summary.txt`** - Detailed import statistics

## Card Matching

The enhanced importer uses smart card matching to connect scraped card names with your existing card database:

- **Exact matches**: Perfect name matches get 100% confidence
- **Partial matches**: Cards with similar names get scored by similarity
- **Minimum confidence**: Only matches with 60%+ confidence are accepted
- **Unmatched cards**: Exported to CSV for manual review

## Database Integration

The importer reads from your existing card database CSV file. Make sure your card database includes:

- `CardID` - Unique identifier
- `Name` - Card name
- `CardType` - Pokemon, Trainer, Energy, etc.
- `ExpansionName` - Set/expansion name
- `Rarity` - Card rarity

## API Endpoints

### `GET /api/import-decks`
Returns import status and statistics:
```json
{
  "status": "ready",
  "currentDeckCount": 6,
  "lastImport": { ... },
  "scriptsAvailable": {
    "constructionDecks": true,
    "pythonScripts": true
  }
}
```

### `POST /api/import-decks`
Imports decks from the generated JSON file:
```json
{
  "success": true,
  "imported": 6,
  "errors": 0,
  "report": { ... }
}
```

## Customization

### Adding New Decks

Edit `enhanced_deck_importer.py` and add to the `construction_decks` list:

```python
{
    "name": "Your Deck Name",
    "description": "Deck description",
    "cards": [
        ("Card Name", quantity),
        ("Another Card", quantity),
        # ... more cards
    ]
}
```

### Improving Card Matching

Modify the `normalize_name()` and `calculate_similarity()` methods in `DatabaseCardMatcher` class to handle your specific card naming patterns.

### Web Interface Customization

The admin interface at `/admin/import-decks` can be customized by editing the React component in `src/app/admin/import-decks/page.tsx`.

## Troubleshooting

### Common Issues

1. **"Card database not found"**
   - Ensure your `pokemon_cards.csv` file is in the correct location
   - Check the path in `enhanced_deck_importer.py`

2. **"No valid cards found"**
   - Review the card matching logic
   - Check `unmatched_cards.csv` for cards that need manual attention

3. **Import fails in web app**
   - Verify `construction_decks.json` exists in the scripts folder
   - Check the API logs for detailed error messages

### Manual Card Matching

If you have many unmatched cards:

1. Review `unmatched_cards.csv`
2. Update your card database with missing cards
3. Re-run the import script
4. Alternative: Manually edit `construction_decks.json` with correct card IDs

## Advanced Usage

### Custom Scraping

For additional deck sources, modify `pokemon_deck_scraper.py` to:
- Add new URL patterns
- Implement site-specific parsing logic
- Handle different card list formats

### Database Integration

For direct database integration (PostgreSQL, MySQL, etc.), modify the importer to:
- Connect to your database instead of CSV files
- Use SQL queries for card matching
- Insert decks directly into your database

## Contributing

To extend this importer:
1. Add new deck sources to the scraper
2. Improve card name matching algorithms
3. Add support for additional card properties
4. Enhance the web interface

## License

This tool is for educational purposes. Respect the terms of service of scraped websites and Pokemon TCG intellectual property rights.