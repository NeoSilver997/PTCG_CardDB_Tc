import sqlite3
import os

db_path = 'pokemon_cards.db'
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Check for cards with empty or null names
    cursor.execute('SELECT COUNT(*) FROM cards WHERE name IS NULL OR name = "" OR TRIM(name) = ""')
    empty_count = cursor.fetchone()[0]

    print(f'Cards with empty/null names: {empty_count}')

    if empty_count > 0:
        # Show some examples
        cursor.execute('SELECT id, name, card_type FROM cards WHERE name IS NULL OR name = "" OR TRIM(name) = "" LIMIT 10')
        examples = cursor.fetchall()
        print('Examples of cards with empty names:')
        for example in examples:
            print(f'  ID: {example[0]}, Name: "{example[1]}", Type: {example[2]}')

        # Ask if user wants to delete these cards
        print(f'\nFound {empty_count} cards with empty names.')
        print('These cards should be removed from the database.')
    else:
        print('No cards with empty names found - database is clean!')

    conn.close()
else:
    print('Database file not found')