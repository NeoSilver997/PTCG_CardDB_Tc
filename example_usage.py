import os
from pokemon_csv_processor import PokemonCardProcessor

def main():
    # Create a processor instance
    processor = PokemonCardProcessor()
    
    # Check for CSV file in different possible locations
    possible_paths = [
        os.path.join(os.path.dirname(os.path.abspath(__file__)), "masterdb", "pokemon_cards_detailed_master.csv"),
        os.path.join(os.path.dirname(os.path.abspath(__file__)), "pokemon_cards_detailed_master.csv"),
        # Add any other potential locations
    ]
    
    # Try to find and load the CSV file
    csv_loaded = False
    for path in possible_paths:
        if os.path.exists(path):
            print(f"Found CSV file at: {path}")
            if processor.load_csv(path):
                csv_loaded = True
                break
    
    if not csv_loaded:
        print("\nCSV file not found in expected locations.")
        custom_path = input("Enter the full path to your Pokemon card CSV file: ")
        if os.path.exists(custom_path):
            processor.load_csv(custom_path)
        else:
            print(f"Error: File not found at {custom_path}")
            return
    
    # Display basic statistics
    print(f"\nLoaded {len(processor.cards)} Pokemon cards")
    print(f"Found {len(processor.attributes)} unique attributes: {', '.join(processor.attributes)}")
    print(f"Found {len(processor.expansions)} unique expansions")
    print(f"Maximum HP value: {processor.max_hp}")
    
    # Interactive filtering
    while True:
        print("\n==== Pokemon Card Database ====")
        print("1. Search by name")
        print("2. Filter by attribute")
        print("3. Filter by expansion")
        print("4. Filter by HP range")
        print("5. Export filtered cards to JSON")
        print("6. Exit")
        
        choice = input("\nEnter your choice (1-6): ")
        
        if choice == '1':
            name_search = input("Enter name to search for: ")
            filtered_cards = processor.filter_cards(name_search=name_search)
            print(f"Found {len(filtered_cards)} cards matching '{name_search}'")
            display_results(processor, filtered_cards)
            
        elif choice == '2':
            print("\nAvailable attributes:")
            attributes = list(processor.attributes)
            for i, attr in enumerate(attributes):
                print(f"{i+1}. {attr}")
            
            attr_indices = input("Enter attribute numbers (comma-separated): ")
            try:
                selected_indices = [int(idx.strip()) - 1 for idx in attr_indices.split(',')]
                selected_attributes = {attributes[idx] for idx in selected_indices if 0 <= idx < len(attributes)}
                
                filtered_cards = processor.filter_cards(attributes=selected_attributes)
                print(f"Found {len(filtered_cards)} cards with attributes: {', '.join(selected_attributes)}")
                display_results(processor, filtered_cards)
            except (ValueError, IndexError):
                print("Invalid input. Please enter valid numbers.")
                
        elif choice == '3':
            # Get top 10 expansions for simplicity
            expansions = list(processor.expansions)[:10]
            print("\nTop 10 expansions:")
            for i, exp in enumerate(expansions):
                print(f"{i+1}. {exp}")
            
            exp_indices = input("Enter expansion numbers (comma-separated): ")
            try:
                selected_indices = [int(idx.strip()) - 1 for idx in exp_indices.split(',')]
                selected_expansions = {expansions[idx] for idx in selected_indices if 0 <= idx < len(expansions)}
                
                filtered_cards = processor.filter_cards(expansions=selected_expansions)
                print(f"Found {len(filtered_cards)} cards from expansions: {', '.join(selected_expansions)}")
                display_results(processor, filtered_cards)
            except (ValueError, IndexError):
                print("Invalid input. Please enter valid numbers.")
                
        elif choice == '4':
            try:
                hp_min = int(input(f"Enter minimum HP (0-{processor.max_hp}): "))
                hp_max = int(input(f"Enter maximum HP (0-{processor.max_hp}): "))
                
                filtered_cards = processor.filter_cards(hp_min=hp_min, hp_max=hp_max)
                print(f"Found {len(filtered_cards)} cards with HP between {hp_min} and {hp_max}")
                display_results(processor, filtered_cards)
            except ValueError:
                print("Invalid input. Please enter valid numbers.")
                
        elif choice == '5':
            # First get filtered cards
            print("\nApply filters before exporting:")
            name_search = input("Name contains (leave empty to skip): ")
            
            # Get attribute filter
            selected_attributes = set()
            attr_input = input("Filter by attribute? (y/n): ")
            if attr_input.lower() == 'y':
                print("\nAvailable attributes:")
                attributes = list(processor.attributes)
                for i, attr in enumerate(attributes):
                    print(f"{i+1}. {attr}")
                
                attr_indices = input("Enter attribute numbers (comma-separated): ")
                try:
                    selected_indices = [int(idx.strip()) - 1 for idx in attr_indices.split(',')]
                    selected_attributes = {attributes[idx] for idx in selected_indices if 0 <= idx < len(attributes)}
                except (ValueError, IndexError):
                    print("Invalid input. Using no attribute filter.")
            
            # Apply filters
            filtered_cards = processor.filter_cards(
                attributes=selected_attributes if selected_attributes else None,
                name_search=name_search
            )
            
            # Export to JSON
            output_path = input("Enter output JSON filename: ")
            if not output_path.endswith('.json'):
                output_path += '.json'
                
            if processor.export_to_json(output_path, filtered_cards):
                print(f"Successfully exported {len(filtered_cards)} cards to {output_path}")
                
        elif choice == '6':
            print("Exiting program. Goodbye!")
            break
            
        else:
            print("Invalid choice. Please enter a number between 1 and 6.")

def display_results(processor, cards, limit=5):
    """Display a limited number of card results"""
    if not cards:
        print("No cards found matching your criteria.")
        return
        
    print(f"\nShowing {min(limit, len(cards))} of {len(cards)} results:")
    for i, card in enumerate(cards[:limit]):
        processor.print_card_summary(card)
        
    if len(cards) > limit:
        print(f"...and {len(cards) - limit} more cards")

if __name__ == "__main__":
    main()