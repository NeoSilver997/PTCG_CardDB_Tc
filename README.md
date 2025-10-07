# Pokemon TCG Card Database & Analysis System

## Overview
A comprehensive Pokemon Trading Card Game (PTCG) database system that provides data processing, analysis, rating, and web-based card browsing capabilities. The system combines intelligent card merging, multi-criteria rating algorithms, and a responsive web interface for exploring Pokemon card data.

## 🚀 Key Features

### 📊 Data Processing Pipeline
- **Smart Card Merging**: Intelligent deduplication based on normalized skill effects
- **Multi-Criteria Rating System**: Comprehensive card evaluation using meta relevance, expansion power, function analysis, synergy potential, effect classification, and damage output
- **CSV Processing**: Automated batch processing with detailed scoring breakdowns

### 🌐 Web Application
- **Responsive Card Browser**: Modern web interface for exploring Pokemon cards
- **Advanced Filtering**: Filter by attribute, expansion, HP range, card name, and more
- **Detailed Card Views**: Comprehensive card information including stats, abilities, and images
- **Mobile-Friendly Design**: Fully responsive interface for all devices

### 📈 Analysis Tools
- **Effect Classification**: Automated categorization of card abilities and effects
- **Meta Analysis**: Competitive deck building and optimization tools
- **Statistical Reports**: Detailed analysis of card distributions and patterns
- **Evolution Tracking**: Pokemon evolution chain analysis and visualization

## 🛠️ System Components

### Core Processor (`ptcg_processor.py`)
The unified PTCG processing system that combines all merge and rating functionality:

```bash
# Smart merge duplicate cards
python ptcg_processor.py merge input.csv output.csv

# Rate cards with comprehensive scoring
python ptcg_processor.py rate input.csv output.csv

# Complete pipeline: merge + rate
python ptcg_processor.py pipeline input.csv rated.csv --merged_file merged.csv
```

### Web Application
- **Main Interface**: `index.html` - Card browsing and filtering
- **Styling**: `styles.css` - Responsive design
- **Functionality**: `script.js` - Interactive features and data loading

### Analysis Scripts
- `skill_effect_analyzer.py` - Effect classification and analysis
- `meta_deck_analysis.py` - Competitive deck optimization
- `competitive_deck_builder.py` - Deck building tools
- `pokemon_type_analysis.py` - Type-based statistical analysis

## 📋 Installation & Setup

### Prerequisites
- Python 3.8+
- Web browser for the interface
- CSV data files with Pokemon card information

### Quick Start
1. **Process Card Data**:
   ```bash
   # Run the complete processing pipeline
   python ptcg_processor.py pipeline cards_output_all_mega_with_effects.csv final_cards.csv --merged_file merged_cards.csv
   ```

2. **Start Web Interface**:
   ```bash
   # Start local web server
   python -m http.server 8000
   ```

3. **Access Application**:
   - Open browser to: `http://localhost:8000`
   - Browse and filter Pokemon cards
   - View detailed card information

## 🎯 Rating System Details

### Scoring Components
- **Base Score**: Card type importance (Supporter > Item > Pokemon Tool > Energy)
- **Meta Score**: Competitive relevance and tournament performance
- **Expansion Score**: Set power level and recency
- **Function Score**: Text-based keyword analysis
- **Synergy Score**: Deck-building versatility
- **Effect Score**: Ability classification and impact
- **Damage Score**: Attack power and damage output

### Tier Classifications
- **S+/S**: Meta-defining cards, essential for competitive play
- **A+/A**: Strong cards with wide applicability
- **B+/B**: Situational cards, good in specific decks
- **C+/C**: Niche cards, limited use cases
- **D**: Generally weak or outdated cards

## 📁 Project Structure

```
├── ptcg_processor.py              # Main processing system
├── backup_scripts/                # Legacy processing scripts
├── scripts/                       # Utility scripts
├── html_pages/                    # Raw card data sources
├── masterdb/                      # Processed card databases
├── images/                        # Card images and assets
├── index.html                     # Web application
├── styles.css                     # Web styling
├── script.js                      # Web functionality
├── README.md                      # This file
└── Various analysis outputs/      # Generated reports and CSVs
```

## 🔧 Data Processing Workflow

### 1. Raw Data Collection
- Card data scraped from Pokemon Card Game websites
- HTML pages stored in `html_pages/` directory
- Raw CSV exports generated from web scraping

### 2. Smart Merging
- Normalizes skill text and removes HTML artifacts
- Deduplicates cards based on standardized effect descriptions
- Reduces dataset from ~4,700 to ~2,400 unique cards (49.5% compression)

### 3. Effect Classification
- Automated categorization of card abilities
- Identifies primary and special effect types
- Statistical analysis of effect distributions

### 4. Rating & Scoring
- Multi-dimensional evaluation algorithm
- Rarity-based score modifiers
- Detailed breakdown for each scoring component

### 5. Web Presentation
- Responsive card grid layout
- Real-time filtering and search
- Detailed card information modals

## 📊 Sample Output Statistics

After processing a typical PTCG dataset:
- **Input Cards**: 4,778 raw cards
- **Merged Cards**: 2,365 unique cards (49.5% reduction)
- **Rating Distribution**:
  - S+ Tier: 2.7% (65 cards)
  - S Tier: 8.9% (210 cards)
  - A+ Tier: 18.5% (437 cards)
  - A Tier: 23.7% (560 cards)
  - B+ Tier: 19.8% (468 cards)
  - B Tier: 13.8% (327 cards)
  - C+ Tier: 8.3% (197 cards)
  - C Tier: 2.5% (59 cards)
  - D Tier: 1.8% (42 cards)

## 🛠️ Advanced Usage

### Custom Processing
```python
from ptcg_processor import PTCGCardProcessor

processor = PTCGCardProcessor()

# Process specific files
processor.smart_merge_cards('input.csv', 'merged.csv')
processor.rate_csv('merged.csv', 'rated.csv')

# Or use the complete pipeline
processor.process_full_pipeline('input.csv', 'merged.csv', 'rated.csv')
```

### Analysis Tools
```bash
# Effect classification analysis
python skill_effect_analyzer.py

# Meta deck optimization
python meta_deck_analysis.py

# Type-based statistics
python pokemon_type_analysis.py
```

## 🤝 Contributing

### Adding New Features
1. Create feature branch from `main`
2. Implement changes in appropriate module
3. Update tests and documentation
4. Submit pull request

### Data Updates
- Place new card data in `html_pages/` directory
- Run processing pipeline to update databases
- Update web interface data sources as needed

## 📝 Data Sources & Credits

- **Card Data**: Official Pokemon Card Game databases and web sources
- **Images**: Pokemon Card Game official card images
- **Processing Logic**: Custom algorithms for effect normalization and rating
- **Web Framework**: Vanilla HTML/CSS/JavaScript for maximum compatibility

## 🔄 Version History

### v2.0.0 (Current)
- ✅ Unified PTCG processor combining merge and rating systems
- ✅ Complete data processing pipeline
- ✅ Enhanced web interface with improved filtering
- ✅ Comprehensive effect classification system
- ✅ Advanced rating algorithm with detailed breakdowns

### v1.x Legacy
- Individual merge and rating scripts (now in `backup_scripts/`)
- Basic web interface functionality
- Initial effect analysis tools

## 📄 License

This project is for educational and research purposes related to Pokemon Trading Card Game analysis.

---

**Last Updated**: October 7, 2025
**Data Version**: PTCG SV Series (through SV11)
**Cards Processed**: 4,778 → 2,365 unique cards