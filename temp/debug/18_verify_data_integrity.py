#!/usr/bin/env python3
"""
18_verify_data_integrity.py
Comprehensive verification of database constraints and data integrity.
"""

import sqlite3
import os

def verify_data_integrity():
    """Verify all database constraints and data integrity rules."""

    db_path = 'pokemon_cards.db'

    if not os.path.exists(db_path):
        print(f"Database file {db_path} not found!")
        return

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        print("=== DATABASE INTEGRITY VERIFICATION ===\n")

        # 1. Check name constraints
        print("1. Name Field Constraints:")
        cursor.execute("SELECT COUNT(*) FROM cards WHERE name IS NULL OR length(trim(name)) = 0")
        invalid_names = cursor.fetchone()[0]
        print(f"   Cards with invalid names: {invalid_names}")

        if invalid_names == 0:
            print("   ✓ Name constraints working correctly")
        else:
            print("   ✗ Name constraints violated!")

        # 2. Check card type validity
        print("\n2. Card Type Validation:")
        valid_types = ['寶可夢', '物品卡', '支援者', '競技場']
        cursor.execute("SELECT DISTINCT card_type FROM cards WHERE card_type IS NOT NULL")
        types_in_db = [row[0] for row in cursor.fetchall()]

        invalid_types = [t for t in types_in_db if t not in valid_types]
        if invalid_types:
            print(f"   Invalid card types found: {invalid_types}")
        else:
            print("   ✓ All card types are valid")

        # 3. Check Pokemon cards have HP
        print("\n3. Pokemon HP Validation:")
        cursor.execute("""
            SELECT COUNT(*) FROM cards
            WHERE card_type = '寶可夢' AND (hp IS NULL OR hp <= 0)
        """)
        pokemon_without_hp = cursor.fetchone()[0]
        print(f"   Pokemon cards without valid HP: {pokemon_without_hp}")

        if pokemon_without_hp == 0:
            print("   ✓ All Pokemon cards have valid HP")
        else:
            print("   ⚠ Some Pokemon cards missing HP (may be valid for some cards)")

        # 4. Check foreign key integrity
        print("\n4. Foreign Key Integrity:")

        # Check expansion_id references
        cursor.execute("""
            SELECT COUNT(*) FROM cards
            WHERE expansion_id IS NOT NULL AND expansion_id NOT IN (SELECT id FROM expansions)
        """)
        invalid_expansions = cursor.fetchone()[0]
        print(f"   Cards with invalid expansion_id: {invalid_expansions}")

        # Check illustrator_id references
        cursor.execute("""
            SELECT COUNT(*) FROM cards
            WHERE illustrator_id IS NOT NULL AND illustrator_id NOT IN (SELECT id FROM illustrators)
        """)
        invalid_illustrators = cursor.fetchone()[0]
        print(f"   Cards with invalid illustrator_id: {invalid_illustrators}")

        if invalid_expansions == 0 and invalid_illustrators == 0:
            print("   ✓ All foreign key references are valid")
        else:
            print("   ✗ Foreign key violations found!")

        # 5. Check rarity values
        print("\n5. Rarity Value Validation:")
        valid_rarities = ['C', 'R', 'U', 'S', 'SR', 'AR', 'RR', 'MUR', 'BWR', 'ACE', 'SSR', 'UR', 'SAR']
        cursor.execute("SELECT DISTINCT rarity FROM cards WHERE rarity IS NOT NULL")
        rarities_in_db = [row[0] for row in cursor.fetchall()]

        invalid_rarities = [r for r in rarities_in_db if r not in valid_rarities]
        if invalid_rarities:
            print(f"   Invalid rarities found: {invalid_rarities}")
        else:
            print("   ✓ All rarity values are valid")

        # 6. Check evolution stage values
        print("\n6. Evolution Stage Validation:")
        valid_stages = ['基礎', '1階進化', '2階進化']
        cursor.execute("SELECT DISTINCT evolution_stage FROM cards WHERE evolution_stage IS NOT NULL")
        stages_in_db = [row[0] for row in cursor.fetchall()]

        invalid_stages = [s for s in stages_in_db if s not in valid_stages]
        if invalid_stages:
            print(f"   Invalid evolution stages found: {invalid_stages}")
        else:
            print("   ✓ All evolution stages are valid")

        # 7. Summary statistics
        print("\n7. Database Summary:")
        cursor.execute("SELECT COUNT(*) FROM cards")
        total_cards = cursor.fetchone()[0]
        print(f"   Total cards: {total_cards}")

        cursor.execute("SELECT COUNT(DISTINCT expansion_id) FROM cards WHERE expansion_id IS NOT NULL")
        expansions_used = cursor.fetchone()[0]
        print(f"   Expansions referenced: {expansions_used}")

        cursor.execute("SELECT COUNT(DISTINCT illustrator_id) FROM cards WHERE illustrator_id IS NOT NULL")
        illustrators_used = cursor.fetchone()[0]
        print(f"   Illustrators referenced: {illustrators_used}")

        print("\n=== VERIFICATION COMPLETE ===")

        # Overall assessment
        issues_found = invalid_names + len(invalid_types) + invalid_expansions + invalid_illustrators + len(invalid_rarities) + len(invalid_stages)

        if issues_found == 0:
            print("✓ Database integrity is excellent - no issues found!")
        else:
            print(f"⚠ Found {issues_found} data integrity issues that should be addressed")

    except Exception as e:
        print(f"Error during verification: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    verify_data_integrity()