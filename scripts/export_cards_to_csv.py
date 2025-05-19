import os
import csv
from bs4 import BeautifulSoup
import sys
import re

HTML_DIR = r'c:\Users\schan15\SCCode\PTCG_CardDB_Tc\html_pages'
OUTPUT_CSV = 'cards_output_all.csv'  # Changed name to reflect all cards

def get_energy_type_from_url(url):
    """Extract energy type name from image URL"""
    if not url:
        return ''
    # Match patterns like 'mark/twhk_type_grass.png' or similar
    match = re.search(r'(\w+)\.png$', url)
    if match:
        return match.group(1)
    return ''

def get_skill_energy_cost(skill_elem):
    """Extract energy types from skill cost"""
    energy_costs = []
    cost_container = skill_elem.find('span', class_='skillCost')
    if cost_container:
        energy_imgs = cost_container.find_all('img')
        for img in energy_imgs:
            if img.has_attr('src'):
                energy_type = get_energy_type_from_url(img['src'])
                if energy_type:
                    energy_costs.append(energy_type)
    return ','.join(energy_costs) if energy_costs else ''

def get_expansion_code_from_folder(file_path):
    """Extract expansion code from folder path"""
    folder = os.path.basename(os.path.dirname(file_path))
    return folder

def clean_text_for_csv(text):
    """Clean and escape text for CSV"""
    if not text:
        return ''
    # Replace newlines with space and remove multiple spaces
    cleaned = ' '.join(text.replace('\n', '<br/>').replace('\r', '<br/>').split())
    return cleaned

def extract_card_fields(html, file_path):
    try:
        try:
            soup = BeautifulSoup(html, 'lxml')
        except:
            soup = BeautifulSoup(html, 'html.parser')
            
        # Card Name and Evolution Stage handling
        name = ''
        evolution_stage = ''
        h1 = soup.find('h1', class_='pageHeader')
        card_type = ''
                            
        if h1:
            full_name = '\n'.join(h1.stripped_strings)
            try:
                name = full_name.strip()
                name = name.split("\n")[1] # Normalize whitespace
                evolution_stage = full_name.split("\n")[0]
                card_type ='寶可夢'
            except:
                name = full_name.strip()
            
        # Image URL and Card ID
        img_url = ''
        img = soup.select_one('.cardImage img')
        if img and img.has_attr('src'):
            img_url = img['src']
            
        web_card_id = ''
        if img_url:
            match = re.search(r'hk(\d+)\.png$', img_url)
            if match:
                web_card_id = match.group(1)

        # Card Type
        if card_type == '':
            h3 = soup.select_one('.skillInformation .commonHeader')
            if not h3:
                h3 = soup.select_one('.commonHeader')
            if h3:
                card_type = h3.get_text(strip=True)
            
        hp = ''
        main_info = soup.find('p', class_='mainInfomation')
        if main_info:
            hp_span = main_info.find('span', class_='number')
            if hp_span:
                hp = hp_span.get_text(strip=True)

        # Attribute/Type
        attribute = ''
        if main_info:
            type_img = main_info.find('img')
            if type_img and 'src' in type_img.attrs:
                attribute = get_energy_type_from_url(type_img['src'])

        # Initialize ability fields
        ability_name = ''
        ability_desc = ''
        
        # Skills/Attacks handling with ability separation
        skill1_name = ''
        skill1_damage = ''
        skill1_effect = ''
        skill1_cost = ''  # New field
        skill2_name = ''
        skill2_damage = ''
        skill2_effect = ''
        skill2_cost = ''  # New field
        
        skill_info = soup.find('div', class_='skillInformation')
        if skill_info:
            skills = skill_info.find_all('div', class_='skill')
            current_skill = 0  # Counter for regular skills
            
            for skill in skills:
                name_elem = skill.find('span', class_='skillName')
                if name_elem:
                    skill_name = name_elem.get_text(strip=True)
                    effect_elem = skill.find('p', class_='skillEffect')
                    effect_text = effect_elem.get_text(strip=True) if effect_elem else ''
                    
                    # Check if this is an ability
                    if '[特性]' in skill_name:
                        ability_name = skill_name.replace('[特性]', '').strip()
                        ability_desc = effect_text
                    else:
                        # This is a regular skill
                        damage_elem = skill.find('span', class_='skillDamage')
                        damage = damage_elem.get_text(strip=True) if damage_elem else ''
                        # Get energy cost
                        energy_cost = get_skill_energy_cost(skill)
                        
                        if current_skill == 0:
                            skill1_name = skill_name
                            skill1_damage = damage
                            skill1_effect = effect_text
                            skill1_cost = energy_cost
                        elif current_skill == 1:
                            skill2_name = skill_name
                            skill2_damage = damage
                            skill2_effect = effect_text
                            skill2_cost = energy_cost
                        current_skill += 1

        # Weakness, Resistance, Retreat Cost with energy images
        weakness = ''
        weakness_type = ''
        resistance = ''
        resistance_type = ''
        retreat_cost = ''
        
        sub_info = soup.find('div', class_='subInformation')
        if sub_info:
            # Weakness handling
            weak_td = sub_info.find('td', class_='weakpoint')
            if weak_td:
                weak_img = weak_td.find('img')
                if weak_img and weak_img.has_attr('src'):
                    weakness_type = get_energy_type_from_url(weak_img['src'])
                weak_text = weak_td.find('span', class_='number')
                if weak_text:
                    weakness = weak_text.get_text(strip=True)

            # Resistance handling
            resist_td = sub_info.find('td', class_='resist')
            if resist_td:
                resist_img = resist_td.find('img')
                if resist_img and resist_img.has_attr('src'):
                    resistance_type = get_energy_type_from_url(resist_img['src'])
                resist_text = resist_td.find('span', class_='number')
                if resist_text:
                    resistance = resist_text.get_text(strip=True)

            # Retreat Cost handling
            retreat_td = sub_info.find('td', class_='escape')
            if retreat_td:
                retreat_imgs = retreat_td.find_all('img')
                retreat_cost = str(len(retreat_imgs)) if retreat_imgs else '0'

        collector = ''
        collector_span = soup.select_one('.collectorNumber')
        if collector_span:
            collector = collector_span.get_text(strip=True)
            
        expansion = ''
        exp_link = soup.select_one('.expansionLinkColumn a')
        if exp_link:
            expansion = exp_link.get_text(strip=True)
            
        illustrator = ''
        illu = soup.select_one('.illustrator a')
        if illu:
            illustrator = illu.get_text(strip=True)

        pokemon_info = ''
        info_section = soup.find('p', class_='discription')
        if info_section:
            pokemon_info = info_section.get_text(strip=True)

        # Enhanced subtypes handling
        subtypes = []
        if 'ex' in name.lower():
            subtypes.append('ex')
        if '太晶' in name or (skill1_name and '太晶' in skill1_name) or (skill2_name and '太晶' in skill2_name):
            subtypes.append('太晶')

        # Get expansion code from folder
        expansion_code = get_expansion_code_from_folder(file_path)

        # Clean all text fields for CSV
        name = clean_text_for_csv(name)
        evolution_stage = clean_text_for_csv(evolution_stage)
        card_type = clean_text_for_csv(card_type)
        ability_name = clean_text_for_csv(ability_name)
        ability_desc = clean_text_for_csv(ability_desc)
        skill1_name = clean_text_for_csv(skill1_name)
        skill1_effect = clean_text_for_csv(skill1_effect)
        skill2_name = clean_text_for_csv(skill2_name)
        skill2_effect = clean_text_for_csv(skill2_effect)
        pokemon_info = clean_text_for_csv(pokemon_info)
        expansion = clean_text_for_csv(expansion)
        illustrator = clean_text_for_csv(illustrator)

        return [
            name, evolution_stage, web_card_id, img_url, card_type, hp, attribute,
            ability_name, ability_desc,
            skill1_name, skill1_cost, skill1_damage, skill1_effect,
            skill2_name, skill2_cost, skill2_damage, skill2_effect,
            weakness, weakness_type,
            resistance, resistance_type,
            retreat_cost,
            collector, expansion, expansion_code, illustrator, pokemon_info,  # Added expansion_code
            ','.join(subtypes)
        ]
    except Exception as e:
        print(f"Error processing HTML: {str(e)}", file=sys.stderr)
        return [''] * 28  # Updated number of fields

def process_html_directory(directory):
    """Process all HTML files in a directory and its subdirectories"""
    rows = []
    for root, dirs, files in os.walk(directory):
        for fname in files:
            if fname.endswith('.html'):
                file_path = os.path.join(root, fname)
                try:
                    with open(file_path, encoding='utf-8') as f:
                        html = f.read()
                    fields = extract_card_fields(html, file_path)  # Pass file_path to get expansion code
                    # Add expansion folder name for reference
                    expansion_folder = os.path.basename(root)
                    print(f"Processing: [{expansion_folder}] {fname} - Name: {fields[0]}")
                    rows.append(fields)
                except Exception as e:
                    print(f"Error processing {file_path}: {str(e)}", file=sys.stderr)
    return rows

def main():
    if not os.path.exists(HTML_DIR):
        print(f"Error: Directory not found: {HTML_DIR}", file=sys.stderr)
        return

    try:
        # Process all HTML files in HTML_DIR and its subdirectories
        rows = process_html_directory(HTML_DIR)

        # Create output directory if it doesn't exist
        output_dir = os.path.dirname(os.path.abspath(OUTPUT_CSV))
        os.makedirs(output_dir, exist_ok=True)

        with open(OUTPUT_CSV, 'w', newline='', encoding='utf-8-sig') as f:
            writer = csv.writer(f, quoting=csv.QUOTE_ALL)  # Quote all fields to handle special characters
            writer.writerow([
                'Name', 'EvolutionStage', 'WebCardID', 'ImageURL', 'CardType', 'HP', 'Attribute',
                'Ability', 'AbilityDesc',
                'Skill1Name', 'Skill1Cost', 'Skill1Damage', 'Skill1Effect',
                'Skill2Name', 'Skill2Cost', 'Skill2Damage', 'Skill2Effect',
                'Weakness', 'WeaknessType',
                'Resistance', 'ResistanceType',
                'RetreatCost',
                'CollectorNumber', 'Expansion', 'ExpansionCode', 'Illustrator', 'PokemonInfo',  # Added ExpansionCode
                'Subtypes'
            ])
            writer.writerows(rows)
        print(f'Successfully processed {len(rows)} cards. Output: {OUTPUT_CSV}')
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)

if __name__ == '__main__':
    main()