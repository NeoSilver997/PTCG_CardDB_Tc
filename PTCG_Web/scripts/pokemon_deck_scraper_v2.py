#!/usr/bin/env python3
"""
Pokemon Construction Deck Scraper V2
Specifically designed for Pokemon Card official website format
"""

import requests
import json
import pandas as pd
from typing import Dict, List, Optional, Tuple
import re
import time
from datetime import datetime

class PokemonDeckScraperV2:
    def __init__(self, csv_path: str = "../../cards_output_all_mega.csv"):
        """Initialize scraper with database connection"""
        self.csv_path = csv_path
        self.cards_df = self.load_database()
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
    
    def load_database(self) -> pd.DataFrame:
        """Load card database"""
        print("📚 Loading card database...")
        try:
            df = pd.read_csv(self.csv_path, encoding='utf-8')
            print(f"✅ Loaded {len(df)} cards from database")
            return df
        except Exception as e:
            print(f"❌ Failed to load database: {e}")
            return pd.DataFrame()
    
    def fetch_page_text(self, url: str) -> str:
        """Fetch page content as text"""
        try:
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            response.encoding = 'utf-8'  # Force UTF-8 encoding
            text = response.text
            
            # Debug: show sample of text
            print(f"📝 Sample text (first 500 chars): {text[:500]}")
            
            return text
        except Exception as e:
            print(f"❌ Failed to fetch {url}: {e}")
            return ""
    
    def extract_mbg_deck(self, text: str) -> List[Dict]:
        """Extract MBG (Super Gengar ex) deck from page text"""
        print("🔍 Extracting MBG deck...")
        
        # Debug: show what text we have
        print(f"📝 Text length: {len(text)}")
        print(f"📝 Contains '挑戰牌組': {'挑戰牌組' in text}")
        print(f"📝 Contains '牌組清單': {'牌組清單' in text}")
        
        # More flexible pattern - look for content between the deck name and next major section
        mbg_pattern = r'挑戰牌組.*?超級耿鬼.*?牌組清單(.*?)(?=挑戰牌組.*?超級蒂安希|商品資訊|$)'
        mbg_match = re.search(mbg_pattern, text, re.DOTALL | re.IGNORECASE)
        
        if mbg_match:
            deck_text = mbg_match.group(1)
            print(f"📝 MBG deck section found: {deck_text[:200]}...")
            return self.parse_deck_cards(deck_text, "MBG")
        else:
            print("❌ Could not find MBG deck section")
            return []
    
    def extract_mbd_deck(self, text: str) -> List[Dict]:
        """Extract MBD (Super Diancie ex) deck from page text"""
        print("🔍 Extracting MBD deck...")
        
        # More flexible pattern
        mbd_pattern = r'挑戰牌組.*?超級蒂安希.*?牌組清單(.*?)(?=商品資訊|$)'
        mbd_match = re.search(mbd_pattern, text, re.DOTALL | re.IGNORECASE)
        
        if mbd_match:
            deck_text = mbd_match.group(1)
            print(f"📝 MBD deck section found: {deck_text[:200]}...")
            return self.parse_deck_cards(deck_text, "MBD")
        else:
            print("❌ Could not find MBD deck section")
            return []
    
    def parse_deck_cards(self, deck_text: str, expansion_code: str) -> List[Dict]:
        """Parse cards from deck text section"""
        cards = []
        
        # Extract different card types
        pokemon_cards = self.extract_pokemon_cards(deck_text)
        trainer_cards = self.extract_trainer_cards(deck_text)
        energy_cards = self.extract_energy_cards(deck_text)
        
        cards.extend(pokemon_cards)
        cards.extend(trainer_cards)
        cards.extend(energy_cards)
        
        # Add expansion code to all cards
        for card in cards:
            card['expansion_code'] = expansion_code
        
        print(f"📊 Parsed {len(cards)} cards:")
        print(f"   🦸 Pokemon: {len(pokemon_cards)}")
        print(f"   👤 Trainers: {len(trainer_cards)}")
        print(f"   ⚡ Energy: {len(energy_cards)}")
        
        return cards
    
    def extract_pokemon_cards(self, text: str) -> List[Dict]:
        """Extract Pokemon cards from text"""
        # Find Pokemon section
        pokemon_match = re.search(r'寶可夢卡(.*?)(?=訓練家卡|能量卡)', text, re.DOTALL)
        if not pokemon_match:
            return []
        
        pokemon_text = pokemon_match.group(1)
        return self.parse_card_list(pokemon_text, "Pokemon")
    
    def extract_trainer_cards(self, text: str) -> List[Dict]:
        """Extract Trainer cards from text"""
        # Find Trainer section
        trainer_match = re.search(r'訓練家卡(.*?)(?=能量卡)', text, re.DOTALL)
        if not trainer_match:
            return []
        
        trainer_text = trainer_match.group(1)
        return self.parse_card_list(trainer_text, "Trainer")
    
    def extract_energy_cards(self, text: str) -> List[Dict]:
        """Extract Energy cards from text"""
        # Find Energy section
        energy_match = re.search(r'能量卡(.*?)(?=$)', text, re.DOTALL)
        if not energy_match:
            return []
        
        energy_text = energy_match.group(1)
        return self.parse_card_list(energy_text, "Energy")
    
    def parse_card_list(self, text: str, card_type: str) -> List[Dict]:
        """Parse individual cards from text section"""
        cards = []
        
        # Clean the text
        cleaned_text = re.sub(r'[^\u4e00-\u9fff\w\s\(\)（）\[\]【】\d]', '', text)
        cleaned_text = re.sub(r'\s+', '', cleaned_text)  # Remove spaces
        
        print(f"🔍 Parsing {card_type} from: {cleaned_text[:100]}...")
        
        # Pattern to match: CardName followed by number
        pattern = r'([^\d]+?)(\d+)'
        matches = re.findall(pattern, cleaned_text)
        
        for name, quantity_str in matches:
            name = name.strip()
            
            # Skip very short names or obvious non-cards
            if len(name) < 2:
                continue
                
            # Skip pure numbers or single characters
            if re.match(r'^[\d\s]+$', name) or len(name) == 1:
                continue
            
            try:
                quantity = int(quantity_str)
                if 1 <= quantity <= 4:  # Valid Pokemon card quantities
                    # Try to match with database
                    card_id, matched_name = self.match_card_to_database(name, card_type)
                    
                    cards.append({
                        'name': matched_name or name,
                        'quantity': quantity,
                        'type': card_type,
                        'card_id': card_id,
                        'original_name': name
                    })
                    print(f"   ✅ {name} x{quantity} {'(ID: ' + str(card_id) + ')' if card_id else '(No ID)'}")
            except ValueError:
                continue
        
        return cards
    
    def match_card_to_database(self, card_name: str, card_type: str) -> Tuple[Optional[int], Optional[str]]:
        """Match card name to database and return ID and official name"""
        if self.cards_df.empty:
            return None, None
        
        # Direct name match
        exact_match = self.cards_df[self.cards_df['name'] == card_name]
        if not exact_match.empty:
            row = exact_match.iloc[0]
            return row['id'], row['name']
        
        # Partial name match
        partial_matches = self.cards_df[self.cards_df['name'].str.contains(card_name, na=False)]
        if not partial_matches.empty:
            # Prefer exact expansion code matches if available
            row = partial_matches.iloc[0]
            return row['id'], row['name']
        
        # Special handling for energy cards
        if card_type == "Energy":
            return self.match_energy_card(card_name)
        
        print(f"   ⚠️  No database match for: {card_name}")
        return None, None
    
    def match_energy_card(self, energy_name: str) -> Tuple[Optional[int], Optional[str]]:
        """Special handling for energy cards"""
        energy_mapping = {
            '基本【惡】能量': (14406, '基本【惡】能量'),
            '基本【超】能量': (14382, '基本【超】能量'),
            '基本惡能量': (14406, '基本【惡】能量'),
            '基本超能量': (14382, '基本【超】能量')
        }
        
        if energy_name in energy_mapping:
            card_id, official_name = energy_mapping[energy_name]
            print(f"   🔋 Energy match: {energy_name} → {official_name} (ID: {card_id})")
            return card_id, official_name
        
        return None, None
    
    def scrape_official_decks(self, url: str = "https://asia.pokemon-card.com/hk/archives/8009/") -> Dict:
        """Scrape construction decks from official Pokemon website"""
        print(f"🌐 Scraping decks from: {url}")
        
        page_text = self.fetch_page_text(url)
        if not page_text:
            return {}
        
        # Extract both decks
        mbg_cards = self.extract_mbg_deck(page_text)
        mbd_cards = self.extract_mbd_deck(page_text)
        
        decks = {}
        
        if mbg_cards:
            decks["MBG - 挑戰牌組 超級耿鬼ex"] = {
                "name": "MBG - 挑戰牌組 超級耿鬼ex",
                "description": "Official construction deck featuring Super Gengar ex",
                "cards": mbg_cards,
                "source": "Official Pokemon Card Website",
                "url": url,
                "scraped_at": datetime.now().isoformat()
            }
        
        if mbd_cards:
            decks["MBD - 挑戰牌組 超級蒂安希ex"] = {
                "name": "MBD - 挑戰牌組 超級蒂安希ex", 
                "description": "Official construction deck featuring Super Diancie ex",
                "cards": mbd_cards,
                "source": "Official Pokemon Card Website",
                "url": url,
                "scraped_at": datetime.now().isoformat()
            }
        
        return decks
    
    def save_decks(self, decks: Dict, output_file: str = "scraped_construction_decks.json"):
        """Save scraped decks to JSON file"""
        try:
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(decks, f, ensure_ascii=False, indent=2)
            print(f"💾 Saved {len(decks)} decks to {output_file}")
        except Exception as e:
            print(f"❌ Failed to save decks: {e}")

def main():
    """Main execution function"""
    print("🚀 Starting Pokemon Deck Scraper V2...")
    
    scraper = PokemonDeckScraperV2()
    
    # Scrape official construction decks
    decks = scraper.scrape_official_decks()
    
    if decks:
        scraper.save_decks(decks)
        
        # Print summary
        print("\n📈 Scraping Summary:")
        for deck_name, deck_info in decks.items():
            total_cards = sum(card['quantity'] for card in deck_info['cards'])
            matched_cards = sum(1 for card in deck_info['cards'] if card['card_id'])
            print(f"   📋 {deck_name}:")
            print(f"      🎯 {len(deck_info['cards'])} unique cards, {total_cards} total cards")
            print(f"      🔗 {matched_cards} cards matched to database")
    else:
        print("❌ No decks scraped successfully")

if __name__ == "__main__":
    main()