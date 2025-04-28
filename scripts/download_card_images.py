import sqlite3
import os
import requests
from PIL import Image
from urllib.parse import urlparse

DB_PATH = r'x:\Document\PokemonDBDownload\pokemon_cards.db'


def get_db_connection():
    return sqlite3.connect(DB_PATH)


def sanitize_filename(name):
    # 替换所有路径分隔符和特殊字符
    name = name.replace('/', '-')
    name = name.replace('\\', '-')
    name = name.replace(':', '')
    name = name.replace('<', '(')
    name = name.replace('>', ')')
    # 使用正则表达式移除其他非法字符
    import re
    name = re.sub(r'[\\:*?"<>|]', '-', name)
    return name.strip()


def download_image(url, path):
    try:
        response = requests.get(url, stream=True, timeout=10)
        response.raise_for_status()
        with open(path, 'wb') as f:
            for chunk in response.iter_content(1024):
                f.write(chunk)
        return True
    except Exception as e:
        print(f"Failed to download {url}: {str(e)}")
        return False


def create_resized_copy(src_path, dest_path, max_width=300):
    try:
        with Image.open(src_path) as img:
            w_percent = max_width / float(img.size[0])
            h_size = int(float(img.size[1]) * float(w_percent))
            img = img.resize((max_width, h_size), Image.LANCZOS)
            img.save(dest_path, 'PNG')
        return True
    except Exception as e:
        print(f"Failed to resize {src_path}: {str(e)}")
        return False


def process_cards():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT expansion, number, web_card_id, Name, card_type, Image_URL 
        FROM card_csv
        WHERE Image_URL IS NOT NULL
    ''')

    for row in cursor.fetchall():
        expansion, number, web_id, name, card_type, image_url = row
        if not all([expansion, number, web_id, name, image_url]):
            continue

        # Create directories
        base_dir = os.path.dirname(os.path.abspath(__file__))
        sanitized_name = sanitize_filename(name)
        expansion_dir = os.path.join(base_dir, 'card_images', sanitize_filename(expansion))
        small_dir = os.path.join(base_dir, 'card_small_images', sanitize_filename(expansion))
        
        os.makedirs(expansion_dir, exist_ok=True)
        os.makedirs(small_dir, exist_ok=True)

        # Generate filenames
        # 处理卡牌编号中的斜杠
        safe_number = str(number).replace('/', '_')
        filename = f"{safe_number}_{web_id}_{sanitized_name}_{card_type}.png".replace(' ', '_')
        orig_path = os.path.join(expansion_dir, filename)
        small_path = os.path.join(small_dir, filename)

        # Skip existing files
        if os.path.exists(orig_path) and os.path.exists(small_path):
            continue

        # Download original
        if not os.path.exists(orig_path):
            if not download_image(image_url, orig_path):
                continue

        # Create resized copy
        if os.path.exists(orig_path) and not os.path.exists(small_path):
            create_resized_copy(orig_path, small_path)

    conn.close()

if __name__ == '__main__':
    process_cards()