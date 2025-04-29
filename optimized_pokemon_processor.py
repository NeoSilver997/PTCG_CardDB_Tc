import sqlite3
import os
import json
from typing import List, Dict, Any, Optional, Set, Tuple
from contextlib import contextmanager
import time

class OptimizedPokemonCardProcessor:
    """An optimized version of the Pokemon Card Processor that uses SQLite directly
    instead of loading all cards into memory.
    
    This class implements connection pooling, prepared statements, and leverages
    database indexes for faster queries.
    """
    
    def __init__(self, db_path: str = 'pokemon_cards.db'):
        """Initialize the processor with the database path
        
        Args:
            db_path: Path to the SQLite database file
        """
        self.db_path = db_path
        self.max_connections = 3  # Maximum number of connections in the pool
        self.connections = []     # List of available connections
        self.in_use = set()       # Set of connections currently in use
        
        # Cache for frequently accessed metadata
        self._attributes_cache = None
        self._expansions_cache = None
        self._max_hp_cache = None
        
        # Initialize database if needed
        self._initialize_db()
    
    def _initialize_db(self):
        """Initialize the database with optimized settings and indexes"""
        with self.get_connection() as conn:
            # Set optimized pragmas
            conn.execute('PRAGMA journal_mode = WAL')
            conn.execute('PRAGMA synchronous = NORMAL')
            conn.execute('PRAGMA cache_size = 5000')
            conn.execute('PRAGMA temp_store = MEMORY')
            
            # Create indexes if they don't exist
            indexes = [
                ("name_idx", "name"),
                ("expansion_idx", "expansion"),
                ("attribute_idx", "attribute"),
                ("hp_idx", "hp"),
                ("name_attr_idx", "name, attribute"),
                ("expansion_attr_idx", "expansion, attribute")
            ]
            
            for index_name, columns in indexes:
                conn.execute(f"CREATE INDEX IF NOT EXISTS {index_name} ON card_csv({columns})")
            
            # Update statistics
            conn.execute("ANALYZE")
    
    @contextmanager
    def get_connection(self):
        """Get a database connection from the pool"""
        connection = self._get_connection()
        try:
            yield connection
        finally:
            self._return_connection(connection)
    
    def _get_connection(self):
        """Get an available connection or create a new one"""
        # Check for available connections
        for conn in self.connections:
            if conn not in self.in_use:
                self.in_use.add(conn)
                return conn
        
        # Create a new connection if under the limit
        if len(self.connections) < self.max_connections:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row  # Return rows as dictionaries
            self.connections.append(conn)
            self.in_use.add(conn)
            return conn
        
        # Wait for a connection to become available
        while True:
            for conn in self.connections:
                if conn not in self.in_use:
                    self.in_use.add(conn)
                    return conn
            time.sleep(0.1)
    
    def _return_connection(self, connection):
        """Return a connection to the pool"""
        if connection in self.in_use:
            self.in_use.remove(connection)
    
    def close_all(self):
        """Close all database connections"""
        for conn in self.connections:
            if conn not in self.in_use:
                conn.close()
        self.connections = [conn for conn in self.connections if conn in self.in_use]
    
    @property
    def attributes(self) -> Set[str]:
        """Get all unique attributes from the database"""
        if self._attributes_cache is None:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT DISTINCT attribute FROM card_csv WHERE attribute IS NOT NULL AND attribute != ''")
                self._attributes_cache = {row[0] for row in cursor.fetchall()}
        return self._attributes_cache
    
    @property
    def expansions(self) -> Set[str]:
        """Get all unique expansions from the database"""
        if self._expansions_cache is None:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT DISTINCT expansion FROM card_csv WHERE expansion IS NOT NULL AND expansion != ''")
                self._expansions_cache = {row[0] for row in cursor.fetchall()}
        return self._expansions_cache
    
    @property
    def max_hp(self) -> int:
        """Get the maximum HP value from the database"""
        if self._max_hp_cache is None:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT MAX(hp) FROM card_csv WHERE hp IS NOT NULL")
                result = cursor.fetchone()
                self._max_hp_cache = result[0] if result and result[0] is not None else 0
        return self._max_hp_cache
    
    def count_cards(self) -> int:
        """Count the total number of cards in the database"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM card_csv")
            return cursor.fetchone()[0]
    
    def filter_cards(self, 
                     attributes: Optional[Set[str]] = None, 
                     expansions: Optional[Set[str]] = None,
                     hp_min: int = 0,
                     hp_max: Optional[int] = None,
                     name_search: str = "",
                     limit: int = 100,
                     offset: int = 0) -> List[Dict[str, Any]]:
        """Filter cards based on various criteria using optimized SQL queries
        
        Args:
            attributes: Set of attributes to include (e.g., {'Fire', 'Water'})
            expansions: Set of expansions to include (e.g., {'SV1', 'SV2'})
            hp_min: Minimum HP value
            hp_max: Maximum HP value
            name_search: Text to search for in card names
            limit: Maximum number of results to return
            offset: Number of results to skip (for pagination)
            
        Returns:
            List of card dictionaries matching the filters
        """
        # Set default max HP if not provided
        if hp_max is None:
            hp_max = self.max_hp or 1000
        
        # Build the query dynamically
        query = "SELECT * FROM card_csv WHERE 1=1"
        params = []
        
        # Add filters
        if attributes:
            placeholders = ', '.join(['?'] * len(attributes))
            query += f" AND attribute IN ({placeholders})"
            params.extend(attributes)
        
        if expansions:
            placeholders = ', '.join(['?'] * len(expansions))
            query += f" AND expansion IN ({placeholders})"
            params.extend(expansions)
        
        if hp_min > 0:
            query += " AND hp >= ?"
            params.append(hp_min)
        
        if hp_max < 1000:
            query += " AND hp <= ?"
            params.append(hp_max)
        
        if name_search:
            query += " AND name LIKE ?"
            params.append(f"%{name_search}%")
        
        # Add limit and offset
        query += " LIMIT ? OFFSET ?"
        params.append(limit)
        params.append(offset)
        
        # Execute the query
        with self.get_connection() as conn:
            cursor = conn.cursor()
            start_time = time.time()
            cursor.execute(query, params)
            rows = cursor.fetchall()
            end_time = time.time()
            
            # Convert rows to dictionaries
            results = []
            for row in rows:
                card_dict = {}
                for key in row.keys():
                    card_dict[key] = row[key]
                results.append(card_dict)
            
            print(f"Query executed in {end_time - start_time:.4f} seconds")
            return results
    
    def get_card_by_id(self, card_id: int) -> Optional[Dict[str, Any]]:
        """Get a card by its ID
        
        Args:
            card_id: The card ID to look up
            
        Returns:
            Card dictionary or None if not found
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM card_csv WHERE id = ?", (card_id,))
            row = cursor.fetchone()
            
            if row:
                card_dict = {}
                for key in row.keys():
                    card_dict[key] = row[key]
                return card_dict
            
            return None
    
    def get_cards_by_name(self, name: str, exact_match: bool = False) -> List[Dict[str, Any]]:
        """Get cards by name
        
        Args:
            name: The name to search for
            exact_match: Whether to require an exact match
            
        Returns:
            List of matching card dictionaries
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            if exact_match:
                cursor.execute("SELECT * FROM card_csv WHERE name = ?", (name,))
            else:
                cursor.execute("SELECT * FROM card_csv WHERE name LIKE ?", (f"%{name}%",))
            
            rows = cursor.fetchall()
            
            # Convert rows to dictionaries
            results = []
            for row in rows:
                card_dict = {}
                for key in row.keys():
                    card_dict[key] = row[key]
                results.append(card_dict)
            
            return results
    
    def export_to_json(self, cards: List[Dict[str, Any]], output_path: str) -> bool:
        """Export cards to a JSON file
        
        Args:
            cards: List of card dictionaries to export
            output_path: Path to save the JSON file
            
        Returns:
            True if successful, False otherwise
        """
        try:
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(cards, f, ensure_ascii=False, indent=2)
            return True
        except Exception as e:
            print(f"Error exporting to JSON: {str(e)}")
            return False
    
    def get_card_count_by_attribute(self) -> Dict[str, int]:
        """Get the count of cards for each attribute
        
        Returns:
            Dictionary mapping attribute names to counts
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT attribute, COUNT(*) as count 
                FROM card_csv 
                WHERE attribute IS NOT NULL AND attribute != '' 
                GROUP BY attribute 
                ORDER BY count DESC
            """)
            
            return {row[0]: row[1] for row in cursor.fetchall()}
    
    def get_card_count_by_expansion(self) -> Dict[str, int]:
        """Get the count of cards for each expansion
        
        Returns:
            Dictionary mapping expansion names to counts
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT expansion, COUNT(*) as count 
                FROM card_csv 
                WHERE expansion IS NOT NULL AND expansion != '' 
                GROUP BY expansion 
                ORDER BY count DESC
            """)
            
            return {row[0]: row[1] for row in cursor.fetchall()}
    
    def batch_process(self, card_ids: List[int], process_func) -> List[Any]:
        """Process multiple cards in batches
        
        Args:
            card_ids: List of card IDs to process
            process_func: Function to apply to each card
            
        Returns:
            List of results from processing each card
        """
        results = []
        batch_size = 100
        
        for i in range(0, len(card_ids), batch_size):
            batch = card_ids[i:i+batch_size]
            
            # Get cards in batch
            with self.get_connection() as conn:
                cursor = conn.cursor()
                placeholders = ', '.join(['?'] * len(batch))
                cursor.execute(f"SELECT * FROM card_csv WHERE id IN ({placeholders})", batch)
                
                for row in cursor.fetchall():
                    card_dict = {}
                    for key in row.keys():
                        card_dict[key] = row[key]
                    
                    # Process the card
                    result = process_func(card_dict)
                    results.append(result)
        
        return results

# Example usage
def main():
    # Create processor instance
    processor = OptimizedPokemonCardProcessor('x:\\Document\\PokemonDBDownload\\pokemon_cards.db')
    
    # Display basic statistics
    print(f"\nLoaded {processor.count_cards()} Pokemon cards")
    print(f"Found {len(processor.attributes)} unique attributes: {', '.join(processor.attributes)}")
    print(f"Found {len(processor.expansions)} unique expansions")
    print(f"Maximum HP value: {processor.max_hp}")
    
    # Example: Search for Pikachu cards
    start_time = time.time()
    pikachu_cards = processor.get_cards_by_name('Pikachu')
    end_time = time.time()
    print(f"\nFound {len(pikachu_cards)} Pikachu cards in {end_time - start_time:.4f} seconds")
    
    # Example: Filter cards
    start_time = time.time()
    filtered_cards = processor.filter_cards(
        attributes={'Fire'},
        hp_min=100
    )
    end_time = time.time()
    print(f"Found {len(filtered_cards)} Fire cards with HP >= 100 in {end_time - start_time:.4f} seconds")
    
    # Example: Get card counts by attribute
    attribute_counts = processor.get_card_count_by_attribute()
    print("\nCard counts by attribute:")
    for attr, count in list(attribute_counts.items())[:5]:  # Show top 5
        print(f"  {attr}: {count}")
    
    # Close all connections
    processor.close_all()

if __name__ == "__main__":
    main()