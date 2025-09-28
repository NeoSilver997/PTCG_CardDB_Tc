#!/usr/bin/env python3
"""
Pokemon TCG Web Deck Importer - Enhanced Version
Scrapes construction decks from multiple sources and integrates with existing card database
"""

import requests
import json
import time
import re
import os
import sys
from bs4 import BeautifulSoup
from typing import List, Dict, Any, Optional, Tuple
from urllib.parse import urljoin, urlparse
from dataclasses import dataclass
import csv

# Import our existing database matcher
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from enhanced_deck_importer import DatabaseCardMatcher, CardMatch

@dataclass
class ScrapedDeck:
    """Represents a deck scraped from the web"""
    name: str
    description: str
    cards: List[Tuple[str, int]]  # (card_name, quantity)
    source_url: str
    expansion_code: str = ""
    deck_type: str = "Standard"

class WebDeckScraper:
    """Enhanced web scraper for Pokemon TCG construction decks"""
    
    def __init__(self, cards_csv_path: str):
        self.base_url = "https://asia.pokemon-card.com"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        })
        
        # Initialize card matcher with database
        self.card_matcher = DatabaseCardMatcher(cards_csv_path)
        
        # Storage for results
        self.scraped_decks: List[ScrapedDeck] = []
        self.processed_decks: List[Dict] = []
        self.unmatched_cards: List[Dict] = []
        
    def get_page(self, url: str, delay: float = 2.0) -> Optional[BeautifulSoup]:
        """Fetch and parse a web page with respectful delays"""
        try:
            print(f"  Fetching: {url}")
            time.sleep(delay)  # Respectful delay
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            response.encoding = 'utf-8'
            return BeautifulSoup(response.content, 'html.parser')
        except Exception as e:
            print(f"  ❌ Error fetching {url}: {e}")
            return None
    
    def discover_construction_deck_urls(self) -> List[str]:
        """Discover construction deck URLs from various sources"""
        print("🔍 Discovering construction deck URLs...")
        
        deck_urls = []
        
        # Source 1: Product archives
        archive_urls = [
            "https://asia.pokemon-card.com/hk/archives/",
            "https://asia.pokemon-card.com/hk/products/",
        ]
        
        for base_url in archive_urls:
            soup = self.get_page(base_url)
            if soup:
                # Look for links containing deck-related keywords
                links = soup.find_all('a', href=True)
                for link in links:
                    href = link.get('href', '')
                    text = link.get_text(strip=True)
                    
                    # Filter for construction deck related links
                    if any(keyword in text.lower() for keyword in ['挑戰牌組', '構築牌組', 'challenge deck', 'construction']):
                        full_url = urljoin(self.base_url, href)
                        if full_url not in deck_urls and '/archives/' in full_url:
                            deck_urls.append(full_url)
        
        # Source 2: Known construction deck URLs (from our database)
        known_urls = [
            "https://asia.pokemon-card.com/hk/archives/8009/",  # MBG/MBD decks
            # Add more known construction deck URLs here
        ]
        
        for url in known_urls:
            if url not in deck_urls:
                deck_urls.append(url)
        
        print(f"  📋 Found {len(deck_urls)} construction deck URLs")
        return deck_urls
    
    def extract_deck_info_from_page(self, url: str) -> List[ScrapedDeck]:
        """Extract deck information from a construction deck page"""
        soup = self.get_page(url)
        if not soup:
            return []
        
        decks = []
        page_text = soup.get_text()
        
        # Check if this page contains multiple deck lists
        deck_sections = []
        
        # Pattern 1: Look for deck names in headers
        headers = soup.find_all(['h1', 'h2', 'h3', 'h4'])
        for header in headers:
            text = header.get_text(strip=True)
            if any(keyword in text for keyword in ['挑戰牌組', '牌組清單', 'Challenge Deck']):
                deck_sections.append({
                    'name': text,
                    'element': header
                })
        
        # If we found deck sections, process each one
        if deck_sections:
            for i, section in enumerate(deck_sections):
                deck_name = section['name']
                
                # Find the next section to determine boundaries
                next_element = section['element'].find_next_sibling()
                deck_content = []
                
                # Collect content until next deck section or end
                current = next_element
                while current and current != (deck_sections[i+1]['element'] if i+1 < len(deck_sections) else None):
                    if current.name:
                        deck_content.append(current)
                    current = current.find_next_sibling()
                
                # Extract cards from this section
                cards = self.extract_cards_from_content(deck_content)
                
                if cards:
                    # Try to determine expansion code from deck name
                    expansion_code = self.infer_expansion_code(deck_name, url)
                    
                    deck = ScrapedDeck(
                        name=deck_name,
                        description=f"Construction deck scraped from {urlparse(url).netloc}",
                        cards=cards,
                        source_url=url,
                        expansion_code=expansion_code
                    )
                    decks.append(deck)
        
        # If no structured sections found, try to extract from entire page
        if not decks:
            cards = self.extract_cards_from_text(page_text)
            if cards:
                # Try to extract deck name from title or main header
                title = soup.find('title')
                main_header = soup.find(['h1', 'h2'])
                
                deck_name = "Unknown Deck"
                if title:
                    deck_name = title.get_text(strip=True)
                elif main_header:
                    deck_name = main_header.get_text(strip=True)
                
                expansion_code = self.infer_expansion_code(deck_name, url)
                
                deck = ScrapedDeck(
                    name=deck_name,
                    description=f"Construction deck scraped from {urlparse(url).netloc}",
                    cards=cards,
                    source_url=url,
                    expansion_code=expansion_code
                )
                decks.append(deck)
        
        return decks
    
    def extract_cards_from_content(self, elements: List) -> List[Tuple[str, int]]:
        """Extract cards from HTML elements"""
        cards = []
        
        for element in elements:
            text = element.get_text(strip=True)
            extracted_cards = self.extract_cards_from_text(text)
            cards.extend(extracted_cards)
        
        return cards
    
    def extract_cards_from_text(self, text: str) -> List[Tuple[str, int]]:
        """Extract card information from text using various patterns"""
        cards = []
        lines = text.split('\n')
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Pattern 1: "卡名4" or "卡名 4"
            match = re.search(r'(.+?)(\d+)$', line)
            if match:
                name = match.group(1).strip()
                try:
                    quantity = int(match.group(2))
                    if 1 <= quantity <= 4 and len(name) > 1:  # Valid Pokemon TCG quantities
                        cards.append((name, quantity))
                        continue
                except ValueError:
                    pass
            
            # Pattern 2: "4張卡名" or "4 卡名"
            match = re.search(r'^(\d+)[\s張]*(.+)$', line)
            if match:
                try:
                    quantity = int(match.group(1))
                    name = match.group(2).strip()
                    if 1 <= quantity <= 4 and len(name) > 1:
                        cards.append((name, quantity))
                        continue
                except ValueError:
                    pass
            
            # Pattern 3: Look for Chinese card patterns with numbers
            chinese_pattern = re.search(r'([^\d\s]{2,})\s*(\d+)', line)
            if chinese_pattern:
                name = chinese_pattern.group(1).strip()
                try:
                    quantity = int(chinese_pattern.group(2))
                    if 1 <= quantity <= 4 and len(name) > 1:
                        # Filter out obvious non-card text
                        if not any(skip in name for skip in ['張', '頁', '月', '日', '年', '號', '版']):
                            cards.append((name, quantity))
                except ValueError:
                    pass
        
        return cards
    
    def infer_expansion_code(self, deck_name: str, url: str) -> str:
        """Try to infer expansion code from deck name or URL"""
        # Map known deck patterns to expansion codes
        expansion_patterns = {
            'MBG': ['超級耿鬼', '耿鬼ex'],
            'MBD': ['超級蒂安希', '蒂安希ex'],
            'AC1D': ['眾星雲集'],
            'AC2D': ['美夢成真'],
            'AS5D': ['雙倍爆擊'],
            'AS6D': ['傳說交鋒'],
        }
        
        for code, patterns in expansion_patterns.items():
            if any(pattern in deck_name for pattern in patterns):
                return code
        
        return ""
    
    def process_scraped_deck(self, scraped_deck: ScrapedDeck) -> Optional[Dict]:
        """Process scraped deck with database matching"""
        print(f"  🔧 Processing deck: {scraped_deck.name}")
        
        matched_cards = []
        unmatched_count = 0
        
        for card_name, quantity in scraped_deck.cards:
            match = self.card_matcher.find_best_match(card_name, scraped_deck.expansion_code)
            
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
                print(f"    ✓ {card_name} -> {match.name} [ID: {match.card_id}]")
            else:
                unmatched_count += 1
                self.unmatched_cards.append({
                    "deck": scraped_deck.name,
                    "card": card_name,
                    "quantity": quantity,
                    "source": scraped_deck.source_url
                })
                print(f"    ❌ Unmatched: {card_name}")
        
        if matched_cards:
            return {
                "name": scraped_deck.name,
                "description": scraped_deck.description,
                "format": scraped_deck.deck_type,
                "cards": matched_cards,
                "createdAt": time.strftime("%Y-%m-%d"),
                "sourceUrl": scraped_deck.source_url,
                "tags": ["Official", "Construction Deck", "Scraped"],
                "expansionCode": scraped_deck.expansion_code,
                "matchStats": {
                    "totalCards": len(scraped_deck.cards),
                    "matchedCards": len(matched_cards),
                    "unmatchedCards": unmatched_count
                }
            }
        
        return None
    
    def scrape_all_construction_decks(self) -> List[Dict]:
        """Main function to scrape all construction decks"""
        print("🚀 Starting web deck scraping...")
        
        # Discover deck URLs
        deck_urls = self.discover_construction_deck_urls()
        
        # Process each URL
        for i, url in enumerate(deck_urls, 1):
            print(f"📄 Processing URL {i}/{len(deck_urls)}: {url}")
            
            scraped_decks = self.extract_deck_info_from_page(url)
            
            for scraped_deck in scraped_decks:
                if len(scraped_deck.cards) >= 30:  # Only process decks with reasonable card counts
                    processed_deck = self.process_scraped_deck(scraped_deck)
                    if processed_deck:
                        self.processed_decks.append(processed_deck)
                        self.scraped_decks.append(scraped_deck)
                else:
                    print(f"    ⚠️ Skipping deck with {len(scraped_deck.cards)} cards (too few)")
        
        print(f"✅ Scraping complete! Found {len(self.processed_decks)} valid decks")
        return self.processed_decks
    
    def export_results(self):
        """Export all results to files"""
        # Export matched decks
        if self.processed_decks:
            with open("web_scraped_decks.json", 'w', encoding='utf-8') as f:
                json.dump(self.processed_decks, f, indent=2, ensure_ascii=False)
            print(f"📁 Exported {len(self.processed_decks)} decks to web_scraped_decks.json")
        
        # Export unmatched cards for review
        if self.unmatched_cards:
            with open("unmatched_web_cards.csv", 'w', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                writer.writerow(['Deck', 'Card Name', 'Quantity', 'Source URL'])
                for card in self.unmatched_cards:
                    writer.writerow([card['deck'], card['card'], card['quantity'], card['source']])
            print(f"📁 Exported {len(self.unmatched_cards)} unmatched cards to unmatched_web_cards.csv")
        
        # Export summary
        with open("web_scraping_summary.txt", 'w', encoding='utf-8') as f:
            f.write("Pokemon TCG Web Deck Scraping Summary\n")
            f.write("=" * 50 + "\n\n")
            f.write(f"Total decks processed: {len(self.processed_decks)}\n")
            f.write(f"Total unmatched cards: {len(self.unmatched_cards)}\n\n")
            
            for deck in self.processed_decks:
                stats = deck.get('matchStats', {})
                f.write(f"Deck: {deck['name']}\n")
                f.write(f"  Source: {deck.get('sourceUrl', 'Unknown')}\n")
                f.write(f"  Cards: {stats.get('matchedCards', 0)}/{stats.get('totalCards', 0)} matched\n")
                if stats.get('totalCards', 0) > 0:
                    match_rate = stats.get('matchedCards', 0) / stats.get('totalCards', 0) * 100
                    f.write(f"  Match rate: {match_rate:.1f}%\n")
                f.write("\n")
        
        print("📄 Export complete!")

def main():
    """Main function"""
    print("🎯 Pokemon TCG Web Deck Importer")
    print("=" * 50)
    
    # Path to card database CSV
    cards_csv_path = "source/cards_output_all_mega.csv"
    
    if not os.path.exists(cards_csv_path):
        print(f"❌ Card database not found at: {cards_csv_path}")
        print("Please ensure your card database CSV file is available.")
        return
    
    # Initialize scraper
    scraper = WebDeckScraper(cards_csv_path)
    
    # Scrape decks
    decks = scraper.scrape_all_construction_decks()
    
    # Export results
    scraper.export_results()
    
    print("\n📊 Scraping Summary:")
    if decks:
        print(f"✅ Total decks imported: {len(decks)}")
        for deck in decks:
            stats = deck.get('matchStats', {})
            print(f"  📋 {deck['name']}: {stats.get('matchedCards', 0)} cards")
        
        print("\n💡 Next steps:")
        print("1. Review unmatched_web_cards.csv for cards that need manual matching")
        print("2. Merge web_scraped_decks.json with your existing imported_decks.json")
        print("3. Use the web application to verify the imported decks")
    else:
        print("❌ No decks were successfully imported.")

if __name__ == "__main__":
    main()