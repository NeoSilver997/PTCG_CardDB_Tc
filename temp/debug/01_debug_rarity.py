import requests
from bs4 import BeautifulSoup
import json
import os

url = "https://asia.pokemon-card.com/tw/card-search/list/"
response = requests.get(url)
soup = BeautifulSoup(response.text, 'html.parser')

rarity_options = {}

# Look for input elements with name="rarity[]"
rarity_inputs = soup.find_all('input', {'name': 'rarity[]'})
for inp in rarity_inputs:
    if inp.get('value'):
        rarity_id = inp['value']
        # Find the associated label
        label = soup.find('label', {'for': inp.get('id')})
        if label:
            rarity_name = label.text.strip()
        else:
            # If no label, use the value or look for text near it
            rarity_name = inp.get('data-name', f"Rarity {rarity_id}")
        rarity_options[rarity_id] = rarity_name

# If no inputs, try select options
if not rarity_options:
    rarity_select = soup.find('select', {'name': 'rarity[]'})
    if rarity_select:
        options = rarity_select.find_all('option')
        for option in options:
            if option.get('value') and option.get('value') != '':
                rarity_id = option['value']
                rarity_name = option.text.strip()
                rarity_options[rarity_id] = rarity_name

# If still no options, try to map from visible text
if not rarity_options:
    rarity_section = soup.find('div', string=lambda x: x and '稀有度' in x)
    if rarity_section:
        # Find the next element with rarity names
        rarity_list = rarity_section.find_next('div', class_=lambda x: x and 'rarity' in x.lower())
        if rarity_list:
            # Assume the names are in spans or something
            spans = rarity_list.find_all('span')
            for i, span in enumerate(spans):
                rarity_name = span.text.strip()
                rarity_id = str(i + 1)  # Assume sequential IDs starting from 1
                rarity_options[rarity_id] = rarity_name

# Save to JSON
if rarity_options:
    json_path = os.path.join(os.path.dirname(__file__), "rarity_options.json")
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(rarity_options, f, ensure_ascii=False, indent=4)
    print(f"Rarity options saved to {json_path}")
    print(json.dumps(rarity_options, ensure_ascii=False, indent=4))
else:
    print("No rarity options found.")