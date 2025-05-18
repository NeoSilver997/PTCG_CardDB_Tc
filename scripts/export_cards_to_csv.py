import os
import csv
from bs4 import BeautifulSoup
import sys
import re

HTML_DIR = r'c:\Users\schan15\SCCode\PTCG_CardDB_Tc\html_pages\SV10'
OUTPUT_CSV = 'cards_output.csv'

def extract_card_fields(html):
    try:
        try:
            soup = BeautifulSoup(html, 'lxml')
        except:
            soup = BeautifulSoup(html, 'html.parser')
            
        # Card Name with evolve marker handling
        name = ''
        h1 = soup.find('h1', class_='pageHeader')
        if h1:
            name = ''.join(h1.stripped_strings)
            
        # Image URL
        img_url = ''
        img = soup.select_one('.cardImage img')
        if img and img.has_attr('src'):
            img_url = img['src']
            
        # Extract web card ID from image URL
        web_card_id = ''
        if img_url:
            match = re.search(r'hk(\d+)\.png$', img_url)
            if match:
                web_card_id = match.group(1)

        # Card Type
        card_type = ''
        h3 = soup.select_one('.skillInformation .commonHeader')
        if not h3:
            h3 = soup.select_one('.commonHeader')
        if h3:
            card_type = h3.get_text(strip=True)
            
        # HP (for Pokemon cards)
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
                attribute = type_img['src']

        # Skills/Attacks
        attacks = []
        attack_damage = []
        skill_info = soup.find('div', class_='skillInformation')
        if skill_info:
            skills = skill_info.find_all('div', class_='skill')
            for skill in skills:
                skill_name = skill.find('span', class_='skillName')
                skill_damage = skill.find('span', class_='skillDamage')
                if skill_name:
                    attacks.append(skill_name.get_text(strip=True))
                if skill_damage:
                    attack_damage.append(skill_damage.get_text(strip=True))

        # Effect
        effect = ''
        effect_p = soup.select_one('.skillEffect')
        if effect_p:
            effect = effect_p.get_text(strip=True)
            
        # Weakness, Resistance, Retreat Cost
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

        # Collector Number
        collector = ''
        collector_span = soup.select_one('.collectorNumber')
        if collector_span:
            collector = collector_span.get_text(strip=True)
            
        # Expansion
        expansion = ''
        exp_link = soup.select_one('.expansionLinkColumn a')
        if exp_link:
            expansion = exp_link.get_text(strip=True)
            
        # Illustrator
        illustrator = ''
        illu = soup.select_one('.illustrator a')
        if illu:
            illustrator = illu.get_text(strip=True)
            
        # Q&A Link
        qa_link = ''
        qa = soup.select_one('.qaLink a')
        if qa and qa.has_attr('href'):
            qa_link = qa['href']

        # Pokemon Info (description)
        pokemon_info = ''
        info_section = soup.find('p', class_='discription')
        if info_section:
            pokemon_info = info_section.get_text(strip=True)

        # Subtypes (ex, VSTAR, etc.)
        subtypes = []
        if 'ex' in name.lower():
            subtypes.append('ex')
        # Add more subtype checks as needed

        return [
            name, web_card_id, img_url, card_type, hp, attribute, 
            ','.join(attacks), ','.join(attack_damage), effect,
            weakness, resistance, retreat_cost,
            collector, expansion, illustrator, pokemon_info,
            ','.join(subtypes), qa_link
        ]
    except Exception as e:
        print(f"Error processing HTML: {str(e)}", file=sys.stderr)
        return [''] * 18  # Return empty strings for all fields

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
                'Name', 'WebCardID', 'ImageURL', 'CardType', 'HP', 'Attribute',
                'Attacks', 'AttackDamage', 'Effect', 'Weakness', 'Resistance',
                'RetreatCost', 'CollectorNumber', 'Expansion', 'Illustrator',
                'PokemonInfo', 'Subtypes', 'QALink'
            ])
            writer.writerows(rows)
        print(f'Successfully processed {len(rows)} cards. Output: {OUTPUT_CSV}')
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)

if __name__ == '__main__':
    main()