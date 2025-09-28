#!/usr/bin/env python3
"""
Merge all imported construction decks into final application format
"""

import json

def merge_all_construction_decks():
    """Merge official decks and newly imported decks"""
    
    # Load existing official decks
    with open('official_construction_decks.json', 'r', encoding='utf-8') as f:
        official_decks = json.load(f)
    
    # Load newly imported target decks  
    with open('target_construction_decks.json', 'r', encoding='utf-8') as f:
        target_decks = json.load(f)
    
    # Convert all to application format
    all_decks = []
    
    print("🔄 Converting decks to application format...")
    
    # Process existing official decks (MBG and MBD)
    for deck_key, deck_data in official_decks.items():
        app_deck = convert_to_app_format(deck_data)
        all_decks.append(app_deck)
        print(f"   ✅ Converted: {app_deck['name']}")
    
    # Process newly imported target decks
    for deck_key, deck_data in target_decks.items():
        app_deck = convert_to_app_format(deck_data)
        all_decks.append(app_deck)
        print(f"   ✅ Converted: {app_deck['name']}")
    
    # Save the complete collection
    with open('../data/all_construction_decks.json', 'w', encoding='utf-8') as f:
        json.dump(all_decks, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ Final collection: {len(all_decks)} construction decks saved")
    
    # Print complete summary
    print("\n📋 Complete Construction Deck Collection:")
    for deck in all_decks:
        total_cards = sum(card['quantity'] for card in deck['cards'])
        matched_cards = sum(1 for card in deck['cards'] if card.get('cardId'))
        print(f"   🎯 {deck['name']}:")
        print(f"      📊 {len(deck['cards'])} unique cards, {total_cards} total cards")
        print(f"      🔗 {matched_cards} cards with database IDs")
        
        # Show sample cards
        sample_cards = deck['cards'][:3]
        sample_text = ', '.join([f"{card['name']} x{card['quantity']}" for card in sample_cards])
        print(f"      🃏 Sample: {sample_text}")

def convert_to_app_format(deck_data):
    """Convert deck data to application format"""
    app_deck = {
        "name": deck_data["name"],
        "description": deck_data["description"],
        "format": "Standard",
        "cards": [],
        "source": deck_data.get("source", "Official Pokemon Card Website"),
        "url": deck_data.get("url", ""),
        "scraped_at": deck_data.get("scraped_at", "")
    }
    
    # Convert cards to application format
    for card in deck_data["cards"]:
        # Determine card type based on name content
        card_type = determine_card_type(card["name"])
        
        app_card = {
            "cardId": int(card["card_id"]) if card.get("card_id") else None,
            "name": card["name"],
            "quantity": card["quantity"],
            "type": card_type,
            "expansion": card.get("expansion_code", ""),
            "rarity": "normal",
            "confidence": 1.0
        }
        app_deck["cards"].append(app_card)
    
    return app_deck

def determine_card_type(card_name):
    """Determine card type based on name"""
    if '能量' in card_name:
        return "能量"
    
    # List of known Pokemon names/keywords
    pokemon_keywords = [
        'ex', 'EX', 'GX', 'V', 'VMAX', 'VSTAR', 
        '鬼斯', '超級', '黑暗', '烏鴉', '勾魂', '阿勃', '無極', '桃歹', '米立',
        '布魯', '克雷', '美洛', '蒂安', '謎擬', '小仙', '霜奶', '拉帝',
        '莫魯', '長毛', '搣蛋', '詐唬', '皮卡', '雷丘', '帕奇', '電飛',
        '雷電', '頑皮', '麻麻', '魔幻', '花葉', '新葉', '勒克', '豪力',
        '腕力', '怪力', '土居', '鐵面', '沙奈', '奇魯', '拉魯', '胡帕',
        '太陽', '伊布', '未來', '密勒', '雷電龍', '電海燕', '太晶', '羅托',
        '噴火龍', '妙蛙種子', '水箭龜'
    ]
    
    for keyword in pokemon_keywords:
        if keyword in card_name:
            return "寶可夢"
    
    # If not energy and not clearly Pokemon, assume trainer
    return "訓練家"

if __name__ == "__main__":
    merge_all_construction_decks()