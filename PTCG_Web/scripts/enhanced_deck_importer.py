#!/usr/bin/env python3
"""
Pokemon TCG Deck Importer - Enhanced Version
Integrates with existing PTCG card database to match scraped cards
"""

import requests
import json
import csv
import os
import re
import time
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import sqlite3
from pathlib import Path

@dataclass
class CardMatch:
    """Represents a matched card from the database"""
    card_id: int
    name: str
    card_type: str
    expansion: str
    rarity: str
    confidence: float

class DatabaseCardMatcher:
    """Matches scraped card names with existing card database"""
    
    def __init__(self, csv_file_path: str):
        self.cards_data = []
        self.load_cards_from_csv(csv_file_path)
    
    def load_cards_from_csv(self, csv_file_path: str):
        """Load card data from CSV file"""
        try:
            # Use utf-8-sig to handle BOM (Byte Order Mark)
            with open(csv_file_path, 'r', encoding='utf-8-sig') as f:
                reader = csv.DictReader(f)
                for i, row in enumerate(reader):
                    self.cards_data.append(row)
            print(f"Loaded {len(self.cards_data)} cards from database")
        except FileNotFoundError:
            print(f"Card database file not found: {csv_file_path}")
        except Exception as e:
            print(f"Error loading card database: {e}")
            import traceback
            traceback.print_exc()
    
    def normalize_name(self, name: str) -> str:
        """Normalize card name for better matching"""
        # Remove common suffixes and prefixes
        name = re.sub(r'\s+(ex|EX|gx|GX|v|V|vmax|VMAX|vstar|VSTAR)$', '', name, flags=re.IGNORECASE)
        name = re.sub(r'^(Team\s+)?', '', name, flags=re.IGNORECASE)
        
        # Remove special characters and normalize spaces
        name = re.sub(r'[^\w\s]', '', name)
        name = re.sub(r'\s+', ' ', name)
        
        return name.strip().lower()
    
    def calculate_similarity(self, name1: str, name2: str) -> float:
        """Calculate similarity score between two names (simple implementation)"""
        norm1 = self.normalize_name(name1)
        norm2 = self.normalize_name(name2)
        
        # Exact match
        if norm1 == norm2:
            return 1.0
        
        # Direct string matching for Chinese characters (without normalization issues)
        if name1.strip() == name2.strip():
            return 1.0
        
        if name1.strip() in name2.strip() or name2.strip() in name1.strip():
            return 0.9
        
        # Simple word matching
        words1 = set(norm1.split())
        words2 = set(norm2.split())
        
        if not words1 or not words2:
            return 0.0
        
        intersection = words1 & words2
        union = words1 | words2
        
        return len(intersection) / len(union) if union else 0.0
    
    def find_best_match(self, scraped_name: str, expansion_code: str = None, min_confidence: float = 0.5) -> Optional[CardMatch]:
        """Find the best matching card in the database"""
        best_match = None
        best_score = 0.0
        
        # First try exact match with expansion code preference
        for card in self.cards_data:
            card_name = card.get('Name', '')
            card_expansion = card.get('ExpansionCode', '')
            if not card_name:
                continue
                
            if card_name.strip() == scraped_name.strip():
                confidence = 1.0
                # Boost confidence if expansion code matches
                if expansion_code and card_expansion == expansion_code:
                    confidence = 1.1  # Priority for correct expansion
                    
                match = CardMatch(
                    card_id=int(card.get('CardID', 0) or card.get('WebCardID', '0')),
                    name=card_name,
                    card_type=card.get('CardType', ''),
                    expansion=card.get('ExpansionName', ''),
                    rarity=card.get('Rarity', ''),
                    confidence=confidence
                )
                
                if confidence > best_score:
                    best_score = confidence
                    best_match = match
        
        # Return exact match if found
        if best_match and best_score >= 1.0:
            return best_match
        
        # Then try similarity matching
        for card in self.cards_data:
            card_name = card.get('Name', '')
            if not card_name:
                continue
            
            score = self.calculate_similarity(scraped_name, card_name)
            if score > best_score and score >= min_confidence:
                best_score = score
                best_match = CardMatch(
                    card_id=int(card.get('CardID', 0) or card.get('WebCardID', '0')),
                    name=card_name,
                    card_type=card.get('CardType', ''),
                    expansion=card.get('ExpansionName', ''),
                    rarity=card.get('Rarity', ''),
                    confidence=score
                )
        
        return best_match

class EnhancedPokemonDeckScraper:
    """Enhanced scraper with database integration"""
    
    def __init__(self, cards_csv_path: str):
        self.base_url = "https://asia.pokemon-card.com"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        
        # Initialize card matcher
        self.card_matcher = DatabaseCardMatcher(cards_csv_path)
        
        # Store results
        self.scraped_decks = []
        self.unmatched_cards = []
    
    def scrape_construction_decks(self) -> List[Dict]:
        """Main scraping function"""
        print("Starting enhanced deck scraping with database matching...")
        
        # Construction deck data based on actual cards from expansion sets
        # MBG = 挑戰牌組「超級耿鬼ex」, MBD = 挑戰牌組「超級蒂安希ex」
        construction_decks = [
            {
                "name": "挑戰牌組 超級耿鬼ex",
                "description": "Challenge Deck featuring Super Gengar ex with Ghost-type synergy",
                "expansionCode": "MBG",
                "cards": [
                    ("鬼斯", 4),           # 00014383
                    ("鬼斯通", 2),         # 00014384
                    ("超級耿鬼ex", 2),     # 00014385
                    ("黑暗鴉", 3),         # 00014386
                    ("烏鴉頭頭", 2),       # 00014387
                    ("勾魂眼", 3),         # 00014388
                    ("阿勃梭魯", 2),       # 00014389
                    ("無極汰那", 1),       # 00014390
                    ("桃歹郎ex", 2),       # 00014391
                    ("米立龍", 2),         # 00014392
                    ("好友寶芬", 3),       # 00014393
                    ("高級球", 4),         # 00014394
                    ("神奇糖果", 2),       # 00014395
                    ("頂尖捕捉器", 2),     # 00014396
                    ("寶可夢交替", 3),     # 00014397
                    ("超級信號", 2),       # 00014398
                    ("夜間擔架", 2),       # 00014399
                    ("龐克頭盔", 2),       # 00014400
                    ("氣球", 2),           # 00014401
                    ("艾莉絲的鬥志", 3),   # 00014402
                    ("老大的指令", 2),     # 00014403
                ]
            },
            {
                "name": "挑戰牌組 超級蒂安希ex", 
                "description": "Challenge Deck featuring Super Diancie ex with Fairy-type focus",
                "expansionCode": "MBD",
                "cards": [
                    ("布魯", 3),           # 00014359
                    ("布魯皇", 2),         # 00014360
                    ("拉帝亞斯ex", 2),     # 00014361
                    ("克雷色利亞", 2),     # 00014362
                    ("美洛耶塔", 2),       # 00014363
                    ("超級蒂安希ex", 2),   # 00014364
                    ("謎擬Q", 3),          # 00014365
                    ("小仙奶", 3),         # 00014366
                    ("霜奶仙", 2),         # 00014367
                    ("米立龍", 2),         # 00014368
                    ("不公印章", 2),       # 00014369
                    ("好友寶芬", 3),       # 00014370
                    ("高級球", 4),         # 00014372
                    ("神奇糖果", 2),       # 00014373
                    ("頂尖捕捉器", 2),     # 00014374
                    ("寶可夢交替", 3),     # 00014375
                    ("超級信號", 2),       # 00014376
                    ("夜間擔架", 2),       # 00014377
                    ("龐克頭盔", 1),       # 00014378
                    ("氣球", 2),           # 00014379
                    ("艾莉絲的鬥志", 2),   # 00014380
                    ("老大的指令", 2),     # 00014381
                ]
            }
        ]
        
        # Process each deck
        for deck_info in construction_decks:
            processed_deck = self.process_deck(deck_info)
            if processed_deck:
                self.scraped_decks.append(processed_deck)
        
        print(f"Processed {len(self.scraped_decks)} construction decks")
        return self.scraped_decks
    
    def process_deck(self, deck_info: Dict) -> Optional[Dict]:
        """Process a single deck with card matching"""
        deck_name = deck_info["name"]
        expansion_code = deck_info.get("expansionCode")
        print(f"Processing deck: {deck_name} (Expansion: {expansion_code})")
        
        matched_cards = []
        unmatched_count = 0
        
        for card_name, quantity in deck_info["cards"]:
            print(f"  Searching for: '{card_name}' in expansion {expansion_code}")
            
            # Debug: show some similar names from database
            similar_names = []
            for card in self.card_matcher.cards_data[:50]:  # Check first 50 cards for debugging
                db_name = card.get('Name', '')
                if card_name in db_name or db_name in card_name:
                    similar_names.append(f"{db_name} ({card.get('ExpansionCode', 'N/A')})")
            
            if similar_names:
                print(f"    Similar names found: {similar_names[:3]}")
            
            match = self.card_matcher.find_best_match(card_name, expansion_code)
            
            if match:
                matched_cards.append({
                    "cardId": match.card_id,
                    "name": match.name,
                    "quantity": quantity,
                    "type": match.card_type,
                    "expansion": match.expansion,
                    "rarity": match.rarity,
                    "confidence": match.confidence
                })
                print(f"  ✓ Matched: {card_name} -> {match.name} [ID: {match.card_id}] (confidence: {match.confidence:.2f})")
            else:
                unmatched_count += 1
                self.unmatched_cards.append({
                    "deck": deck_name,
                    "card": card_name,
                    "quantity": quantity
                })
                print(f"  ✗ Unmatched: {card_name}")
        
        if matched_cards:
            return {
                "name": deck_name,
                "description": deck_info["description"],
                "format": "Standard",
                "cards": matched_cards,
                "createdAt": time.strftime("%Y-%m-%d"),
                "tags": ["Official", "Construction Deck", "Standard"],
                "expansionCode": expansion_code,
                "matchStats": {
                    "totalCards": len(deck_info["cards"]),
                    "matchedCards": len(matched_cards),
                    "unmatchedCards": unmatched_count
                }
            }
        
        return None
    
    def export_results(self):
        """Export all results to files"""
        # Export matched decks
        if self.scraped_decks:
            with open("construction_decks.json", 'w', encoding='utf-8') as f:
                json.dump(self.scraped_decks, f, indent=2, ensure_ascii=False)
            print(f"Exported {len(self.scraped_decks)} decks to construction_decks.json")
        
        # Export unmatched cards for manual review
        if self.unmatched_cards:
            with open("unmatched_cards.csv", 'w', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                writer.writerow(['Deck', 'Card Name', 'Quantity'])
                for card in self.unmatched_cards:
                    writer.writerow([card['deck'], card['card'], card['quantity']])
            print(f"Exported {len(self.unmatched_cards)} unmatched cards to unmatched_cards.csv")
        
        # Export summary
        with open("import_summary.txt", 'w', encoding='utf-8') as f:
            f.write("Pokemon TCG Construction Deck Import Summary\n")
            f.write("=" * 50 + "\n\n")
            f.write(f"Total decks processed: {len(self.scraped_decks)}\n")
            f.write(f"Total unmatched cards: {len(self.unmatched_cards)}\n\n")
            
            for deck in self.scraped_decks:
                stats = deck['matchStats']
                f.write(f"Deck: {deck['name']}\n")
                f.write(f"  Cards: {stats['matchedCards']}/{stats['totalCards']} matched\n")
                f.write(f"  Match rate: {stats['matchedCards']/stats['totalCards']*100:.1f}%\n\n")
        
        print("Export complete!")

def main():
    """Main function"""
    print("Enhanced Pokemon TCG Construction Deck Importer")
    print("=" * 50)
    
    # Path to your card database CSV
    cards_csv_path = "../data/pokemon_cards.csv"  # Adjust path as needed
    
    if not os.path.exists(cards_csv_path):
        print(f"Card database not found at: {cards_csv_path}")
        print("Please ensure your card database CSV file is available.")
        return
    
    # Initialize scraper
    scraper = EnhancedPokemonDeckScraper(cards_csv_path)
    
    # Scrape and process decks
    decks = scraper.scrape_construction_decks()
    
    # Export results
    scraper.export_results()
    
    print("\nImport complete! Files generated:")
    print("- construction_decks.json (ready for import)")
    print("- unmatched_cards.csv (for manual review)")
    print("- import_summary.txt (process summary)")

if __name__ == "__main__":
    main()