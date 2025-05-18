import os
import csv
from bs4 import BeautifulSoup
import sys
import re

HTML_DIR = r'c:\Users\schan15\SCCode\PTCG_CardDB_Tc\html_pages\SV8a'
OUTPUT_CSV = 'cards_output_sv8a.csv'

def extract_card_fields(html):
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

        attribute = ''
        if main_info:
            type_img = main_info.find('img')
            if type_img and 'src' in type_img.attrs:
                attribute = type_img['src']

        # Initialize ability fields
        ability_name = ''
        ability_desc = ''
        
        # Skills/Attacks handling with ability separation
        skill1_name = ''
        skill1_damage = ''
        skill1_effect = ''
        skill2_name = ''
        skill2_damage = ''
        skill2_effect = ''
        
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
                        
                        if current_skill == 0:
                            skill1_name = skill_name
                            skill1_damage = damage
                            skill1_effect = effect_text
                        elif current_skill == 1:
                            skill2_name = skill_name
                            skill2_damage = damage
                            skill2_effect = effect_text
                        current_skill += 1

        # Other fields remain the same
        weakness = ''
        resistance = ''
        retreat_cost = ''
        sub_info = soup.find('div', class_='subInformation')
        if sub_info:
            weak_td = sub_info.find('td', class_='weakpoint')
            resist_td = sub_info.find('td', class_='resist')
            retreat_td = sub_info.find('td', class_='escape')
            
            if weak_td:
                weakness = weak_td.get_text(strip=True)
            if resist_td:
                resistance = resist_td.get_text(strip=True)
            if retreat_td:
                retreat_cost = retreat_td.get_text(strip=True)

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

        return [
            name, evolution_stage, web_card_id, img_url, card_type, hp, attribute,
            ability_name, ability_desc,  # New ability fields
            skill1_name, skill1_damage, skill1_effect,
            skill2_name, skill2_damage, skill2_effect,
            weakness, resistance, retreat_cost,
            collector, expansion, illustrator, pokemon_info,
            ','.join(subtypes)
        ]
    except Exception as e:
        print(f"Error processing HTML: {str(e)}", file=sys.stderr)
        return [''] * 23  # Updated number of fields

def main():
    if not os.path.exists(HTML_DIR):
        print(f"Error: Directory not found: {HTML_DIR}", file=sys.stderr)
        return

    rows = []
    try:
        for fname in os.listdir(HTML_DIR):
            if fname.endswith('.html'):
                file_path = os.path.join(HTML_DIR, fname)
                try:
                    with open(file_path, encoding='utf-8') as f:
                        html = f.read()
                    fields = extract_card_fields(html)
                    print(f"Processing: {fname} - Name: {fields[0]}")
                    rows.append(fields)
                except Exception as e:
                    print(f"Error processing {fname}: {str(e)}", file=sys.stderr)

        output_dir = os.path.dirname(os.path.abspath(OUTPUT_CSV))
        os.makedirs(output_dir, exist_ok=True)

        with open(OUTPUT_CSV, 'w', newline='', encoding='utf-8-sig') as f:
            writer = csv.writer(f)
            writer.writerow([
                'Name', 'EvolutionStage', 'WebCardID', 'ImageURL', 'CardType', 'HP', 'Attribute',
                'Ability', 'AbilityDesc',  # New ability columns
                'Skill1Name', 'Skill1Damage', 'Skill1Effect',
                'Skill2Name', 'Skill2Damage', 'Skill2Effect',
                'Weakness', 'Resistance', 'RetreatCost',
                'CollectorNumber', 'Expansion', 'Illustrator', 'PokemonInfo',
                'Subtypes'
            ])
            writer.writerows(rows)
        print(f'Successfully processed {len(rows)} cards. Output: {OUTPUT_CSV}')
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)

if __name__ == '__main__':
    main()