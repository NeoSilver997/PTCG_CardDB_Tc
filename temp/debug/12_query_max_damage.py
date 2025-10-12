import sqlite3
import re

# Path to the database
db_path = r'x:\Document\PokemonDBByjules\PTCG_CardDB_Tc\pokemon_cards.db'

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Get all damages
cursor.execute("SELECT damage FROM skills WHERE damage != '' AND damage IS NOT NULL")
rows = cursor.fetchall()

max_damage = 0
max_card = None

for row in rows:
    damage_str = row[0]
    # Extract numbers, ignore + or other
    match = re.match(r'(\d+)', damage_str)
    if match:
        damage = int(match.group(1))
        if damage > max_damage:
            max_damage = damage
            max_card = damage_str

print(f"Highest damage: {max_damage} (from skill: {max_card})")

# To get the card name
cursor.execute("""
SELECT c.name, s.name, s.damage
FROM skills s
JOIN cards c ON s.card_id = c.id
WHERE s.damage LIKE ?
ORDER BY CAST(s.damage AS INTEGER) DESC
LIMIT 1
""", (f"{max_damage}%",))

result = cursor.fetchone()
if result:
    print(f"Card: {result[0]}, Skill: {result[1]}, Damage: {result[2]}")

conn.close()