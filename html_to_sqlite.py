import os
import re
import sqlite3
from bs4 import BeautifulSoup

# Path to the folder containing HTML detail pages (organized by expansion)
HTML_PAGES_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "html_pages")
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "pokemon_cards.db")

def create_table(conn):
    conn.execute('''
        CREATE TABLE IF NOT EXISTS cards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            expansion TEXT,
            number TEXT,
            type TEXT,
            hp TEXT,
            attribute TEXT,
            attacks TEXT,
            attack_damage TEXT,
            weakness TEXT,
            resistance TEXT,
            retreat_cost TEXT,
            evolution TEXT,
            pokemon_info TEXT,
            artist TEXT,
            evolve_marker TEXT,
            expansion_symbol TEXT,
            subtypes TEXT,
            image_url TEXT,
            web_card_id TEXT
        )
    ''')
    conn.commit()

def extract_card_data(html_path):
    with open(html_path, 'r', encoding='utf-8') as f:
        soup = BeautifulSoup(f, 'html.parser')
    card_data = {
        'name': '', 'expansion': '', 'number': '', 'type': '', 'hp': '', 'attribute': '',
        'attacks': '', 'attack_damage': '', 'weakness': '', 'resistance': '', 'retreat_cost': '',
        'evolution': '', 'pokemon_info': '', 'artist': '', 'evolve_marker': '', 'expansion_symbol': '',
        'subtypes': '', 'image_url': '', 'web_card_id': ''
    }
    # Name
    name_header = soup.find('h1', class_='pageHeader')
    if name_header:
        try:
            name = name_header.text.strip()
            name = name.split("\n")[2]
            card_data['name'] = name.strip()
        except:
            card_data['name'] = name_header.text.strip()
    # Expansion
    expansion_symbol = soup.find('span', class_='expansionSymbol')
    if expansion_symbol:
        exp_img = expansion_symbol.find('img')
        if exp_img and 'src' in exp_img.attrs:
            src = exp_img['src']
            exp_match = re.search(r'twhk_exp_(\w+)\.png', src)
            if exp_match:
                card_data['expansion'] = exp_match.group(1)
    # Number
    collector_number = soup.find('span', class_='collectorNumber')
    if collector_number:
        card_data['number'] = collector_number.text.strip()
    # Type, HP, Attribute
    main_info = soup.find('p', class_='mainInfomation')
    if main_info:
        hp_span = main_info.find('span', class_='number')
        if hp_span:
            card_data['hp'] = hp_span.text.strip()
        type_img = main_info.find('img')
        if type_img and 'src' in type_img.attrs:
            src = type_img['src']
            type_match = re.search(r'energy/(\w+)\.png', src)
            if type_match:
                card_data['attribute'] = type_match.group(1)
    # Attacks, Attack Damage, Subtypes
    skill_info = soup.find('div', class_='skillInformation')
    attacks = []
    damages = []
    subtypes = []
    if skill_info:
        for skill in skill_info.find_all('div', class_='skill'):  # May need adjustment
            skill_name = skill.find('span', class_='skillName')
            skill_damage = skill.find('span', class_='skillDamage')
            if skill_name:
                attacks.append(skill_name.text.strip())
            if skill_damage:
                damages.append(skill_damage.text.strip())
    card_data['attacks'] = '; '.join(attacks)
    card_data['attack_damage'] = '; '.join(damages)
    # Weakness, Resistance, Retreat Cost
    for label, key in [('weakness', 'weakness'), ('resistance', 'resistance'), ('retreatCost', 'retreat_cost')]:
        elem = soup.find('span', class_=label)
        if elem:
            card_data[key] = elem.text.strip()
    # Evolution, Pokemon Info, Artist, Evolve Marker, Expansion Symbol
    # (Add more extraction logic as needed)
    # Image URL and Web Card ID from file name
    base = os.path.basename(html_path)
    match = re.match(r'(\d+)_', base)
    if match:
        card_data['number'] = match.group(1)
    card_data['image_url'] = ''  # Could be constructed if needed
    card_data['web_card_id'] = ''  # Could be extracted if needed
    # Subtypes (example: ex, V, etc.)
    if 'ex' in card_data['name'].lower():
        subtypes.append('ex')
    card_data['subtypes'] = '; '.join(subtypes)
    return card_data

def insert_card(conn, card_data):
    fields = ','.join(card_data.keys())
    placeholders = ','.join(['?'] * len(card_data))
    sql = f"INSERT INTO cards ({fields}) VALUES ({placeholders})"
    conn.execute(sql, list(card_data.values()))
    conn.commit()

def main():
    conn = sqlite3.connect(DB_PATH)
    create_table(conn)
    for expansion in os.listdir(HTML_PAGES_DIR):
        exp_dir = os.path.join(HTML_PAGES_DIR, expansion)
        if not os.path.isdir(exp_dir):
            continue
        for fname in os.listdir(exp_dir):
            if not fname.endswith('.html'):
                continue
            html_path = os.path.join(exp_dir, fname)
            try:
                card_data = extract_card_data(html_path)
                insert_card(conn, card_data)
                print(f"Inserted card: {card_data['name']} ({card_data['number']})")
            except Exception as e:
                print(f"Failed to process {html_path}: {e}")
    conn.close()

if __name__ == "__main__":
    main()