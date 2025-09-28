#!/usr/bin/env python3
"""
Construction Deck Expansion Code Standardizer
Assigns proper expansion codes (SVQP, SVQL, SVOD, SVOM) to all construction decks
"""

import json
import sys
from datetime import datetime

def load_decks(file_path: str) -> list:
    """Load construction decks from JSON file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            decks = json.load(f)
        print(f"✅ Loaded {len(decks)} decks from {file_path}")
        return decks
    except Exception as e:
        print(f"❌ Error loading decks: {e}")
        return []

def assign_expansion_codes(decks: list) -> list:
    """Assign proper expansion codes to all decks"""
    print("🔄 Standardizing expansion codes...")
    
    # Expansion code mapping based on deck types and names
    expansion_mapping = {
        # Challenge Decks - SVOM (Marie's) and SVOD (Daigo's) 
        'MBG - 挑戰牌組 超級耿鬼ex': 'SVOM',
        'MBD - 挑戰牌組 超級蒂安希ex': 'SVOM', 
        '挑戰牌組 瑪俐的莫魯貝可&長毛巨魔ex': 'SVOM',
        '挑戰牌組 大吾的鐵啞鈴&巨金怪ex': 'SVOD',
        
        # ex Starter Decks - SVQP (Pikachu) and SVQL (Charizard)
        'ex初階牌組 皮卡丘': 'SVQP',
        
        # Tactical Decks - SVT series
        '戰術牌組 魔幻假面喵ex': 'SVQT',  # Tactical deck series
        '戰術牌組 沙奈朵ex': 'SVQT',
        
        # Starting Set - SVQS
        '起始組合 未來密勒頓ex': 'SVQS'
    }
    
    updated_decks = []
    
    for deck in decks:
        deck_name = deck['name']
        target_expansion = expansion_mapping.get(deck_name, 'SVQP')  # Default to SVQP
        
        print(f"   📋 {deck_name}")
        print(f"      🏷️  Assigning expansion: {target_expansion}")
        
        # Update all cards in the deck
        updated_cards = []
        for card in deck['cards']:
            updated_card = card.copy()
            updated_card['expansion'] = target_expansion
            updated_cards.append(updated_card)
        
        # Create updated deck
        updated_deck = deck.copy()
        updated_deck['cards'] = updated_cards
        
        # Add expansion info to deck metadata if not present
        if 'expansion' not in updated_deck:
            updated_deck['expansion'] = target_expansion
            
        updated_decks.append(updated_deck)
        
        print(f"      ✅ Updated {len(updated_cards)} cards")
        
    print(f"✅ Standardized expansion codes for {len(updated_decks)} decks")
    return updated_decks

def save_decks(decks: list, output_file: str = "all_construction_decks_standardized.json"):
    """Save standardized decks to JSON file"""
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(decks, f, ensure_ascii=False, indent=2)
        print(f"💾 Saved {len(decks)} standardized decks to {output_file}")
        return True
    except Exception as e:
        print(f"❌ Failed to save decks: {e}")
        return False

def validate_expansion_codes(decks: list):
    """Validate that all decks have consistent expansion codes"""
    print("\n📊 Expansion Code Validation:")
    
    expansion_stats = {}
    
    for deck in decks:
        deck_expansion = deck.get('expansion', 'Unknown')
        if deck_expansion not in expansion_stats:
            expansion_stats[deck_expansion] = []
        expansion_stats[deck_expansion].append(deck['name'])
        
        # Check card consistency
        card_expansions = set()
        for card in deck['cards']:
            if 'expansion' in card:
                card_expansions.add(card['expansion'])
        
        if len(card_expansions) > 1:
            print(f"   ⚠️  {deck['name']}: Mixed expansions {card_expansions}")
        elif len(card_expansions) == 1:
            card_exp = list(card_expansions)[0]
            if card_exp != deck_expansion:
                print(f"   ⚠️  {deck['name']}: Deck={deck_expansion}, Cards={card_exp}")
    
    print("\n📈 Final Expansion Distribution:")
    for expansion, deck_names in expansion_stats.items():
        print(f"   {expansion}: {len(deck_names)} decks")
        for name in deck_names:
            print(f"      - {name}")
    
def main():
    """Main execution function"""
    print("🚀 Starting Construction Deck Expansion Code Standardization...")
    
    # Load current decks
    decks = load_decks("../data/all_construction_decks.json")
    
    if not decks:
        print("❌ No decks to process")
        return
    
    # Assign standard expansion codes
    standardized_decks = assign_expansion_codes(decks)
    
    # Validate the results
    validate_expansion_codes(standardized_decks)
    
    # Save standardized decks
    if save_decks(standardized_decks):
        print("\n🎉 Expansion code standardization complete!")
        print("📁 Output: all_construction_decks_standardized.json")
        print("🔄 Ready to replace main data file")
    else:
        print("❌ Failed to save standardized decks")

if __name__ == "__main__":
    main()