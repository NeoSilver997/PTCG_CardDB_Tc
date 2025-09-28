#!/usr/bin/env python3
"""
Test script to debug CSV reading issues
"""
import csv
import os

def test_csv_reading():
    csv_path = "../source/cards_output_all_mega.csv"
    
    print(f"Testing CSV file: {csv_path}")
    print(f"File exists: {os.path.exists(csv_path)}")
    
    # Test different encodings
    encodings = ['utf-8', 'utf-8-sig', 'cp950', 'gb2312', 'big5']
    
    for encoding in encodings:
        try:
            print(f"\n=== Testing encoding: {encoding} ===")
            with open(csv_path, 'r', encoding=encoding) as f:
                # Read first few lines
                lines = []
                for i, line in enumerate(f):
                    lines.append(line.strip())
                    if i >= 3:  # Read first 4 lines
                        break
                
                print("Raw lines:")
                for i, line in enumerate(lines):
                    print(f"  Line {i+1}: {line[:100]}...")
                
                # Test CSV parsing
                f.seek(0)
                reader = csv.DictReader(f)
                print("CSV headers:", reader.fieldnames)
                
                print("First 3 rows:")
                for i, row in enumerate(reader):
                    name = row.get('Name', 'MISSING')
                    card_type = row.get('CardType', 'MISSING')
                    print(f"  Row {i+1}: Name='{name}', CardType='{card_type}'")
                    if i >= 2:
                        break
                        
                print(f"✅ Encoding {encoding} works!")
                break
                        
        except UnicodeDecodeError as e:
            print(f"❌ Encoding {encoding} failed: {e}")
        except Exception as e:
            print(f"❌ Encoding {encoding} error: {e}")

if __name__ == "__main__":
    test_csv_reading()