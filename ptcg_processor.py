#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PTCG Card Database Processor - Combined Merge and Rating System
Combines smart card merging logic with comprehensive card rating system
for Pokemon Trading Card Game database processing.

Features:
- Smart merging of duplicate cards based on normalized skill effects
- Multi-criteria card rating system (meta, expansion, function, synergy, effect, damage)
- CSV processing with detailed scoring breakdown
- Command-line interface for different operations
"""

import csv
import re
from collections import defaultdict
from typing import Dict, List, Tuple
import argparse
import sys

class PTCGCardProcessor:
    """Combined PTCG Card Processing System with Merge and Rating capabilities"""

    def __init__(self):
        # Initialize rating system components
        self._init_rating_system()
        self._init_effect_classifier()

    def _init_rating_system(self):
        """Initialize the card rating system components"""
        # Define meta-relevant card names and their base scores
        self.meta_cards = {
            'S_TIER': [
                '高級球', '超級球', '神奇糖果', '能量回收', '寶可夢交替',
                '巢穴球', '博士的研究', '馬志士的作戰', '寶可齒輪',
                '莉莉艾的決意', 'Professor Oak', 'Bill', 'Computer Search'
            ],
            'A_TIER': [
                '粉碎之錘', '改造之錘', '反擊捕捉器', '朋友手冊',
                '寶可夢捕捉器', '能量轉移', '裁判', '學習裝置'
            ],
            'B_TIER': [
                '精靈球', '傷藥', '寶可夢中心的姐姐', '觀光客',
                '反擊增幅器', '能量再利用'
            ]
        }

        # Expansion tier rankings (newer/more competitive = higher tier)
        self.expansion_tiers = {
            'S_TIER': ['SV11', 'SV10', 'SV9', 'SV8', 'SV7', 'SV6'],
            'A_TIER': ['SV5', 'SV4', 'SV3', 'SV2', 'SV1', 'SV'],
            'B_TIER': ['S12', 'S11', 'S10', 'S9', 'S8', 'S7'],
            'C_TIER': ['S6', 'S5', 'S4', 'S3', 'S2', 'S1'],
            'D_TIER': ['AC', 'AS', 'M', 'SC', 'SDL', 'SH', 'SI']
        }

        # Card type base scores
        self.card_type_scores = {
            '支援者卡': 8,    # Supporter cards are crucial
            '物品卡': 7,      # Item cards are versatile
            '寶可夢道具': 6,   # Pokemon tools are situational
            '基本能量': 5,    # Basic energy is necessary
            '特殊能量': 7,    # Special energy can be powerful
            '競技場卡': 6     # Stadium cards affect game state
        }

        # Rarity multipliers
        self.rarity_multipliers = {
            'ultra_rare': 1.3,
            'rare': 1.2,
            'uncommon': 1.1,
            'normal': 1.0,
            'common': 0.9
        }

        # Function keywords and their score modifiers
        self.function_keywords = {
            # Search effects
            '抽出': 2, '查看': 1, '搜尋': 3, '尋找': 2,
            # Draw effects
            '抽卡': 2, '抽': 1, '加入手牌': 1,
            # Energy manipulation
            '能量': 2, '附加': 1, '改附': 2,
            # Disruption
            '丟到棄牌區': 3, '重洗': 1, '對手': 2,
            # Healing/Recovery
            '恢復': 1, '治療': 1, 'HP': 1,
            # Evolution
            '進化': 3, '完成進化': 4,
            # Switching
            '互換': 2, '交替': 3, '備戰': 1
        }

        # Effect type scores based on our classification system
        self.primary_effect_scores = {
            # Resource acquisition (highest priority)
            '資源獲取': 4,
            '搜索效果': 3,
            '抽卡效果': 3,
            '能量回收': 3,

            # Resource management
            '資源管理': 3,
            '能量操作': 3,
            '能量附著': 2,
            '牌庫操作': 2,

            # Damage output
            '傷害輸出': 4,
            '傷害效果': 3,
            '條件傷害': 3,
            '連鎖傷害': 4,

            # Status control
            '狀態控制': 3,
            '狀態異常': 3,
            '傷害指示物': 2,

            # Random effects
            '隨機效果': 2,
            '硬幣判定': 1,

            # Support effects
            '支援效果': 3,
            '物品效果': 2,

            # Position control
            '位置控制': 3,
            '切換效果': 2,

            # Recovery
            '恢復效果': 2,
            '回復效果': 2,

            # Defense
            '防禦效果': 3,
            '傷害防禦': 3,
            '效果免疫': 4,

            # Disruption
            '干擾效果': 4,
            '道具消除': 3,
            '招式封鎖': 3,

            # Other effects
            '情報效果': 2,
            '進化效果': 3,
            '資源控制': 2,
            '條件效果': 2,
            '限制效果': 1,
            '增幅效果': 2,
            '場地效果': 2,
            '特殊效果': 2
        }

        self.special_effect_scores = {
            # High impact effects
            '大量抽卡': 5,
            '丟棄對手': 4,
            '撤退效果': 3,
            '放置效果': 3,
            '競技場效果': 4,
            '特性效果': 3,
            '狀態免疫': 4,
            '進化效果': 3
        }

    def _init_effect_classifier(self):
        """Initialize the effect classification system"""
        # Primary effect type mappings
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
            '無視弱點/效果': '傷害輸出',
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

    # ===== MERGE SYSTEM METHODS =====

    def normalize_skill_text(self, skill_text):
        '''最終完美版本的標準化技能文字函數 - 最終修正替換順序'''
        if not skill_text:
            return ''

        # 移除HTML標籤
        skill_text = re.sub(r'<[^>]+>', '', skill_text)

        # 首先處理可能會與後續替換衝突的術語
        skill_text = skill_text.replace('那隻寶可夢', '該寶可夢')  # 必須在【2階進化】寶可夢之前替換

        # 統一術語變體
        skill_text = skill_text.replace('抽出1張', '選擇1張')  # 抽出 vs 選擇
        skill_text = skill_text.replace('抽出', '選擇')  # 統一抽卡術語
        skill_text = skill_text.replace('最初自己的回合', '自己的最初回合')  # 統一順序
        skill_text = skill_text.replace('這個回合剛使出的', '剛使出的')  # 簡化表達
        skill_text = skill_text.replace('或剛使出的寶可夢', '與這個回合剛使出的寶可夢')  # 統一限制語句
        skill_text = skill_text.replace('與剛使出的寶可夢', '與這個回合剛使出的寶可夢')  # 統一限制語句
        skill_text = skill_text.replace('或剛使出的', '與這個回合剛使出的')  # 統一限制語句

        # 修復常見的文字錯誤
        skill_text = skill_text.replace('寶可夢卡卡', '寶可夢卡')  # 修復雙重"卡"
        skill_text = skill_text.replace('【2階進化】寶可夢', '【2階進化】寶可夢卡')  # 統一術語

        # 統一神奇糖果的特殊表達
        skill_text = skill_text.replace('並完成進化', '完成進化')  # 簡化進化表達
        skill_text = skill_text.replace('跳過【1階進化】完成進化', '完成進化')  # 統一進化表達
        skill_text = skill_text.replace('1隻可進化成', '可進化成')  # 簡化數量表達
        skill_text = skill_text.replace('身上完成進化', '身上，完成進化')  # 統一逗號使用

        # 統一數字和單位表達
        skill_text = skill_text.replace('剩餘獎賞卡張數', '剩餘獎賞卡的張數')  # 統一獎賞卡表達
        skill_text = skill_text.replace('選擇1隻', '選擇')  # 簡化選擇表達
        skill_text = skill_text.replace('選擇對手的1隻', '選擇對手的')  # 簡化選擇表達

        # 統一物品卡規則 - 這些通常可以忽略，因為它們是標準規則
        if skill_text.strip() == '在自己的回合時，物品卡可不限張數使用。':
            return ''  # 將標準物品卡規則視為空，因為它們總是相同的

        # 移除多餘的句點後空格 - 這是最後的清理
        skill_text = re.sub(r'\。\s+', '。', skill_text)  # 移除句點後的多餘空格

        # 移除多餘空白和換行
        skill_text = re.sub(r'\s+', ' ', skill_text)
        return skill_text.strip()

    def create_skill_key(self, card):
        '''為卡牌創建技能鍵，只考慮主要技能效果'''
        skill1 = self.normalize_skill_text(card.get('Skill1Effect', '').strip())
        # 忽略Skill2，因為它通常是標準規則
        return skill1

    def smart_merge_cards(self, input_file: str, output_file: str) -> None:
        """Perform smart merging of duplicate cards based on normalized skill effects"""
        print('🔄 開始最終完美智慧合併...')

        # 第一階段：按名稱分組
        name_groups = defaultdict(list)

        with open(input_file, 'r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            fieldnames = reader.fieldnames

            for row in reader:
                name = row.get('Name', '').strip()
                name_groups[name].append(row)

        print(f'找到 {len(name_groups)} 個唯一名稱')

        # 第二階段：對於每個名稱，合併大致相同的技能
        merged_cards = []
        total_original = 0
        total_merged = 0

        for name, cards in name_groups.items():
            total_original += len(cards)

            # 如果這個名稱只有一張卡，保持不變
            if len(cards) == 1:
                merged_cards.extend(cards)
                total_merged += 1
                continue

            # 對於有多張卡的名稱，按技能分組 (只考慮Skill1)
            skill_groups = defaultdict(list)

            for card in cards:
                skill_key = self.create_skill_key(card)
                skill_groups[skill_key].append(card)

            # 對於每個技能組，取第一張卡作為代表
            for skill_key, skill_cards in skill_groups.items():
                representative = skill_cards[0].copy()
                merged_cards.append(representative)
                total_merged += 1

        # 寫入新CSV文件
        with open(output_file, 'w', newline='', encoding='utf-8-sig') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(merged_cards)

        print(f'\n✅ 最終完美智慧合併完成!')
        print(f'原始卡牌數: {total_original}')
        print(f'智慧合併後卡牌數: {total_merged}')
        print(f'移除重複數: {total_original - total_merged}')
        print(f'壓縮比例: {total_merged/total_original*100:.1f}%')
        print(f'輸出文件: {output_file}')

        # 最終驗證所有問題卡牌
        test_cards = ['大地之容器', '反擊捕捉器', '神奇糖果']
        all_good = True
        for test_card in test_cards:
            count = 0
            with open(output_file, 'r', encoding='utf-8-sig') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    name = row.get('Name', '').strip()
                    if test_card in name:
                        count += 1
            status = "✅" if count == 1 else "❌"
            if count != 1:
                all_good = False
            print(f'{status} {test_card}: {count} 張')

        if all_good:
            print('\n🎉 所有問題卡牌已成功合併為1張!')
            print('智慧合併任務完成！')
        else:
            print('\n⚠️  還有卡牌需要進一步處理')

    # ===== RATING SYSTEM METHODS =====

    def calculate_base_score(self, card_data: Dict[str, str]) -> float:
        """Calculate base score from card type"""
        card_type = card_data.get('CardType', '')
        return self.card_type_scores.get(card_type, 5)

    def calculate_meta_score(self, card_name: str) -> float:
        """Calculate meta relevance score"""
        for tier, cards in self.meta_cards.items():
            if any(meta_card in card_name for meta_card in cards):
                if tier == 'S_TIER':
                    return 5
                elif tier == 'A_TIER':
                    return 3
                elif tier == 'B_TIER':
                    return 1
        return 0

    def calculate_expansion_score(self, expansion_code: str) -> float:
        """Calculate expansion power level score"""
        for tier, expansions in self.expansion_tiers.items():
            if any(exp in expansion_code for exp in expansions):
                if tier == 'S_TIER':
                    return 3
                elif tier == 'A_TIER':
                    return 2
                elif tier == 'B_TIER':
                    return 1
                elif tier == 'C_TIER':
                    return 0
                elif tier == 'D_TIER':
                    return -1
        return 0

    def calculate_function_score(self, card_data: Dict[str, str]) -> float:
        """Calculate score based on card text and abilities"""
        text_fields = [
            card_data.get('AbilityDesc', ''),
            card_data.get('Skill1Effect', ''),
            card_data.get('Skill2Effect', '')
        ]

        total_text = ' '.join(text_fields)
        function_score = 0

        for keyword, score in self.function_keywords.items():
            if keyword in total_text:
                function_score += score

        return min(function_score, 10)  # Cap at 10

    def calculate_synergy_score(self, card_data: Dict[str, str]) -> float:
        """Calculate synergy potential score"""
        synergy_score = 0
        card_name = card_data.get('Name', '')

        # Cards that work well in multiple deck types
        if any(keyword in card_name for keyword in ['球', '回收', '交替', '糖果']):
            synergy_score += 3

        # Cards with conditional effects (higher skill ceiling)
        skill_text = card_data.get('Skill1Effect', '') + card_data.get('Skill2Effect', '')
        if '若' in skill_text or '只有在' in skill_text:
            synergy_score += 2

        # Cards that affect multiple Pokemon
        if '場上' in skill_text or '全部' in skill_text:
            synergy_score += 2

        return min(synergy_score, 7)  # Cap at 7

    def calculate_effect_score(self, card_data: Dict[str, str]) -> float:
        """Calculate score based on effect classifications"""
        effect_score = 0

        # Primary effect types
        primary_effect = card_data.get('主要效果類型', '')
        if primary_effect:
            # Handle multiple effects separated by commas
            effects = [e.strip() for e in primary_effect.split(',')]
            for effect in effects:
                effect_score += self.primary_effect_scores.get(effect, 1)

        # Special effect types
        special_effect = card_data.get('特殊效果類型', '')
        if special_effect and special_effect != '無':
            # Handle multiple effects separated by commas
            effects = [e.strip() for e in special_effect.split(',')]
            for effect in effects:
                effect_score += self.special_effect_scores.get(effect, 1)

        # Ability effect statistics
        ability_effect = card_data.get('Ability效果統計', '')
        if ability_effect:
            # Handle multiple effects separated by commas
            effects = [e.strip() for e in ability_effect.split(',')]
            for effect in effects:
                effect_score += self.special_effect_scores.get(effect, 1)

        return min(effect_score, 12)  # Cap at 12

    def calculate_damage_score(self, card_data: Dict[str, str]) -> float:
        """Calculate score based on maximum damage output"""
        damage_score = 0

        # Parse damage values from skills
        skill1_damage = card_data.get('Skill1Damage', '').strip()
        skill2_damage = card_data.get('Skill2Damage', '').strip()
        skill1_effect = card_data.get('Skill1Effect', '').strip()
        skill2_effect = card_data.get('Skill2Effect', '').strip()

        damages = []

        # Parse Skill1 damage
        if skill1_damage:
            damage_value = self._parse_damage_value(skill1_damage, skill1_effect)
            if damage_value > 0:
                damages.append(damage_value)

        # Parse Skill2 damage
        if skill2_damage:
            damage_value = self._parse_damage_value(skill2_damage, skill2_effect)
            if damage_value > 0:
                damages.append(damage_value)

        # Calculate score based on maximum damage
        if damages:
            max_damage = max(damages)

            # Damage scoring tiers
            if max_damage >= 450:
                damage_score = 9  # Ultra high damage (ex cards, etc.)
            elif max_damage >= 300:
                damage_score = 8  # Very high damage
            elif max_damage >= 200:
                damage_score = 6  # Very high damage
            elif max_damage >= 150:
                damage_score = 5  # High damage
            elif max_damage >= 120:
                damage_score = 4  # Good damage
            elif max_damage >= 90:
                damage_score = 3  # Moderate damage
            elif max_damage >= 60:
                damage_score = 2  # Low-moderate damage
            elif max_damage >= 30:
                damage_score = 1  # Basic damage
            # Below 30 gets 0 points

        return min(damage_score, 8)  # Cap at 8

    def classify_single_effect(self, effect: str):
        """Classify a single skill effect and return primary and special types"""
        primary_types = set()
        special_types = set()

        # Primary effect classifications
        if any(word in effect for word in ['抽取', '抽出', '加入手牌', '抽卡']) and '牌庫' in effect:
            if any(pattern in effect for pattern in ['抽4張', '抽5張', '抽6張', '抽出4張', '抽出5張', '抽出6張']):
                special_types.add('大量抽卡')
            else:
                primary_types.add('抽卡效果')

        if any(word in effect for word in ['從', '選擇']) and any(word in effect for word in ['牌庫', '棄牌區']) and '抽卡' not in effect:
            primary_types.add('搜索效果')

        if any(word in effect for word in ['附上', '附加', '移除']) and '能量' in effect:
            primary_types.add('能量操作')

        if any(word in effect for word in ['造成', '給予']) and '傷害' in effect:
            primary_types.add('傷害效果')

        if any(word in effect for word in ['中毒', '燃燒', '麻痺', '睡眠', '混亂']):
            primary_types.add('狀態異常')

        if '硬幣' in effect and '擲' in effect:
            primary_types.add('硬幣判定')

        if any(word in effect for word in ['切換', '互換']):
            primary_types.add('切換效果')

        if any(word in effect for word in ['恢復', '回復']) and any(word in effect for word in ['HP', '傷害']):
            primary_types.add('回復效果')

        if any(word in effect for word in ['不會受到', '無法使用']) and '傷害' in effect:
            primary_types.add('傷害防禦')

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

        if any(word in effect for word in ['進化', '2階進化', '跳過']) and '進化' in effect and '從手牌使出這張卡並完成進化時' not in effect:
            primary_types.add('進化支援')

        if '撤退' in effect and any(word in effect for word in ['增加', '所需的能量']):
            primary_types.add('撤退干擾')

        if '獎賞卡' in effect:
            primary_types.add('獎賞控制')

        if any(word in effect for word in ['這隻寶可夢也受到', '自己也受到']) and '傷害' in effect:
            primary_types.add('反噬傷害')

        if any(word in effect for word in ['備戰寶可夢也受到', '備戰區不計算']) and '傷害' in effect:
            primary_types.add('連鎖傷害')

        if any(word in effect for word in ['傷害不計算', '不計算弱點', '不計算抵抗力']) and any(word in effect for word in ['弱點', '抵抗力', '附加效果']) and '備戰區不計算' not in effect:
            primary_types.add('無視弱點/效果')

        if any(word in effect for word in ['下個自己的回合']) and '無法使用招式' in effect:
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
            special_types.add('丟棄效果')

        if '撤退' in effect:
            special_types.add('撤退效果')

        if '放置' in effect and any(word in effect for word in ['備戰區', '場上']):
            special_types.add('放置效果')

        if any(word in effect for word in ['從手牌使出這張卡並完成進化時']):
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

    def classify_card_effects(self, card_row):
        """Classify effects for a single card and return classification results"""
        primary_types = set()
        special_types = set()
        
        # Analyze Skill 1 Effect
        if card_row.get('AbilityDesc') and card_row['AbilityDesc'].strip():
            p_types, s_types = self.classify_single_effect(card_row['AbilityDesc'].strip())
            primary_types.update(p_types)
            special_types.update(s_types)

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

    def _parse_damage_value(self, damage_str: str, effect_str: str = '') -> int:
        """Parse damage string and return maximum possible damage"""
        if not damage_str or damage_str == '':
            return 0

        # Handle variable damage (e.g., "30×", "10×")
        if '×' in damage_str:
            base_damage = damage_str.replace('×', '').strip()
            try:
                base = int(base_damage)
                # Check effect description for specific multipliers
                effect_lower = effect_str.lower()

                # Energy-based damage (e.g., discard deck cards for energy count)
                if '能量' in effect_str or 'energy' in effect_lower:
                    # Look for numbers in the effect that indicate maximum cards/energy
                    import re
                    numbers = re.findall(r'\d+', effect_str)
                    if numbers:
                        # Use the largest number found as potential maximum
                        max_count = max(int(num) for num in numbers)
                        return base * max_count
                    else:
                        # Default to 4 energy if no specific number
                        return base * 4

                # Coin flip damage
                elif '擲' in effect_str or '硬幣' in effect_str or 'coin' in effect_lower:
                    # Assume 3 flips max for most cases
                    return base * 3

                else:
                    # Other variable damage - assume 2x multiplier
                    return base * 2
            except ValueError:
                return 0

        # Handle plus damage (e.g., "30+")
        if '+' in damage_str:
            base_damage = damage_str.replace('+', '').strip()
            try:
                base = int(base_damage)
                # Assume maximum bonus (e.g., coin flip success)
                return base + 50  # Conservative estimate
            except ValueError:
                return 0

        # Handle regular numeric damage
        try:
            return int(damage_str)
        except ValueError:
            return 0

    def calculate_rarity_modifier(self, rarity: str) -> float:
        """Apply rarity-based multiplier"""
        return self.rarity_multipliers.get(rarity.lower(), 1.0)

    def rate_card(self, card_data: Dict[str, str]) -> Tuple[str, float, Dict[str, float]]:
        """
        Rate a single card and return tier, score, and breakdown
        """
        # Calculate individual score components
        base_score = self.calculate_base_score(card_data)
        meta_score = self.calculate_meta_score(card_data.get('Name', ''))
        expansion_score = self.calculate_expansion_score(card_data.get('ExpansionCode', ''))
        function_score = self.calculate_function_score(card_data)
        synergy_score = self.calculate_synergy_score(card_data)
        effect_score = self.calculate_effect_score(card_data)
        damage_score = self.calculate_damage_score(card_data)
        rarity_modifier = self.calculate_rarity_modifier(card_data.get('Rarity', ''))

        # Calculate total score (include effect_score and damage_score)
        raw_score = base_score + meta_score + expansion_score + function_score + synergy_score + effect_score + damage_score
        final_score = raw_score * rarity_modifier

        # Determine tier based on final score
        if final_score >= 26:
            tier = 'S+'
        elif final_score >= 23:
            tier = 'S'
        elif final_score >= 20:
            tier = 'A+'
        elif final_score >= 17:
            tier = 'A'
        elif final_score >= 14:
            tier = 'B+'
        elif final_score >= 11:
            tier = 'B'
        elif final_score >= 9:
            tier = 'C+'
        elif final_score >= 7:
            tier = 'C'
        else:
            tier = 'D'

        # Score breakdown for analysis
        breakdown = {
            'base_score': base_score,
            'meta_score': meta_score,
            'expansion_score': expansion_score,
            'function_score': function_score,
            'synergy_score': synergy_score,
            'effect_score': effect_score,
            'damage_score': damage_score,
            'rarity_modifier': rarity_modifier,
            'final_score': final_score
        }

        return tier, final_score, breakdown

    def rate_csv(self, input_file: str, output_file: str) -> None:
        """Process entire CSV file and add ratings"""
        with open(input_file, 'r', encoding='utf-8-sig', newline='') as infile:
            reader = csv.DictReader(infile)
            fieldnames = list(reader.fieldnames) + ['Tier', 'Score', 'ScoreBreakdown', 'PrimaryEffectType', 'SpecialEffectType']

            with open(output_file, 'w', encoding='utf-8-sig', newline='') as outfile:
                writer = csv.DictWriter(outfile, fieldnames=fieldnames)
                writer.writeheader()

                tier_counts = {}
                total_cards = 0

                for row in reader:
                    tier, score, breakdown = self.rate_card(row)

                    # Classify effects
                    primary_effect, special_effect = self.classify_card_effects(row)

                    # Add rating data to row
                    row['Tier'] = tier
                    row['Score'] = f"{score:.2f}"
                    row['ScoreBreakdown'] = f"Base:{breakdown['base_score']:.1f}|Meta:{breakdown['meta_score']:.1f}|Exp:{breakdown['expansion_score']:.1f}|Func:{breakdown['function_score']:.1f}|Syn:{breakdown['synergy_score']:.1f}|Eff:{breakdown['effect_score']:.1f}|Dmg:{breakdown['damage_score']:.1f}|Mod:{breakdown['rarity_modifier']:.2f}"
                    row['PrimaryEffectType'] = primary_effect
                    row['SpecialEffectType'] = special_effect

                    writer.writerow(row)

                    # Track statistics
                    tier_counts[tier] = tier_counts.get(tier, 0) + 1
                    total_cards += 1

                # Print summary statistics
                print(f"\n=== PTCG Card Rating Summary ===")
                print(f"Total cards processed: {total_cards}")
                print(f"Output file: {output_file}")
                print("\nTier Distribution:")
                for tier in ['S+', 'S', 'A+', 'A', 'B+', 'B', 'C+', 'C', 'D']:
                    count = tier_counts.get(tier, 0)
                    percentage = (count / total_cards * 100) if total_cards > 0 else 0
                    print(f"  {tier}: {count:4d} cards ({percentage:5.1f}%)")

    def process_full_pipeline(self, input_file: str, merged_file: str, rated_file: str) -> None:
        """Run the complete pipeline: merge -> rate"""
        print("🚀 Starting PTCG Card Database Processing Pipeline")
        print("=" * 60)

        # Step 1: Smart merge
        print("\n📋 Step 1: Smart Card Merging")
        self.smart_merge_cards(input_file, merged_file)

        # Step 2: Rating
        print("\n⭐ Step 2: Card Rating System")
        self.rate_csv(merged_file, rated_file)

        print("\n🎉 Pipeline Complete!")
        print(f"📁 Merged file: {merged_file}")
        print(f"📁 Rated file: {rated_file}")


def main():
    """Main execution function with command-line interface"""
    parser = argparse.ArgumentParser(
        description='PTCG Card Database Processor - Merge and Rating System',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python ptcg_processor.py merge input.csv output.csv
  python ptcg_processor.py rate input.csv output.csv
  python ptcg_processor.py pipeline input.csv merged.csv rated.csv
        """
    )

    parser.add_argument('operation', choices=['merge', 'rate', 'pipeline'],
                       help='Operation to perform')
    parser.add_argument('input_file', help='Input CSV file')
    parser.add_argument('output_file', help='Output CSV file')
    parser.add_argument('--merged_file', help='Intermediate merged file (for pipeline only)')

    args = parser.parse_args()

    # Initialize the processor
    processor = PTCGCardProcessor()

    try:
        if args.operation == 'merge':
            print("🔄 Starting Smart Card Merging...")
            processor.smart_merge_cards(args.input_file, args.output_file)

        elif args.operation == 'rate':
            print("⭐ Starting Card Rating System...")
            processor.rate_csv(args.input_file, args.output_file)

        elif args.operation == 'pipeline':
            if not args.merged_file:
                print("❌ Error: --merged_file is required for pipeline operation")
                sys.exit(1)
            processor.process_full_pipeline(args.input_file, args.merged_file, args.output_file)

    except FileNotFoundError as e:
        print(f"❌ Error: Could not find file - {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main()