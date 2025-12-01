import requests
from bs4 import BeautifulSoup
import math
import csv
from urllib.parse import urljoin
import time
import os
import datetime
import re
import json
import shutil

# Base URL for the card list
base_url = "https://asia.pokemon-card.com/hk/card-search/list/?pageNo=1&sortCondition=&keyword=&cardType=all&regulation=1&pokemonEnergy=&pokemonWeakness=&pokemonResistance=&pokemonMoveEnergy=&hpLowerLimit=none&hpUpperLimit=none&retreatCostLowerLimit=0&retreatCostUpperLimit=none&illustratorName=&expansionCodes=M2a"

try:
    # Create folders if they don't exist
    log_folder = os.path.join(os.path.dirname(os.path.abspath(__file__)), "logs")
    os.makedirs(log_folder, exist_ok=True)
    
    # Create images folder for storing downloaded card images
    images_folder = os.path.join(os.path.dirname(os.path.abspath(__file__)), "images")
    os.makedirs(images_folder, exist_ok=True)
    
    # Create html_pages folder for storing detail page HTML files
    html_pages_folder = os.path.join(os.path.dirname(os.path.abspath(__file__)), "html_pages")
    os.makedirs(html_pages_folder, exist_ok=True)
    
    # Build a small index of already-downloaded detail pages so we can
    # reuse saved HTML rather than fetching again and — importantly —
    # detect the card "Type" (寶可夢 / 物品卡 / 支援者卡 / 競技場卡 / 特殊能量卡)
    def scan_downloaded_html_for_types(root_dir):
        mapping_by_id = {}
        mapping_by_name_lc = {}

        # load overrides mapping of names -> types
        overrides = {}
        cfg_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'scripts', 'type_overrides.json')
        if os.path.exists(cfg_path):
            try:
                with open(cfg_path, 'r', encoding='utf-8') as fh:
                    overrides = {k.lower(): v for k, v in json.load(fh).get('name_overrides', {}).items()}
            except Exception:
                overrides = {}

        for dirpath, dirs, files in os.walk(root_dir):
            for fname in files:
                if not fname.endswith('.html'):
                    continue
                fpath = os.path.join(dirpath, fname)
                try:
                    with open(fpath, 'r', encoding='utf-8') as fh:
                        raw = fh.read()
                except Exception:
                    # skip unreadable files
                    continue

                # Try to extract the card id from meta og:url if present (detail/12345)
                id_match = re.search(r'/detail/(\d+)/', raw)
                card_id = id_match.group(1) if id_match else None

                # parse header to find the skill information header label
                try:
                    soup_local = BeautifulSoup(raw, 'html.parser')
                    header = None
                    skill_info_local = soup_local.find('div', class_='skillInformation')
                    if skill_info_local:
                        h3 = skill_info_local.find('h3', class_='commonHeader')
                        if h3:
                            header = h3.get_text(strip=True)

                    # If still no header try other heuristics
                    if not header:
                        # look for first h3 in the page header area
                        h3_any = soup_local.find('h3')
                        header = h3_any.get_text(strip=True) if h3_any else ''

                    # map header content to our internal Type values
                    card_type = None
                    if header:
                        # Map '學習裝置' and similar header variants to '寶可夢道具'
                        if '學習裝置' in header or '寶可夢道具' in header or ('道具' in header and '寶可夢' in header):
                            card_type = '寶可夢道具'
                        elif '物品' in header:
                            card_type = '物品卡'
                        elif '支援者' in header:
                            card_type = '支援者卡'
                        elif '競技場' in header:
                            card_type = '競技場卡'
                        elif '特殊能量' in header or '特殊 能量' in header or '特殊能量卡' in header:
                            card_type = '特殊能量卡'
                        elif '能量' in header:
                            card_type = '能量卡'  
                        else:
                            card_type = '寶可夢'

                    # name fallback: get the h1 text (card name)
                    name = None
                    ph = soup_local.find('h1', class_='pageHeader')
                    if ph:
                        name = ' '.join(ph.stripped_strings)

                    # apply name-based override (overrides file takes precedence)
                    if name and name.lower() in overrides:
                        card_type = overrides[name.lower()]

                    if card_id and card_type:
                        mapping_by_id[card_id] = card_type
                    if name and card_type:
                        mapping_by_name_lc[name.lower()] = card_type
                except Exception:
                    continue

        return mapping_by_id, mapping_by_name_lc

    # gather downloaded page indexes
    downloaded_id_map, downloaded_name_map = scan_downloaded_html_for_types(html_pages_folder)

    # Get the total number of pages
    response = requests.get(base_url)
    soup = BeautifulSoup(response.text, 'html.parser')
    
    # Extract the total number of pages from the result text
    # Based on log analysis, the total pages info is in "resultTotalPages" class
    total_pages_elem = soup.find('p', class_='resultTotalPages')
    
    if total_pages_elem:
        # Extract the number from text like "/ 共 544 頁"
        total_pages_text = total_pages_elem.text.strip()
        # Extract digits from the text
        import re
        digits = re.findall(r'\d+', total_pages_text)
        if digits:
            total_pages = int(digits[0])
        else:
            # Default to a reasonable number if we can't determine
            total_pages = 1
    else:
        # If we can't find the element, try the pagination as fallback
        pagination = soup.find('div', class_='pagination')
        if pagination:
            page_links = pagination.find_all('a')
            if page_links:
                last_page = max([int(a.text) for a in page_links if a.text.isdigit()])
                total_pages = last_page
            else:
                total_pages = 1
        else:
            # If we can't find pagination, let's just scrape the first page
            total_pages = 1
    
    print(f"Found {total_pages} pages to scrape")
    
    # List to store all card data
    all_cards = []
    last_page_html = None
    
    # Add page limit option for testing (default to total_pages if not specified)
    # Add page limit option for testing (default to total_pages if not specified)
    max_pages = min(total_pages, 300)  # Default test limit of 300 pages
    
    # Iterate through each page
    for page in range(1, max_pages + 1):
        print(f"Scraping page {page} of {total_pages}...")
        response = requests.get(base_url, params={'pageNo': page})
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Save the HTML content of the last page
        if page == total_pages:
            last_page_html = response.text
        
        # Based on log analysis, the card list is in a 'ul' with class 'list'
        card_list = soup.find('ul', class_='list')
        
        if not card_list:
            # Fallback to other potential class names
            card_list = soup.find('ul', class_='card-list')
            
        if not card_list:
            print(f"Warning: Could not find card list on page {page}")
            continue
            
        cards = card_list.find_all('li', class_='card')
        
        # Extract information for each card
        for card in cards:
            try:
                # Get card type from class, with error handling
                card_classes = card.get('class', [])
                card_type = card_classes[0] if card_classes else 'unknown'
                
                # Get card details from the link and image
                card_link = card.find('a')
                card_url = urljoin(base_url, card_link['href']) if card_link and 'href' in card_link.attrs else ''
                
                # Find image in the imageContainer div (list page)
                img_container = card.find('div', class_='imageContainer')
                img_tag = img_container.find('img') if img_container else card.find('img')
                
                # Prioritize data-src for lazy-loaded images
                
                name = ''
                # Basic card info from the list page
                # Extract web card ID from URL (last path segment)
                web_card_id = ''
                if card_url:
                    url_parts = card_url.rstrip('/').split('/')
                    if url_parts:
                        web_card_id = url_parts[-1]
                if web_card_id:
                    image_url = f'https://asia.pokemon-card.com/hk/card-img/hk000{web_card_id}.png'
                # Basic card info from the list page
                card_data = {
                    'Web Card ID': web_card_id,
                    'Type': card_type,
                    'Name': '',
                    'Expansion': '',
                    'Number': '',
                    'Card URL': card_url,
                    'Image URL': image_url,
                    'HP': '',
                    'Attribute': '',
                    'Attacks': '',
                    'Attack_Damage': '',
                    'Weakness': '',
                    'Resistance': '',
                    'Retreat_Cost': '',
                    'Evolution': '',
                    'Pokemon_Info': '',
                    'Artist': '',
                    'Evolve_Marker': '',
                    'Expansion_Symbol': '',
                    'Subtypes': ''
                }
                
                # Visit the detail page to get more information (but prefer a previously
                # downloaded HTML file if available in html_pages)
                try:
                    print(f"Fetching details for {name} from {card_url}")
                    # If we already saved this page earlier use it to avoid a network
                    # request and to set the card Type reliably.
                    html_source = None
                    if web_card_id and web_card_id in downloaded_id_map:
                        # find the saved file by scanning the folder tree for the id string
                        for dirpath, dirs, files in os.walk(html_pages_folder):
                            for fname in files:
                                if fname.endswith('.html'):
                                    path = os.path.join(dirpath, fname)
                                    try:
                                        with open(path, 'r', encoding='utf-8') as fcheck:
                                            if f"/detail/{web_card_id}/" in fcheck.read():
                                                with open(path, 'r', encoding='utf-8') as f2:
                                                    html_source = f2.read()
                                                break
                                    except Exception:
                                        continue
                            if html_source:
                                break

                    # fallback to matching by name if the id wasn't found
                    if not html_source and card_data['Name'] and card_data['Name'].lower() in downloaded_name_map:
                        # try to find a saved file whose h1 matches the name
                        for dirpath, dirs, files in os.walk(html_pages_folder):
                            for fname in files:
                                if not fname.endswith('.html'):
                                    continue
                                path = os.path.join(dirpath, fname)
                                try:
                                    with open(path, 'r', encoding='utf-8') as fcheck:
                                        raw = fcheck.read()
                                        if card_data['Name'] in raw:
                                            html_source = raw
                                            break
                                except Exception:
                                    continue
                            if html_source:
                                break

                    if html_source:
                        detail_soup = BeautifulSoup(html_source, 'html.parser')
                        # set Type from downloaded index if available
                        if web_card_id and web_card_id in downloaded_id_map:
                            card_data['Type'] = downloaded_id_map[web_card_id]
                        else:
                            # name-based mapping
                            nm = card_data['Name'].lower() if card_data['Name'] else ''
                            if nm in downloaded_name_map:
                                card_data['Type'] = downloaded_name_map[nm]
                    else:
                        detail_response = requests.get(card_url, timeout=10)
                        detail_soup = BeautifulSoup(detail_response.text, 'html.parser')
                    # Skip if URL is empty
                    if not card_url:
                        print(f"Skipping detail fetch for {name} - no URL available")
                        all_cards.append(card_data)
                        continue
                        
                    # Add timeout to avoid hanging on slow responses
                    detail_response = requests.get(card_url, timeout=10)
                    detail_soup = BeautifulSoup(detail_response.text, 'html.parser')
                    
                    # Save the detail page HTML for debugging if needed
                    if page == 1 and cards.index(card) == 0:  # Save only the first card's detail page
                        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
                        detail_log_path = os.path.join(log_folder, f"detail_page_{timestamp}.html")
                        with open(detail_log_path, 'w', encoding='utf-8') as log_file:
                            log_file.write(detail_response.text)
                        print(f"First card detail page saved to {detail_log_path}")
                    
                    # Extract card name from page header with improved logic
                    name_header = detail_soup.find('h1', class_='pageHeader')
                    if name_header:
                        # Clean up name by removing extra whitespace and special characters
                        try:
                            name = name_header.text.strip()
                            name = name.split("\n")[2] # Normalize whitespace
                            card_data['Name'] = name.strip()
                        except:
                            name = name_header.text.strip()
                            card_data['Name'] = name.strip()
                        
                    
                    # Extract expansion from symbol image
                    expansion_symbol = detail_soup.find('span', class_='expansionSymbol')
                    if expansion_symbol:
                        exp_img = expansion_symbol.find('img')
                        if exp_img and 'src' in exp_img.attrs:
                            src = exp_img['src']
                            exp_match = re.search(r'twhk_exp_(\w+)\.png', src)
                            if exp_match:
                                card_data['Expansion'] = exp_match.group(1)
                            else:
                                # Extract expansion code from URL if available
                                url_exp_match = re.search(r'expansionCodes=(\w+)', base_url)
                                if url_exp_match:
                                    card_data['Expansion'] = url_exp_match.group(1)
                    
                    # Extract expansion from link in expansionLinkColumn
                    expansion_link_section = detail_soup.find('section', class_='expansionLinkColumn')
                    if expansion_link_section:
                        expansion_link = expansion_link_section.find('a', href=True)
                        if expansion_link:
                            href = expansion_link['href']
                            exp_match = re.search(r'expansionCodes=(\w+)', href)
                            if exp_match:
                                card_data['Expansion'] = exp_match.group(1)
                    
                    # Print debug info for first card
                    if page == 1 and cards.index(card) == 0:
                        print("\n=== FIRST CARD DETAILS ===")
                        print(f"Card URL: {card_url}")
                        print(f"Image URL: {image_url}")
                        print(f"Card Type: {card_type}")
                        
                        # Print all extracted attributes for verification
                        print("\nExtracted Attributes:")
                        for key, value in card_data.items():
                            if value:  # Only print non-empty values
                                print(f"{key}: {value}")
                        print("\n")
                    
                    # Extract HP from mainInfomation section
                    main_info = detail_soup.find('p', class_='mainInfomation')
                    if main_info:
                        hp_span = main_info.find('span', class_='number')
                        if hp_span:
                            card_data['HP'] = hp_span.text.strip()
                        
                        # Extract Attribute from mainInfomation section
                        type_img = main_info.find('img')
                        if type_img and 'src' in type_img.attrs:
                            src = type_img['src']
                            # Extract type from image URL (e.g. energy/Grass.png)
                            type_match = re.search(r'energy/(\w+)\.png', src)
                            if type_match:
                                card_data['Attribute'] = type_match.group(1)
                    # Extract collector number from collectorNumber class
                    collector_number = detail_soup.find('span', class_='collectorNumber')
                    if collector_number:
                        card_data['Number'] = collector_number.text.strip()
                        
                    # Save detail page HTML organized by expansion, number and name
                    # Do this after extracting basic card info but before adding to all_cards
                    if card_data['Expansion'] and card_data['Number'] and card_data['Name']:
                        # Create safe filename by removing invalid characters
                        safe_name = re.sub(r'[\\/*?:"<>|]', '', card_data['Name'])
                        # Get card number without the slash part if present
                        card_number = card_data['Number'].split('/')[0] if '/' in card_data['Number'] else card_data['Number']
                        
                        # Create folder structure: html_pages/[Expansion]/
                        expansion_folder = os.path.join(html_pages_folder, card_data['Expansion'])
                        os.makedirs(expansion_folder, exist_ok=True)
                        
                        # Create filename: [Number]_[Name].html
                        html_filename = f"{card_number}_{safe_name}.html"
                        html_file_path = os.path.join(expansion_folder, html_filename)
                        
                        # Save the HTML content
                        with open(html_file_path, 'w', encoding='utf-8') as html_file:
                            html_file.write(detail_response.text)
                        print(f"Saved detail page HTML to {html_file_path}")
                    else:
                        print(f"Skipping HTML save - missing required info: Expansion={card_data['Expansion']}, Number={card_data['Number']}, Name={card_data['Name']}")

                    # Extract Skills and Abilities from skillInformation section
                    skill_info = detail_soup.find('div', class_='skillInformation')
                    subtypes = []
                    if 'ex' in card_data['Name'].lower():
                                subtypes.append('ex')
                    if skill_info:
                        # Initialize skill fields
                        card_data['[特性]'] = ''
                        card_data['Skill1_Name'] = 'N/A'
                        card_data['Skill1_Cost'] = 'N/A'
                        card_data['Skill1_Damage'] = 'N/A'
                        card_data['Skill1_Effect'] = 'N/A'
                        card_data['Skill2_Name'] = 'N/A'
                        card_data['Skill2_Cost'] = 'N/A'
                        card_data['Skill2_Damage'] = 'N/A'
                        card_data['Skill2_Effect'] = 'N/A'
                        
                        # Find all skill divs
                        skillno = 0
                        skills = skill_info.find_all('div', class_='skill')
                        attack_names = []
                        attack_damages = []
                        for i, skill in enumerate(skills[:3]):  # Only process first 3 skills
                            # Extract skill name first to check for 太晶
                            name_elem = skill.find('span', class_='skillName')
                            if name_elem:
                                skill_name = name_elem.text.strip()
                                if '太晶' in skill_name:
                                    subtypes.append('太晶')
                                
                                # If this is skill1 and contains 太晶, skip this entire div
                                if i == 0 and '太晶' in skill_name:
                                    continue
                                
                                if '特性' in skill_name:
                                    card_data['[特性]'] = skill_name
                                    effect_elem = skill.find('p', class_='skillEffect')
                                    if effect_elem:
                                        card_data['[特性]'] = card_data['[特性]'] + '-'+  effect_elem.text.strip()
                                        continue
                                if '太晶' in skill_name:
                                    subtypes.append('太晶')
                                    continue
                                else:
                                    skillno = skillno +1
                                    skill_prefix = f'Skill{skillno}_'
                                    card_data[skill_prefix + 'Name'] = skill_name
                            

                            # 識別特殊技能類型
                            
                            skill_text = skill_name + ' ' + (effect_elem.text.strip() if effect_elem else '')
                            if '太晶' in skill_text:
                                subtypes.append('太晶')

                            # Extract skill cost (energy requirements)
                            cost_imgs = skill.find('span',class_='skillCost').find_all('img')
                            if cost_imgs:
                                costs = []
                                for img in cost_imgs:
                                    if 'src' in img.attrs:
                                        cost_type = re.search(r'energy/(\w+)\.png', img['src'])
                                        if cost_type:
                                            costs.append(cost_type.group(1))
                                if costs:
                                    card_data[skill_prefix + 'Cost'] = ', '.join(costs)
                            
                            # Extract skill damage
                            damage_elem = skill.find('span', class_='skillDamage')
                            if damage_elem:
                                card_data[skill_prefix + 'Damage'] = damage_elem.text.strip()
                            
                            # Extract skill effect
                            effect_elem = skill.find('span', class_='skillEffect')
                            if effect_elem:
                                card_data[skill_prefix + 'Effect'] = effect_elem.text.strip()
                            
                            # Collect attack names and damages for summary
                            if skill_name and skill_name != 'N/A':
                                attack_names.append(skill_name)
                            if card_data[skill_prefix + 'Damage'] and card_data[skill_prefix + 'Damage'] != 'N/A':
                                attack_damages.append(card_data[skill_prefix + 'Damage'])
                                
                            
                        
                        
                        
                        # Set attack summary after processing all skills
                        card_data['Attacks'] = ', '.join(attack_names) if attack_names else 'N/A'
                        card_data['Attack_Damage'] = ', '.join(attack_damages) if attack_damages else 'N/A'

                        # Detect card type from the skillInformation header when present
                        try:
                            header = ''
                            if skill_info:
                                h3 = skill_info.find('h3', class_='commonHeader')
                                if h3:
                                    header = h3.get_text(strip=True)

                            # allow name-based overrides from config
                            try:
                                cfg_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'scripts', 'type_overrides.json')
                                overrides = {}
                                if os.path.exists(cfg_path):
                                    try:
                                        with open(cfg_path, 'r', encoding='utf-8') as fh:
                                            overrides = {k.lower(): v for k, v in json.load(fh).get('name_overrides', {}).items()}
                                    except Exception:
                                        overrides = {}
                            except Exception:
                                overrides = {}

                            if header:
                                # If the card name matches an override, use it before header matching
                                nm = card_data['Name'].lower().strip() if card_data['Name'] else ''
                                if nm and nm in overrides:
                                    card_data['Type'] = overrides[nm]
                                else:
                                    # Map learning device/title or header variants to Pokemon Tool (寶可夢道具)
                                    if  '寶可夢道具' in header or ('道具' in header and '寶可夢' in header):
                                        card_data['Type'] = '寶可夢道具'
                                    elif '物品' in header:
                                        card_data['Type'] = '物品卡'
                                    elif '支援者' in header:
                                        card_data['Type'] = '支援者卡'
                                    elif '競技場' in header:
                                        card_data['Type'] = '競技場卡'
                                    elif '特殊能量' in header or '特殊 能量' in header:
                                        card_data['Type'] = '特殊能量卡'
                                    elif '能量' in header:
                                        card_data['Type'] = '能量卡'
                                    else:
                                        card_data['Type'] = '寶可夢'
                        except Exception:
                            pass
                        
                        # Extract Weakness, Resistance and Retreat Cost from subInformation section
                        sub_info = detail_soup.find('div', class_='subInformation')
                        if sub_info:
                            # Extract Weakness
                            weak_elem = sub_info.find('td', class_='weakpoint')
                            if weak_elem:
                                weak_img = weak_elem.find('img')
                                if weak_img and 'src' in weak_img.attrs:
                                    src = weak_img['src']
                                    weak_type = re.search(r'energy/(\w+)\.png', src)
                                    if weak_type:
                                        weak_mult = weak_elem.text.strip().split('×')[-1]
                                        card_data['Weakness'] = f"{weak_type.group(1)}×{weak_mult}"
                            
                            # Extract Resistance
                            resist_elem = sub_info.find('td', class_='resist')
                            if resist_elem:
                                card_data['Resistance'] = resist_elem.text.strip()
                            
                            # Extract Retreat Cost
                            retreat_elem = sub_info.find('td', class_='escape')
                            if retreat_elem:
                                cost_imgs = retreat_elem.find_all('img')
                                if cost_imgs:
                                    costs = []
                                    for img in cost_imgs:
                                        if 'src' in img.attrs:
                                            cost_type = re.search(r'energy/(\w+)\.png', img['src'])
                                            if cost_type:
                                                costs.append(cost_type.group(1))
                                    if costs:
                                        card_data['Retreat_Cost'] = ', '.join(costs)
                        
                        # Extract Evolution, Pokemon Info and Artist from extraInformationColumn
                        extra_info = detail_soup.find('section', class_='extraInformationColumn')
                        if extra_info:
                            # Extract Evolution chain
                            evolution_div = extra_info.find('div', class_='evolution')
                            if evolution_div:
                                evolution_steps = []
                                first_step = evolution_div.find('li', class_='step active')
                                if first_step:
                                    evolution_steps.append(first_step.text.strip())
                                
                                second_steps = evolution_div.find_all('li', class_='step')
                                if second_steps:
                                    evolution_steps.extend([step.text.strip() for step in second_steps])
                                
                                if evolution_steps:
                                    card_data['Evolution'] = ' → '.join(evolution_steps)
                            
                            # Extract Pokemon Info
                            pokemon_info_div = extra_info.find('div', class_='extraInformation')
                            if pokemon_info_div:
                                # Get Pokemon number and description
                                number_elem = pokemon_info_div.find('h3')
                                desc_elem = pokemon_info_div.find('p', class_='discription')
                                if number_elem and desc_elem:
                                    card_data['Pokemon_Info'] = f"{number_elem.text.strip()}: {desc_elem.text.strip()}"
                            
                            # Extract Artist
                            artist_div = extra_info.find('div', class_='illustrator')
                            if artist_div:
                                artist_link = artist_div.find('a')
                                if artist_link:
                                    card_data['Artist'] = artist_link.text.strip()
                    
                    # Extract Weakness, Resistance, Retreat Cost
                    # Try to find the section containing these attributes
                    attributes_section = detail_soup.find(['div', 'table'], class_=lambda x: x and ('weak' in str(x).lower() or 'retreat' in str(x).lower()))
                    
                    # If we found a container with these attributes
                    if attributes_section:
                        # Extract all text from this section
                        attr_texts = list(attributes_section.stripped_strings)
                        
                        # Look for weakness
                        for i, text in enumerate(attr_texts):
                            if '弱點' in text and i+1 < len(attr_texts):
                                card_data['Weakness'] = attr_texts[i+1]
                            elif 'weak' in text.lower() and i+1 < len(attr_texts):
                                card_data['Weakness'] = attr_texts[i+1]
                        
                        # Look for resistance
                        for i, text in enumerate(attr_texts):
                            if '抵抗力' in text and i+1 < len(attr_texts):
                                card_data['Resistance'] = attr_texts[i+1]
                            elif 'resist' in text.lower() and i+1 < len(attr_texts):
                                card_data['Resistance'] = attr_texts[i+1]
                        
                        # Look for retreat cost
                        for i, text in enumerate(attr_texts):
                            if '撤退' in text and i+1 < len(attr_texts):
                                card_data['Retreat_Cost'] = attr_texts[i+1]
                            elif 'retreat' in text.lower() and i+1 < len(attr_texts):
                                card_data['Retreat_Cost'] = attr_texts[i+1]
                    
                    # Fallback to direct element search if the section approach didn't work
                    if not card_data['Weakness']:
                        weak_elem = detail_soup.find('p', string='弱點') or detail_soup.find('p', string=lambda x: x and '弱點' in x)
                        if weak_elem and weak_elem.find_next_sibling():
                            card_data['Weakness'] = weak_elem.find_next_sibling().text.strip()
                    
                    if not card_data['Resistance']:
                        resist_elem = detail_soup.find('p', string='抵抗力') or detail_soup.find('p', string=lambda x: x and '抵抗力' in x)
                        if resist_elem and resist_elem.find_next_sibling():
                            card_data['Resistance'] = resist_elem.find_next_sibling().text.strip()
                    
                    if not card_data['Retreat_Cost']:
                        retreat_elem = detail_soup.find('p', string='撤退') or detail_soup.find('p', string=lambda x: x and '撤退' in x)
                        if retreat_elem and retreat_elem.find_next_sibling():
                            card_data['Retreat_Cost'] = retreat_elem.find_next_sibling().text.strip()
                    
                    # Extract card name from h1.pageHeader
                    page_header = detail_soup.find('h1', class_='pageHeader')
                    if page_header:
                        # Get all text content and remove evolve marker text
                        name_text = page_header.get_text(' ', strip=True)
                        evolve_marker = page_header.find('span', class_='evolveMarker')
                        if evolve_marker:
                            name_text = name_text.replace(evolve_marker.text.strip(), '').strip()
                            card_data['Evolve_Marker'] = evolve_marker.text.strip()
                        if name_text =='':
                            card_data['Name'] = name_text
                        
                    
                    
                    # Extract expansion symbol from expansionColumn
                    expansion_column = detail_soup.find('section', class_='expansionColumn')
                    if expansion_column:
                        expansion_symbol = expansion_column.find('span', class_='expansionSymbol')
                        if expansion_symbol and expansion_symbol.find('img'):
                            img_url = urljoin(base_url, expansion_symbol.find('img')['src'])
                            card_data['Expansion_Symbol'] = img_url
                            # Extract expansion code from image URL (e.g. twhk_exp_SV10.png)
                            exp_match = re.search(r'twhk_exp_(\w+)\.png', img_url)
                            if exp_match:
                                card_data['Expansion'] = exp_match.group(1)
                    
                    # Extract Evolution information
                    evolution_section = detail_soup.find('p', string='進化')
                    if evolution_section:
                        # Try to find the container with evolution information
                        evolution_container = evolution_section.find_parent()
                        if evolution_container:
                            # Get all text elements in the evolution section
                            evolution_texts = list(evolution_container.stripped_strings)
                            # Filter out the header
                            evolution_texts = [text for text in evolution_texts if text != '進化']
                            # Join the remaining texts
                            if evolution_texts:
                                card_data['Evolution'] = ' '.join(evolution_texts)
                    
                    # Extract Pokemon Info (description, height, weight)
                    # Try multiple approaches to find Pokemon info
                    pokemon_info_section = None
                    
                    # First try: look for text containing '寶可夢'
                    pokemon_info = detail_soup.find(string=re.compile(r'寶可夢'))
                    if pokemon_info:
                        pokemon_info_section = pokemon_info.find_parent()
                    
                    # Second try: look for elements that might contain Pokemon description
                    if not pokemon_info_section:
                        # Look for elements that might contain height/weight info
                        height_elem = detail_soup.find(string=re.compile(r'身高'))
                        if height_elem:
                            pokemon_info_section = height_elem.find_parent()
                    
                    if pokemon_info_section:
                        # Get all text from this section
                        info_texts = list(pokemon_info_section.stripped_strings)
                        # Join them with spaces
                        if info_texts:
                            card_data['Pokemon_Info'] = ' '.join(info_texts)
                    
                    # Extract Artist - try multiple approaches
                    artist_elem = detail_soup.find('p', string='繪師') or detail_soup.find(string=re.compile(r'繪師'))
                    if artist_elem:
                        # First try to get the next sibling
                        if artist_elem.find_next_sibling():
                            card_data['Artist'] = artist_elem.find_next_sibling().text.strip()
                        # If that doesn't work, try to get all text from the parent container
                        else:
                            artist_container = artist_elem.find_parent()
                            if artist_container:
                                artist_texts = list(artist_container.stripped_strings)
                                # Filter out the header
                                artist_texts = [text for text in artist_texts if text != '繪師']
                                if artist_texts:
                                    card_data['Artist'] = artist_texts[0]
                    
                    # Add a small delay to avoid overloading the server
                    time.sleep(1.5)  # Increased delay to be more respectful to the server
                    
                    # Clean up any empty or problematic values
                    for key, value in card_data.items():
                        # Replace empty values with 'N/A'
                        if value == '':
                            card_data[key] = 'N/A'
                        # Clean up any excessive whitespace
                        elif isinstance(value, str):
                            card_data[key] = ' '.join(value.split())
                    
                except Exception as e:
                    print(f"Error fetching details for {name}: {e}")

                if subtypes:
                    card_data['Subtypes'] = ', '.join(subtypes)    
                print(f"Card Type: {card_data}")
                all_cards.append(card_data)
                
            except Exception as e:
                print(f"Error processing a card: {e}")
                continue
        
        # Add a small delay to avoid overloading the server
        time.sleep(1)
    
    # Save the last page HTML to a file in the log folder
    if last_page_html:
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        log_file_path = os.path.join(log_folder, f"last_page_{timestamp}.html")
        with open(log_file_path, 'w', encoding='utf-8') as log_file:
            log_file.write(last_page_html)
        print(f"Last page saved to {log_file_path}")
    
    # Save the data to a CSV file
    if all_cards:
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        csv_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), f"pokemon_cards_detailed_{timestamp}.csv")
        
        with open(csv_path, 'w', newline='', encoding='utf-8') as csvfile:
            fieldnames = ['Web Card ID', 'Type', 'Name', 'Expansion', 'Number', 
                        'HP', 'Attribute', 'Attacks', 'Attack_Damage', '[特性]', 'Skill1_Name', 'Skill1_Cost', 
                        'Skill1_Damage', 'Skill1_Effect', 'Skill2_Name', 'Skill2_Cost', 
                        'Skill2_Damage', 'Skill2_Effect', 'Weakness', 'Resistance', 
                        'Retreat_Cost', 'Evolution', 'Pokemon_Info', 'Artist', 
                        'Evolve_Marker', 'Expansion_Symbol','Subtypes', 'Card URL', 'Image URL']
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            
            for card in all_cards:
                # Clean and encode Pokemon_info without line breaks
                if 'Pokemon_Info' in card and card['Pokemon_Info']:
                    card['Pokemon_Info'] = card['Pokemon_Info'].replace('\n', ' ').replace('\r', '')
                writer.writerow(card)
        
        print(f"Successfully scraped {len(all_cards)} cards with details and saved to pokemon_cards_detailed.csv")
        
        # Download card images
        print("Downloading card images...")
        for card in all_cards:
            try:
                if card['Image URL'] and card['Name'] and card['Expansion'] and card['Number']:
                    # Create filename from card details
                    cno = card['Number'].split('/')[0]
                    filename = f"{card['Expansion']}/{cno}.png"
                    image_path = os.path.join(images_folder, filename)
                    # Ensure the directory exists before saving the image
                    os.makedirs(os.path.dirname(image_path), exist_ok=True)
                    # Download image
                    response = requests.get(card['Image URL'], stream=True)
                    if response.status_code == 200:
                        with open(image_path, 'wb') as out_file:
                            shutil.copyfileobj(response.raw, out_file)
                        print(f"Saved image: {filename}")
                    else:
                        print(f"Failed to download image for {card['Name']}")
            except Exception as e:
                print(f"Error downloading image for {card['Name']}: {str(e)}")
    else:
        print("No cards were found to save.")
        
except Exception as e:
    print(f"An error occurred: {e}")