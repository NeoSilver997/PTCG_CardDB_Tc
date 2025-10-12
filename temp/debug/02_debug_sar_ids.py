import requests
from bs4 import BeautifulSoup
import json
import os
import time
import re

# Base URL for SAR rarity cards
base_url = "https://asia.pokemon-card.com/tw/card-search/list/?pageNo=1&sortCondition=&keyword=&cardType=all&regulation=1&pokemonEnergy=&pokemonWeakness=&pokemonResistance=&pokemonMoveEnergy=&hpLowerLimit=none&hpUpperLimit=none&retreatCostLowerLimit=0&retreatCostUpperLimit=none&illustratorName=&rarity[]=15"

try:
    # Get the total number of pages
    response = requests.get(base_url)
    soup = BeautifulSoup(response.text, 'html.parser')

    # Extract the total number of pages
    total_pages_elem = soup.find('p', class_='resultTotalPages')
    if total_pages_elem:
        total_pages_text = total_pages_elem.text.strip()
        digits = re.findall(r'\d+', total_pages_text)
        if digits:
            total_pages = int(digits[0])
        else:
            total_pages = 1
    else:
        total_pages = 1

    print(f"Found {total_pages} pages for SAR rarity")

    web_card_ids = []
    max_pages = min(total_pages, 300)  # Limit to 300 pages

    for page in range(1, max_pages + 1):
        print(f"Scraping page {page} of {max_pages}...")
        response = requests.get(base_url, params={'pageNo': page})
        soup = BeautifulSoup(response.text, 'html.parser')

        card_list = soup.find('ul', class_='list')
        if card_list:
            cards = card_list.find_all('li', class_='card')
            for card in cards:
                link = card.find('a', href=True)
                if link:
                    href = link['href']
                    # Extract ID from /detail/{id}/
                    match = re.search(r'/detail/(\d+)/', href)
                    if match:
                        web_card_id = match.group(1)
                        web_card_ids.append(web_card_id)

        time.sleep(1)  # Delay to avoid overloading

    # Save to JSON
    json_path = os.path.join(os.path.dirname(__file__), "sar_web_card_ids.json")
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(web_card_ids, f, indent=4)

    print(f"Collected {len(web_card_ids)} web_card_ids for SAR rarity")
    print(f"Saved to {json_path}")

except Exception as e:
    print(f"An error occurred: {e}")