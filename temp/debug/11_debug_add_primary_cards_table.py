import sqlite3
import os

# Path to the database
db_path = r'x:\Document\PokemonDBByjules\PTCG_CardDB_Tc\pokemon_cards.db'
print(f"DB path: {db_path}")
print(f"DB exists: {os.path.exists(db_path)}")

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

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
    FOREIGN KEY(primary_card_id) REFERENCES cards(id)
)
''')

# Populate the table
# For each unique name + skill_name, select the card with the smallest id as primary
cursor.execute('''
INSERT INTO primary_cards (name, skill_name, primary_card_id)
SELECT c.name, s.name as skill_name, MIN(c.id) as primary_card_id
FROM cards c
JOIN skills s ON c.id = s.card_id
GROUP BY c.name, s.name
''')

conn.commit()
conn.close()

print("Primary cards table created and populated.")