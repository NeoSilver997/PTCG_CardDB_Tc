import os
import json
from pokemon_csv_processor import PokemonCardProcessor

def generate_web_data():
    """Generate JSON data for the web interface from the CSV file"""
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
            return False
    
    # Create output directory if it doesn't exist
    output_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "masterdb")
    os.makedirs(output_dir, exist_ok=True)
    
    # Export all cards to JSON for the web interface
    all_cards_path = os.path.join(output_dir, "all_cards.json")
    processor.export_to_json(all_cards_path)
    
    # Generate metadata for filters
    metadata = {
        "attributes": list(processor.attributes),
        "expansions": list(processor.expansions),
        "maxHP": processor.max_hp,
        "cardCount": len(processor.cards)
    }
    
    # Export metadata
    metadata_path = os.path.join(output_dir, "metadata.json")
    try:
        with open(metadata_path, 'w', encoding='utf-8') as file:
            json.dump(metadata, file, indent=2, ensure_ascii=False)
        print(f"Exported metadata to {metadata_path}")
    except Exception as e:
        print(f"Error exporting metadata: {str(e)}")
        return False
    
    print("\nData generation complete!")
    print(f"Generated files in {output_dir}:")
    print(f"- all_cards.json: Contains all {len(processor.cards)} cards")
    print(f"- metadata.json: Contains filter options and statistics")
    print("\nYou can now use these files with the web interface.")
    print("Make sure the web server is running to access the Pokemon Card Database.")
    
    return True

def update_script_js():
    """Update script.js to load data from JSON instead of CSV"""
    script_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "script.js")
    
    if not os.path.exists(script_path):
        print(f"Error: script.js not found at {script_path}")
        return False
    
    try:
        # Read the current script.js content
        with open(script_path, 'r', encoding='utf-8') as file:
            content = file.read()
        
        # Check if the file already uses JSON loading
        if 'fetch(\'masterdb/all_cards.json\')' in content:
            print("script.js is already configured to use JSON data.")
            return True
        
        # Replace the CSV loading function with JSON loading
        old_load_function = "async function loadCardData() {\n    try {\n        const response = await fetch('masterdb/pokemon_cards_detailed_master.csv');\n        const csvText = await response.text();\n        return parseCSV(csvText);\n    } catch (error) {\n        console.error('Error loading CSV data:', error);\n        throw error;\n    }\n}"
        
        new_load_function = "async function loadCardData() {\n    try {\n        const response = await fetch('masterdb/all_cards.json');\n        const cards = await response.json();\n        return cards;\n    } catch (error) {\n        console.error('Error loading JSON data:', error);\n        throw error;\n    }\n}"
        
        # Replace the function
        updated_content = content.replace(old_load_function, new_load_function)
        
        # Remove the parseCSV function since it's no longer needed
        parse_csv_function = "function parseCSV(csvText) {\n    const lines = csvText.split('\\n');\n    const headers = lines[0].split(',');\n    \n    const cards = [];\n    \n    for (let i = 1; i < lines.length; i++) {\n        if (!lines[i].trim()) continue; // Skip empty lines\n        \n        const values = lines[i].split(',');\n        const card = {};\n        \n        // Map CSV columns to card properties\n        headers.forEach((header, index) => {\n            card[header] = values[index] || '';\n        });\n        \n        // Only add cards with valid data\n        if (card['Web Card ID'] && card['Name'] && card['Image URL']) {\n            cards.push(card);\n        }\n    }\n    \n    return cards;\n}"
        
        # Remove the parseCSV function
        updated_content = updated_content.replace(parse_csv_function, "// JSON data is already parsed by fetch")
        
        # Write the updated content back to the file
        with open(script_path, 'w', encoding='utf-8') as file:
            file.write(updated_content)
        
        print("Updated script.js to load data from JSON instead of CSV.")
        return True
        
    except Exception as e:
        print(f"Error updating script.js: {str(e)}")
        return False

if __name__ == "__main__":
    print("=== Pokemon CSV to Web Data Converter ===")
    print("This script will convert your Pokemon card CSV data to JSON format for the web interface.")
    print("Make sure you have the CSV file in the expected location.\n")
    
    # Generate web data
    if generate_web_data():
        # Update script.js to use JSON data
        update_script_js()
        
        print("\nSetup complete! You can now run the web server to view your Pokemon Card Database.")
        print("Run the server with: python -m http.server 8000")
        print("Then open http://localhost:8000/ in your web browser.")
    else:
        print("\nSetup failed. Please check the error messages above.")