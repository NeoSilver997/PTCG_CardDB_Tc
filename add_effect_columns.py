#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Add Effect Classification Columns to PTCG Card Database
Adds primary and special effect type columns to each card
"""

import csv
from collections import defaultdict
import re

class CardEffectClassifier:
    def __init__(self):
        # Common effect type mappings
        self.primary_effect_types = {
            '抽卡效果': '資源獲取',
            '搜索效果': '資源獲取',
            '能量操作': '資源管理',
            '傷害效果': '傷害輸出',
            '狀態異常': '狀態控制',
            '硬幣判定': '隨機效果',
            '物品效果': '支援效果',
            '切換效果': '位置控制',
            '回復效果': '恢復效果',
            '傷害防禦': '防禦效果',
            '支援者效果': '支援效果',
            '其他效果': '特殊效果'
        }

        self.special_effect_types = {
            '大量抽卡': '大量資源',
            '丟棄效果': '資源破壞',
            '撤退效果': '撤退控制',
            '放置效果': '位置操作',
            '進化效果': '進化支援',
            '競技場效果': '場地控制',
            '特性效果': '特性效果',
            '狀態免疫': '狀態免疫'
        }

    def classify_card_effects(self, card_row):
        """Classify effects for a single card and return classification results"""
        primary_types = set()
        special_types = set()

        # Analyze Skill 1 Effect
        if card_row.get('Skill1Effect') and card_row['Skill1Effect'].strip():
            p_types, s_types = self.classify_single_effect(card_row['Skill1Effect'].strip())
            primary_types.update(p_types)
            special_types.update(s_types)

        # Analyze Skill 2 Effect
        if card_row.get('Skill2Effect') and card_row['Skill2Effect'].strip():
            p_types, s_types = self.classify_single_effect(card_row['Skill2Effect'].strip())
            primary_types.update(p_types)
            special_types.update(s_types)

        # Convert sets to sorted comma-separated strings
        primary_str = ', '.join(sorted(primary_types)) if primary_types else '無'
        special_str = ', '.join(sorted(special_types)) if special_types else '無'

        return primary_str, special_str

    def classify_single_effect(self, effect: str):
        """Classify a single skill effect and return primary and special types"""
        primary_types = set()
        special_types = set()

        # Primary effect classifications
        if any(word in effect for word in ['抽取', '抽出', '加入手牌']) and '牌庫' in effect:
            if any(num in effect for num in ['4', '5', '6']):
                special_types.add('大量抽卡')
            else:
                primary_types.add('抽卡效果')

        elif any(word in effect for word in ['從', '選擇']) and any(word in effect for word in ['牌庫', '棄牌區']):
            primary_types.add('搜索效果')

        elif any(word in effect for word in ['附上', '附加', '移除']) and '能量' in effect:
            primary_types.add('能量操作')

        elif any(word in effect for word in ['造成', '給予']) and '傷害' in effect:
            primary_types.add('傷害效果')

        elif any(word in effect for word in ['中毒', '燃燒', '麻痺', '睡眠', '混亂']):
            primary_types.add('狀態異常')

        elif '硬幣' in effect and '擲' in effect:
            primary_types.add('硬幣判定')

        elif any(word in effect for word in ['在自己的回合時，物品', '物品卡']):
            primary_types.add('物品效果')

        elif any(word in effect for word in ['切換', '互換']):
            primary_types.add('切換效果')

        elif any(word in effect for word in ['恢復', '回復']) and any(word in effect for word in ['HP', '傷害']):
            primary_types.add('回復效果')

        elif any(word in effect for word in ['不會受到', '無法使用']) and '傷害' in effect:
            primary_types.add('傷害防禦')


        # Special effect classifications
        if '丟棄' in effect and '對手' in effect:
            special_types.add('丟棄效果')

        if '撤退' in effect:
            special_types.add('撤退效果')

        if '放置' in effect and any(word in effect for word in ['備戰區', '場上']):
            special_types.add('放置效果')

        if any(word in effect for word in ['進化', '太晶']):
            special_types.add('進化效果')

        if '競技場' in effect:
            special_types.add('競技場效果')

        if '特性' in effect:
            special_types.add('特性效果')

        if any(word in effect for word in ['特殊狀態', '狀態']) and any(word in effect for word in ['不會', '不能', '無法']):
            special_types.add('狀態免疫')

        # If no classification found, mark as other
        if not primary_types and not special_types:
            primary_types.add('其他效果')

        return primary_types, special_types

    def process_csv_file(self, input_file: str, output_file: str):
        """Process the CSV file and add effect classification columns"""
        print(f"Processing {input_file}...")

        with open(input_file, 'r', encoding='utf-8-sig') as infile, \
             open(output_file, 'w', newline='', encoding='utf-8-sig') as outfile:

            reader = csv.DictReader(infile)
            fieldnames = reader.fieldnames + ['主要效果類型', '特殊效果類型']
            writer = csv.DictWriter(outfile, fieldnames=fieldnames)

            # Write header
            writer.writeheader()

            processed_count = 0
            for row in reader:
                # Classify effects for this card
                primary_types, special_types = self.classify_card_effects(row)

                # Add new columns to the row
                row['主要效果類型'] = primary_types
                row['特殊效果類型'] = special_types

                # Write the row
                writer.writerow(row)

                processed_count += 1
                if processed_count % 500 == 0:
                    print(f"Processed {processed_count} cards...")

        print(f"✅ Processing complete! {processed_count} cards processed.")
        print(f"📁 Output saved to: {output_file}")

def main():
    classifier = CardEffectClassifier()

    input_file = 'scripts/cards_output_all_mega.csv'
    output_file = 'cards_output_all_mega_with_effects.csv'

    classifier.process_csv_file(input_file, output_file)

    print("\n🎯 效果分類欄位說明:")
    print("   • 主要效果類型: 卡牌的主要功能分類")
    print("   • 特殊效果類型: 卡牌的特殊機制分類")
    print("   • 多個分類以逗號分隔")

if __name__ == "__main__":
    main()