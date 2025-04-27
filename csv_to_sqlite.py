import sqlite3
import csv
import argparse
from typing import List, Dict, Any
import logging

logging.basicConfig(level=logging.INFO)

def create_table(conn):
    """Create card_csv table with schema matching CSV structure"""
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS card_csv (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            web_card_id TEXT,
            card_type TEXT,
            name TEXT,
            expansion TEXT,
            number TEXT,
            hp INTEGER,
            attribute TEXT,
            skill1_name TEXT,
            skill1_cost TEXT,
            skill1_damage TEXT,
            skill1_effect TEXT,
            skill2_name TEXT,
            skill2_cost TEXT,
            skill2_damage TEXT,
            skill2_effect TEXT,
            weakness TEXT,
            resistance TEXT,
            retreat_cost TEXT,
            evolution TEXT,
            pokemon_info TEXT,
            artist TEXT,
            evolve_marker TEXT,
            expansion_symbol TEXT,
            subtypes TEXT,
            card_url TEXT,
            image_url TEXT,
            special_feature TEXT  -- For [特性] column
        )
    ''')
    conn.commit()

def batch_insert(conn, rows: List[Dict[str, Any]]):
    """Batch insert records with error handling"""
    # logging.info(f'Inserting {rows} records')
    cursor = conn.cursor()
    try:
        cursor.executemany('''
            INSERT INTO card_csv (
                card_type, name, expansion, number, hp, attribute,
                skill1_name, skill1_cost, skill1_damage, skill1_effect,
                skill2_name, skill2_cost, skill2_damage, skill2_effect,
                weakness, resistance, retreat_cost, evolution, pokemon_info,
                artist, evolve_marker, expansion_symbol, subtypes,
                special_feature , web_card_id ,card_url,image_url
            ) VALUES (
                :Type, :Name, :Expansion, :Number, :HP, :Attribute,
                :Skill1_Name, :Skill1_Cost, :Skill1_Damage, :Skill1_Effect,
                :Skill2_Name, :Skill2_Cost, :Skill2_Damage, :Skill2_Effect,
                :Weakness, :Resistance, :Retreat_Cost, :Evolution, :Pokemon_Info,
                :Artist, :Evolve_Marker, :Expansion_Symbol, :Subtypes,
                :special_feature , :WebCardID , :CardURL,:ImageURL
            )
        ''', rows)
        conn.commit()
        logging.info(f'Inserted {len(rows)} records')
    except Exception as e:
        conn.rollback()
        logging.error(f'Batch insert failed: 1 {str(e)}')

def main(csv_path: str, db_path: str = 'pokemon_cards.db', batch_size: int = 100):
    """Main conversion process"""
    try:
        with sqlite3.connect(db_path) as conn:
            create_table(conn)
            with open(csv_path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                batch = []
                
                for row in reader:
                    # Convert HP to integer
                    # Convert numeric fields
                    try:
                        row['HP'] = int(row['HP'].strip() or 0) if row['HP'] else 0
                    except ValueError as ve:
                        logging.warning(f"Invalid HP value '{row['HP']}' for card {row['Name']}")
                        row['HP'] = 0
                    
                    # Convert Number field to string if alphanumeric
                    row['Number'] = str(row['Number']).strip()
                    
                    # Validate skill costs
                    for skill in ['Skill1_Cost', 'Skill2_Cost']:
                        row[skill] = row[skill] if row[skill].strip() else 'None'
                    
                    batch.append(row)
                    
                    if len(batch) >= batch_size:
                        batch_insert(conn, batch)
                        batch = []
                
                if batch:
                    batch_insert(conn, batch)
            
            logging.info('Data import completed successfully')
            
    except Exception as e:
        logging.error(f'Critical error: {str(e)}')
        raise

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Import Pokemon CSV into SQLite')
    parser.add_argument('--input', required=True, help='Path to input CSV file')
    parser.add_argument('--output', default='pokemon_cards.db', help='Output SQLite database path')
    parser.add_argument('--batch', type=int, default=100, help='Batch size for inserts')
    args = parser.parse_args()
    
    main(args.input, args.output, args.batch)