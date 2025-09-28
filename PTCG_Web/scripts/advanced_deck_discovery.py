#!/usr/bin/env python3
"""
Advanced Pokemon Deck Discovery System
Search for multiple construction deck types across Pokemon Card website
"""

import requests
import json
import pandas as pd
from bs4 import BeautifulSoup
from typing import Dict, List, Optional, Tuple
import re
import time
from datetime import datetime
import urllib.parse

class AdvancedDeckDiscovery:
    def __init__(self, csv_path: str = "../../cards_output_all_mega_with_effects_smart_merged_final_success_with_ability_stats_rated_with_damage.csv"):
        """Initialize advanced deck discovery system"""
        self.csv_path = csv_path
        self.cards_df = self.load_database()
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        
        # Target deck keywords
        self.target_decks = {
            '瑪俐的莫魯貝可': 'Challenge Deck Marie\'s Morpeko & Grimmsnarl ex',
            '長毛巨魔ex': 'Challenge Deck Grimmsnarl ex', 
            '皮卡丘': 'ex Starter Deck Pikachu',
            '魔幻假面喵ex': 'Tactical Deck Meowscarada ex',
            '沙奈朵ex': 'Tactical Deck Gardevoir ex',
            '未來密勒頓ex': 'Starting Set Future Miraidon ex',
            'ex初階牌組': 'ex Starter Deck series',
            '戰術牌組': 'Tactical Deck series',
            '起始組合': 'Starting Set series'
        }
    
    def load_database(self) -> pd.DataFrame:
        """Load card database"""
        print("📚 Loading card database...")
        try:
            df = pd.read_csv(self.csv_path, encoding='utf-8')
            print(f"✅ Loaded {len(df)} cards from database")
            return df
        except Exception as e:
            print(f"⚠️  Database not found, continuing without ID matching: {e}")
            return pd.DataFrame()
    
    def discover_deck_urls(self) -> List[str]:
        """Discover construction deck URLs from Pokemon website"""
        print("🔍 Discovering construction deck URLs...")
        
        found_urls = []
        
        # Method 1: Search main archives
        for archive_id in range(6000, 8500, 50):  # Broader search
            url = f"https://asia.pokemon-card.com/hk/archives/{archive_id}/"
            if self.check_deck_url(url):
                found_urls.append(url)
                print(f"  ✅ Found deck at: {url}")
                time.sleep(1)  # Be respectful
        
        # Method 2: Known pattern URLs
        known_patterns = [
            "https://asia.pokemon-card.com/hk/archives/7892/",  # Marie's deck pattern
            "https://asia.pokemon-card.com/hk/archives/7845/",  # Pikachu ex starter
            "https://asia.pokemon-card.com/hk/archives/7612/",  # Tactical decks
            "https://asia.pokemon-card.com/hk/archives/7156/",  # Starting sets
        ]
        
        for url in known_patterns:
            if self.check_deck_url(url):
                found_urls.append(url)
                print(f"  ✅ Found known pattern: {url}")
        
        return found_urls
    
    def check_deck_url(self, url: str) -> bool:
        """Check if URL contains construction deck content"""
        try:
            response = self.session.get(url, timeout=10)
            if response.status_code == 200:
                text = response.text.lower()
                # Check for deck-related keywords
                deck_indicators = [
                    '牌組清單', '挑戰牌組', 'ex初階', '戰術牌組', '起始組合',
                    'challenge deck', 'starter deck', 'tactical deck'
                ]
                
                for indicator in deck_indicators:
                    if indicator.lower() in text:
                        return True
            return False
        except:
            return False
    
    def extract_deck_from_url(self, url: str) -> Optional[Dict]:
        """Extract deck information from a specific URL"""
        try:
            response = self.session.get(url, timeout=30)
            response.encoding = 'utf-8'
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Extract title
            title_elem = soup.find('title')
            if not title_elem:
                return None
            
            title = title_elem.get_text(strip=True)
            
            # Check if this is one of our target decks
            target_found = None
            for keyword in self.target_decks.keys():
                if keyword in title:
                    target_found = keyword
                    break
            
            if not target_found:
                return None
            
            print(f"🎯 Processing target deck: {title}")
            
            # Extract cards from tables
            cards = self.extract_cards_from_soup(soup)
            
            if len(cards) < 30:  # Valid deck should have at least 30 cards
                print(f"   ⚠️  Insufficient cards found: {len(cards)}")
                return None
            
            return {
                "name": title.replace('「', '').replace('」', ''),
                "description": f"Official construction deck from Pokemon website",
                "cards": cards,
                "source": "Official Pokemon Card Website",
                "url": url,
                "scraped_at": datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"❌ Error processing {url}: {e}")
            return None
    
    def extract_cards_from_soup(self, soup: BeautifulSoup) -> List[Dict]:
        """Extract cards from BeautifulSoup object"""
        cards = []
        
        # Method 1: Look for table-based card lists
        tables = soup.find_all('table')
        for table in tables:
            cards.extend(self.parse_table_cards(table))
        
        # Method 2: Look for structured lists
        lists = soup.find_all(['ul', 'ol'])
        for list_elem in lists:
            cards.extend(self.parse_list_cards(list_elem))
        
        # Method 3: Look for text-based patterns
        text_content = soup.get_text()
        cards.extend(self.parse_text_cards(text_content))
        
        # Remove duplicates and clean up
        unique_cards = {}
        for card in cards:
            key = f"{card['name']}_{card['quantity']}"
            if key not in unique_cards:
                unique_cards[key] = card
        
        return list(unique_cards.values())
    
    def parse_table_cards(self, table) -> List[Dict]:
        """Parse cards from HTML table"""
        cards = []
        rows = table.find_all('tr')
        
        for row in rows:
            cells = row.find_all(['td', 'th'])
            if len(cells) >= 2:
                name_text = cells[0].get_text(strip=True)
                qty_text = cells[1].get_text(strip=True)
                
                try:
                    quantity = int(qty_text)
                    if 1 <= quantity <= 4 and len(name_text) >= 2:
                        card_id, matched_name = self.match_card_to_database(name_text)
                        cards.append({
                            'name': matched_name or name_text,
                            'quantity': quantity,
                            'card_id': card_id,
                            'original_name': name_text
                        })
                except ValueError:
                    continue
        
        return cards
    
    def parse_list_cards(self, list_elem) -> List[Dict]:
        """Parse cards from HTML list"""
        cards = []
        items = list_elem.find_all('li')
        
        for item in items:
            text = item.get_text(strip=True)
            # Look for pattern: CardName Number
            match = re.search(r'(.+?)(\d+)$', text)
            if match:
                name = match.group(1).strip()
                try:
                    quantity = int(match.group(2))
                    if 1 <= quantity <= 4 and len(name) >= 2:
                        card_id, matched_name = self.match_card_to_database(name)
                        cards.append({
                            'name': matched_name or name,
                            'quantity': quantity,
                            'card_id': card_id,
                            'original_name': name
                        })
                except ValueError:
                    continue
        
        return cards
    
    def parse_text_cards(self, text: str) -> List[Dict]:
        """Parse cards from plain text"""
        cards = []
        lines = text.split('\n')
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Pattern: Chinese card name followed by number
            match = re.search(r'([一-龥\w\s\(\)（）\[\]【】]+?)(\d+)', line)
            if match:
                name = match.group(1).strip()
                try:
                    quantity = int(match.group(2))
                    if 1 <= quantity <= 4 and len(name) >= 2:
                        # Filter out obvious non-cards
                        if not any(skip in name for skip in ['月', '日', '年', '頁', '版', 'px', 'div']):
                            card_id, matched_name = self.match_card_to_database(name)
                            cards.append({
                                'name': matched_name or name,
                                'quantity': quantity,
                                'card_id': card_id,
                                'original_name': name
                            })
                except ValueError:
                    continue
        
        return cards
    
    def match_card_to_database(self, card_name: str) -> Tuple[Optional[int], Optional[str]]:
        """Match card name to database and return ID and official name"""
        if self.cards_df.empty:
            return None, None
        
        # Special handling for energy cards
        if '能量' in card_name:
            return self.match_energy_card(card_name)
        
        # Direct name match
        exact_match = self.cards_df[self.cards_df['Name'] == card_name]
        if not exact_match.empty:
            row = exact_match.iloc[0]
            return row['WebCardID'], row['Name']
        
        # Partial name match
        partial_matches = self.cards_df[self.cards_df['Name'].str.contains(card_name, na=False)]
        if not partial_matches.empty:
            row = partial_matches.iloc[0]
            return row['WebCardID'], row['Name']
        
        return None, None
    
    def match_energy_card(self, energy_name: str) -> Tuple[Optional[int], Optional[str]]:
        """Special handling for energy cards"""
        energy_mapping = {
            '基本【惡】能量': (14406, '基本【惡】能量'),
            '基本【超】能量': (14382, '基本【超】能量'),
            '基本【電】能量': (14404, '基本【電】能量'),
            '基本【草】能量': (14405, '基本【草】能量'),
            '基本【火】能量': (14401, '基本【火】能量'),
            '基本【水】能量': (14402, '基本【水】能量'),
            '基本【鬥】能量': (14403, '基本【鬥】能量'),
            '基本【鋼】能量': (14407, '基本【鋼】能量')
        }
        
        # Clean up brackets for matching
        cleaned_name = energy_name
        for exact_name, (card_id, official_name) in energy_mapping.items():
            if exact_name in cleaned_name or cleaned_name in exact_name:
                return card_id, official_name
        
        return None, None
    
    def search_and_import_decks(self) -> Dict:
        """Main function to search and import target decks"""
        print("🚀 Starting Advanced Deck Discovery...")
        
        # Discover URLs
        deck_urls = self.discover_deck_urls()
        
        if not deck_urls:
            print("❌ No deck URLs discovered")
            # Fall back to manual URLs for known decks
            deck_urls = self.get_manual_deck_urls()
        
        print(f"📋 Processing {len(deck_urls)} URLs...")
        
        imported_decks = {}
        
        for url in deck_urls:
            deck = self.extract_deck_from_url(url)
            if deck:
                imported_decks[deck['name']] = deck
                print(f"✅ Imported: {deck['name']}")
            time.sleep(2)  # Be respectful to the server
        
        return imported_decks
    
    def get_manual_deck_urls(self) -> List[str]:
        """Manual URLs for specific decks we're looking for"""
        return [
            # Add specific URLs as we find them
            "https://asia.pokemon-card.com/hk/archives/7892/",  # Potential Marie's deck
            "https://asia.pokemon-card.com/hk/archives/7845/",  # Potential Pikachu deck
            "https://asia.pokemon-card.com/hk/archives/7612/",  # Potential tactical decks
        ]
    
    def save_decks(self, decks: Dict, output_file: str = "discovered_construction_decks.json"):
        """Save discovered decks to JSON file"""
        try:
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(decks, f, ensure_ascii=False, indent=2)
            print(f"💾 Saved {len(decks)} decks to {output_file}")
        except Exception as e:
            print(f"❌ Failed to save decks: {e}")

def main():
    """Main execution function"""
    discovery = AdvancedDeckDiscovery()
    
    # Search and import target decks
    decks = discovery.search_and_import_decks()
    
    if decks:
        discovery.save_decks(decks)
        
        # Print summary
        print("\n📈 Discovery Summary:")
        for deck_name, deck_info in decks.items():
            total_cards = sum(card['quantity'] for card in deck_info['cards'])
            matched_cards = sum(1 for card in deck_info['cards'] if card['card_id'])
            print(f"   📋 {deck_name}:")
            print(f"      🎯 {len(deck_info['cards'])} unique cards, {total_cards} total cards")
            print(f"      🔗 {matched_cards} cards matched to database")
    else:
        print("❌ No target decks discovered")
        print("💡 Consider adding manual URLs for specific decks")

if __name__ == "__main__":
    main()