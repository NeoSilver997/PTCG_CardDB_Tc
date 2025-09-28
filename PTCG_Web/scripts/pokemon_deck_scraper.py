#!/usr/bin/env python3
"""
Pokemon TCG Standard Deck Scraper
Scrapes construction decks from https://asia.pokemon-card.com/hk/products/#constructionDeck
and converts them into deck lists compatible with the PTCG web application.
"""

import requests
import json
import time
import re
from bs4 import BeautifulSoup
from typing import List, Dict, Any, Optional
from urllib.parse import urljoin, urlparse
from dataclasses import dataclass
import csv
import os

@dataclass
class DeckCard:
    """Represents a card in a deck with quantity"""
    card_id: str
    name: str
    quantity: int
    card_type: str = ""
    expansion: str = ""
    rarity: str = ""

@dataclass
class Deck:
    """Represents a complete deck"""
    name: str
    description: str
    cards: List[DeckCard]
    source_url: str
    deck_type: str = "Standard"
    created_date: str = ""

class PokemonTCGDeckScraper:
    """Scraper for Pokemon TCG construction decks"""
    
    def __init__(self):
        self.base_url = "https://asia.pokemon-card.com"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        self.decks: List[Deck] = []
        
    def get_page(self, url: str) -> Optional[BeautifulSoup]:
        """Fetch and parse a web page"""
        try:
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            response.encoding = 'utf-8'
            return BeautifulSoup(response.content, 'html.parser')
        except Exception as e:
            print(f"Error fetching {url}: {e}")
            return None
    
    def extract_deck_urls(self, products_page: BeautifulSoup) -> List[str]:
        """Extract deck detail URLs from the products page"""
        deck_urls = []
        
        # Look for links to deck detail pages
        links = products_page.find_all('a', href=True)
        for link in links:
            href = link.get('href', '')
            
            # Filter for construction deck URLs
            if '/archives/' in href or '/archive/special/card/' in href:
                full_url = urljoin(self.base_url, href)
                if full_url not in deck_urls:
                    deck_urls.append(full_url)
                    
        print(f"Found {len(deck_urls)} potential deck URLs")
        return deck_urls
    
    def parse_deck_name(self, soup: BeautifulSoup) -> str:
        """Extract deck name from the page"""
        # Try multiple selectors for deck name
        selectors = [
            'h1',
            '.deck-title',
            '.product-title',
            'title'
        ]
        
        for selector in selectors:
            element = soup.select_one(selector)
            if element:
                name = element.get_text(strip=True)
                if name and name != "商品資訊":
                    return name
                    
        return "Unknown Deck"
    
    def parse_card_list(self, soup: BeautifulSoup) -> List[DeckCard]:
        """Extract card list from deck page"""
        cards = []
        
        # Look for various card list patterns
        card_patterns = [
            # Pattern 1: Table-based card lists
            'table tr',
            # Pattern 2: List-based card lists
            '.card-list li',
            '.decklist li',
            # Pattern 3: Div-based card lists
            '.card-item',
            # Pattern 4: Text patterns
            'p, div'
        ]
        
        for pattern in card_patterns:
            elements = soup.select(pattern)
            found_cards = self.extract_cards_from_elements(elements)
            if found_cards:
                cards.extend(found_cards)
                break
                
        # If no structured data found, try parsing text content
        if not cards:
            cards = self.extract_cards_from_text(soup.get_text())
            
        return cards
    
    def extract_cards_from_elements(self, elements: List) -> List[DeckCard]:
        """Extract cards from HTML elements"""
        cards = []
        
        for element in elements:
            text = element.get_text(strip=True)
            extracted_cards = self.parse_card_text(text)
            cards.extend(extracted_cards)
            
        return cards
    
    def extract_cards_from_text(self, text: str) -> List[DeckCard]:
        """Extract cards from plain text"""
        cards = []
        lines = text.split('\n')
        
        for line in lines:
            line = line.strip()
            if line:
                extracted_cards = self.parse_card_text(line)
                cards.extend(extracted_cards)
                
        return cards
    
    def parse_card_text(self, text: str) -> List[DeckCard]:
        """Parse card information from text"""
        cards = []
        
        # Common patterns for card entries
        patterns = [
            # Pattern: "4 Pikachu"
            r'(\d+)\s+(.+?)(?:\s|$)',
            # Pattern: "Pikachu x4"
            r'(.+?)\s+[xX](\d+)',
            # Pattern: "Pikachu (4)"
            r'(.+?)\s*\((\d+)\)',
        ]
        
        for pattern in patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                try:
                    if pattern.startswith(r'(\d+)'):
                        quantity = int(match.group(1))
                        name = match.group(2).strip()
                    else:
                        name = match.group(1).strip()
                        quantity = int(match.group(2))
                    
                    if quantity > 0 and len(name) > 2:
                        # Generate a card ID (this would need to be matched with your card database)
                        card_id = self.generate_card_id(name)
                        
                        cards.append(DeckCard(
                            card_id=card_id,
                            name=name,
                            quantity=quantity
                        ))
                except (ValueError, IndexError):
                    continue
                    
        return cards
    
    def generate_card_id(self, name: str) -> str:
        """Generate a card ID from the card name (placeholder implementation)"""
        # This is a simple implementation - in practice, you'd want to match against your card database
        return f"card_{hash(name) % 100000:05d}"
    
    def scrape_deck(self, url: str) -> Optional[Deck]:
        """Scrape a single deck from its detail page"""
        print(f"Scraping deck: {url}")
        soup = self.get_page(url)
        
        if not soup:
            return None
            
        deck_name = self.parse_deck_name(soup)
        cards = self.parse_card_list(soup)
        
        # Extract description
        description_selectors = ['.description', '.deck-description', 'p']
        description = ""
        for selector in description_selectors:
            element = soup.select_one(selector)
            if element:
                desc_text = element.get_text(strip=True)
                if len(desc_text) > 20:  # Reasonable description length
                    description = desc_text[:200] + "..." if len(desc_text) > 200 else desc_text
                    break
        
        if not description:
            description = f"Standard construction deck: {deck_name}"
        
        deck = Deck(
            name=deck_name,
            description=description,
            cards=cards,
            source_url=url,
            deck_type="Standard",
            created_date=time.strftime("%Y-%m-%d")
        )
        
        print(f"  - Found deck: {deck_name} with {len(cards)} cards")
        return deck
    
    def scrape_all_decks(self) -> List[Deck]:
        """Scrape all construction decks"""
        print("Starting deck scraping...")
        
        # Get the main products page
        products_url = "https://asia.pokemon-card.com/hk/products/#constructionDeck"
        soup = self.get_page(products_url)
        
        if not soup:
            print("Failed to fetch products page")
            return []
        
        # Extract deck URLs
        deck_urls = self.extract_deck_urls(soup)
        
        # Scrape each deck
        for i, url in enumerate(deck_urls[:10]):  # Limit to first 10 for testing
            print(f"Processing deck {i+1}/{min(10, len(deck_urls))}")
            deck = self.scrape_deck(url)
            if deck and deck.cards:  # Only add decks with cards
                self.decks.append(deck)
            
            # Be respectful - add delay between requests
            time.sleep(2)
        
        print(f"Scraping complete. Found {len(self.decks)} valid decks.")
        return self.decks
    
    def export_to_json(self, filename: str = "pokemon_tcg_decks.json"):
        """Export scraped decks to JSON format compatible with the web app"""
        export_data = []
        
        for deck in self.decks:
            deck_data = {
                "name": deck.name,
                "description": deck.description,
                "format": deck.deck_type,
                "cards": [
                    {
                        "cardId": card.card_id,
                        "name": card.name,
                        "quantity": card.quantity,
                        "type": card.card_type,
                        "expansion": card.expansion,
                        "rarity": card.rarity
                    }
                    for card in deck.cards
                ],
                "createdAt": deck.created_date,
                "sourceUrl": deck.source_url,
                "tags": ["Official", "Construction Deck", "Standard"]
            }
            export_data.append(deck_data)
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(export_data, f, indent=2, ensure_ascii=False)
        
        print(f"Exported {len(export_data)} decks to {filename}")
    
    def export_to_csv(self, filename: str = "pokemon_tcg_decks.csv"):
        """Export deck summary to CSV"""
        with open(filename, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(['Deck Name', 'Description', 'Card Count', 'Source URL'])
            
            for deck in self.decks:
                writer.writerow([
                    deck.name,
                    deck.description,
                    len(deck.cards),
                    deck.source_url
                ])
        
        print(f"Exported deck summary to {filename}")

def main():
    """Main function to run the scraper"""
    print("Pokemon TCG Construction Deck Scraper")
    print("=====================================")
    
    scraper = PokemonTCGDeckScraper()
    
    # Scrape all decks
    decks = scraper.scrape_all_decks()
    
    if decks:
        # Export results
        scraper.export_to_json()
        scraper.export_to_csv()
        
        print("\nScraping Summary:")
        print(f"Total decks scraped: {len(decks)}")
        for deck in decks:
            print(f"  - {deck.name}: {len(deck.cards)} cards")
    else:
        print("No decks were successfully scraped.")

if __name__ == "__main__":
    main()