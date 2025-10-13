import sqlite3
import json

# Check the API response for cards with undefined/null names
db_path = '../pokemon_cards.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Get a sample of cards to check their structure
cursor.execute('SELECT id, name, card_type FROM cards LIMIT 10')
sample_cards = cursor.fetchall()

print("Sample cards from database:")
for card in sample_cards:
    print(f"ID: {card[0]}, Name: '{card[1]}', Type: {card[2]}")

# Check for any cards where name might be problematic
cursor.execute('SELECT id, name FROM cards WHERE name IS NULL OR LENGTH(TRIM(name)) = 0')
problematic_cards = cursor.fetchall()

print(f"\nCards with problematic names: {len(problematic_cards)}")
for card in problematic_cards[:5]:  # Show first 5
    print(f"ID: {card[0]}, Name: '{card[1]}'")

conn.close()

# Also check if there are any cards with very short names that might be problematic
print("\nChecking for very short names...")
conn = sqlite3.connect(db_path)
cursor = conn.cursor()
cursor.execute('SELECT id, name FROM cards WHERE LENGTH(TRIM(name)) < 2 AND name IS NOT NULL')
short_names = cursor.fetchall()
print(f"Cards with very short names (< 2 chars): {len(short_names)}")
for card in short_names[:5]:
    print(f"ID: {card[0]}, Name: '{card[1]}'")

conn.close()