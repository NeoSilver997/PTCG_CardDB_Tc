# 12_query_max_damage.py

This script queries the Pokemon card database to find the highest damage value and the corresponding card and skill.

## Functionality
- Connects to the SQLite database.
- Parses damage strings to find the maximum numerical damage.
- Retrieves the card name, skill name, and damage for the highest value.

## Usage
Run the script to get the highest damage in the database.

## Dependencies
- sqlite3
- re
- os