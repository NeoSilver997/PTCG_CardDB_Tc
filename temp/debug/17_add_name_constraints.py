#!/usr/bin/env python3
"""
17_add_name_constraints.py
Add constraints to prevent empty card names in the database.
"""

import sqlite3
import os

def add_name_constraints():
    """Add NOT NULL and CHECK constraints to the name field in cards table."""

    db_path = 'pokemon_cards.db'

    if not os.path.exists(db_path):
        print(f"Database file {db_path} not found!")
        return

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        print("Adding constraints to prevent empty card names...")

        # First, check if there are any NULL or empty names (should be none based on previous checks)
        cursor.execute("SELECT COUNT(*) FROM cards WHERE name IS NULL OR name = ''")
        empty_count = cursor.fetchone()[0]

        if empty_count > 0:
            print(f"Warning: Found {empty_count} cards with empty names. Cannot add constraints.")
            return

        # Add CHECK constraint to ensure name is not empty
        # SQLite doesn't support adding constraints directly, so we need to recreate the table
        print("Recreating cards table with name constraints...")

        # Get the current table schema
        cursor.execute("PRAGMA table_info(cards)")
        columns = cursor.fetchall()

        # Create new table with constraints
        create_table_sql = """
        CREATE TABLE cards_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL CHECK(length(trim(name)) > 0),
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
        """

        cursor.execute(create_table_sql)

        # Copy data from old table to new table
        columns_list = [col[1] for col in columns]  # column names
        columns_str = ', '.join(columns_list)
        cursor.execute(f"INSERT INTO cards_new ({columns_str}) SELECT {columns_str} FROM cards")

        # Drop old table and rename new table
        cursor.execute("DROP TABLE cards")
        cursor.execute("ALTER TABLE cards_new RENAME TO cards")

        # Recreate indexes if they exist
        try:
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_cards_name ON cards(name)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_cards_type ON cards(card_type)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_cards_expansion ON cards(expansion_id)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_cards_rarity ON cards(rarity)")
        except Exception as e:
            print(f"Warning: Could not recreate indexes: {e}")

        conn.commit()

        # Verify the constraint works
        print("Testing constraint with invalid data...")
        try:
            cursor.execute("INSERT INTO cards (name) VALUES ('')")
            print("ERROR: Constraint not working - empty string was inserted!")
        except sqlite3.IntegrityError:
            print("✓ Constraint working: Empty string rejected")

        try:
            cursor.execute("INSERT INTO cards (name) VALUES (NULL)")
            print("ERROR: Constraint not working - NULL was inserted!")
        except sqlite3.IntegrityError:
            print("✓ Constraint working: NULL rejected")

        conn.rollback()  # Don't keep the test inserts

        print("✓ Successfully added name constraints to cards table")
        print("✓ Name field now requires non-empty, non-null values")

    except Exception as e:
        print(f"Error adding constraints: {e}")
        if conn:
            conn.rollback()
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    add_name_constraints()