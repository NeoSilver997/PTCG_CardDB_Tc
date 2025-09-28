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
        
        # Special handling for basic energy cards
        if "基本" in scraped_name and "能量" in scraped_name:
            return self.find_energy_card(scraped_name)
        
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
    
    def find_energy_card(self, energy_name: str) -> Optional[CardMatch]:
        """Special handler for basic energy cards"""
        # Map energy names to their types (handle both bracketed and non-bracketed versions)
        energy_mapping = {
            "基本超能量": "基本超能量",
            "基本【超】能量": "基本超能量",
            "基本火能量": "基本火能量",
            "基本【火】能量": "基本火能量", 
            "基本水能量": "基本水能量",
            "基本【水】能量": "基本水能量",
            "基本草能量": "基本草能量",
            "基本【草】能量": "基本草能量",
            "基本雷能量": "基本雷能量",
            "基本【雷】能量": "基本雷能量",
            "基本鬥能量": "基本鬥能量",
            "基本【鬥】能量": "基本鬥能量",
            "基本惡能量": "基本惡能量",
            "基本【惡】能量": "基本惡能量",
            "基本鋼能量": "基本鋼能量",
            "基本【鋼】能量": "基本鋼能量"
        }
        
        # Normalize energy name by extracting the type between brackets
        normalized_name = energy_name.strip()
        
        # Extract energy type: 基本【惡】能量 -> 基本惡能量
        if '【' in normalized_name and '】' in normalized_name:
            # Extract the character between brackets
            bracket_content = re.search(r'【(.)】', normalized_name)
            if bracket_content:
                energy_type = bracket_content.group(1)
                search_name = f"基本{energy_type}能量"
            else:
                search_name = normalized_name
        else:
            search_name = normalized_name
        
        # Try to find exact energy match
        if normalized_name in energy_mapping:
            target_name = energy_mapping[normalized_name]
        elif search_name in energy_mapping:
            target_name = energy_mapping[search_name]
        else:
            return None
            
        # Look for the energy card in database with the specific ID we need
        energy_id = self.get_energy_card_id(search_name)
        
        for card in self.cards_data:
            card_id = int(card.get('CardID', 0) or card.get('WebCardID', '0'))
            card_name = card.get('Name', '').strip()
            
            # Match by the specific energy card ID we want
            if card_id == energy_id:
                expansion_name = "挑戰牌組「超級蒂安希ex」" if search_name == "基本超能量" else "挑戰牌組「超級耿鬼ex」" if search_name == "基本惡能量" else "基本能量"
                return CardMatch(
                    card_id=energy_id,
                    name=card_name,  # Use the actual database name (with or without brackets)
                    card_type="基本能量卡",
                    expansion=expansion_name,
                    rarity="common",
                    confidence=1.0
                )
        
        return None
    
    def get_energy_card_id(self, energy_name: str) -> int:
        """Generate consistent IDs for basic energy cards"""
        # Extract energy type: 基本【惡】能量 -> 基本惡能量
        clean_name = energy_name.strip()
        if '【' in clean_name and '】' in clean_name:
            bracket_content = re.search(r'【(.)】', clean_name)
            if bracket_content:
                energy_type = bracket_content.group(1)
                clean_name = f"基本{energy_type}能量"
        
        energy_ids = {
            "基本超能量": 14382,   # Psychic - MBD deck
            "基本火能量": 99002,   # Fire
            "基本水能量": 99003,   # Water
            "基本草能量": 99004,   # Grass
            "基本雷能量": 99005,   # Electric
            "基本鬥能量": 99006,   # Fighting
            "基本惡能量": 14406,   # Dark - MBG deck
            "基本鋼能量": 99008    # Metal
        }
        return energy_ids.get(clean_name, 99000)

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
    
    def reprocess_existing_decks(self) -> List[Dict]:
        """Reprocess existing construction decks from imported_decks.json"""
        imported_decks_path = "../data/imported_decks.json"
        if not os.path.exists(imported_decks_path):
            print(f"No existing imported decks found at: {imported_decks_path}")
            return self.scrape_construction_decks()
        
        print("Reprocessing existing construction decks with enhanced matching...")
        
        try:
            with open(imported_decks_path, 'r', encoding='utf-8') as f:
                existing_decks = json.load(f)
            
            for existing_deck in existing_decks:
                deck_name = existing_deck.get('name', '')
                description = existing_deck.get('description', '')
                
                print(f"Reprocessing deck: {deck_name}")
                
                # Extract cards from existing deck
                cards_list = []
                for card in existing_deck.get('cards', []):
                    card_name = card.get('name', '')
                    quantity = card.get('quantity', 1)
                    if card_name:
                        cards_list.append((card_name, quantity))
                
                # Add missing energy cards based on deck type
                if "超級耿鬼ex" in deck_name:
                    cards_list.extend([
                        ("基本超能量", 8),
                        ("能量轉移", 2),
                        ("粉碎之錘", 2),
                        ("能量回收", 2),
                    ])
                elif "超級蒂安希ex" in deck_name:
                    cards_list.extend([
                        ("基本超能量", 8),
                        ("能量轉移", 4),
                        ("能量回收", 2),
                        ("學習裝置", 2),
                    ])
                
                # Reprocess with enhanced matching
                deck_info = {
                    "name": deck_name,
                    "description": description,
                    "expansionCode": existing_deck.get('expansionCode', ''),
                    "cards": cards_list
                }
                
                processed_deck = self.process_deck(deck_info)
                if processed_deck:
                    self.scraped_decks.append(processed_deck)
            
            print(f"Reprocessed {len(self.scraped_decks)} construction decks")
            return self.scraped_decks
            
        except Exception as e:
            print(f"Error reprocessing existing decks: {e}")
            return self.scrape_construction_decks()

    def scrape_construction_decks(self) -> List[Dict]:
        """Main scraping function"""
        print("Starting enhanced deck scraping with database matching...")
        
        # Construction deck data based on official Pokemon Card website
        # Source: https://asia.pokemon-card.com/hk/archives/8009/
        # MBG = 挑戰牌組「超級耿鬼ex」, MBD = 挑戰牌組「超級蒂安希ex」
        construction_decks = [
            {
                "name": "挑戰牌組 超級耿鬼ex",
                "description": "Challenge Deck featuring Super Gengar ex with Ghost-type synergy",
                "expansionCode": "MBG",
                "cards": [
                    # Pokemon Cards (18 cards total)
                    ("鬼斯", 4),                    # Gastly
                    ("鬼斯通", 2),                  # Haunter (regular)
                    ("鬼斯通", 1),                  # Haunter (full art illustration)
                    ("超級耿鬼ex", 2),              # Mega Gengar ex
                    ("黑暗鴉", 2),                  # Murkrow
                    ("烏鴉頭頭", 1),                # Honchkrow
                    ("勾魂眼", 2),                  # Sableye
                    ("阿勃梭魯", 1),                # Absol
                    ("無極汰那", 1),                # Eternatus
                    ("桃歹郎ex", 1),                # Pecharunt ex
                    ("米立龍", 1),                  # Goomy
                    
                    # Trainer Cards (28 cards total)
                    ("好友寶芬", 3),                # Professor Sada's Vitality
                    ("高級球", 4),                  # Ultra Ball
                    ("神奇糖果", 3),                # Rare Candy
                    ("頂尖捕捉器", 1),              # Prime Catcher
                    ("寶可夢交替", 1),              # Pokemon Switch
                    ("超級信號", 1),                # Super Rod
                    ("夜間擔架", 1),                # Night Stretcher
                    ("氣球", 2),                    # Air Balloon
                    ("龐克頭盔", 2),                # Punk Helmet
                    ("艾莉絲的鬥志", 4),            # Iris's Fighting Spirit
                    ("老大的指令", 2),              # Boss's Orders
                    ("莉莉艾的決意", 4),            # Lillie's Full Force
                    
                    # Energy Cards (14 cards total)
                    ("基本惡能量", 14),             # Basic Dark Energy
                ]
            },
            {
                "name": "挑戰牌組 超級蒂安希ex", 
                "description": "Challenge Deck featuring Super Diancie ex with Fairy-type focus",
                "expansionCode": "MBD",
                "cards": [
                    # Pokemon Cards (17 cards total)
                    ("布魯", 2),                    # Popplio
                    ("布魯皇", 1),                  # Primarina
                    ("克雷色利亞", 1),              # Cresselia
                    ("美洛耶塔", 1),                # Meloetta (regular)
                    ("美洛耶塔", 1),                # Meloetta (full art illustration)
                    ("超級蒂安希ex", 2),            # Mega Diancie ex
                    ("謎擬Q", 1),                   # Mimikyu
                    ("小仙奶", 3),                  # Milcery
                    ("霜奶仙", 3),                  # Alcremie
                    ("拉帝亞斯ex", 1),              # Latias ex
                    ("米立龍", 1),                  # Goomy
                    
                    # Trainer Cards (29 cards total)
                    ("能量回收器", 1),              # Energy Retrieval
                    ("好友寶芬", 3),                # Professor Sada's Vitality
                    ("高級球", 4),                  # Ultra Ball
                    ("超級信號", 1),                # Super Rod
                    ("夜間擔架", 1),                # Night Stretcher
                    ("奇跡修正檔", 4),              # Miracle Archive
                    ("不公印章", 1),                # Unfair Stamp
                    ("氣球", 2),                    # Air Balloon
                    ("艾莉絲的鬥志", 4),            # Iris's Fighting Spirit
                    ("老大的指令", 2),              # Boss's Orders
                    ("莉莉艾的決意", 4),            # Lillie's Full Force
                    ("神秘花園", 2),                # Mystery Garden
                    
                    # Energy Cards (14 cards total)
                    ("基本超能量", 14),             # Basic Psychic Energy
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
    cards_csv_path = "source/cards_output_all_mega.csv"  # Updated path
    
    if not os.path.exists(cards_csv_path):
        print(f"Card database not found at: {cards_csv_path}")
        print("Please ensure your card database CSV file is available.")
        return
    
    # Initialize scraper
    scraper = EnhancedPokemonDeckScraper(cards_csv_path)
    
    # Check if user wants to reprocess existing decks
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "--reprocess":
        print("Reprocessing existing decks with energy cards...")
        decks = scraper.reprocess_existing_decks()
    else:
        print("Creating new deck data...")
        decks = scraper.scrape_construction_decks()
    
    # Export results
    scraper.export_results()
    
    print("\nImport complete! Files generated:")
    print("- construction_decks.json (ready for import)")
    print("- unmatched_cards.csv (for manual review)")
    print("- import_summary.txt (process summary)")
    print("\nTo use in your web app, copy construction_decks.json to ../data/imported_decks.json")
    print("\nTo reprocess existing decks with energy cards, run: python enhanced_deck_importer.py --reprocess")

if __name__ == "__main__":
    main()