#!/usr/bin/env python3
"""
Fix Expansion Codes to use only SVQP, SVQL, SVOD, SVOM
"""

import json

def fix_expansion_codes():
    """Fix expansion codes to use only the specified 4 codes"""
    print("🔧 Fixing expansion codes to use only SVQP, SVQL, SVOD, SVOM...")
    
    # Load current decks
    with open("../data/all_construction_decks.json", "r", encoding="utf-8") as f:
        decks = json.load(f)
    
    # Corrected mapping - only using the 4 specified codes
    correct_mapping = {
        # MBG/MBD Challenge decks -> SVOM (Marie's series)
        "MBG - 挑戰牌組 超級耿鬼ex": "SVOM",
        "MBD - 挑戰牌組 超級蒂安希ex": "SVOM", 
        "挑戰牌組 瑪俐的莫魯貝可&長毛巨魔ex": "SVOM",
        
        # Daigo's challenge deck -> SVOD
        "挑戰牌組 大吾的鐵啞鈴&巨金怪ex": "SVOD",
        
        # ex Starter decks -> SVQP and SVQL
        "ex初階牌組 皮卡丘": "SVQP",
        # If there was a Charizard deck, it would be SVQL
        
        # Tactical decks -> SVQL (since no Charizard deck exists)
        "戰術牌組 魔幻假面喵ex": "SVQL",
        "戰術牌組 沙奈朵ex": "SVQL",
        
        # Starting set -> SVQP (group with Pikachu starter)
        "起始組合 未來密勒頓ex": "SVQP"
    }
    
    print("📋 Applying corrected expansion codes:")
    
    for deck in decks:
        deck_name = deck["name"]
        if deck_name in correct_mapping:
            new_expansion = correct_mapping[deck_name]
            old_expansion = deck.get("expansion", "None")
            
            print(f"   {deck_name}")
            print(f"      {old_expansion} -> {new_expansion}")
            
            # Update deck expansion
            deck["expansion"] = new_expansion
            
            # Update all card expansions
            for card in deck["cards"]:
                card["expansion"] = new_expansion
        else:
            print(f"   ⚠️  Unknown deck: {deck_name}")
    
    # Save corrected decks
    with open("../data/all_construction_decks.json", "w", encoding="utf-8") as f:
        json.dump(decks, f, ensure_ascii=False, indent=2)
    
    print("\n✅ Expansion codes corrected!")
    
    # Show final distribution
    print("\n📊 Final Expansion Code Distribution:")
    expansion_counts = {}
    for deck in decks:
        exp = deck.get("expansion", "Unknown")
        if exp not in expansion_counts:
            expansion_counts[exp] = []
        expansion_counts[exp].append(deck["name"])
    
    for exp, deck_names in expansion_counts.items():
        print(f"   {exp}: {len(deck_names)} decks")
        for name in deck_names:
            print(f"      - {name}")

if __name__ == "__main__":
    fix_expansion_codes()