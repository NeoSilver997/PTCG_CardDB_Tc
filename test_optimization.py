import sqlite3
import time
import os
import sys

# Add the current directory to the path so we can import our modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import our optimized modules
from optimize_db import connect_db
from optimized_pokemon_processor import OptimizedPokemonCardProcessor

# Database path
DB_PATH = 'x:\\Document\\PokemonDBDownload\\pokemon_cards.db'

def test_standard_queries():
    """Test standard SQLite queries without optimization"""
    print("\n=== Testing Standard Queries ===")
    
    # Connect to database with default settings
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Test queries
    test_queries = [
        ("SELECT * FROM card_csv LIMIT 100", "Simple SELECT"),
        ("SELECT * FROM card_csv WHERE name LIKE '%Pikachu%'", "Name search"),
        ("SELECT * FROM card_csv WHERE expansion = 'SV1a'", "Expansion filter"),
        ("SELECT * FROM card_csv WHERE attribute = 'Fire'", "Attribute filter"),
        ("SELECT * FROM card_csv WHERE hp > 100", "HP filter"),
        ("SELECT * FROM card_csv WHERE name LIKE '%Pikachu%' AND attribute = 'Electric'", "Combined filter")
    ]
    
    for query, description in test_queries:
        try:
            start_time = time.time()
            cursor.execute(query)
            results = cursor.fetchall()
            end_time = time.time()
            print(f"{description}: {end_time - start_time:.4f}s, {len(results)} results")
        except Exception as e:
            print(f"{description}: Error - {str(e)}")
    
    conn.close()

def test_optimized_queries():
    """Test queries with optimized connection and indexes"""
    print("\n=== Testing Optimized Queries ===")
    
    # Connect to database with optimized settings
    conn = connect_db()
    cursor = conn.cursor()
    
    # Test queries
    test_queries = [
        ("SELECT * FROM card_csv LIMIT 100", "Simple SELECT"),
        ("SELECT * FROM card_csv WHERE name LIKE '%Pikachu%'", "Name search"),
        ("SELECT * FROM card_csv WHERE expansion = 'SV1a'", "Expansion filter"),
        ("SELECT * FROM card_csv WHERE attribute = 'Fire'", "Attribute filter"),
        ("SELECT * FROM card_csv WHERE hp > 100", "HP filter"),
        ("SELECT * FROM card_csv WHERE name LIKE '%Pikachu%' AND attribute = 'Electric'", "Combined filter")
    ]
    
    for query, description in test_queries:
        try:
            start_time = time.time()
            cursor.execute(query)
            results = cursor.fetchall()
            end_time = time.time()
            print(f"{description}: {end_time - start_time:.4f}s, {len(results)} results")
        except Exception as e:
            print(f"{description}: Error - {str(e)}")
    
    conn.close()

def test_optimized_processor():
    """Test the optimized Pokemon card processor"""
    print("\n=== Testing Optimized Pokemon Processor ===")
    
    # Create processor instance
    processor = OptimizedPokemonCardProcessor(DB_PATH)
    
    # Test operations
    tests = [
        ("Count cards", lambda: processor.count_cards()),
        ("Get attributes", lambda: len(processor.attributes)),
        ("Get expansions", lambda: len(processor.expansions)),
        ("Get max HP", lambda: processor.max_hp),
        ("Search by name", lambda: len(processor.get_cards_by_name('Pikachu'))),
        ("Filter by attribute", lambda: len(processor.filter_cards(attributes={'Fire'}))),
        ("Filter by HP", lambda: len(processor.filter_cards(hp_min=100))),
        ("Combined filter", lambda: len(processor.filter_cards(attributes={'Fire'}, hp_min=100)))
    ]
    
    for description, test_func in tests:
        try:
            start_time = time.time()
            result = test_func()
            end_time = time.time()
            print(f"{description}: {end_time - start_time:.4f}s, Result: {result}")
        except Exception as e:
            print(f"{description}: Error - {str(e)}")
    
    # Close all connections
    processor.close_all()

def main():
    print("=== Database Optimization Performance Test ===")
    print(f"Database: {DB_PATH}")
    
    # Check if database exists
    if not os.path.exists(DB_PATH):
        print(f"Error: Database file not found at {DB_PATH}")
        return
    
    # Run tests
    test_standard_queries()
    test_optimized_queries()
    test_optimized_processor()
    
    print("\n=== Performance Test Complete ===")
    print("The optimized database and processor should show significant performance improvements.")
    print("Key optimizations implemented:")
    print("1. Added indexes on frequently queried columns")
    print("2. Optimized SQLite connection settings")
    print("3. Implemented connection pooling")
    print("4. Used prepared statements for queries")
    print("5. Added result caching for frequently accessed data")

if __name__ == "__main__":
    main()