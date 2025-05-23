import os
import csv
import json
from collections import Counter

def load_metadata():
    """Load metadata from the JSON file"""
    with open('masterdb/metadata.json', 'r') as f:
        return json.load(f)

def count_expansions_and_attributes(csv_files):
    """Count occurrences of expansions and attributes in CSV files"""
    expansion_counter = Counter()
    attribute_counter = Counter()
    
    for csv_file in csv_files:
        try:
            with open(csv_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    # Count expansions
                    if 'Expansion' in row and row['Expansion']:
                        expansion_counter[row['Expansion']] += 1
                    
                    # Count attributes
                    if 'Attribute' in row and row['Attribute']:
                        attribute_counter[row['Attribute']] += 1
        except Exception as e:
            print(f"Error processing {csv_file}: {e}")
    
    return expansion_counter, attribute_counter

def main():
    # Get all CSV files in the directory
    csv_files = [f for f in os.listdir() if f.endswith('.csv') and 'pokemon_cards_detailed' in f]
    
    if not csv_files:
        print("No CSV files found.")
        return
    
    print(f"Found {len(csv_files)} CSV files to process.")
    
    # Load metadata
    metadata = load_metadata()
    all_expansions = set(metadata['expansions'])
    all_attributes = set(metadata['attributes'])
    
    # Count expansions and attributes
    expansion_counter, attribute_counter = count_expansions_and_attributes(csv_files)
    
    # Print expansion counts
    print("\nExpansion Counts:")
    print("-" * 30)
    for expansion in sorted(all_expansions):
        count = expansion_counter.get(expansion, 0)
        if count > 0:
            print(f"{expansion}: {count}")
    
    # Print attribute counts
    print("\nAttribute Counts:")
    print("-" * 30)
    for attribute in sorted(all_attributes):
        count = attribute_counter.get(attribute, 0)
        if count > 0:
            print(f"{attribute}: {count}")
    
    # Print totals
    print("\nSummary:")
    print("-" * 30)
    print(f"Total cards counted: {sum(expansion_counter.values())}")
    print(f"Total expansions found: {len([e for e in expansion_counter if e in all_expansions])}")
    print(f"Total attributes found: {len([a for a in attribute_counter if a in all_attributes])}")

if __name__ == "__main__":
    main()