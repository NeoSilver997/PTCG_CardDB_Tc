import sqlite3
import os

# Path to the database
db_path = r'x:\Document\PokemonDBByjules\PTCG_CardDB_Tc\pokemon_cards.db'
print(f"DB path: {db_path}")
print(f"DB exists: {os.path.exists(db_path)}")

conn = sqlite3.connect(db_path)
cursor = conn.cursor()
cursor.execute('DROP TABLE IF EXISTS primary_cards')
# Check existing tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()
print("Existing tables:", tables)


# Create the primary_cards table
cursor.execute('''
CREATE TABLE IF NOT EXISTS primary_cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    skill_name TEXT,
    primary_card_id INTEGER,
    count INTEGER,
    rarity_card_ids TEXT,
    FOREIGN KEY(primary_card_id) REFERENCES cards(id)
)
''')


# Populate the table
# For each unique name + skill_name, collect all card IDs and select the card with smallest web_card_id as primary
cursor.execute('''
SELECT
    grouped.name,
    grouped.skill_name,
    grouped.all_card_ids,
    (SELECT c2.id FROM cards c2 WHERE c2.web_card_id = grouped.min_web_card_id) as primary_card_id,
    grouped.count
FROM (
    SELECT
        c.name,
        s.name || ' ' || s.description as skill_name,
        GROUP_CONCAT(c.id) as all_card_ids,
        MIN(c.web_card_id) as min_web_card_id,
        COUNT(*) as count
    FROM cards c
    JOIN skills s ON c.id = s.card_id AND s.skill_number = 1
    WHERE c.rarity in ('RR','normal','n/a','promo','','high','ACE')
    GROUP BY c.name, s.name
) grouped
ORDER BY grouped.name, grouped.skill_name
''')

results = cursor.fetchall()

for name, skill_name, all_card_ids_str, primary_card_id, count in results:
    # Convert comma-separated string to list and back to JSON-like string
    card_ids_list = [int(id) for id in all_card_ids_str.split(',')]
    rarity_card_ids_json = str(card_ids_list).replace(' ', '')  # Simple JSON-like format

    cursor.execute('''
    INSERT INTO primary_cards (name, skill_name, primary_card_id, count, rarity_card_ids)
    VALUES (?, ?, ?, ?, ?)
    ''', (name, skill_name, primary_card_id, count, rarity_card_ids_json))

print(f"Inserted {len(results)} primary card groups")


conn.commit()
conn.close()

print("Primary cards table created and populated.")