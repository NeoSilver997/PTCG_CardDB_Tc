#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PTCG Skill Keyword Analysis
Analyzes all skill names and effects to identify common keywords and patterns
"""

import csv
from collections import defaultdict, Counter
import re
from typing import Dict, List, Set

class SkillKeywordAnalyzer:
    def __init__(self):
        self.skill_keywords = defaultdict(int)
        self.skill_effects = defaultdict(int)
        self.skill_names = defaultdict(int)
        self.energy_costs = defaultdict(int)
        self.damage_patterns = defaultdict(int)
        self.effect_keywords = defaultdict(int)

        # Common PTCG keywords to look for
        self.common_keywords = {
            'GX', 'VMAX', 'VSTAR', 'EX', 'ACE SPEC',
            'TAG TEAM', 'BREAK', 'TURBO', 'MEGA', 'PRIMAL',
            'ABILITY', 'POKé-BODY', 'POKé-POWER',
            'KNOCK OUT', 'DISCARD', 'DRAW', 'SEARCH', 'SHUFFLE',
            'SWITCH', 'RETREAT', 'EVOLVE', 'ATTACH', 'DETACH',
            'FLIP', 'COIN', 'DICE', 'ROLL',
            'BENCH', 'ACTIVE', 'PRIZE', 'HAND', 'DECK', 'DISCARD',
            'ENERGY', 'BASIC', 'SPECIAL', 'TOOL', 'STADIUM',
            'SUPPORTER', 'TRAINER', 'ITEM',
            'DAMAGE', 'HEAL', 'RECOVER', 'PREVENT',
            'POISON', 'BURN', 'PARALYZE', 'SLEEP', 'CONFUSE',
            'TURN', 'NEXT', 'END', 'START', 'BEGINNING',
            'OPPONENT', 'YOUR', 'THEIR', 'OWN',
            'CHOOSE', 'SELECT', 'PICK', 'LOOK', 'REVEAL',
            'PUT', 'PLACE', 'MOVE', 'SWITCH', 'EXCHANGE',
            'SHUFFLE', 'REARRANGE', 'REORDER',
            'CANNOT', 'MAY', 'MUST', 'DOES', 'IF', 'WHEN', 'WHENEVER',
            'INSTEAD', 'ADDITIONALLY', 'ALSO', 'MORE',
            'LESS', 'EQUAL', 'SAME', 'DIFFERENT',
            'RANDOM', 'ANY', 'ALL', 'EACH', 'EVERY',
            'THAT', 'THIS', 'THESE', 'THOSE',
            'OR', 'AND', 'BUT', 'EXCEPT', 'UNLESS'
        }

    def load_card_data(self, csv_file: str):
        """Load card data from CSV file"""
        print(f"Loading card data from {csv_file}...")

        with open(csv_file, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)

            for row in reader:
                self.analyze_card_skills(row)

        print(f"Analyzed {len(self.skill_names)} unique skill names")

    def analyze_card_skills(self, card_row: Dict):
        """Analyze skills from a single card"""
        # Analyze Skill 1
        if card_row.get('Skill1Name'):
            self.analyze_skill(
                card_row['Skill1Name'],
                card_row.get('Skill1Cost', ''),
                card_row.get('Skill1Damage', ''),
                card_row.get('Skill1Effect', '')
            )

        # Analyze Skill 2
        if card_row.get('Skill2Name'):
            self.analyze_skill(
                card_row['Skill2Name'],
                card_row.get('Skill2Cost', ''),
                card_row.get('Skill2Damage', ''),
                card_row.get('Skill2Effect', '')
            )

    def analyze_skill(self, name: str, cost: str, damage: str, effect: str):
        """Analyze a single skill"""
        # Count skill names
        self.skill_names[name] += 1

        # Analyze energy costs
        if cost:
            self.analyze_energy_cost(cost)

        # Analyze damage
        if damage:
            self.analyze_damage(damage)

        # Analyze effect text
        if effect:
            self.analyze_effect_text(effect)

    def analyze_energy_cost(self, cost: str):
        """Analyze energy cost patterns"""
        # Count total energy symbols
        energy_count = len(re.findall(r'[🔥⚡🌊🌱🛡️🌈💎]', cost))
        if energy_count > 0:
            self.energy_costs[f"{energy_count} energy"] += 1

        # Count specific energy types
        energy_types = re.findall(r'[🔥⚡🌊🌱🛡️🌈💎]', cost)
        for energy_type in energy_types:
            self.energy_costs[energy_type] += 1

        # Count colorless energy
        colorless_count = len(re.findall(r'☆', cost))
        if colorless_count > 0:
            self.energy_costs[f"{colorless_count} colorless"] += 1

    def analyze_damage(self, damage: str):
        """Analyze damage patterns"""
        # Extract numeric damage
        damage_match = re.search(r'(\d+)', damage)
        if damage_match:
            damage_value = int(damage_match.group(1))
            if damage_value <= 10:
                self.damage_patterns["Low (1-10)"] += 1
            elif damage_value <= 50:
                self.damage_patterns["Medium (11-50)"] += 1
            elif damage_value <= 100:
                self.damage_patterns["High (51-100)"] += 1
            elif damage_value <= 200:
                self.damage_patterns["Very High (101-200)"] += 1
            else:
                self.damage_patterns["Extreme (200+)"] += 1

        # Check for special damage patterns
        if '+' in damage:
            self.damage_patterns["Plus damage"] += 1
        if '×' in damage or '*' in damage:
            self.damage_patterns["Multiplier damage"] += 1
        if 'HP' in damage.upper():
            self.damage_patterns["HP-based damage"] += 1

    def analyze_effect_text(self, effect: str):
        """Analyze effect text for keywords"""
        effect_lower = effect.lower()

        # Count common keywords
        for keyword in self.common_keywords:
            if keyword.lower() in effect_lower:
                self.effect_keywords[keyword] += 1

        # Analyze effect patterns
        if '抽' in effect and '牌' in effect:
            self.effect_keywords['DRAW_CARDS'] += 1
        if '丟' in effect and '棄' in effect:
            self.effect_keywords['DISCARD'] += 1
        if '搜' in effect or '找' in effect:
            self.effect_keywords['SEARCH'] += 1
        if '附' in effect and '能' in effect:
            self.effect_keywords['ATTACH_ENERGY'] += 1
        if '進化' in effect:
            self.effect_keywords['EVOLVE'] += 1
        if '切換' in effect or '互換' in effect:
            self.effect_keywords['SWITCH'] += 1
        if '硬幣' in effect or '擲' in effect:
            self.effect_keywords['COIN_FLIP'] += 1
        if '傷害' in effect:
            self.effect_keywords['DAMAGE'] += 1
        if '治療' in effect or '回復' in effect:
            self.effect_keywords['HEAL'] += 1
        if '中毒' in effect:
            self.effect_keywords['POISON'] += 1
        if '燃燒' in effect:
            self.effect_keywords['BURN'] += 1
        if '麻痺' in effect:
            self.effect_keywords['PARALYZE'] += 1
        if '睡眠' in effect:
            self.effect_keywords['SLEEP'] += 1
        if '混亂' in effect:
            self.effect_keywords['CONFUSE'] += 1

    def print_analysis_results(self):
        """Print comprehensive analysis results"""
        print("🎴 PTCG 技能關鍵字分析報告")
        print("=" * 60)
        print()

        # Top skill names
        print("🏆 最常見的技能名稱 (前20名)")
        print("-" * 40)
        sorted_names = sorted(self.skill_names.items(), key=lambda x: x[1], reverse=True)
        for i, (name, count) in enumerate(sorted_names[:20], 1):
            print("2")
        print()

        # Energy cost analysis
        print("⚡ 能量消耗分析")
        print("-" * 30)
        print("能量類型分佈:")
        for energy_type, count in sorted(self.energy_costs.items(), key=lambda x: x[1], reverse=True):
            if energy_type in ['🔥', '⚡', '🌊', '🌱', '🛡️', '🌈', '💎']:
                emoji_map = {'🔥': 'Fire', '⚡': 'Lightning', '🌊': 'Water', '🌱': 'Grass', '🛡️': 'Fighting', '🌈': 'Fairy', '💎': 'Metal'}
                energy_name = emoji_map.get(energy_type, energy_type)
                print(f"   • {energy_name}: {count} 次")
        print()
        print("能量數量分佈:")
        for cost_type, count in sorted(self.energy_costs.items(), key=lambda x: x[1], reverse=True):
            if 'energy' in cost_type or 'colorless' in cost_type:
                print(f"   • {cost_type}: {count} 次")
        print()

        # Damage analysis
        print("💥 傷害分析")
        print("-" * 20)
        for damage_type, count in sorted(self.damage_patterns.items(), key=lambda x: x[1], reverse=True):
            print(f"   • {damage_type}: {count} 次")
        print()

        # Effect keywords analysis
        print("🔍 效果關鍵字分析 (前30名)")
        print("-" * 35)
        # Filter out common English words, focus on game-specific terms
        game_keywords = {k: v for k, v in self.effect_keywords.items()
                        if k in ['DRAW_CARDS', 'DISCARD', 'SEARCH', 'ATTACH_ENERGY', 'EVOLVE',
                                'SWITCH', 'COIN_FLIP', 'DAMAGE', 'HEAL', 'POISON', 'BURN',
                                'PARALYZE', 'SLEEP', 'CONFUSE', 'GX', 'VMAX', 'VSTAR', 'EX',
                                'ABILITY', 'KNOCK OUT', 'BENCH', 'PRIZE', 'HAND', 'DECK']}

        for keyword, count in sorted(game_keywords.items(), key=lambda x: x[1], reverse=True)[:30]:
            keyword_display = keyword.replace('_', ' ').title()
            print("6")
        print()

        # Special effect patterns
        print("🎯 特殊效果模式分析")
        print("-" * 30)
        special_patterns = {
            '條件觸發': ['如果', '當', '每當', '若'],
            '數量選擇': ['選擇', '選出', '挑選'],
            '隨機效果': ['隨機', '任意', '任一'],
            '狀態異常': ['中毒', '燃燒', '麻痺', '睡眠', '混亂'],
            '資源操作': ['抽牌', '棄牌', '搜尋', '附上', '移除'],
            '戰鬥操作': ['攻擊', '防禦', '切換', '退回']
        }

        for category, keywords in special_patterns.items():
            total_count = sum(self.effect_keywords.get(k, 0) for k in keywords)
            if total_count > 0:
                print(f"   • {category}: {total_count} 次")
                for keyword in keywords:
                    count = self.effect_keywords.get(keyword, 0)
                    if count > 0:
                        print(f"     - {keyword}: {count} 次")
        print()

        # Statistical summary
        total_skills = sum(self.skill_names.values())
        unique_skills = len(self.skill_names)
        pokemon_cards = sum(1 for name, count in self.skill_names.items() if any(char.isdigit() for char in name) or 'ex' in name.lower())

        print("📊 統計摘要")
        print("-" * 20)
        print(f"   • 總技能數量: {total_skills}")
        print(f"   • 獨特技能名稱: {unique_skills}")
        print(f"   • 寶可夢技能: {pokemon_cards}")
        print(f"   • 訓練家技能: {total_skills - pokemon_cards}")
        print(f"   • 平均每技能使用次數: {total_skills/unique_skills:.1f}")
        print()

    def export_keyword_data(self):
        """Export keyword analysis to CSV files"""
        # Export skill names
        with open('skill_names_analysis.csv', 'w', newline='', encoding='utf-8') as file:
            writer = csv.writer(file)
            writer.writerow(['Skill Name', 'Frequency'])
            for name, count in sorted(self.skill_names.items(), key=lambda x: x[1], reverse=True):
                writer.writerow([name, count])

        # Export effect keywords
        with open('effect_keywords_analysis.csv', 'w', newline='', encoding='utf-8') as file:
            writer = csv.writer(file)
            writer.writerow(['Keyword', 'Frequency'])
            for keyword, count in sorted(self.effect_keywords.items(), key=lambda x: x[1], reverse=True):
                writer.writerow([keyword, count])

        # Export energy costs
        with open('energy_costs_analysis.csv', 'w', newline='', encoding='utf-8') as file:
            writer = csv.writer(file)
            writer.writerow(['Energy Type', 'Frequency'])
            for energy_type, count in sorted(self.energy_costs.items(), key=lambda x: x[1], reverse=True):
                writer.writerow([energy_type, count])

        print("📁 分析結果已匯出至 CSV 文件:")
        print("   • skill_names_analysis.csv")
        print("   • effect_keywords_analysis.csv")
        print("   • energy_costs_analysis.csv")

def main():
    analyzer = SkillKeywordAnalyzer()

    # Analyze the main card database
    csv_file = 'scripts/cards_output_all_mega_rated.csv'
    analyzer.load_card_data(csv_file)

    # Print comprehensive analysis
    analyzer.print_analysis_results()

    # Export data
    analyzer.export_keyword_data()

    print("✅ 技能關鍵字分析完成！")

if __name__ == "__main__":
    main()