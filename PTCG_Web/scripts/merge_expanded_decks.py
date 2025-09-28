#!/usr/bin/env python3
"""
Merge New Construction Decks with Existing Collection
Combines newly discovered decks with the current deck collection
"""

import json
import sys
from datetime import datetime

def load_existing_decks(file_path: str) -> list:
    """Load existing construction decks"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            decks = json.load(f)
        print(f"✅ Loaded {len(decks)} existing decks from {file_path}")
        return decks
    except Exception as e:
        print(f"❌ Error loading existing decks: {e}")
        return []

def load_new_decks(file_path: str) -> list:
    """Load newly discovered decks"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            decks = json.load(f)
        print(f"✅ Loaded {len(decks)} new decks from {file_path}")
        return decks
    except Exception as e:
        print(f"❌ Error loading new decks: {e}")
        return []

def merge_decks(existing_decks: list, new_decks: list) -> list:
    """Merge deck collections, avoiding duplicates"""
    print("🔄 Merging deck collections...")
    
    # Get existing deck names for duplicate checking
    existing_names = {deck['name'] for deck in existing_decks}
    
    merged_decks = existing_decks.copy()
    added_count = 0
    
    for new_deck in new_decks:
        if new_deck['name'] not in existing_names:
            merged_decks.append(new_deck)
            added_count += 1
            print(f"   ➕ Added: {new_deck['name']}")
        else:
            print(f"   ⚠️  Skipped duplicate: {new_deck['name']}")
    
    print(f"✅ Merged collection: {len(existing_decks)} existing + {added_count} new = {len(merged_decks)} total decks")
    return merged_decks

def save_merged_decks(decks: list, output_file: str = "all_construction_decks_expanded.json"):
    """Save merged deck collection"""
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(decks, f, ensure_ascii=False, indent=2)
        print(f"💾 Saved {len(decks)} decks to {output_file}")
        return True
    except Exception as e:
        print(f"❌ Failed to save merged decks: {e}")
        return False

def main():
    """Main execution function"""
    print("🚀 Starting Construction Deck Merger...")
    
    # Load existing decks
    existing_decks = load_existing_decks("../data/all_construction_decks.json")
    
    # Load new decks
    new_decks = load_new_decks("new_construction_decks.json")
    
    if not existing_decks and not new_decks:
        print("❌ No decks to merge")
        return
    
    # Merge decks
    merged_decks = merge_decks(existing_decks, new_decks)
    
    # Save merged collection
    if save_merged_decks(merged_decks):
        print("\n📊 Final Collection Summary:")
        for i, deck in enumerate(merged_decks, 1):
            total_cards = sum(card['quantity'] for card in deck['cards'])
            print(f"   {i:2d}. {deck['name']} - {len(deck['cards'])} unique cards, {total_cards} total")
        
        print(f"\n🎉 Successfully expanded construction deck collection!")
        print(f"📈 Total decks: {len(merged_decks)}")
        print(f"💾 Output: all_construction_decks_expanded.json")
    else:
        print("❌ Failed to save merged collection")

if __name__ == "__main__":
    main()