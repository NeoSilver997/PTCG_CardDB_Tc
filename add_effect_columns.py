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
            '條件傷害': '條件效果',
            '狀態恢復': '恢復效果',
            '傷害指示物': '狀態控制',
            '道具消除': '干擾效果',
            '情報收集': '情報效果',
            '昏厥條件': '傷害輸出',
            '進化支援': '進化效果',
            '撤退干擾': '位置控制',
            '獎賞控制': '資源控制',
            '反噬傷害': '傷害輸出',
            '連鎖傷害': '傷害輸出',
            '傷害無視': '傷害輸出',
            '使用限制': '限制效果',
            '條件失敗': '條件效果',
            '能量附著': '資源管理',
            '狀態施加': '狀態控制',
            '備戰傷害加成': '條件效果',
            '特殊能量': '資源管理',
            '牌庫操作': '資源管理',
            '連續技': '條件效果',
            '招式封鎖': '干擾效果',
            '能量條件': '條件效果',
            '附著干擾': '干擾效果',
            'HP提升': '增幅效果',
            '場地增幅': '場地效果',
            '效果免疫': '防禦效果',
            '道具移除': '干擾效果',
            '招式複製': '特殊效果',
            '簡單灼傷': '狀態控制',
            '弱點消除': '防禦效果',
            '屬性防禦': '防禦效果',
            '能量需求增加': '干擾效果',
            '棄牌區傷害加成': '條件效果',
            '物品卡封鎖': '干擾效果',
            '全體防禦': '防禦效果',
            '撤退封鎖': '位置控制',
            '招式鎖定': '限制效果',
            '能量回收': '資源管理',
            '道具使用規則': '支援效果',
            '傷害減免': '防禦效果',
            '支援者限制': '限制效果',
            '牌庫重洗': '資源管理',
            '特定寶可夢防禦': '防禦效果',
            '弱點改變': '狀態控制',
            '招式複製對手': '特殊效果',
            '高額傷害減免': '防禦效果',
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

        if any(word in effect for word in ['從', '選擇']) and any(word in effect for word in ['牌庫', '棄牌區']):
            primary_types.add('搜索效果')

        if any(word in effect for word in ['附上', '附加', '移除']) and '能量' in effect:
            primary_types.add('能量操作')

        if any(word in effect for word in ['造成', '給予']) and '傷害' in effect:
            primary_types.add('傷害效果')

        if any(word in effect for word in ['中毒', '燃燒', '麻痺', '睡眠', '混亂']):
            primary_types.add('狀態異常')

        if '硬幣' in effect and '擲' in effect:
            primary_types.add('硬幣判定')

        # if any(word in effect for word in ['在自己的回合時，物品', '物品卡']):
        #     primary_types.add('物品效果')

        if any(word in effect for word in ['切換', '互換']):
            primary_types.add('切換效果')

        if any(word in effect for word in ['恢復', '回復']) and any(word in effect for word in ['HP', '傷害']):
            primary_types.add('回復效果')
        if any(word in effect for word in ['這張卡不會陷入特殊狀態']):
            primary_types.add('特殊進化')
        if any(word in effect for word in ['不會受到', '無法使用']) and '傷害' in effect:
            primary_types.add('傷害防禦')
        if any(word in effect for word in ['放回手牌']) :
            primary_types.add('放回手牌')
        if any(word in effect for word in ['丟棄']) and '自己' in effect:
            primary_types.add('自己丟棄')
        if '重洗' in effect:    
            primary_types.add('牌庫重洗') 
        if any(word in effect for word in ['若', '在這個回合', '在上個', '在下個']) and any(word in effect for word in ['增加', '點傷害']):
            primary_types.add('條件傷害')
        if any(word in effect for word in ['恢復', '回復']) and any(word in effect for word in ['特殊狀態', '狀態']):
            primary_types.add('狀態恢復')
        if '傷害指示物' in effect and any(word in effect for word in ['放置', '增加']):
            primary_types.add('傷害指示物')
        if any(word in effect for word in ['道具', '物品']) and any(word in effect for word in ['消除', '移除']):
            primary_types.add('道具消除')
        if any(word in effect for word in ['查看', '看']) and '搜索效果' not in primary_types:
            primary_types.add('情報收集')
        if any(word in effect for word in ['昏厥']) and any(word in effect for word in ['若', '當']):
            primary_types.add('昏厥條件')
        if any(word in effect for word in ['進化', '2階進化', '跳過']) and '進化' in effect:
            primary_types.add('進化支援')
        if '撤退' in effect and any(word in effect for word in ['增加', '所需的能量']):
            primary_types.add('撤退干擾')
        if '獎賞卡' in effect:
            primary_types.add('獎賞控制') 
        if any(word in effect for word in ['這隻寶可夢也受到', '自己也受到']) and '傷害' in effect:
            primary_types.add('反噬傷害')
        if any(word in effect for word in ['備戰寶可夢也受到', '備戰區不計算']) and '傷害' in effect:
            primary_types.add('連鎖傷害')
        if any(word in effect for word in ['傷害不計算', '不計算弱點', '不計算抵抗力']) and any(word in effect for word in ['弱點', '抵抗力', '附加效果']):
            primary_types.add('傷害無視')
        if any(word in effect for word in ['下個自己的回合', '無法使用招式']):
            primary_types.add('使用限制')
        if any(word in effect for word in ['若', '如果']) and any(word in effect for word in ['失敗', '則這個招式失敗']):
            primary_types.add('條件失敗')
        if any(word in effect for word in ['從自己的手牌選擇', '選擇1張能量卡']) and '附於' in effect:
            primary_types.add('能量附著')
        if any(word in effect for word in ['灼傷', '將對手的戰鬥寶可夢']) and any(word in effect for word in ['灼傷', '中毒', '燃燒']) and '若' in effect:
            primary_types.add('狀態施加')
        if any(word in effect for word in ['備戰寶可夢的數量', '數量×']) and '傷害' in effect:
            primary_types.add('備戰傷害加成')
        if any(word in effect for word in ['視為提供', '重新附於']) and '能量' in effect:
            primary_types.add('特殊能量')
        if any(word in effect for word in ['放回牌庫並重洗', '各自從牌庫抽出']) and '支援者卡' in effect:
            primary_types.add('牌庫操作')
        if any(word in effect for word in ['在上個自己的回合', '在上個對手的回合', '在上個回合', '在上回合']) and '才可使用' in effect:
            primary_types.add('連續技')
        if any(word in effect for word in ['選擇1個', '持有的招式']) and '無法使用' in effect:
            primary_types.add('招式封鎖')
        if any(word in effect for word in ['若自己', '只需要']) and '能量即可使用' in effect:
            primary_types.add('能量條件')
        if any(word in effect for word in ['若對手', '將能量卡附於']) and '對手的回合結束' in effect:
            primary_types.add('附著干擾')
        if any(word in effect for word in ['最大HP', '+50', '+70', '+30']):
            primary_types.add('HP提升')
        if any(word in effect for word in ['場上所有', '最大HP各']) and '競技場' in effect:
            primary_types.add('場地增幅')
        if any(word in effect for word in ['不會受到', '效果的影響']):
            primary_types.add('效果免疫')
        if any(word in effect for word in ['寶可夢道具', '將其丟棄']) and '選擇最多' in effect:
            primary_types.add('道具移除')
        if any(word in effect for word in ['選擇1個', '持有的招式']) and '作為這個招式使用' in effect:
            primary_types.add('招式複製')
        if '將對手的戰鬥寶可夢【灼傷】' in effect and not any(word in effect for word in ['若', '沒有', '失敗']):
            primary_types.add('簡單灼傷') 
        if any(word in effect for word in ['弱點全部消除', '弱點消除']):
            primary_types.add('弱點消除')
        if any(word in effect for word in ['受到對手的寶可夢招式的傷害', '傷害「-30」點']) and any(word in effect for word in ['【鋼】', '【鬥】']):
            primary_types.add('屬性防禦')
        if any(word in effect for word in ['使用招式所需的能量', '各增加1個']):
            primary_types.add('能量需求增加')
        if any(word in effect for word in ['棄牌區', '張數×']) and '傷害' in effect:
            primary_types.add('棄牌區傷害加成')
        if any(word in effect for word in ['無法從手牌使出物品卡', '不能使用物品卡']):
            primary_types.add('物品卡封鎖')
        if any(word in effect for word in ['自己的所有寶可夢', '受到對手的寶可夢招式的傷害']) and '包含新上場' in effect:
            primary_types.add('全體防禦')
        if any(word in effect for word in ['無法撤退']):
            primary_types.add('撤退封鎖')
        if any(word in effect for word in ['離開戰鬥場前無法使用', '無法使用']):
            primary_types.add('招式鎖定')
        if any(word in effect for word in ['從自己的棄牌區抽出', '放回牌庫並重洗']) and '能量卡' in effect:
            primary_types.add('能量回收')
        # if any(word in effect for word in ['道具卡可不限張數', '道具卡附於', '物品卡可不限張數']):
        #     primary_types.add('道具使用規則') 
        if any(word in effect for word in ['受到招式的傷害', '傷害「-']) and any(word in effect for word in ['-10', '-20', '-30']) and not any(word in effect for word in ['【鋼】', '【鬥】', '所有寶可夢']):
            primary_types.add('傷害減免')
        if any(word in effect for word in ['支援者卡只可使用', '支援者卡只可使用1張']):
            primary_types.add('支援者限制')
        if any(word in effect for word in ['放回各自的牌庫並重洗', '全部放回牌庫並重洗']):
            primary_types.add('牌庫重洗')
        if any(word in effect for word in ['的所有「', '的寶可夢」']) and '傷害「-30」點' in effect:
            primary_types.add('特定寶可夢防禦')
        if any(word in effect for word in ['弱點改為', '弱點以']):
            primary_types.add('弱點改變')
        if any(word in effect for word in ['對手選擇對手自己的', '作為這個招式使用']):
            primary_types.add('招式複製對手')
        if any(word in effect for word in ['傷害「-80', '傷害「-100']):
            primary_types.add('高額傷害減免') 


        # Special effect classifications
        if '丟棄' in effect and '對手' in effect:
            special_types.add('丟棄對手')

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

        # If no classification found, mark as other (but skip for rule modifications)
        if not primary_types and not special_types:
            # Skip "其他效果" for rule-modifying effects like item card usage rules
            if not any(word in effect for word in ['可不限張數使用', '可使用', '只能使用']):
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