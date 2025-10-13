import sqlite3
import os

db_path = 'pokemon_cards.db'
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Check for cards with very short names or whitespace
    cursor.execute('SELECT id, name, LENGTH(TRIM(name)) as name_len FROM cards WHERE LENGTH(TRIM(name)) < 3 ORDER BY LENGTH(TRIM(name)) LIMIT 10')
    short_names = cursor.fetchall()

    print('Cards with very short names (< 3 chars):')
    for card in short_names:
        print(f'ID: {card[0]}, Name: "{card[1]}", Length: {card[2]}')

    # Check for cards with just numbers or symbols
    cursor.execute("SELECT id, name FROM cards WHERE name GLOB '*[0-9]*' AND LENGTH(name) < 5 LIMIT 5")
    number_names = cursor.fetchall()

    print('\nCards with numbers in short names:')
    for card in number_names:
        print(f'ID: {card[0]}, Name: "{card[1]}"')

    # Test the toLowerCase logic with edge cases
    print('\nTesting toLowerCase logic with edge cases:')
    test_names = ['', ' ', 'A', '1', '卡', None]

    for name in test_names:
        try:
            if name is None:
                result = ''
            else:
                result = name
            lower_result = result.lower()
            print(f'Original: "{name}" -> Safe: "{result}" -> Lower: "{lower_result}"')
        except Exception as e:
            print(f'Error with "{name}": {e}')

    conn.close()
else:
    print('Database file not found')