#!/usr/bin/env python3
import sqlite3

conn = sqlite3.connect('pokemon_cards.db')
cursor = conn.cursor()

# Check if primary_card_id values exist in cards.id
cursor.execute("""
SELECT COUNT(DISTINCT pc.primary_card_id)
FROM primary_cards pc
WHERE pc.primary_card_id IN (SELECT id FROM cards)
""")
matching_ids = cursor.fetchone()[0]

cursor.execute("SELECT COUNT(*) FROM primary_cards")
total_primary = cursor.fetchone()[0]

print(f'primary_cards with matching card IDs: {matching_ids}/{total_primary}')

if matching_ids != total_primary:
    print('Some primary_card_id values do not exist in cards table!')
    cursor.execute("""
    SELECT pc.primary_card_id, pc.name
    FROM primary_cards pc
    WHERE pc.primary_card_id NOT IN (SELECT id FROM cards)
    LIMIT 10
    """)
    missing = cursor.fetchall()
    print('Sample missing IDs:', missing)

conn.close()