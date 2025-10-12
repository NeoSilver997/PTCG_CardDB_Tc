# 02_debug_sar_ids.py

## Description
This script scrapes all web_card_id (card detail IDs) for cards with SAR rarity from the Pokemon card search page. It filters by rarity[]=15 and collects IDs from all available pages.

## Functions/Operations
- Fetches the total number of pages for SAR rarity cards.
- Iterates through each page of the filtered search results.
- Parses the HTML to find card list items and extracts the card detail URLs.
- Uses regex to extract the numeric ID from URLs like `/detail/{id}/`.
- Collects all unique web_card_ids into a list.
- Saves the list to `sar_web_card_ids.json` in the script's directory.
- Includes a delay between requests to avoid overloading the server.

## Usage
Run the script with Python: `python 02_debug_sar_ids.py`

## Output
- `sar_web_card_ids.json`: JSON file containing a list of all web_card_id strings for SAR rarity cards.
- Console output: Progress messages and final count.

## Dependencies
- requests
- beautifulsoup4
- json (built-in)
- os (built-in)
- time (built-in)
- re (built-in)