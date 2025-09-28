#!/usr/bin/env python3
"""
Verify ExpansionCode consistency in imported decks
"""
import json
import pandas as pd

def main():
    print("Expansion Code Consistency Verification")
    print("=" * 40)
    
    # Load imported decks
    with open('data/imported_decks.json', 'r', encoding='utf-8') as f:
        decks = json.load(f)
    
    # Load cards database to get ExpansionCode for each card
    cards_df = pd.read_csv('source/cards_output_all_mega.csv', encoding='utf-8')
    cards_dict = {}
    for _, card in cards_df.iterrows():
        card_id = card.get('CardID') or card.get('WebCardID')
        if pd.notna(card_id) and card_id != '':
            try:
                cards_dict[int(card_id)] = {
                    'name': card['Name'],
                    'expansion': card.get('ExpansionCode', 'Unknown')
                }
            except (ValueError, TypeError):
                continue
    
    for deck in decks:
        deck_name = deck['name']
        expected_expansion = 'MBG' if '超級耿鬼ex' in deck_name else 'MBD' if '超級蒂安希ex' in deck_name else 'Unknown'
        
        print(f"\nDeck: {deck_name}")
        print(f"Expected Expansion: {expected_expansion}")
        print("-" * 30)
        
        expansion_counts = {}
        total_cards = 0
        correct_expansion_cards = 0
        
        for card in deck['cards']:
            card_id = card['cardId']
            card_name = card['name']
            quantity = card['quantity']
            
            if card_id in cards_dict:
                card_expansion = cards_dict[card_id]['expansion']
                expansion_counts[card_expansion] = expansion_counts.get(card_expansion, 0) + quantity
                total_cards += quantity
                
                if card_expansion == expected_expansion:
                    correct_expansion_cards += quantity
                else:
                    print(f"  ❌ {card_name} ({quantity}x) -> {card_expansion} (expected {expected_expansion})")
            else:
                print(f"  ❓ {card_name} ({quantity}x) -> Card ID not found in database")
                total_cards += quantity
        
        print(f"\nExpansion breakdown:")
        for expansion, count in sorted(expansion_counts.items()):
            percentage = (count / total_cards) * 100 if total_cards > 0 else 0
            status = "✓" if expansion == expected_expansion else "❌"
            print(f"  {status} {expansion}: {count} cards ({percentage:.1f}%)")
        
        consistency = (correct_expansion_cards / total_cards) * 100 if total_cards > 0 else 0
        print(f"\nConsistency Score: {consistency:.1f}% ({correct_expansion_cards}/{total_cards} cards)")

if __name__ == "__main__":
    main()