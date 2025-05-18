import os
import csv
from bs4 import BeautifulSoup
import sys

HTML_DIR = r'c:\Users\schan15\SCCode\PTCG_CardDB_Tc\html_pages\SV10'
OUTPUT_CSV = 'cards_output.csv'

def extract_card_fields(html):
    try:
        # Try lxml first, fall back to html.parser if lxml fails
        try:
            soup = BeautifulSoup(html, 'lxml')
        except:
            soup = BeautifulSoup(html, 'html.parser')
            
        # Card Name
        name = ''
        h1 = soup.find('h1', class_='pageHeader')
        if h1:
            name = ''.join(h1.stripped_strings)
            
        # Image URL
        img_url = ''
        img = soup.select_one('.cardImage img')
        if img and img.has_attr('src'):
            img_url = img['src']
            
        # Card Type
        card_type = ''
        h3 = soup.select_one('.skillInformation .commonHeader')
        if not h3:
            h3 = soup.select_one('.commonHeader')
        if h3:
            card_type = h3.get_text(strip=True)
            
        # Skill/Effect
        effect = ''
        effect_p = soup.select_one('.skillEffect')
        if effect_p:
            effect = effect_p.get_text(strip=True)
            
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
            
        return [name, img_url, card_type, effect, collector, expansion, illustrator, qa_link]
    except Exception as e:
        print(f"Error processing HTML: {str(e)}", file=sys.stderr)
        return ['', '', '', '', '', '', '', '']

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
                    # Add filename to help with debugging
                    print(f"Processing: {fname} - Name: {fields[0]}")
                    rows.append(fields)
                except Exception as e:
                    print(f"Error processing {fname}: {str(e)}", file=sys.stderr)

        # Create output directory if it doesn't exist
        output_dir = os.path.dirname(os.path.abspath(OUTPUT_CSV))
        os.makedirs(output_dir, exist_ok=True)

        with open(OUTPUT_CSV, 'w', newline='', encoding='utf-8-sig') as f:
            writer = csv.writer(f)
            writer.writerow(['Name', 'ImageURL', 'CardType', 'Effect', 'CollectorNumber', 'Expansion', 'Illustrator', 'QALink'])
            writer.writerows(rows)
        print(f'Successfully processed {len(rows)} cards. Output: {OUTPUT_CSV}')
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)

if __name__ == '__main__':
    main()