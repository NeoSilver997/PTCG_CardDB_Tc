import requests
from bs4 import BeautifulSoup
import math
import csv

# Base URL for the card list
base_url = "https://asia.pokemon-card.com/hk/card-search/list/"

# Get the total number of pages
response = requests.get(base_url)
soup = BeautifulSoup(response.text, 'html.parser')
result_p = soup.find('p', class_='result')
total_span = result_p.find('span')
total_cards = int(total_span.text)
cards_per_page = 20
total_pages = math.ceil(total_cards / cards_per_page)

# List to store all card data
all_cards = []

# Iterate through each page
for page in range(1, total_pages + 1):
    response = requests.get(base_url, params={'pageNo': page})
    soup = BeautifulSoup(response.text, 'html.parser')
    card_list = soup.find('ul', class_='card-list')
    cards = card_list.find_all('li')
    
    # Extract information for each card
    for card in cards:
        card_type = card['class'][0]  # e.g., 'pokemon', 'trainer', 'energy'
        name = card.find('p', class_='name').text.strip()
        expansion = card.find('p', class_='expansion').text.strip()
        number = card.find('p', class_='number').text.strip()
        all_cards.append({
            'Type': card_type,
            'Name': name,
            'Expansion': expansion,
            'Number': number
        })

# Save the data to a CSV file
with open('pokemon_cards.csv', 'w', newline='', encoding='utf-8') as csvfile:
    fieldnames = ['Type', 'Name', 'Expansion', 'Number']
    writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
    writer.writeheader()
    for card in all_cards:
        writer.writerow(card)