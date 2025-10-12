# 10_debug_csv_to_sqlite.py

This script converts the CSV file `cards_output_all_mega.csv` to a normalized SQLite database `pokemon_cards.db`.

## Functionality
- Creates normalized tables: expansions, illustrators, cards, abilities, skills, evolutions, subtypes.
- Reads the CSV, inserts data into the database with proper foreign keys.
- Handles lists in fields like Evolution and Subtypes by splitting and inserting multiple rows.

## Database Schema
- expansions: id, name, code, mark
- illustrators: id, name
- cards: id, name, evolution_stage, web_card_id, image_url, card_type, hp, attribute, weakness, weakness_type, resistance, resistance_type, retreat_cost, collector_number, rarity, expansion_id, illustrator_id, pokemon_info, tier, score, score_breakdown, primary_effect_type, special_effect_type
- abilities: id, card_id, name, description
- skills: id, card_id, skill_number, name, cost, damage, description
- evolutions: id, card_id, evolution
- subtypes: id, card_id, subtype

## Usage
Run the script to create and populate the SQLite database.

## Dependencies
- csv
- sqlite3
- os