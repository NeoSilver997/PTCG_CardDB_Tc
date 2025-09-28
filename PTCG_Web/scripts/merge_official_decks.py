#!/usr/bin/env python3
"""
Update imported decks with web-scraped official construction decks
"""

import json

def merge_official_decks():
    """Merge officially scraped decks with imported decks"""
    
    # Load the officially scraped decks
    with open('official_construction_decks.json', 'r', encoding='utf-8') as f:
        official_decks = json.load(f)
    
    # Convert to the format expected by our web application
    updated_decks = []
    
    for deck_key, deck_data in official_decks.items():
        # Convert from web-scraped format to application format
        app_deck = {
            "name": deck_data["name"],
            "description": deck_data["description"],
            "format": "Standard",
            "cards": [],
            "source": deck_data["source"],
            "url": deck_data["url"],
            "scraped_at": deck_data["scraped_at"]
        }
        
        # Convert cards to application format
        for card in deck_data["cards"]:
            app_card = {
                "cardId": int(card["card_id"]) if card["card_id"] else None,
                "name": card["name"],
                "quantity": card["quantity"],
                "type": "寶可夢" if "ex" in card["name"] or any(keyword in card["name"] for keyword in ["鬼斯", "黑暗", "布魯", "克雷", "美洛", "蒂安", "謎擬", "小仙", "霜奶", "拉帝", "米立", "烏鴉", "勾魂", "阿勃", "無極", "桃歹"]) else ("訓練家" if "能量" not in card["name"] else "能量"),
                "expansion": card["expansion_code"],
                "rarity": "normal",
                "confidence": 1.0
            }
            app_deck["cards"].append(app_card)
        
        updated_decks.append(app_deck)
    
    # Save the updated decks
    with open('../data/imported_decks_updated.json', 'w', encoding='utf-8') as f:
        json.dump(updated_decks, f, ensure_ascii=False, indent=2)
    
    print(f"✅ Updated {len(updated_decks)} official construction decks")
    
    # Print summary
    for deck in updated_decks:
        total_cards = sum(card['quantity'] for card in deck['cards'])
        matched_cards = sum(1 for card in deck['cards'] if card['cardId'])
        print(f"   📋 {deck['name']}:")
        print(f"      🎯 {len(deck['cards'])} unique cards, {total_cards} total cards")
        print(f"      🔗 {matched_cards} cards matched to database")

if __name__ == "__main__":
    merge_official_decks()