# 09_debug_update_rarity_by_webid.py

This script updates the rarity in the CSV file `cards_output_all_mega.csv` by mapping web_card_id directly to known rarities from JSON files.

## Functionality
- Loads all `*_web_card_ids.json` files from `temp/debug/`
- Creates a mapping from web_card_id to rarity (e.g., '00014201' -> 'AR')
- Reads the CSV, updates the 'Rarity' column where web_card_id matches
- Logs changes and writes back to the CSV

## Usage
Run the script to update rarities based on scraped web_card_ids.

## Dependencies
- csv
- json
- os
- glob