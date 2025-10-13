#!/usr/bin/env python3
import sqlite3

conn = sqlite3.connect('pokemon_cards.db')
cursor = conn.cursor()

# Check primary_cards table
cursor.execute("SELECT COUNT(*) FROM primary_cards")
count = cursor.fetchone()[0]
print(f'primary_cards table has {count} rows')

if count > 0:
    cursor.execute("SELECT * FROM primary_cards LIMIT 5")
    rows = cursor.fetchall()
    print('Sample primary_cards data:')
    for row in rows:
        print(row)

# Check cards table
cursor.execute("SELECT COUNT(*) FROM cards")
cards_count = cursor.fetchone()[0]
print(f'\ncards table has {cards_count} rows')

conn.close()