import sqlite3
import os

db_path = 'pokemon_cards.db'
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Check for cards with empty or null names
    cursor.execute('SELECT COUNT(*) FROM cards WHERE name IS NULL OR name = ""')
    null_empty_count = cursor.fetchone()[0]

    # Check for cards with whitespace-only names
    cursor.execute('SELECT COUNT(*) FROM cards WHERE TRIM(name) = ""')
    whitespace_count = cursor.fetchone()[0]

    # Get total card count
    cursor.execute('SELECT COUNT(*) FROM cards')
    total_count = cursor.fetchone()[0]

    print(f'Total cards: {total_count}')
    print(f'Cards with NULL or empty names: {null_empty_count}')
    print(f'Cards with whitespace-only names: {whitespace_count}')

    # Show a few examples if any exist
    if null_empty_count > 0:
        cursor.execute('SELECT id, name, card_type FROM cards WHERE name IS NULL OR name = "" LIMIT 5')
        examples = cursor.fetchall()
        print(f'Examples of cards with empty names:')
        for example in examples:
            print(f'  ID: {example[0]}, Name: "{example[1]}", Type: {example[2]}')

    conn.close()
else:
    print('Database file not found')