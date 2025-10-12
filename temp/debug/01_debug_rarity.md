# 01_debug_rarity.py

## Description
This script fetches the rarity options from the Pokemon card search page (https://asia.pokemon-card.com/tw/card-search/list/) and extracts the rarity IDs and names from the HTML form inputs. It saves the mapping to a JSON file for reference.

## Functions/Operations
- Fetches the HTML content of the card search list page.
- Parses the HTML using BeautifulSoup to find input elements with name="rarity[]".
- Extracts the value (ID) and associated label text (name) for each rarity option.
- Falls back to select options or visible text if inputs are not found.
- Saves the rarity options dictionary to `rarity_options.json` in the script's directory.
- Prints the JSON content to the console.

## Usage
Run the script with Python: `python 01_debug_rarity.py`

## Output
- `rarity_options.json`: JSON file containing rarity ID to name mappings.
- Console output: Confirmation message and the JSON data.

## Dependencies
- requests
- beautifulsoup4
- json (built-in)
- os (built-in)