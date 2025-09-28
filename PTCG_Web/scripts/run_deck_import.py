#!/usr/bin/env python3
"""
Quick runner script for importing Pokemon construction decks
"""

import os
import sys
import subprocess

def check_dependencies():
    """Check if required Python packages are installed"""
    required = ['requests', 'beautifulsoup4', 'lxml']
    missing = []
    
    for package in required:
        try:
            __import__(package.replace('-', '_'))
        except ImportError:
            missing.append(package)
    
    if missing:
        print("Missing required packages:", ', '.join(missing))
        print("Installing required packages...")
        subprocess.check_call([sys.executable, '-m', 'pip', 'install'] + missing)

def find_card_database():
    """Find the card database CSV file"""
    possible_paths = [
        "../data/pokemon_cards.csv",
        "../../data/pokemon_cards.csv", 
        "../pokemon_cards.csv",
        "pokemon_cards.csv",
        "/source/cards_output_all_mega.csv",
        "../../source/cards_output_all_mega.csv",
        "../source/cards_output_all_mega.csv"
        
    ]
    
    for path in possible_paths:
        if os.path.exists(path):
            return path
    
    return None

def main():
    print("Pokemon TCG Construction Deck Import Tool")
    print("=" * 45)
    
    # Check dependencies
    check_dependencies()
    
    # Find card database
    card_db_path = find_card_database()
    if not card_db_path:
        print("❌ Card database not found!")
        print("Please ensure pokemon_cards.csv is in one of these locations:")
        print("  - ../data/pokemon_cards.csv")
        print("  - ../../data/pokemon_cards.csv")
        print("  - ../pokemon_cards.csv")
        print("  - pokemon_cards.csv")
        return
    
    print(f"✅ Found card database: {card_db_path}")
    
    # Import and run the enhanced scraper
    try:
        from enhanced_deck_importer import EnhancedPokemonDeckScraper
        
        print("🔄 Starting deck import...")
        scraper = EnhancedPokemonDeckScraper(card_db_path)
        decks = scraper.scrape_construction_decks()
        scraper.export_results()
        
        print(f"✅ Successfully imported {len(decks)} construction decks!")
        print("\nFiles created:")
        print("  📄 construction_decks.json - Ready for import into your web app")
        print("  📄 unmatched_cards.csv - Cards that need manual matching")
        print("  📄 import_summary.txt - Import statistics")
        
        print("\n🎯 Next steps:")
        print("1. Review unmatched_cards.csv and update your card database if needed")
        print("2. Import construction_decks.json into your web application")
        print("3. Test the imported decks in your deck builder")
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("Please ensure all required files are present.")
    except Exception as e:
        print(f"❌ Error during import: {e}")

if __name__ == "__main__":
    main()