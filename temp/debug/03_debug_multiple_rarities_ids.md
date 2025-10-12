# 03_debug_multiple_rarities_ids.py

## Description
This script scrapes web_card_id for multiple high-rarity cards from the Pokemon card search page. It processes AR, SR, RR, MUR, BWR, ACE, SSR, and UR rarities by filtering the search results and collecting card IDs from all available pages.

## Functions/Operations
- Defines a dictionary of rarity names and their corresponding IDs.
- For each rarity, constructs the filtered search URL.
- Fetches the total number of pages for each rarity filter.
- Iterates through each page of the filtered results.
- Parses the HTML to find card list items and extracts card detail URLs.
- Uses regex to extract the numeric ID from URLs like `/detail/{id}/`.
- Collects all web_card_ids for each rarity into separate lists.
- Saves each list to a JSON file named `{rarity_name}_web_card_ids.json` (e.g., `ar_web_card_ids.json`).
- Includes delays between requests to avoid server overload.

## Usage
Run the script with Python: `python 03_debug_multiple_rarities_ids.py`

## Output
- Multiple JSON files: `ar_web_card_ids.json`, `sr_web_card_ids.json`, etc., each containing a list of web_card_id strings for that rarity.
- Console output: Progress messages for each rarity and final counts.

## Dependencies
- requests
- beautifulsoup4
- json (built-in)
- os (built-in)
- time (built-in)
- re (built-in)