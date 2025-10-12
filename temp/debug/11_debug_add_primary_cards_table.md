# 11_debug_add_primary_cards_table.py

This script adds a `primary_cards` table to the SQLite database.

## Functionality
- Creates a table `primary_cards` with columns: id, name, skill_name, primary_card_id
- Populates it by grouping cards by name and skill_name, selecting the card with the smallest ID as primary

## Usage
Run the script to add and populate the primary_cards table.

## Dependencies
- sqlite3
- os