#!/usr/bin/env python3
"""
Apply Official Expansion Codes from Pokemon Database
Updates all construction decks to use the correct official expansion codes
"""

import json

def apply_official_expansion_codes():
    """Apply the official expansion codes from the Pokemon database"""
    print("🔧 Applying official expansion codes from Pokemon database...")
    
    # Load current decks
    with open("../data/all_construction_decks.json", "r", encoding="utf-8") as f:
        decks = json.load(f)
    
    # Official expansion code mapping from the provided data
    official_mapping = {
        # ex Starter Decks
        "ex初階牌組 皮卡丘": "SVQP",
        
        # Challenge Decks  
        "MBG - 挑戰牌組 超級耿鬼ex": "MBG",
        "MBD - 挑戰牌組 超級蒂安希ex": "MBD", 
        "挑戰牌組 瑪俐的莫魯貝可&長毛巨魔ex": "SVOM",
        "挑戰牌組 大吾的鐵啞鈴&巨金怪ex": "SVOD",
        
        # Tactical Decks
        "戰術牌組 魔幻假面喵ex": "SVTM",  # 魔幻假面喵ex = Meowscarada ex
        "戰術牌組 沙奈朵ex": "SVTS",      # 沙奈朵ex = Gardevoir ex
        
        # Starting Set - map to general ex starter category
        "起始組合 未來密勒頓ex": "SVD"    # General ex starter deck code
    }
    
    print("📋 Applying official expansion codes:")
    
    for deck in decks:
        deck_name = deck["name"]
        if deck_name in official_mapping:
            new_expansion = official_mapping[deck_name]
            old_expansion = deck.get("expansion", "None")
            
            print(f"   {deck_name}")
            print(f"      {old_expansion} -> {new_expansion}")
            
            # Update deck expansion
            deck["expansion"] = new_expansion
            
            # Update all card expansions
            for card in deck["cards"]:
                card["expansion"] = new_expansion
        else:
            print(f"   ⚠️  Unknown deck: {deck_name} - keeping current expansion")
    
    # Save updated decks
    with open("../data/all_construction_decks.json", "w", encoding="utf-8") as f:
        json.dump(decks, f, ensure_ascii=False, indent=2)
    
    print("\n✅ Official expansion codes applied!")
    
    # Show final distribution
    print("\n📊 Final Official Expansion Code Distribution:")
    expansion_counts = {}
    for deck in decks:
        exp = deck.get("expansion", "Unknown")
        if exp not in expansion_counts:
            expansion_counts[exp] = []
        expansion_counts[exp].append(deck["name"])
    
    for exp in sorted(expansion_counts.keys()):
        deck_names = expansion_counts[exp]
        print(f"   {exp}: {len(deck_names)} deck(s)")
        for name in deck_names:
            print(f"      - {name}")

if __name__ == "__main__":
    apply_official_expansion_codes()