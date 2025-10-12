import csv
import sqlite3
import os

# Paths
csv_path = r'x:\Document\PokemonDBByjules\PTCG_CardDB_Tc\PTCG_Web\source\cards_output_all_mega.csv'
db_path = r'x:\Document\PokemonDBByjules\PTCG_CardDB_Tc\pokemon_cards.db'

# Create database
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Create tables
cursor.execute('DROP TABLE IF EXISTS expansions')
cursor.execute('''
CREATE TABLE expansions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    code TEXT,
    mark TEXT
)
''')

cursor.execute('DROP TABLE IF EXISTS illustrators')
cursor.execute('''
CREATE TABLE illustrators (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE
)
''')

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

cursor.execute('DROP TABLE IF EXISTS skills')
cursor.execute('''
CREATE TABLE skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    card_id INTEGER,
    skill_number INTEGER,
    name TEXT,
    cost TEXT,
    damage TEXT,
    effect TEXT,
    FOREIGN KEY(card_id) REFERENCES cards(id)
)
''')

cursor.execute('DROP TABLE IF EXISTS evolutions')
cursor.execute('''
CREATE TABLE evolutions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    card_id INTEGER,
    evolution TEXT,
    FOREIGN KEY(card_id) REFERENCES cards(id)
)
''')

cursor.execute('DROP TABLE IF EXISTS subtypes')
cursor.execute('''
CREATE TABLE subtypes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    card_id INTEGER,
    subtype TEXT,
    FOREIGN KEY(card_id) REFERENCES cards(id)
)
''')

# Read CSV and insert
with open(csv_path, 'r', encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    for row in reader:
        # Insert expansion
        expansion_name = row['Expansion']
        expansion_code = row['ExpansionCode']
        mark = row['Mark']
        cursor.execute('INSERT OR IGNORE INTO expansions (name, code, mark) VALUES (?, ?, ?)', (expansion_name, expansion_code, mark))
        expansion_id = cursor.execute('SELECT id FROM expansions WHERE name = ?', (expansion_name,)).fetchone()[0]

        # Insert illustrator
        illustrator_name = row['Illustrator']
        cursor.execute('INSERT OR IGNORE INTO illustrators (name) VALUES (?)', (illustrator_name,))
        illustrator_id = cursor.execute('SELECT id FROM illustrators WHERE name = ?', (illustrator_name,)).fetchone()[0]

        # Insert card
        hp = int(row['HP']) if row['HP'] else None
        retreat_cost = int(row['RetreatCost']) if row['RetreatCost'] else None
        score = float(row['Score']) if row['Score'] else None

        cursor.execute('''
        INSERT INTO cards (name, evolution_stage, web_card_id, image_url, card_type, hp, attribute, weakness, weakness_type, resistance, resistance_type, retreat_cost, collector_number, rarity, expansion_id, illustrator_id, pokemon_info, tier, score, score_breakdown, primary_effect_type, special_effect_type)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            row['Name'], row['EvolutionStage'], row['WebCardID'], row['ImageURL'], row['CardType'], hp, row['Attribute'],
            row['Weakness'], row['WeaknessType'], row['Resistance'], row['ResistanceType'], retreat_cost, row['CollectorNumber'],
            row['Rarity'], expansion_id, illustrator_id, row['PokemonInfo'], row['Tier'], score, row['ScoreBreakdown'],
            row['PrimaryEffectType'], row['SpecialEffectType']
        ))
        card_id = cursor.lastrowid

        # Insert ability if exists
        if row['Ability']:
            cursor.execute('INSERT INTO abilities (card_id, name, description) VALUES (?, ?, ?)', (card_id, row['Ability'], row['AbilityDesc']))

        # Insert skills
        if row['Skill1Name']:
            cursor.execute('INSERT INTO skills (card_id, skill_number, name, cost, damage, effect) VALUES (?, ?, ?, ?, ?, ?)', (card_id, 1, row['Skill1Name'], row['Skill1Cost'], row['Skill1Damage'], row['Skill1Effect']))
        if row['Skill2Name']:
            cursor.execute('INSERT INTO skills (card_id, skill_number, name, cost, damage, effect) VALUES (?, ?, ?, ?, ?, ?)', (card_id, 2, row['Skill2Name'], row['Skill2Cost'], row['Skill2Damage'], row['Skill2Effect']))

        # Insert evolutions
        if row['Evolution']:
            evolutions_list = [e.strip() for e in row['Evolution'].split('→') if e.strip()]
            for evo in evolutions_list:
                cursor.execute('INSERT INTO evolutions (card_id, evolution) VALUES (?, ?)', (card_id, evo))

        # Insert subtypes
        if row['Subtypes']:
            subtypes_list = [s.strip() for s in row['Subtypes'].split(',') if s.strip()]
            for sub in subtypes_list:
                cursor.execute('INSERT INTO subtypes (card_id, subtype) VALUES (?, ?)', (card_id, sub))

# Commit and close
conn.commit()
conn.close()

print("Database created and populated successfully.")