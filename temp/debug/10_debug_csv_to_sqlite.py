import csv
import sqlite3
import os

# Paths
csv_path = r'x:\Document\PokemonDBByjules\PTCG_CardDB_Tc\PTCG_Web\source\cards_output_all_mega.csv'
db_path = r'x:\Document\PokemonDBByjules\PTCG_CardDB_Tc\pokemon_cards.db'
print(f"DB path: {db_path}")

# Create database
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute('DROP TABLE IF EXISTS expansions')
cursor.execute('''
CREATE TABLE expansions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    code TEXT,
    mark TEXT
)
''')
print("expansions created")

cursor.execute('DROP TABLE IF EXISTS illustrators')
cursor.execute('''
CREATE TABLE illustrators (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE
)
''')
print("illustrators created")

cursor.execute('DROP TABLE IF EXISTS cards')
cursor.execute('''
CREATE TABLE cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    evolution_stage TEXT,
    web_card_id TEXT,
    image_url TEXT,
    card_type TEXT,
    hp INTEGER,
    attribute TEXT,
    weakness TEXT,
    weakness_type TEXT,
    resistance TEXT,
    resistance_type TEXT,
    retreat_cost INTEGER,
    collector_number TEXT,
    rarity TEXT,
    expansion_id INTEGER,
    illustrator_id INTEGER,
    pokemon_info TEXT,
    tier TEXT,
    score REAL,
    score_breakdown TEXT,
    primary_effect_type TEXT,
    special_effect_type TEXT,
    FOREIGN KEY(expansion_id) REFERENCES expansions(id),
    FOREIGN KEY(illustrator_id) REFERENCES illustrators(id)
)
''')
print("cards created")

cursor.execute('DROP TABLE IF EXISTS abilities')
cursor.execute('''
CREATE TABLE abilities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    card_id INTEGER,
    name TEXT,
    description TEXT,
    FOREIGN KEY(card_id) REFERENCES cards(id)
)
''')
print("abilities created")

cursor.execute('DROP TABLE IF EXISTS skills')
cursor.execute('''
CREATE TABLE skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    card_id INTEGER,
    skill_number INTEGER,
    name TEXT,
    cost TEXT,
    damage TEXT,
    description TEXT,
    FOREIGN KEY(card_id) REFERENCES cards(id)
)
''')
print("skills created")

cursor.execute('DROP TABLE IF EXISTS evolutions')
cursor.execute('''
CREATE TABLE evolutions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    card_id INTEGER,
    evolution TEXT,
    FOREIGN KEY(card_id) REFERENCES cards(id)
)
''')
print("evolutions created")

cursor.execute('DROP TABLE IF EXISTS subtypes')
cursor.execute('''
CREATE TABLE subtypes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    card_id INTEGER,
    subtype TEXT,
    FOREIGN KEY(card_id) REFERENCES cards(id)
)
''')
print("subtypes created")

print("Tables created.")
conn.commit()

# Read CSV and insert
with open(csv_path, 'r', encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    count = 0
    for row in reader:
        count += 1
        if count % 1000 == 0:
            print(f"Processed {count} rows")

        # Extract values using snake_case variable names (following Python conventions)
        expansion_name = row['Expansion']
        expansion_code = row['ExpansionCode']
        mark = row['Mark']
        illustrator_name = row['Illustrator']

        # Card data with proper Python naming
        card_name = row['Name']
        evolution_stage = row['EvolutionStage']
        web_card_id = row['WebCardID']
        image_url = row['ImageURL']
        card_type = row['CardType']
        hp_value = int(row['HP']) if row['HP'] else None
        attribute = row['Attribute']
        weakness = row['Weakness']
        weakness_type = row['WeaknessType']
        resistance = row['Resistance']
        resistance_type = row['ResistanceType']
        retreat_cost = int(row['RetreatCost']) if row['RetreatCost'] else None
        collector_number = row['CollectorNumber']
        rarity = row['Rarity']
        pokemon_info = row['PokemonInfo']
        tier = row['Tier']
        score = float(row['Score']) if row['Score'] else None
        score_breakdown = row['ScoreBreakdown']
        primary_effect_type = row['PrimaryEffectType']
        special_effect_type = row['SpecialEffectType']

        # Ability data
        ability_name = row['Ability']
        ability_desc = row['AbilityDesc']

        # Skill data
        skill1_name = row['Skill1Name']
        skill1_cost = row['Skill1Cost']
        skill1_damage = row['Skill1Damage']
        skill1_effect = row['Skill1Effect']
        skill2_name = row['Skill2Name']
        skill2_cost = row['Skill2Cost']
        skill2_damage = row['Skill2Damage']
        skill2_effect = row['Skill2Effect']

        # Evolution data
        evolution = row['Evolution']
        subtypes = row['Subtypes']

        # Insert expansion
        cursor.execute('INSERT OR IGNORE INTO expansions (name, code, mark) VALUES (?, ?, ?)', (expansion_name, expansion_code, mark))
        expansion_id = cursor.execute('SELECT id FROM expansions WHERE name = ?', (expansion_name,)).fetchone()[0]

        # Insert illustrator
        cursor.execute('INSERT OR IGNORE INTO illustrators (name) VALUES (?)', (illustrator_name,))
        illustrator_id = cursor.execute('SELECT id FROM illustrators WHERE name = ?', (illustrator_name,)).fetchone()[0]

        # Insert card
        cursor.execute('''
        INSERT INTO cards (name, evolution_stage, web_card_id, image_url, card_type, hp, attribute, weakness, weakness_type, resistance, resistance_type, retreat_cost, collector_number, rarity, expansion_id, illustrator_id, pokemon_info, tier, score, score_breakdown, primary_effect_type, special_effect_type)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            card_name, evolution_stage, web_card_id, image_url, card_type, hp_value, attribute,
            weakness, weakness_type, resistance, resistance_type, retreat_cost, collector_number,
            rarity, expansion_id, illustrator_id, pokemon_info, tier, score, score_breakdown,
            primary_effect_type, special_effect_type
        ))
        card_id = cursor.lastrowid

        # Insert ability if exists (only for Pokemon cards)
        if card_type == '寶可夢' and ability_name:
            cursor.execute('INSERT INTO abilities (card_id, name, description) VALUES (?, ?, ?)', (card_id, ability_name, ability_desc))

        # Insert skills (only for Pokemon cards)
        if card_type == '寶可夢':
            if skill1_name:
                cursor.execute('INSERT INTO skills (card_id, skill_number, name, cost, damage, description) VALUES (?, ?, ?, ?, ?, ?)', (card_id, 1, skill1_name, skill1_cost, skill1_damage, skill1_effect))
            if skill2_name:
                cursor.execute('INSERT INTO skills (card_id, skill_number, name, cost, damage, description) VALUES (?, ?, ?, ?, ?, ?)', (card_id, 2, skill2_name, skill2_cost, skill2_damage, skill2_effect))
        else:
            cursor.execute('INSERT INTO skills (card_id, skill_number, name, cost, damage, description) VALUES (?, ?, ?, ?, ?, ?)', (card_id, 1, skill1_name, skill1_cost, skill1_damage, skill1_effect))
        # Insert evolutions
        if evolution:
            evolutions_list = [e.strip() for e in evolution.split('→') if e.strip()]
            for evo in evolutions_list:
                cursor.execute('INSERT INTO evolutions (card_id, evolution) VALUES (?, ?)', (card_id, evo))

        # Insert subtypes
        if subtypes:
            subtypes_list = [s.strip() for s in subtypes.split(',') if s.strip()]
            for sub in subtypes_list:
                cursor.execute('INSERT INTO subtypes (card_id, subtype) VALUES (?, ?)', (card_id, sub))

        # Insert subtypes
        if row['Subtypes']:
            subtypes_list = [s.strip() for s in row['Subtypes'].split(',') if s.strip()]
            for sub in subtypes_list:
                cursor.execute('INSERT INTO subtypes (card_id, subtype) VALUES (?, ?)', (card_id, sub))

    print(f"Total rows processed: {count}")

# Commit and close
conn.commit()
conn.close()

print("Database created and populated successfully.")