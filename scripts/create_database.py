import pandas as pd
import sqlite3
import os

# Define paths relative to the PTCG_Web directory
excel_file_path = 'source/cards_output_all_mega.xlsx'
db_file_path = 'public/ptcg_cards.db'

def create_database():
    """
    Reads card data from an Excel file and loads it into a SQLite database.
    This script is intended to be run from the root of the PTCG_Web directory.
    """
    if not os.path.exists(excel_file_path):
        print(f"Error: Excel file not found at {os.path.abspath(excel_file_path)}")
        return

    # Create the directory for the database if it doesn't exist
    os.makedirs(os.path.dirname(db_file_path), exist_ok=True)

    # Read the Excel file into a pandas DataFrame
    try:
        df = pd.read_excel(excel_file_path)
        print(f"Successfully loaded {len(df)} records from {excel_file_path}")
    except Exception as e:
        print(f"Error reading Excel file: {e}")
        return

    # Rename columns to match the desired database schema
    column_mapping = {
        'Name': 'Name',
        'Evolution': 'Evolution',
        'EvolutionStage': 'EvolutionStage',
        'WebCardID': 'CardID',
        'ImageURL': 'ImageURL',
        'CardType': 'CardType',
        'HP': 'HP',
        'Attribute': 'Type',
        'Ability': 'AbilityName',
        'AbilityDesc': 'AbilityEffect',
        'Skill1Name': 'Skill1Name',
        'Skill1Cost': 'Skill1Energy',
        'Skill1Damage': 'Skill1Damage',
        'Skill1Effect': 'Skill1Effect',
        'Skill2Name': 'Skill2Name',
        'Skill2Cost': 'Skill2Energy',
        'Skill2Damage': 'Skill2Damage',
        'Skill2Effect': 'Skill2Effect',
        'Weakness': 'Weakness',
        'WeaknessType': 'WeaknessType',
        'Resistance': 'Resistance',
        'ResistanceType': 'ResistanceType',
        'RetreatCost': 'RetreatCost',
        'CollectorNumber': 'CollectorNumber',
        'Rarity': 'Rarity',
        'Mark': 'RegulationMark',
        'Expansion': 'ExpansionName',
        'ExpansionCode': 'ExpansionCode',
        'Illustrator': 'Illustrator',
        'Artist': 'Artist',
        'PokemonInfo': 'PokemonInfo',
        'Subtypes': 'Subtypes',
        '主要效果類型': 'PrimaryEffectType',
        '特殊效果類型': 'SpecialEffectType',
        'Ability效果統計': 'AbilityStats',
        'Tier': 'Tier',
        'Score': 'Score',
        'ScoreBreakdown': 'ScoreBreakdown',
        'SpecialTag': 'SpecialTag'
    }
    df.rename(columns=column_mapping, inplace=True)

    # Ensure required columns exist, fill missing with empty strings
    for col in column_mapping.values():
        if col not in df.columns:
            df[col] = ''

    # Clean data types
    df['CardID'] = pd.to_numeric(df['CardID'], errors='coerce').fillna(0).astype(int)
    df['HP'] = pd.to_numeric(df['HP'], errors='coerce').fillna(0).astype(int)

    # Connect to SQLite database (it will be created if it doesn't exist)
    try:
        conn = sqlite3.connect(db_file_path)
        cursor = conn.cursor()

        # Create table
        # Using TEXT for most fields for simplicity, as SQLite is flexible.
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS cards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            CardID INTEGER UNIQUE,
            Name TEXT,
            Evolution TEXT,
            EvolutionStage TEXT,
            ImageURL TEXT,
            CardType TEXT,
            HP INTEGER,
            Type TEXT,
            AbilityName TEXT,
            AbilityEffect TEXT,
            Skill1Name TEXT,
            Skill1Energy TEXT,
            Skill1Damage TEXT,
            Skill1Effect TEXT,
            Skill2Name TEXT,
            Skill2Energy TEXT,
            Skill2Damage TEXT,
            Skill2Effect TEXT,
            Weakness TEXT,
            WeaknessType TEXT,
            Resistance TEXT,
            ResistanceType TEXT,
            RetreatCost TEXT,
            CollectorNumber TEXT,
            Rarity TEXT,
            RegulationMark TEXT,
            ExpansionName TEXT,
            ExpansionCode TEXT,
            Illustrator TEXT,
            Artist TEXT,
            PokemonInfo TEXT,
            Subtypes TEXT,
            PrimaryEffectType TEXT,
            SpecialEffectType TEXT,
            AbilityStats TEXT,
            Tier TEXT,
            Score TEXT,
            ScoreBreakdown TEXT,
            SpecialTag TEXT
        )
        ''')

        print("Table 'cards' created successfully.")

        # Insert DataFrame data into the 'cards' table
        # Using 'replace' to ensure that if the script is run again, data is overwritten
        df.to_sql('cards', conn, if_exists='replace', index=False)

        print(f"Successfully inserted {len(df)} records into the database at {os.path.abspath(db_file_path)}")

        # Add an index on CardID for faster lookups
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_card_id ON cards (CardID)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_card_type ON cards (CardType)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_name ON cards (Name)")
        print("Indexes created successfully.")

    except sqlite3.Error as e:
        print(f"Database error: {e}")
    finally:
        if conn:
            conn.commit()
            conn.close()
            print("Database connection closed.")

if __name__ == '__main__':
    # This script assumes it is being run from the 'PTCG_Web' directory
    create_database()