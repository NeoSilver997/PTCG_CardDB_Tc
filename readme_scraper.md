# Pokemon Card Scraper

## Overview

The `pokemon_card_scraper.py` is a comprehensive web scraping tool designed to extract detailed Pokemon card information from the official Pokemon Card Game website (asia.pokemon-card.com/hk). This scraper automates the collection of card data, images, and metadata for research, database building, and analysis purposes.

## Features

### Core Functionality

1. **Multi-page Scraping**: Automatically detects and scrapes all available pages from the card database
2. **Detailed Card Information**: Extracts comprehensive card details from both list and detail pages
3. **Image Download**: Downloads high-resolution card images organized by expansion and card number
4. **Data Export**: Saves scraped data to CSV format with timestamped filenames
5. **HTML Archiving**: Saves detail page HTML files for future reference and debugging

### Data Extraction Capabilities

The scraper extracts the following information for each card:

#### Basic Information
- **Web Card ID**: Unique identifier from the website
- **Card Type**: Pokemon, Trainer, Energy, etc.
- **Name**: Card name in Chinese
- **Expansion**: Set code (e.g., SV1, SV2, etc.)
- **Number**: Collector number within the set
- **Card URL**: Direct link to the card's detail page
- **Image URL**: Link to the card's high-resolution image

#### Pokemon-Specific Data
- **HP**: Hit points value
- **Attribute**: Pokemon type (Grass, Fire, Water, etc.)
- **Attacks**: Attack names and descriptions
- **Attack Damage**: Damage values for attacks
- **Weakness**: Type weaknesses
- **Resistance**: Type resistances
- **Retreat Cost**: Energy cost to retreat
- **Evolution**: Evolution chain information
- **Pokemon Info**: Height, weight, and description
- **Artist**: Illustrator name

#### Special Features
- **[特性]**: Ability information
- **Skill Details**: Up to 2 skills with name, cost, damage, and effects
- **Evolve Marker**: Evolution indicators
- **Expansion Symbol**: Set symbol image URL
- **Subtypes**: Special card types (ex, 太晶/Terastallization)

## Technical Implementation

### Dependencies
- `requests`: HTTP requests for web scraping
- `beautifulsoup4`: HTML parsing and data extraction
- `csv`: Data export to CSV format
- `urllib.parse`: URL manipulation
- `datetime`: Timestamp generation
- `re`: Regular expressions for data parsing
- `shutil`: File operations for image downloads
- `os`: File system operations

### Architecture

#### 1. Initialization Phase
- Creates necessary folder structure (`logs/`, `images/`, `html_pages/`)
- Determines total number of pages to scrape
- Sets up data structures for card collection

#### 2. List Page Scraping
- Iterates through all pages (default limit: 300 pages for testing)
- Extracts basic card information from list view
- Identifies card URLs for detail page scraping

#### 3. Detail Page Processing
- Visits each card's detail page
- Extracts comprehensive card information
- Saves HTML content for archival purposes
- Implements rate limiting (1.5 second delays) to respect server resources

#### 4. Image Download
- Downloads card images using constructed URLs
- Organizes images by expansion code and card number
- Handles download errors gracefully

#### 5. Data Export
- Compiles all extracted data into structured format
- Exports to timestamped CSV file
- Generates summary statistics

### Error Handling

The scraper includes robust error handling for:
- Network timeouts and connection failures
- Missing HTML elements
- Invalid data formats
- Image download failures
- File system permission issues

### Rate Limiting

To maintain good relations with the target website:
- 1-second delay between page requests
- 1.5-second delay between detail page requests
- Configurable page limits for testing

## Output Structure

### CSV Data File
- Filename: `pokemon_cards_detailed_YYYYMMDD_HHMMSS.csv`
- Contains all extracted card information
- UTF-8 encoded for proper Chinese character support

### Image Files
- Location: `images/[Expansion]/[CardNumber].png`
- High-resolution card images
- Organized by expansion for easy browsing

### HTML Archives
- Location: `html_pages/[Expansion]/[CardNumber]_[CardName].html`
- Complete detail page HTML
- Useful for debugging and future data extraction

### Log Files
- Location: `logs/`
- Last page HTML for pagination verification
- Detail page samples for debugging

## Usage

### Basic Execution
```bash
python pokemon_card_scraper.py
```

### Configuration Options
- **Page Limit**: Modify `max_pages` variable to control scraping scope
- **Rate Limiting**: Adjust `time.sleep()` values for different speed requirements
- **Output Paths**: Customize folder locations as needed

## Data Quality Features

### Data Validation
- Handles missing or malformed HTML elements
- Provides fallback extraction methods
- Cleans and normalizes extracted text
- Replaces empty values with 'N/A'

### Duplicate Prevention
- Checks for existing data before processing
- Avoids redundant detail page requests

### Encoding Support
- Full UTF-8 support for Chinese characters
- Proper handling of special characters in filenames

## Legal and Ethical Considerations

### Responsible Scraping
- Respects website terms of service
- Implements appropriate delays between requests
- Only scrapes publicly available information
- Does not attempt to bypass rate limiting or access restrictions

### Data Usage
- Intended for personal research and database building
- Not for commercial redistribution of copyrighted content
- Respects intellectual property rights of Pokemon Company

## Troubleshooting

### Common Issues

1. **Connection Timeouts**: Increase timeout values or check network connectivity
2. **Missing Data**: Website structure changes may require code updates
3. **Image Download Failures**: Check image URL construction logic
4. **Encoding Issues**: Ensure UTF-8 encoding throughout the pipeline

### Debugging Features
- Detailed console output for each scraping step
- HTML file archival for manual inspection
- Error logging with specific failure points

## Future Enhancements

Potential improvements could include:
- Configuration file support
- Parallel processing for faster scraping
- Database integration for structured storage
- API endpoint support
- Incremental update capabilities
- Data validation and cleaning pipelines

## Dependencies Installation

```bash
pip install requests beautifulsoup4
```

## Output Statistics

The scraper provides summary statistics including:
- Total cards scraped
- Pages processed
- Images downloaded
- Errors encountered
- Processing time

This tool serves as a comprehensive solution for Pokemon card data collection and analysis, enabling researchers and enthusiasts to build rich databases of card information.