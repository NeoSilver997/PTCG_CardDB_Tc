# Pokemon Card CSV Processor

This set of Python scripts allows you to access, process, and visualize Pokemon card data from CSV files. The scripts provide functionality for loading, filtering, and displaying Pokemon card data, as well as integrating with the existing web interface.

## Files Included

1. **pokemon_csv_processor.py** - Core class for processing Pokemon card CSV data
2. **example_usage.py** - Interactive command-line example of using the processor
3. **csv_to_web.py** - Script to convert CSV data to JSON for the web interface

## Getting Started

### Prerequisites

- Python 3.6 or higher
- A CSV file containing Pokemon card data (typically named `pokemon_cards_detailed_master.csv`)

### Basic Usage

1. Place your Pokemon card CSV file in one of these locations:
   - `masterdb/pokemon_cards_detailed_master.csv`
   - `pokemon_cards_detailed_master.csv` (in the root directory)

2. Run the example script to explore your data:
   ```
   python example_usage.py
   ```

3. To prepare your data for the web interface, run:
   ```
   python csv_to_web.py
   ```

4. After running `csv_to_web.py`, start the web server:
   ```
   python -m http.server 8000
   ```

5. Open your browser and navigate to: http://localhost:8000/

## Features

### PokemonCardProcessor Class

The `PokemonCardProcessor` class provides these main features:

- **Loading CSV data**: Load and parse Pokemon card data from CSV files
- **Filtering cards**: Filter cards by attributes, expansions, HP range, and name
- **Exporting to JSON**: Export filtered card data to JSON format
- **Statistics**: Get unique values and statistics about your card collection

### Example Usage

The `example_usage.py` script provides an interactive command-line interface to:

- Search cards by name
- Filter cards by attribute
- Filter cards by expansion
- Filter cards by HP range
- Export filtered cards to JSON

### Web Integration

The `csv_to_web.py` script:

- Converts your CSV data to JSON format for the web interface
- Updates the web interface to use the JSON data
- Creates metadata for filtering options

## Customization

You can customize the `PokemonCardProcessor` class to add additional filtering options or data processing functionality. The class is designed to be extensible and can be adapted to different CSV formats.

## Troubleshooting

- If your CSV file is not found, you will be prompted to enter the full path to the file
- Make sure your CSV file has the required columns (Web Card ID, Name, etc.)
- Check the console for error messages if the web interface is not displaying data

## License

This project is available for personal use.