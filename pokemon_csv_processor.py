import csv
import os
import json
from typing import List, Dict, Any, Optional, Set

class PokemonCardProcessor:
    """A class to process Pokemon card CSV data"""
    
    def __init__(self, csv_path: str = None):
        """Initialize the processor with an optional CSV file path"""
        self.csv_path = csv_path
        self.cards = []
        self.attributes = set()
        self.expansions = set()
        self.max_hp = 0
        
    def load_csv(self, csv_path: Optional[str] = None) -> bool:
        """Load card data from a CSV file
        
        Args:
            csv_path: Path to the CSV file (overrides the path set in __init__)
            
        Returns:
            bool: True if loading was successful, False otherwise
        """
        if csv_path:
            self.csv_path = csv_path
            
        if not self.csv_path or not os.path.exists(self.csv_path):
            print(f"Error: CSV file not found at {self.csv_path}")
            return False
            
        try:
            with open(self.csv_path, 'r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                self.cards = []
                
                for row in reader:
                    # Skip rows with missing essential data
                    if not row.get('Web Card ID') or not row.get('Name'):
                        continue
                        
                    # Convert HP to integer if possible
                    if 'HP' in row and row['HP']:
                        try:
                            row['HP'] = int(row['HP'])
                            self.max_hp = max(self.max_hp, row['HP'])
                        except ValueError:
                            row['HP'] = 0
                    else:
                        row['HP'] = 0
                        
                    # Add to collection
                    self.cards.append(row)
                    
                    # Track unique attributes and expansions
                    if row.get('Attribute'):
                        self.attributes.add(row['Attribute'])
                    if row.get('Expansion'):
                        self.expansions.add(row['Expansion'])
                        
                print(f"Loaded {len(self.cards)} cards from {self.csv_path}")
                return True
                
        except Exception as e:
            print(f"Error loading CSV: {str(e)}")
            return False
            
    def filter_cards(self, 
                     attributes: Optional[Set[str]] = None, 
                     expansions: Optional[Set[str]] = None,
                     hp_min: int = 0,
                     hp_max: Optional[int] = None,
                     name_search: str = "") -> List[Dict[str, Any]]:
        """Filter cards based on various criteria
        
        Args:
            attributes: Set of attributes to include (e.g., {'Fire', 'Water'})
            expansions: Set of expansions to include (e.g., {'SV1', 'SV2'})
            hp_min: Minimum HP value
            hp_max: Maximum HP value
            name_search: Text to search for in card names
            
        Returns:
            List of card dictionaries matching the filters
        """
        if not self.cards:
            print("No cards loaded. Call load_csv() first.")
            return []
            
        # Set default max HP if not provided
        if hp_max is None:
            hp_max = self.max_hp or 1000
            
        # Convert name search to lowercase for case-insensitive matching
        name_search = name_search.lower()
        
        filtered = []
        for card in self.cards:
            # Filter by attribute
            if attributes and card.get('Attribute') not in attributes:
                continue
                
            # Filter by expansion
            if expansions and card.get('Expansion') not in expansions:
                continue
                
            # Filter by HP range
            hp = int(card.get('HP', 0))
            if hp < hp_min or hp > hp_max:
                continue
                
            # Filter by name
            if name_search and name_search not in card.get('Name', '').lower():
                continue
                
            # Card passed all filters
            filtered.append(card)
            
        return filtered
        
    def get_unique_values(self, field: str) -> Set[str]:
        """Get all unique values for a specific field across all cards
        
        Args:
            field: The field name to get unique values for
            
        Returns:
            Set of unique values
        """
        if not self.cards:
            return set()
            
        return {card.get(field, '') for card in self.cards if card.get(field)}
        
    def export_to_json(self, output_path: str, cards: Optional[List[Dict[str, Any]]] = None) -> bool:
        """Export cards to a JSON file
        
        Args:
            output_path: Path to save the JSON file
            cards: List of cards to export (defaults to all loaded cards)
            
        Returns:
            bool: True if export was successful, False otherwise
        """
        try:
            if cards is None:
                cards = self.cards
                
            with open(output_path, 'w', encoding='utf-8') as file:
                json.dump(cards, file, indent=2, ensure_ascii=False)
                
            print(f"Exported {len(cards)} cards to {output_path}")
            return True
            
        except Exception as e:
            print(f"Error exporting to JSON: {str(e)}")
            return False
            
    def print_card_summary(self, card: Dict[str, Any]) -> None:
        """Print a summary of a card's information
        
        Args:
            card: The card dictionary to summarize
        """
        print(f"\n===== {card.get('Name', 'Unknown')} =====")
        print(f"ID: {card.get('Web Card ID', 'Unknown')}")
        print(f"Type: {card.get('Type', 'Unknown')}")
        print(f"Expansion: {card.get('Expansion', 'Unknown')}")
        print(f"Number: {card.get('Number', 'Unknown')}")
        print(f"HP: {card.get('HP', 'Unknown')}")
        print(f"Attribute: {card.get('Attribute', 'Unknown')}")
        
        if card.get('Image URL'):
            print(f"Image: {card.get('Image URL')}")
            
        if card.get('Card URL'):
            print(f"Details: {card.get('Card URL')}")

# Example usage
if __name__ == "__main__":
    # Check if the CSV file exists in the expected location
    csv_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 
                           "masterdb", "pokemon_cards_detailed_master.csv")
    
    processor = PokemonCardProcessor()
    
    # Try to load the CSV file
    if os.path.exists(csv_path):
        processor.load_csv(csv_path)
    else:
        print(f"CSV file not found at {csv_path}")
        print("Please make sure the CSV file exists or specify the correct path.")
        print("Example: processor.load_csv('path/to/your/pokemon_cards.csv')")
        
    # Example: Filter cards
    if processor.cards:
        # Example 1: Get all Fire type cards
        fire_cards = processor.filter_cards(attributes={'Fire'})
        print(f"Found {len(fire_cards)} Fire type cards")
        
        # Example 2: Get high HP cards
        high_hp_cards = processor.filter_cards(hp_min=200)
        print(f"Found {len(high_hp_cards)} cards with HP >= 200")
        
        # Example 3: Search by name
        pikachu_cards = processor.filter_cards(name_search="pikachu")
        print(f"Found {len(pikachu_cards)} Pikachu cards")
        
        # Print details of the first card in each filtered set
        if fire_cards:
            processor.print_card_summary(fire_cards[0])
        if high_hp_cards:
            processor.print_card_summary(high_hp_cards[0])
        if pikachu_cards:
            processor.print_card_summary(pikachu_cards[0])
            
        # Export filtered cards to JSON
        processor.export_to_json("fire_cards.json", fire_cards)