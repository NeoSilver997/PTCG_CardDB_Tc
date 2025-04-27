import sqlite3
import argparse
import json
import time
from urllib.parse import urlparse
import requests
from bs4 import BeautifulSoup

def create_database():
    conn = sqlite3.connect('x:/Document/PokemonDBDownload/pokemon_cards.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS expansions 
                 (expansion_code TEXT PRIMARY KEY, 
                  expansion_name TEXT,
                  source_url TEXT)''')
    conn.commit()
    return conn


def scrape_expansion_name(url, retries=1):
    for attempt in range(retries):
        try:
            response = requests.get(url, timeout=10 + attempt*1)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # 更精確的標題解析
            title = soup.find('title')
            if title and ' | Pokémon Card Database' in title.text:
                return title.text.split('|')[0].strip()
            return None
            
        except Exception as e:
            print(f"Attempt {attempt+1} failed for {url}: {str(e)}")
            if attempt < retries - 1:
                time.sleep(2 ** attempt)
    print(f"All attempts failed for {url}")
    return None

def process_expansion(conn, card_url, exp_code):
    try:
        response = requests.get(card_url)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # 加強HTML元素檢查
        expansion_link_section = soup.find('section', class_='expansionLinkColumn')
        if not expansion_link_section:
            print(f"Missing expansionLinkColumn section in {card_url}")
            return False
            
        expansion_link = expansion_link_section.find('a')
        if not expansion_link:
            print(f"Missing expansion link in {card_url}")
            return False
            
        expansion_name = expansion_link.text.strip()
        
        # 處理數據庫插入
        try:
            conn.execute('''
                INSERT OR REPLACE INTO expansions 
                (expansion_code, expansion_name, source_url)
                VALUES (?, ?, ?)
            ''', (exp_code, expansion_name, card_url))
            conn.commit()
            return True
        except sqlite3.IntegrityError:
            print(f"Expansion {exp_code} already exists")
            return True
        except Exception as db_error:
            print(f"Database error: {str(db_error)}")
            return False
            
    except Exception as e:
        print(f"Error processing {exp_code}: {str(e)}")
        return False

def main(metadata_path):
    conn = create_database()
    
    with open(metadata_path, 'r') as f:
        metadata = json.load(f)
    
    base_url = 'https://asia.pokemon-card.com/hk/archive/special/card/{}/'
    
    success_count = 0
    for exp_code in metadata['expansions']:
        print(f"Processing {exp_code}...")
        cursor = conn.execute('SELECT Card_URL FROM card_csv WHERE Expansion = ? LIMIT 1', (exp_code,))
        row = cursor.fetchone()
        if not row:
            print(f"No card found for expansion {exp_code}, skipping")
            continue
        card_url = row[0]
        print(f"Processing expansion {exp_code} with URL: {card_url}")
        try:
            result = process_expansion(conn, card_url, exp_code)
            if result:
                success_count += 1
            else:
                print(f"Failed to process expansion {exp_code}")
        except Exception as e:
            print(f"Critical error processing {exp_code}: {str(e)}")
        time.sleep(1)
    
    conn.close()
    print(f"Processed {len(metadata['expansions'])} expansions, {success_count} succeeded")
    
    # 移除重複的數據庫操作代碼

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Pokémon TCG Expansion Scraper')
    parser.add_argument('metadata', help='Path to metadata.json')
    args = parser.parse_args()
    main(args.metadata)