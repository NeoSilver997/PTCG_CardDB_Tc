import os
import csv
import json
import datetime
import argparse
import sys
from collections import Counter

def load_metadata():
    """Load metadata from the JSON file"""
    with open('masterdb/metadata.json', 'r') as f:
        return json.load(f)

def count_expansions_and_attributes():
    """Count occurrences of expansions and attributes in CSV files"""
    expansion_counter = Counter()
    attribute_counter = Counter()
    
    # Get all CSV files in the directory
    csv_files = [f for f in os.listdir() if f.endswith('.csv') and 'pokemon_cards_detailed' in f]
    
    if not csv_files:
        print("No CSV files found.")
        return expansion_counter, attribute_counter
    
    print(f"Found {len(csv_files)} CSV files to process.")
    
    for csv_file in csv_files:
        try:
            print(f"Processing {csv_file}...")
            with open(csv_file, 'r', encoding='utf-8', errors='ignore') as f:
                reader = csv.reader(f)
                headers = next(reader)  # Get the header row
                
                # Find the indices of the Expansion and Attribute columns
                expansion_idx = -1
                attribute_idx = -1
                
                for i, header in enumerate(headers):
                    if header == 'Expansion':
                        expansion_idx = i
                    elif header == 'Attribute':
                        attribute_idx = i
                
                if expansion_idx == -1 or attribute_idx == -1:
                    print(f"Warning: Could not find Expansion or Attribute column in {csv_file}")
                    continue
                
                # Process each row
                for row in reader:
                    if len(row) > max(expansion_idx, attribute_idx):
                        if expansion_idx >= 0 and row[expansion_idx]:
                            expansion_counter[row[expansion_idx]] += 1
                        
                        if attribute_idx >= 0 and row[attribute_idx]:
                            attribute_counter[row[attribute_idx]] += 1
        except Exception as e:
            print(f"Error processing {csv_file}: {e}")
    
    return expansion_counter, attribute_counter

def save_summary_to_csv(sorted_expansions, sorted_attributes, all_expansions, all_attributes):
    """Save the summary to CSV files"""
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # Save expansion summary
    expansion_file = f"expansion_summary_{timestamp}.csv"
    with open(expansion_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['Expansion', 'Count', 'In Metadata'])
        for expansion, count in sorted_expansions:
            in_metadata = "Yes" if expansion in all_expansions else "No"
            writer.writerow([expansion, count, in_metadata])
    print(f"\nExpansion summary saved to {expansion_file}")
    
    # Save attribute summary
    attribute_file = f"attribute_summary_{timestamp}.csv"
    with open(attribute_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['Attribute', 'Count', 'In Metadata'])
        for attribute, count in sorted_attributes:
            in_metadata = "Yes" if attribute in all_attributes else "No"
            writer.writerow([attribute, count, in_metadata])
    print(f"Attribute summary saved to {attribute_file}")

def calculate_statistics(expansion_counter, attribute_counter, all_expansions, all_attributes):
    """Calculate additional statistics about the data"""
    stats = {}
    
    # Card statistics
    total_cards = sum(expansion_counter.values())
    stats['total_cards'] = total_cards
    
    # Expansion statistics
    stats['total_expansions_found'] = len(expansion_counter)
    stats['total_expansions_in_metadata'] = len(all_expansions)
    stats['expansions_in_data_not_metadata'] = len([e for e in expansion_counter if e not in all_expansions])
    stats['expansions_in_metadata_not_data'] = len([e for e in all_expansions if e not in expansion_counter])
    
    # Attribute statistics
    stats['total_attributes_found'] = len(attribute_counter)
    stats['total_attributes_in_metadata'] = len(all_attributes)
    stats['attributes_in_data_not_metadata'] = len([a for a in attribute_counter if a not in all_attributes])
    stats['attributes_in_metadata_not_data'] = len([a for a in all_attributes if a not in attribute_counter])
    
    # Most common
    if expansion_counter:
        stats['most_common_expansion'], stats['most_common_expansion_count'] = max(expansion_counter.items(), key=lambda x: x[1])
    if attribute_counter:
        stats['most_common_attribute'], stats['most_common_attribute_count'] = max(attribute_counter.items(), key=lambda x: x[1])
    
    return stats

def parse_arguments():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description='Analyze Pokemon card data and generate summary statistics.')
    parser.add_argument('--sort', choices=['count', 'name'], default='count',
                        help='Sort method for expansions and attributes (default: count)')
    parser.add_argument('--order', choices=['asc', 'desc'], default='desc',
                        help='Sort order (default: desc)')
    parser.add_argument('--save-csv', action='store_true',
                        help='Save results to CSV files')
    parser.add_argument('--show-all-metadata', action='store_true',
                        help='Show all items from metadata even if count is 0')
    parser.add_argument('--filter-metadata', choices=['all', 'in', 'out', 'missing'], default='all',
                        help='Filter items by metadata status (all, in=only in metadata, out=only not in metadata, missing=in metadata but missing in data)')
    return parser.parse_args()

def main():
    # Parse command line arguments
    args = parse_arguments()
    
    # Load metadata
    metadata = load_metadata()
    all_expansions = set(metadata['expansions'])
    all_attributes = set(metadata['attributes'])
    
    # Count expansions and attributes
    expansion_counter, attribute_counter = count_expansions_and_attributes()
    
    # Determine sort key and order
    if args.sort == 'count':
        sort_key = lambda x: x[1]  # Sort by count
    else:  # args.sort == 'name'
        sort_key = lambda x: x[0].lower()  # Sort by name (case insensitive)
    
    reverse_order = args.order == 'desc'
    
    # Sort expansions
    sorted_expansions = sorted(expansion_counter.items(), key=sort_key, reverse=reverse_order)
    
    # Filter expansions based on metadata if requested
    if args.filter_metadata == 'in':
        sorted_expansions = [(exp, count) for exp, count in sorted_expansions if exp in all_expansions]
    elif args.filter_metadata == 'out':
        sorted_expansions = [(exp, count) for exp, count in sorted_expansions if exp not in all_expansions]
    
    # Add expansions from metadata with count 0 if requested
    if args.show_all_metadata or args.filter_metadata == 'missing':
        missing_expansions = [(exp, 0) for exp in all_expansions if exp not in expansion_counter]
        if args.filter_metadata == 'missing':
            sorted_expansions = sorted(missing_expansions, key=sort_key, reverse=reverse_order)
        else:
            sorted_expansions.extend(missing_expansions)
            sorted_expansions = sorted(sorted_expansions, key=sort_key, reverse=reverse_order)
    
    # Print expansion counts
    sort_method = "count" if args.sort == "count" else "name"
    sort_order = "descending" if args.order == "desc" else "ascending"
    print(f"\nExpansion Counts (sorted by {sort_method}, {sort_order}):")
    print("-" * 50)
    print(f"{'Expansion':<30} | {'Count':>6} | {'In Metadata':>10}")
    print("-" * 50)
    for expansion, count in sorted_expansions:
        in_metadata = "✓" if expansion in all_expansions else "✗"
        print(f"{expansion[:30]:<30} | {count:>6} | {in_metadata:>10}")
    
    # Sort attributes
    sorted_attributes = sorted(attribute_counter.items(), key=sort_key, reverse=reverse_order)
    
    # Filter attributes based on metadata if requested
    if args.filter_metadata == 'in':
        sorted_attributes = [(attr, count) for attr, count in sorted_attributes if attr in all_attributes]
    elif args.filter_metadata == 'out':
        sorted_attributes = [(attr, count) for attr, count in sorted_attributes if attr not in all_attributes]
    
    # Add attributes from metadata with count 0 if requested
    if args.show_all_metadata or args.filter_metadata == 'missing':
        missing_attributes = [(attr, 0) for attr in all_attributes if attr not in attribute_counter]
        if args.filter_metadata == 'missing':
            sorted_attributes = sorted(missing_attributes, key=sort_key, reverse=reverse_order)
        else:
            sorted_attributes.extend(missing_attributes)
            sorted_attributes = sorted(sorted_attributes, key=sort_key, reverse=reverse_order)
    
    # Print attribute counts
    print(f"\nAttribute Counts (sorted by {sort_method}, {sort_order}):")
    print("-" * 50)
    print(f"{'Attribute':<30} | {'Count':>6} | {'In Metadata':>10}")
    print("-" * 50)
    for attribute, count in sorted_attributes:
        in_metadata = "✓" if attribute in all_attributes else "✗"
        print(f"{attribute[:30]:<30} | {count:>6} | {in_metadata:>10}")
    
    # Calculate additional statistics
    stats = calculate_statistics(expansion_counter, attribute_counter, all_expansions, all_attributes)
    
    # Print totals and statistics
    print("\nSummary:")
    print("-" * 50)
    print(f"Total cards counted: {stats['total_cards']}")
    print(f"Total expansions found: {stats['total_expansions_found']}")
    print(f"Total attributes found: {stats['total_attributes_found']}")
    print(f"Expansions in metadata: {stats['total_expansions_in_metadata']}")
    print(f"Attributes in metadata: {stats['total_attributes_in_metadata']}")
    
    print("\nDetailed Statistics:")
    print("-" * 50)
    print(f"Expansions found in data but not in metadata: {stats['expansions_in_data_not_metadata']}")
    print(f"Expansions in metadata but not found in data: {stats['expansions_in_metadata_not_data']}")
    print(f"Attributes found in data but not in metadata: {stats['attributes_in_data_not_metadata']}")
    print(f"Attributes in metadata but not found in data: {stats['attributes_in_metadata_not_data']}")
    
    if expansion_counter:
        print(f"\nMost common expansion: {stats['most_common_expansion']} ({stats['most_common_expansion_count']} cards)")
    if attribute_counter:
        print(f"Most common attribute: {stats['most_common_attribute']} ({stats['most_common_attribute_count']} cards)")
    
    # Save summary to CSV files if requested
    if args.save_csv:
        save_summary_to_csv(sorted_expansions, sorted_attributes, all_expansions, all_attributes)

def print_help_message():
    """Print a help message with examples of how to use the script"""
    print("\nPokemon Card Data Analyzer")
    print("==========================")
    print("\nThis script analyzes Pokemon card data from CSV files and generates summary statistics.")
    print("\nCommand-line options:")
    print("  --sort [count|name]       Sort by count (default) or name")
    print("  --order [desc|asc]        Sort in descending (default) or ascending order")
    print("  --save-csv                Save results to CSV files")
    print("  --show-all-metadata       Show all items from metadata even if count is 0")
    print("  --filter-metadata [option] Filter items by metadata status:")
    print("                              all: Show all items (default)")
    print("                              in: Only show items in metadata")
    print("                              out: Only show items not in metadata")
    print("                              missing: Show items in metadata but missing in data")
    print("\nExamples:")
    print("  python count_summary.py                     # Run with default settings")
    print("  python count_summary.py --sort name         # Sort by name")
    print("  python count_summary.py --save-csv         # Save results to CSV")
    print("  python count_summary.py --filter-metadata in # Show only items in metadata")

if __name__ == "__main__":
    # Print help message if no arguments are provided
    if len(sys.argv) == 1:
        print_help_message()
        print("\nRunning with default settings...\n")
    
    main()