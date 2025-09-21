#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PTCG Skill Effect Keyword Analysis
Comprehensive analysis of all skill effects to identify patterns and keywords
"""

import csv
from collections import defaultdict, Counter
import re
from typing import Dict, List, Set

class SkillEffectAnalyzer:
    def __init__(self):
        self.effect_keywords = defaultdict(int)
        self.effect_patterns = defaultdict(int)
        self.effect_sentences = []
        self.effect_length_stats = defaultdict(int)
        self.condition_keywords = defaultdict(int)
        self.action_keywords = defaultdict(int)
        self.target_keywords = defaultdict(int)
        self.quantity_keywords = defaultdict(int)

        # New classification categories
        self.complexity_classes = defaultdict(int)
        self.strategic_impact = defaultdict(int)
        self.resource_management = defaultdict(int)
        self.timing_classes = defaultdict(int)
        self.synergy_potential = defaultdict(int)
        self.meta_relevance = defaultdict(int)
        self.common_effects = defaultdict(int)  # New: Common effect categories

        # Comprehensive Chinese PTCG keywords for effects
        self.effect_keywords_list = [
            # Basic actions
            '造成', '給予', '受到', '恢復', '回復', '治療', '攻擊', '防禦', '守護',
            '丟棄', '丟到棄牌區', '放回', '重洗', '抽取', '抽出', '加入', '放置',
            '選擇', '選出', '挑選', '任意', '任一', '所有', '每個', '這隻', '那隻',
            '對手', '自己', '場上', '備戰區', '手牌', '牌庫', '棄牌區', '獎賞卡',

            # Conditions and modifiers
            '如果', '若', '當', '每當', '只要', '不會', '不能', '可以', '必須',
            '可能', '可', '無法', '只有', '除了', '根據', '增加', '減少', '變成',
            '變為', '成為', '獲得', '失去', '附上', '附加', '移除', '交換',

            # Quantities and numbers
            '1張', '2張', '3張', '4張', '5張', '6張', '7張', '最多', '至少',
            '1個', '2個', '3個', '4個', '1隻', '2隻', '3隻',

            # Special mechanics
            '硬幣', '擲', '正面', '反面', '傷害', 'HP', '能力', '特性', '道具',
            '競技場', '競技場卡', 'GX', 'VMAX', 'VSTAR', 'EX', '太晶', '進化',
            '撤退', '切換', '互換', '逃走', '逃脫',

            # Status conditions
            '中毒', '燃燒', '麻痺', '睡眠', '混亂', '狀態', '效果',

            # Energy related
            '能量', '基本', '特殊', '無色', '火', '水', '雷', '草', '超', '斗', '暗', '鋼', '妖', '龍'
        ]

    def load_card_data(self, csv_file: str):

        # Comprehensive Chinese PTCG keywords for effects
        self.effect_keywords_list = [
            # Basic actions
            '造成', '給予', '受到', '恢復', '回復', '治療', '攻擊', '防禦', '守護',
            '丟棄', '丟到棄牌區', '放回', '重洗', '抽取', '抽出', '加入', '放置',
            '選擇', '選出', '挑選', '任意', '任一', '所有', '每個', '這隻', '那隻',
            '對手', '自己', '場上', '備戰區', '手牌', '牌庫', '棄牌區', '獎賞卡',

            # Conditions and modifiers
            '如果', '若', '當', '每當', '只要', '不會', '不能', '可以', '必須',
            '可能', '可', '無法', '只有', '除了', '根據', '增加', '減少', '變成',
            '變為', '成為', '獲得', '失去', '附上', '附加', '移除', '交換',

            # Quantities and numbers
            '1張', '2張', '3張', '4張', '5張', '6張', '7張', '最多', '至少',
            '1個', '2個', '3個', '4個', '1隻', '2隻', '3隻',

            # Special mechanics
            '硬幣', '擲', '正面', '反面', '傷害', 'HP', '能力', '特性', '道具',
            '競技場', '競技場卡', 'GX', 'VMAX', 'VSTAR', 'EX', '太晶', '進化',
            '撤退', '切換', '互換', '逃走', '逃脫',

            # Status conditions
            '中毒', '燃燒', '麻痺', '睡眠', '混亂', '狀態', '效果',

            # Energy related
            '能量', '基本', '特殊', '無色', '火', '水', '雷', '草', '超', '斗', '暗', '鋼', '妖', '龍'
        ]

    def load_card_data(self, csv_file: str):
        """Load card data from CSV file with proper encoding"""
        print(f"Loading card data from {csv_file}...")

        with open(csv_file, 'r', encoding='utf-8-sig') as file:
            reader = csv.DictReader(file)

            for row in reader:
                self.analyze_skill_effects(row)

        print(f"Analyzed {len(self.effect_sentences)} skill effects")

    def analyze_skill_effects(self, card_row: Dict):
        """Analyze skill effects from a single card"""
        # Analyze Skill 1 Effect
        if card_row.get('Skill1Effect') and card_row['Skill1Effect'].strip():
            self.analyze_single_effect(card_row['Skill1Effect'].strip())

        # Analyze Skill 2 Effect
        if card_row.get('Skill2Effect') and card_row['Skill2Effect'].strip():
            self.analyze_single_effect(card_row['Skill2Effect'].strip())

    def analyze_single_effect(self, effect: str):
        """Analyze a single skill effect"""
        if not effect or effect in ['[物品規則]', '[支援者規則]', '[寶可夢道具規則]', '[ex規則]']:
            return

        # Store the full effect
        self.effect_sentences.append(effect)

        # Analyze effect length
        length = len(effect)
        if length <= 20:
            self.effect_length_stats["Very Short (≤20字)"] += 1
        elif length <= 50:
            self.effect_length_stats["Short (21-50字)"] += 1
        elif length <= 100:
            self.effect_length_stats["Medium (51-100字)"] += 1
        elif length <= 200:
            self.effect_length_stats["Long (101-200字)"] += 1
        else:
            self.effect_length_stats["Very Long (200+字)"] += 1

        # Count keywords
        for keyword in self.effect_keywords_list:
            if keyword in effect:
                self.effect_keywords[keyword] += 1

        # Analyze effect patterns
        self.analyze_effect_patterns(effect)

        # Analyze conditions
        self.analyze_conditions(effect)

        # Analyze actions
        self.analyze_actions(effect)

        # Analyze targets
        self.analyze_targets(effect)

        # Analyze quantities
        self.analyze_quantities(effect)

        # New classifications
        self.classify_complexity(effect)
        self.classify_strategic_impact(effect)
        self.classify_resource_management(effect)
        self.classify_timing(effect)
        self.classify_synergy_potential(effect)
        self.classify_meta_relevance(effect)
        self.classify_common_effects(effect)  # New: Common effects classification

    def analyze_effect_patterns(self, effect: str):
        """Analyze common effect patterns"""
        # Damage patterns
        if '造成' in effect and '傷害' in effect:
            self.effect_patterns['造成傷害'] += 1
        if '受到' in effect and '傷害' in effect:
            self.effect_patterns['受到傷害'] += 1
        if '增加' in effect and '傷害' in effect:
            self.effect_patterns['增加傷害'] += 1

        # Resource manipulation
        if '抽' in effect and ('牌' in effect or '張' in effect):
            self.effect_patterns['抽牌'] += 1
        if '丟棄' in effect or '丟到棄牌區' in effect:
            self.effect_patterns['棄牌'] += 1
        if '放回' in effect and '牌庫' in effect:
            self.effect_patterns['放回牌庫'] += 1
        if '重洗' in effect:
            self.effect_patterns['重洗牌庫'] += 1

        # Pokemon manipulation
        if '放置' in effect and '備戰區' in effect:
            self.effect_patterns['放置備戰區'] += 1
        if '加入' in effect and '手牌' in effect:
            self.effect_patterns['加入手牌'] += 1
        if '切換' in effect or '互換' in effect:
            self.effect_patterns['寶可夢切換'] += 1

        # Energy manipulation
        if '附' in effect and '能量' in effect:
            self.effect_patterns['附加能量'] += 1
        if '移除' in effect and '能量' in effect:
            self.effect_patterns['移除能量'] += 1

        # Status conditions
        if '中毒' in effect:
            self.effect_patterns['造成中毒'] += 1
        if '燃燒' in effect:
            self.effect_patterns['造成燃燒'] += 1
        if '麻痺' in effect:
            self.effect_patterns['造成麻痺'] += 1
        if '睡眠' in effect:
            self.effect_patterns['造成睡眠'] += 1
        if '混亂' in effect:
            self.effect_patterns['造成混亂'] += 1

        # Coin flips
        if '硬幣' in effect and '擲' in effect:
            self.effect_patterns['擲硬幣'] += 1
        if '正面' in effect:
            self.effect_patterns['正面效果'] += 1
        if '反面' in effect:
            self.effect_patterns['反面效果'] += 1

        # Special mechanics
        if 'GX' in effect.upper():
            self.effect_patterns['GX技能'] += 1
        if 'VMAX' in effect.upper():
            self.effect_patterns['VMAX技能'] += 1
        if 'VSTAR' in effect.upper():
            self.effect_patterns['VSTAR技能'] += 1
        if '太晶' in effect:
            self.effect_patterns['太晶技能'] += 1

    def analyze_conditions(self, effect: str):
        """Analyze conditional keywords"""
        conditions = ['如果', '若', '當', '每當', '只要', '只有', '根據', '不會', '不能']
        for condition in conditions:
            if condition in effect:
                self.condition_keywords[condition] += 1

    def analyze_actions(self, effect: str):
        """Analyze action keywords"""
        actions = ['造成', '給予', '受到', '恢復', '丟棄', '抽出', '放置', '選擇', '附上', '移除', '增加', '減少']
        for action in actions:
            if action in effect:
                self.action_keywords[action] += 1

    def analyze_targets(self, effect: str):
        """Analyze target keywords"""
        targets = ['對手', '自己', '這隻', '那隻', '場上', '備戰區', '手牌', '牌庫', '棄牌區', '獎賞卡']
        for target in targets:
            if target in effect:
                self.target_keywords[target] += 1

    def analyze_quantities(self, effect: str):
        """Analyze quantity keywords"""
        quantities = ['1張', '2張', '3張', '4張', '1個', '2個', '3個', '4個', '1隻', '2隻', '最多', '至少', '所有', '每個']
        for quantity in quantities:
            if quantity in effect:
                self.quantity_keywords[quantity] += 1

    def classify_complexity(self, effect: str):
        """Classify effect complexity based on multiple factors"""
        length = len(effect)
        keyword_count = sum(1 for keyword in self.effect_keywords_list if keyword in effect)
        condition_count = sum(1 for cond in ['如果', '若', '當', '每當', '只要'] if cond in effect)
        has_special_mechanics = any(mech in effect.upper() for mech in ['GX', 'VMAX', 'VSTAR', '太晶'])

        # Complexity scoring
        complexity_score = 0
        complexity_score += min(length / 20, 5)  # Length factor (max 5 points)
        complexity_score += min(keyword_count / 3, 3)  # Keyword density (max 3 points)
        complexity_score += condition_count * 2  # Conditions (2 points each)
        complexity_score += 2 if has_special_mechanics else 0  # Special mechanics bonus

        if complexity_score <= 3:
            self.complexity_classes['簡單效果'] += 1
        elif complexity_score <= 7:
            self.complexity_classes['中等效果'] += 1
        elif complexity_score <= 12:
            self.complexity_classes['複雜效果'] += 1
        else:
            self.complexity_classes['極複雜效果'] += 1

    def classify_strategic_impact(self, effect: str):
        """Classify strategic impact of effects"""
        # Game-changing effects
        if any(word in effect for word in ['無法', '不會', '不能', '只有']):
            self.strategic_impact['限制性效果'] += 1
        elif any(word in effect for word in ['所有', '每個', '任意']):
            self.strategic_impact['廣域效果'] += 1
        elif 'GX' in effect.upper() or 'VMAX' in effect.upper() or 'VSTAR' in effect.upper():
            self.strategic_impact['特殊機制'] += 1
        elif any(word in effect for word in ['太晶', '進化']):
            self.strategic_impact['進化相關'] += 1
        elif any(word in effect for word in ['抽取', '抽出']) and any(word in effect for word in ['4', '5', '6']):
            self.strategic_impact['資源爆發'] += 1
        elif any(word in effect for word in ['丟棄']) and '對手' in effect:
            self.strategic_impact['干擾效果'] += 1
        else:
            self.strategic_impact['一般效果'] += 1

    def classify_resource_management(self, effect: str):
        """Classify resource management aspects"""
        if any(word in effect for word in ['抽取', '抽出', '加入', '手牌']):
            if any(num in effect for num in ['4', '5', '6']):
                self.resource_management['資源獲取(大量)'] += 1
            else:
                self.resource_management['資源獲取(少量)'] += 1
        elif any(word in effect for word in ['丟棄', '丟到棄牌區']) and '對手' in effect:
            self.resource_management['資源破壞'] += 1
        elif any(word in effect for word in ['放回', '重洗']) and '牌庫' in effect:
            self.resource_management['資源回收'] += 1
        elif any(word in effect for word in ['附上', '附加', '移除']) and '能量' in effect:
            self.resource_management['能量操作'] += 1
        elif any(word in effect for word in ['放置', '備戰區']):
            self.resource_management['場上操作'] += 1
        else:
            self.resource_management['其他操作'] += 1

    def classify_timing(self, effect: str):
        """Classify effect timing"""
        if any(word in effect for word in ['每當', '當', '每回合']):
            self.timing_classes['觸發時機'] += 1
        elif any(word in effect for word in ['只要', '持續']):
            self.timing_classes['持續效果'] += 1
        elif any(word in effect for word in ['在自己的回合', '在對手的回合']):
            self.timing_classes['回合限定'] += 1
        elif any(word in effect for word in ['如果', '若']):
            self.timing_classes['條件觸發'] += 1
        elif any(word in effect for word in ['下個', '下回']):
            self.timing_classes['延遲效果'] += 1
        else:
            self.timing_classes['即時效果'] += 1

    def classify_synergy_potential(self, effect: str):
        """Classify synergy potential with other cards"""
        synergy_indicators = 0

        # Check for combo potential
        if any(word in effect for word in ['進化', '太晶']):
            synergy_indicators += 2
        if any(word in effect for word in ['特性', '道具']):
            synergy_indicators += 1
        if any(word in effect for word in ['GX', 'VMAX', 'VSTAR']):
            synergy_indicators += 2
        if any(word in effect for word in ['能量']) and any(word in effect for word in ['附上', '附加']):
            synergy_indicators += 1
        if any(word in effect for word in ['抽取']) and any(word in effect for word in ['特定', '這張']):
            synergy_indicators += 1

        if synergy_indicators >= 3:
            self.synergy_potential['高協同性'] += 1
        elif synergy_indicators >= 2:
            self.synergy_potential['中等協同性'] += 1
        elif synergy_indicators >= 1:
            self.synergy_potential['低協同性'] += 1
        else:
            self.synergy_potential['獨立效果'] += 1

    def classify_meta_relevance(self, effect: str):
        """Classify meta relevance based on tournament impact"""
        # High impact effects
        if any(phrase in effect for phrase in ['無法使用', '不能放置', '不會受到']):
            self.meta_relevance['核心限制'] += 1
        elif any(phrase in effect for phrase in ['抽取4張', '抽取5張', '抽取6張']):
            self.meta_relevance['資源引擎'] += 1
        elif 'GX' in effect.upper() or 'VMAX' in effect.upper():
            self.meta_relevance['競技焦點'] += 1
        elif any(phrase in effect for phrase in ['所有對手', '每隻對手']):
            self.meta_relevance['廣域控制'] += 1
        elif any(phrase in effect for phrase in ['太晶', '進化']) and any(phrase in effect for phrase in ['增加', '變成']):
            self.meta_relevance['進化強化'] += 1
        elif any(phrase in effect for phrase in ['硬幣']) and any(phrase in effect for phrase in ['正面']):
            self.meta_relevance['賭博機制'] += 1
        else:
            self.meta_relevance['一般效果'] += 1

    def classify_common_effects(self, effect: str):
        """Classify common effect types based on typical PTCG mechanics"""
        # Drawing effects
        if any(word in effect for word in ['抽取', '抽出', '加入手牌']) and '牌庫' in effect:
            if any(num in effect for num in ['4', '5', '6']):
                self.common_effects['大量抽卡'] += 1
            else:
                self.common_effects['抽卡效果'] += 1

        # Damage effects
        elif any(word in effect for word in ['造成', '給予']) and '傷害' in effect:
            self.common_effects['傷害效果'] += 1

        # Status effects
        elif any(word in effect for word in ['中毒', '燃燒', '麻痺', '睡眠', '混亂']):
            self.common_effects['狀態異常'] += 1

        # Energy effects
        elif any(word in effect for word in ['附上', '附加', '移除']) and '能量' in effect:
            self.common_effects['能量操作'] += 1

        # Search effects
        elif any(word in effect for word in ['從', '選擇']) and any(word in effect for word in ['牌庫', '棄牌區']):
            self.common_effects['搜索效果'] += 1

        # Recovery effects
        elif any(word in effect for word in ['恢復', '回復']) and any(word in effect for word in ['HP', '傷害']):
            self.common_effects['回復效果'] += 1

        # Placement effects
        elif '放置' in effect and any(word in effect for word in ['備戰區', '場上']):
            self.common_effects['放置效果'] += 1

        # Discard effects
        elif '丟棄' in effect and '對手' in effect:
            self.common_effects['丟棄效果'] += 1

        # Coin flip effects
        elif '硬幣' in effect and '擲' in effect:
            self.common_effects['硬幣判定'] += 1

        # Evolution effects
        elif any(word in effect for word in ['進化', '太晶']):
            self.common_effects['進化效果'] += 1

        # Special condition effects
        elif any(word in effect for word in ['特殊狀態', '狀態']) and any(word in effect for word in ['不會', '不能', '無法']):
            self.common_effects['狀態免疫'] += 1

        # Retreat effects
        elif '撤退' in effect:
            self.common_effects['撤退效果'] += 1

        # Switch effects
        elif any(word in effect for word in ['切換', '互換']):
            self.common_effects['切換效果'] += 1

        # Attack prevention
        elif any(word in effect for word in ['不會受到', '無法使用']) and '傷害' in effect:
            self.common_effects['傷害防禦'] += 1

        # Card advantage effects
        elif any(word in effect for word in ['從手牌', '從牌庫']) and any(word in effect for word in ['丟棄', '放回']):
            self.common_effects['卡牌操作'] += 1

        # Special mechanics
        elif any(word in effect.upper() for word in ['GX', 'VMAX', 'VSTAR']):
            self.common_effects['特殊機制'] += 1

        # Item effects (common item card effects)
        elif any(word in effect for word in ['在自己的回合時，物品', '物品卡']):
            self.common_effects['物品效果'] += 1

        # Supporter effects
        elif any(word in effect for word in ['在自己的回合時，支援', '支援者']):
            self.common_effects['支援者效果'] += 1

        # Stadium effects
        elif '競技場' in effect:
            self.common_effects['競技場效果'] += 1

        # Ability effects
        elif '特性' in effect:
            self.common_effects['特性效果'] += 1

        # Other effects
        else:
            self.common_effects['其他效果'] += 1

    def print_comprehensive_analysis(self):
        """Print comprehensive analysis results"""
        print("🎴 PTCG 技能效果關鍵字深度分析報告")
        print("=" * 70)
        print()

        # Basic statistics
        print("📊 基本統計")
        print("-" * 20)
        print(f"   • 總效果數量: {len(self.effect_sentences):,}")
        print(f"   • 關鍵字種類: {len(self.effect_keywords):,}")
        print(f"   • 總關鍵字出現次數: {sum(self.effect_keywords.values()):,}")
        print()

        # Effect length distribution
        print("📏 效果長度分佈")
        print("-" * 25)
        for length_range, count in sorted(self.effect_length_stats.items(), key=lambda x: x[1], reverse=True):
            percentage = (count / len(self.effect_sentences)) * 100
            print("6.1f")
        print()

        # Top keywords
        print("🔍 最常見關鍵字 (前30名)")
        print("-" * 35)
        for keyword, count in sorted(self.effect_keywords.items(), key=lambda x: x[1], reverse=True)[:30]:
            percentage = (count / len(self.effect_sentences)) * 100
            print("6.1f")
        print()

        # Effect patterns analysis
        print("🎯 效果模式分析")
        print("-" * 25)
        pattern_descriptions = {
            '造成傷害': '傷害輸出',
            '受到傷害': '傷害承受',
            '增加傷害': '傷害增幅',
            '抽牌': '資源獲取',
            '棄牌': '資源棄置',
            '放回牌庫': '資源回收',
            '重洗牌庫': '牌庫重組',
            '放置備戰區': '備戰區操作',
            '加入手牌': '手牌增加',
            '寶可夢切換': '位置交換',
            '附加能量': '能量附著',
            '移除能量': '能量脫離',
            '造成中毒': '狀態異常',
            '造成燃燒': '狀態異常',
            '造成麻痺': '狀態異常',
            '造成睡眠': '狀態異常',
            '造成混亂': '狀態異常',
            '擲硬幣': '隨機判定',
            '正面效果': '成功結果',
            '反面效果': '失敗結果',
            'GX技能': '特殊機制',
            'VMAX技能': '特殊機制',
            'VSTAR技能': '特殊機制',
            '太晶技能': '特殊機制'
        }

        for pattern, count in sorted(self.effect_patterns.items(), key=lambda x: x[1], reverse=True):
            if count > 0:
                description = pattern_descriptions.get(pattern, pattern)
                percentage = (count / len(self.effect_sentences)) * 100
                print("6.1f")
        print()

        # Conditional analysis
        print("⚡ 條件關鍵字分析")
        print("-" * 25)
        for condition, count in sorted(self.condition_keywords.items(), key=lambda x: x[1], reverse=True):
            if count > 0:
                percentage = (count / len(self.effect_sentences)) * 100
                print("6.1f")
        print()

        # Action analysis
        print("🎲 動作關鍵字分析")
        print("-" * 25)
        for action, count in sorted(self.action_keywords.items(), key=lambda x: x[1], reverse=True):
            if count > 0:
                percentage = (count / len(self.effect_sentences)) * 100
                print("6.1f")
        print()

        # Target analysis
        print("🎯 目標關鍵字分析")
        print("-" * 25)
        for target, count in sorted(self.target_keywords.items(), key=lambda x: x[1], reverse=True):
            if count > 0:
                percentage = (count / len(self.effect_sentences)) * 100
                print("6.1f")
        print()

        # Quantity analysis
        print("🔢 數量關鍵字分析")
        print("-" * 25)
        for quantity, count in sorted(self.quantity_keywords.items(), key=lambda x: x[1], reverse=True):
            if count > 0:
                percentage = (count / len(self.effect_sentences)) * 100
                print("6.1f")
        print()

        # New classifications
        self.print_new_classifications()

        # Most complex effects
        print("🧠 最複雜的效果 (前5名)")
        print("-" * 30)
        sorted_effects = sorted(self.effect_sentences, key=len, reverse=True)
        for i, effect in enumerate(sorted_effects[:5], 1):
            print(f"{i}. ({len(effect)}字) {effect[:100]}{'...' if len(effect) > 100 else ''}")
        print()

        # Most common effect starters
        print("🚀 最常見的效果開頭")
        print("-" * 25)
        starters = defaultdict(int)
        for effect in self.effect_sentences:
            if len(effect) > 5:
                starter = effect[:10]  # First 10 characters
                starters[starter] += 1

        for starter, count in sorted(starters.items(), key=lambda x: x[1], reverse=True)[:10]:
            print(f"   • '{starter}...' : {count} 次")
        print()

    def print_new_classifications(self):
        """Print new classification categories"""
        # Complexity classification
        print("🧩 效果複雜度分類")
        print("-" * 25)
        for complexity, count in sorted(self.complexity_classes.items(), key=lambda x: x[1], reverse=True):
            percentage = (count / len(self.effect_sentences)) * 100
            print("6.1f")
        print()

        # Strategic impact
        print("⚔️ 策略影響分類")
        print("-" * 25)
        for impact, count in sorted(self.strategic_impact.items(), key=lambda x: x[1], reverse=True):
            percentage = (count / len(self.effect_sentences)) * 100
            print("6.1f")
        print()

        # Resource management
        print("💰 資源管理分類")
        print("-" * 25)
        for resource, count in sorted(self.resource_management.items(), key=lambda x: x[1], reverse=True):
            percentage = (count / len(self.effect_sentences)) * 100
            print("6.1f")
        print()

        # Timing classification
        print("⏰ 時機分類")
        print("-" * 25)
        for timing, count in sorted(self.timing_classes.items(), key=lambda x: x[1], reverse=True):
            percentage = (count / len(self.effect_sentences)) * 100
            print("6.1f")
        print()

        # Synergy potential
        print("🤝 協同性分類")
        print("-" * 25)
        for synergy, count in sorted(self.synergy_potential.items(), key=lambda x: x[1], reverse=True):
            percentage = (count / len(self.effect_sentences)) * 100
            print("6.1f")
        print()

        # Meta relevance
        print("🏆 競技相關性分類")
        print("-" * 25)
        for meta, count in sorted(self.meta_relevance.items(), key=lambda x: x[1], reverse=True):
            percentage = (count / len(self.effect_sentences)) * 100
            print("6.1f")
        print()

        # Common effects
        print("🎯 常見效果分類")
        print("-" * 25)
        for effect_type, count in sorted(self.common_effects.items(), key=lambda x: x[1], reverse=True):
            percentage = (count / len(self.effect_sentences)) * 100
            print("6.1f")
        print()

    def export_detailed_analysis(self):
        """Export detailed analysis to CSV files"""
        # Export effect keywords
        with open('skill_effect_keywords_detailed.csv', 'w', newline='', encoding='utf-8-sig') as file:
            writer = csv.writer(file)
            writer.writerow(['Keyword', 'Frequency', 'Percentage'])
            total_effects = len(self.effect_sentences)
            for keyword, count in sorted(self.effect_keywords.items(), key=lambda x: x[1], reverse=True):
                percentage = (count / total_effects) * 100
                writer.writerow([keyword, count, ".2f"])

        # Export effect patterns
        with open('skill_effect_patterns_detailed.csv', 'w', newline='', encoding='utf-8-sig') as file:
            writer = csv.writer(file)
            writer.writerow(['Pattern', 'Frequency', 'Description'])
            pattern_descriptions = {
                '造成傷害': '傷害輸出', '受到傷害': '傷害承受', '增加傷害': '傷害增幅',
                '抽牌': '資源獲取', '棄牌': '資源棄置', '放回牌庫': '資源回收',
                '重洗牌庫': '牌庫重組', '放置備戰區': '備戰區操作', '加入手牌': '手牌增加',
                '寶可夢切換': '位置交換', '附加能量': '能量附著', '移除能量': '能量脫離',
                '造成中毒': '狀態異常', '造成燃燒': '狀態異常', '造成麻痺': '狀態異常',
                '造成睡眠': '狀態異常', '造成混亂': '狀態異常', '擲硬幣': '隨機判定',
                '正面效果': '成功結果', '反面效果': '失敗結果', 'GX技能': '特殊機制',
                'VMAX技能': '特殊機制', 'VSTAR技能': '特殊機制', '太晶技能': '特殊機制'
            }

            for pattern, count in sorted(self.effect_patterns.items(), key=lambda x: x[1], reverse=True):
                description = pattern_descriptions.get(pattern, pattern)
                writer.writerow([pattern, count, description])

        # Export sample effects
        with open('skill_effect_samples.csv', 'w', newline='', encoding='utf-8-sig') as file:
            writer = csv.writer(file)
            writer.writerow(['Effect Text', 'Length', 'Complexity'])
            for effect in self.effect_sentences[:1000]:  # Sample first 1000
                length = len(effect)
                if length <= 50:
                    complexity = '簡單'
                elif length <= 100:
                    complexity = '中等'
                else:
                    complexity = '複雜'
                writer.writerow([effect, length, complexity])

        # Export new classifications
        self.export_new_classifications()

        print("📁 詳細分析已匯出至 CSV 文件:")
        print("   • skill_effect_keywords_detailed.csv - 關鍵字統計")
        print("   • skill_effect_patterns_detailed.csv - 效果模式分析")
        print("   • skill_effect_samples.csv - 效果樣本")
        print("   • skill_effect_classifications.csv - 新增分類統計")

    def export_new_classifications(self):
        """Export new classification data to CSV"""
        with open('skill_effect_classifications.csv', 'w', newline='', encoding='utf-8-sig') as file:
            writer = csv.writer(file)
            writer.writerow(['分類類型', '子分類', '數量', '百分比'])

            # Complexity classifications
            writer.writerow(['複雜度分類', '', '', ''])
            for complexity, count in sorted(self.complexity_classes.items(), key=lambda x: x[1], reverse=True):
                percentage = (count / len(self.effect_sentences)) * 100
                writer.writerow(['', complexity, count, ".2f"])

            # Strategic impact
            writer.writerow(['策略影響分類', '', '', ''])
            for impact, count in sorted(self.strategic_impact.items(), key=lambda x: x[1], reverse=True):
                percentage = (count / len(self.effect_sentences)) * 100
                writer.writerow(['', impact, count, ".2f"])

            # Resource management
            writer.writerow(['資源管理分類', '', '', ''])
            for resource, count in sorted(self.resource_management.items(), key=lambda x: x[1], reverse=True):
                percentage = (count / len(self.effect_sentences)) * 100
                writer.writerow(['', resource, count, ".2f"])

            # Timing classification
            writer.writerow(['時機分類', '', '', ''])
            for timing, count in sorted(self.timing_classes.items(), key=lambda x: x[1], reverse=True):
                percentage = (count / len(self.effect_sentences)) * 100
                writer.writerow(['', timing, count, ".2f"])

            # Synergy potential
            writer.writerow(['協同性分類', '', '', ''])
            for synergy, count in sorted(self.synergy_potential.items(), key=lambda x: x[1], reverse=True):
                percentage = (count / len(self.effect_sentences)) * 100
                writer.writerow(['', synergy, count, ".2f"])

            # Meta relevance
            writer.writerow(['競技相關性分類', '', '', ''])
            for meta, count in sorted(self.meta_relevance.items(), key=lambda x: x[1], reverse=True):
                percentage = (count / len(self.effect_sentences)) * 100
                writer.writerow(['', meta, count, ".2f"])

            # Common effects
            writer.writerow(['常見效果分類', '', '', ''])
            for effect_type, count in sorted(self.common_effects.items(), key=lambda x: x[1], reverse=True):
                percentage = (count / len(self.effect_sentences)) * 100
                writer.writerow(['', effect_type, count, ".2f"])

def main():
    analyzer = SkillEffectAnalyzer()

    # Analyze the main card database
    csv_file = 'scripts/cards_output_all_mega.csv'
    analyzer.load_card_data(csv_file)

    # Print comprehensive analysis
    analyzer.print_comprehensive_analysis()

    # Export detailed data
    analyzer.export_detailed_analysis()

    print("✅ 技能效果關鍵字深度分析完成！")

if __name__ == "__main__":
    main()