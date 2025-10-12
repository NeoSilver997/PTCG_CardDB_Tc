import csv
import json
import os
import glob

# Path to the CSV file
csv_path = r'x:\Document\PokemonDBByjules\PTCG_CardDB_Tc\PTCG_Web\source\cards_output_all_mega.csv'

# Directory with JSON files
json_dir = r'x:\Document\PokemonDBByjules\PTCG_CardDB_Tc\temp\debug'

# Create id_to_rarity dict
id_to_rarity = {}

# Find all *_web_card_ids.json files
json_files = glob.glob(os.path.join(json_dir, '*_web_card_ids.json'))

for json_file in json_files:
    rarity = os.path.basename(json_file)[:-18].upper()  # e.g., 'ar' from 'ar_web_card_ids.json'
    with open(json_file, 'r', encoding='utf-8') as f:
        web_card_ids = json.load(f)
        for web_card_id in web_card_ids:
            id_to_rarity[web_card_id] = rarity

print(f"Loaded {len(id_to_rarity)} web_card_id to rarity mappings.")

# Read the CSV and update
updated_rows = []
changes = 0

with open(csv_path, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    fieldnames = reader.fieldnames
    for row in reader:
        web_card_id = row['WebCardID'].lstrip('0')
        old_rarity = row['Rarity']
        if web_card_id in id_to_rarity:
            new_rarity = id_to_rarity[web_card_id]
            if old_rarity != new_rarity:
                row['Rarity'] = new_rarity
                changes += 1
                print(f"Updated {web_card_id}: {old_rarity} -> {new_rarity}")
        updated_rows.append(row)

print(f"Total changes: {changes}")

# Write back
with open(csv_path, 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(updated_rows)

print("CSV updated successfully.")