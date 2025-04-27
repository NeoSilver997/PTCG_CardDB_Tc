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
            [Web_Card_ID] TEXT,
            [Type] TEXT,
            [Name] TEXT,
            [Expansion] TEXT,
            [Number] TEXT,
            [Card_URL] TEXT,
            [Image_URL] TEXT,
            [HP] TEXT,
            [Attribute] TEXT,
            [Attacks] TEXT,
            [Attack_Damage] TEXT,
            [Skill1_Name] TEXT,
            [Skill1_Cost] TEXT,
            [Skill1_Damage] TEXT,
            [Skill1_Effect] TEXT,
            [Skill2_Name] TEXT,
            [Skill2_Cost] TEXT,
            [Skill2_Damage] TEXT,
            [Skill2_Effect] TEXT,
            [Weakness] TEXT,
            [Resistance] TEXT,
            [Retreat_Cost] TEXT,
            [Evolution] TEXT,
            [Pokemon_Info] TEXT,
            [Artist] TEXT,
            [Evolve_Marker] TEXT,
            [Expansion_Symbol] TEXT,
            [Subtypes] TEXT
        )
    ''')
    conn.commit()

# Helper to safely get text

def get_text_safe(elem):
    return elem.text.strip() if elem else ''

def extract_card_data(html_path):
    with open(html_path, 'r', encoding='utf-8') as f:
        soup = BeautifulSoup(f, 'html.parser')
    card_data = {
        'Web_Card_ID': '', 'Type': '', 'Name': '', 'Expansion': '', 'Number': '', 'Card_URL': '', 'Image_URL': '',
        'HP': '', 'Attribute': '', 'Attacks': '', 'Attack_Damage': '',
        'Skill1_Name': '', 'Skill1_Cost': '', 'Skill1_Damage': '', 'Skill1_Effect': '',
        'Skill2_Name': '', 'Skill2_Cost': '', 'Skill2_Damage': '', 'Skill2_Effect': '',
        'Weakness': '', 'Resistance': '', 'Retreat_Cost': '',
        'Evolution': '', 'Pokemon_Info': '', 'Artist': '', 'Evolve_Marker': '', 'Expansion_Symbol': '', 'Subtypes': ''
    }
    # Name
    name_header = soup.find('h1', class_='pageHeader')
    if name_header:
        try:
            name = name_header.text.strip()
            name = name.split("\n")[2]
            card_data['Name'] = name.strip()
        except:
            card_data['Name'] = name_header.text.strip()
    # Expansion
    expansion_symbol = soup.find('span', class_='expansionSymbol')
    if expansion_symbol:
        exp_img = expansion_symbol.find('img')
        if exp_img and 'src' in exp_img.attrs:
            src = exp_img['src']
            exp_match = re.search(r'twhk_exp_(\w+)\.png', src)
            if exp_match:
                card_data['Expansion'] = exp_match.group(1)
            card_data['Expansion_Symbol'] = src
    # Number
    collector_number = soup.find('span', class_='collectorNumber')
    if collector_number:
        card_data['Number'] = collector_number.text.strip()
    # HP, Attribute
    main_info = soup.find('p', class_='mainInfomation')
    if main_info:
        hp_span = main_info.find('span', class_='number')
        if hp_span:
            card_data['HP'] = hp_span.text.strip()
        type_img = main_info.find('img')
        if type_img and 'src' in type_img.attrs:
            src = type_img['src']
            type_match = re.search(r'energy/(\w+)\.png', src)
            if type_match:
                card_data['Attribute'] = type_match.group(1)
    # Attacks, Attack Damage, Skills
    skill_info = soup.find('div', class_='skillInformation')
    attacks = []
    damages = []
    skill_names = []
    skill_costs = []
    skill_damages = []
    skill_effects = []
    if skill_info:
        skills = skill_info.find_all('div', class_='skill')
        for idx, skill in enumerate(skills):
            skill_name = get_text_safe(skill.find('span', class_='skillName'))
            skill_damage = get_text_safe(skill.find('span', class_='skillDamage'))
            skill_effect = get_text_safe(skill.find('span', class_='effect'))
            cost_imgs = skill.find_all('img', src=re.compile(r'energy/'))
            cost_types = [re.search(r'energy/(\w+)\.png', img['src']).group(1) for img in cost_imgs if re.search(r'energy/(\w+)\.png', img['src'])]
            cost_str = ','.join(cost_types)
            if skill_name:
                attacks.append(skill_name)
                skill_names.append(skill_name)
            if skill_damage:
                damages.append(skill_damage)
                skill_damages.append(skill_damage)
            if skill_effect:
                skill_effects.append(skill_effect)
            skill_costs.append(cost_str)
            # Save up to 2 skills
            if idx == 0:
                card_data['Skill1_Name'] = skill_name
                card_data['Skill1_Cost'] = cost_str
                card_data['Skill1_Damage'] = skill_damage
                card_data['Skill1_Effect'] = skill_effect
            elif idx == 1:
                card_data['Skill2_Name'] = skill_name
                card_data['Skill2_Cost'] = cost_str
                card_data['Skill2_Damage'] = skill_damage
                card_data['Skill2_Effect'] = skill_effect
    card_data['Attacks'] = '; '.join(attacks)
    card_data['Attack_Damage'] = '; '.join(damages)
    # Weakness, Resistance, Retreat Cost
    for label, key in [('weakness', 'Weakness'), ('resistance', 'Resistance'), ('retreatCost', 'Retreat_Cost')]:
        elem = soup.find('span', class_=label)
        if elem:
            card_data[key] = elem.text.strip()
    # Evolution, Pokemon Info, Artist, Evolve Marker
    extra_info = soup.find('div', class_='extraInformationColumn')
    if extra_info:
        # Evolution
        evolution_div = extra_info.find('div', class_='evolution')
        if evolution_div:
            steps = [li.text.strip() for li in evolution_div.find_all('li', class_='step')]
            if steps:
                card_data['Evolution'] = ' → '.join(steps)
        # Pokemon Info
        pokemon_info_div = extra_info.find('div', class_='extraInformation')
        if pokemon_info_div:
            number_elem = pokemon_info_div.find('h3')
            desc_elem = pokemon_info_div.find('p', class_='discription')
            if number_elem and desc_elem:
                card_data['Pokemon_Info'] = f"{number_elem.text.strip()}: {desc_elem.text.strip()}"
        # Artist
        artist_div = extra_info.find('div', class_='illustrator')
        if artist_div:
            artist_link = artist_div.find('a')
            if artist_link:
                card_data['Artist'] = artist_link.text.strip()
    # Evolve Marker
    page_header = soup.find('h1', class_='pageHeader')
    if page_header:
        evolve_marker = page_header.find('span', class_='evolveMarker')
        if evolve_marker:
            card_data['Evolve_Marker'] = evolve_marker.text.strip()
    # Subtypes
    subtypes = []
    if 'ex' in card_data['Name'].lower():
        subtypes.append('ex')
    if '太晶' in card_data['Name']:
        subtypes.append('太晶')
    card_data['Subtypes'] = ', '.join(subtypes)
    # Image URL and Web Card ID from file name
    base = os.path.basename(html_path)
    match = re.match(r'(\d+)_', base)
    if match:
        card_data['Number'] = match.group(1)
    card_data['Image_URL'] = ''  # Could be constructed if needed
    card_data['Web_Card_ID'] = ''  # Could be extracted if needed
    card_data['Card_URL'] = ''  # Could be constructed if needed
    return card_data

def insert_card(conn, card_data):
    fields = ','.join([f'[{k}]' for k in card_data.keys()])
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
                print(f"Inserted card: {card_data['Name']} ({card_data['Number']})")
            except Exception as e:
                print(f"Failed to process {html_path}: {e}")
    conn.close()

if __name__ == "__main__":
    main()