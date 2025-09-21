#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Enhanced PTCG Skill Keyword Analysis
Comprehensive analysis of all skills with proper Chinese text handling
"""

import csv
from collections import defaultdict, Counter
import re
from typing import Dict, List, Set

class EnhancedSkillAnalyzer:
    def __init__(self):
        self.skill_names = defaultdict(int)
        self.skill_effects = defaultdict(int)
        self.energy_costs = defaultdict(int)
        self.damage_patterns = defaultdict(int)
        self.effect_keywords = defaultdict(int)
        self.chinese_keywords = defaultdict(int)

        # Chinese PTCG keywords to analyze
        self.chinese_keywords_list = [
            '抽牌', '棄牌', '丟棄', '搜尋', '找', '附上', '附加', '移除', '丟到棄牌區',
            '進化', '切換', '互換', '撤退', '退回', '硬幣', '擲', '傷害', '治療', '回復',
            '中毒', '燃燒', '麻痺', '睡眠', '混亂', '狀態', '效果', '不會', '不能', '可以',
            '選擇', '選出', '挑選', '任意', '任一', '所有', '每個', '這隻', '那隻', '對手',
            '自己', '場上', '備戰區', '手牌', '牌庫', '棄牌區', '獎賞卡', '能量', '基本',
            '特殊', '寶可夢', '訓練家', '物品', '支援者', '競技場', '道具', 'GX', 'VMAX',
            'VSTAR', 'EX', '太晶', 'ACE', 'SPEC', 'TURBO', 'BREAK', 'TAG', 'TEAM'
        ]

    def load_card_data(self, csv_file: str):
        """Load card data from CSV file with proper encoding"""
        print(f"Loading card data from {csv_file}...")

        with open(csv_file, 'r', encoding='utf-8-sig') as file:  # Use utf-8-sig for BOM handling
            reader = csv.DictReader(file)

            for row in reader:
                self.analyze_card_skills(row)

        print(f"Analyzed {len(self.skill_names)} unique skill names")

    def analyze_card_skills(self, card_row: Dict):
        """Analyze skills from a single card"""
        # Analyze Skill 1
        if card_row.get('Skill1Name') and card_row['Skill1Name'].strip():
            self.analyze_skill(
                card_row['Skill1Name'].strip(),
                card_row.get('Skill1Cost', '').strip(),
                card_row.get('Skill1Damage', '').strip(),
                card_row.get('Skill1Effect', '').strip()
            )

        # Analyze Skill 2
        if card_row.get('Skill2Name') and card_row['Skill2Name'].strip():
            self.analyze_skill(
                card_row['Skill2Name'].strip(),
                card_row.get('Skill2Cost', '').strip(),
                card_row.get('Skill2Damage', '').strip(),
                card_row.get('Skill2Effect', '').strip()
            )

    def analyze_skill(self, name: str, cost: str, damage: str, effect: str):
        """Analyze a single skill"""
        if not name:
            return

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
        # Handle comma-separated energy costs like "Fire,Fire" or "Fire,Fire,Fire,Fire"
        if ',' in cost:
            energies = [e.strip() for e in cost.split(',') if e.strip()]
            energy_count = len(energies)
            self.energy_costs[f"{energy_count} energy"] += 1

            # Count specific energy types
            for energy in energies:
                energy = energy.strip()
                if energy:
                    self.energy_costs[energy] += 1
        else:
            # Single energy or special cases
            if cost.strip():
                self.energy_costs[cost.strip()] += 1

    def analyze_damage(self, damage: str):
        """Analyze damage patterns"""
        damage = damage.strip()
        if not damage:
            return

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

        # Count Chinese keywords
        for keyword in self.chinese_keywords_list:
            if keyword in effect:
                self.chinese_keywords[keyword] += 1

        # Analyze specific effect patterns
        if '抽' in effect and ('牌' in effect or '張' in effect):
            self.effect_keywords['DRAW_CARDS'] += 1
        if '丟' in effect and ('棄' in effect or '牌區' in effect):
            self.effect_keywords['DISCARD'] += 1
        if '搜' in effect or '找' in effect:
            self.effect_keywords['SEARCH'] += 1
        if '附' in effect and ('能' in effect or '加' in effect):
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

        # Special PTCG mechanics
        if 'GX' in effect.upper():
            self.effect_keywords['GX'] += 1
        if 'VMAX' in effect.upper():
            self.effect_keywords['VMAX'] += 1
        if 'VSTAR' in effect.upper():
            self.effect_keywords['VSTAR'] += 1
        if '太晶' in effect:
            self.effect_keywords['TERA'] += 1

    def print_comprehensive_analysis(self):
        """Print comprehensive analysis results"""
        print("🎴 PTCG 技能關鍵字深度分析報告")
        print("=" * 70)
        print()

        # Top skill names
        print("🏆 最常見的技能名稱 (前25名)")
        print("-" * 45)
        sorted_names = sorted(self.skill_names.items(), key=lambda x: x[1], reverse=True)
        for i, (name, count) in enumerate(sorted_names[:25], 1):
            print("2")
        print()

        # Energy cost analysis
        print("⚡ 能量消耗深度分析")
        print("-" * 35)
        print("能量數量分佈:")
        energy_count_patterns = {k: v for k, v in self.energy_costs.items() if 'energy' in k}
        for cost_type, count in sorted(energy_count_patterns.items(), key=lambda x: x[1], reverse=True):
            print(f"   • {cost_type}: {count} 次")

        print("\n具體能量類型:")
        specific_energies = {k: v for k, v in self.energy_costs.items()
                           if k not in energy_count_patterns and k.strip()}
        for energy_type, count in sorted(specific_energies.items(), key=lambda x: x[1], reverse=True)[:15]:
            print(f"   • {energy_type}: {count} 次")
        print()

        # Damage analysis
        print("💥 傷害模式分析")
        print("-" * 25)
        for damage_type, count in sorted(self.damage_patterns.items(), key=lambda x: x[1], reverse=True):
            print(f"   • {damage_type}: {count} 次")
        print()

        # Chinese keywords analysis
        print("🔍 中文關鍵字分析 (前30名)")
        print("-" * 40)
        for keyword, count in sorted(self.chinese_keywords.items(), key=lambda x: x[1], reverse=True)[:30]:
            print("6")
        print()

        # Effect patterns analysis
        print("🎯 效果模式分析")
        print("-" * 25)
        effect_patterns = [
            ('DRAW_CARDS', '抽牌效果'),
            ('DISCARD', '棄牌效果'),
            ('SEARCH', '搜尋效果'),
            ('ATTACH_ENERGY', '附能量效果'),
            ('EVOLVE', '進化效果'),
            ('SWITCH', '切換效果'),
            ('COIN_FLIP', '擲硬幣效果'),
            ('DAMAGE', '傷害效果'),
            ('HEAL', '治療效果'),
            ('POISON', '中毒效果'),
            ('BURN', '燃燒效果'),
            ('PARALYZE', '麻痺效果'),
            ('SLEEP', '睡眠效果'),
            ('CONFUSE', '混亂效果'),
            ('GX', 'GX技能'),
            ('VMAX', 'VMAX技能'),
            ('VSTAR', 'VSTAR技能'),
            ('TERA', '太晶技能')
        ]

        for pattern_key, description in effect_patterns:
            count = self.effect_keywords.get(pattern_key, 0)
            if count > 0:
                print("6")
        print()

        # Statistical summary
        total_skills = sum(self.skill_names.values())
        unique_skills = len(self.skill_names)
        pokemon_cards = sum(1 for name, count in self.skill_names.items()
                          if any(char.isdigit() for char in name) or 'ex' in name.lower() or 'GX' in name or 'V' in name)

        print("📊 統計摘要")
        print("-" * 20)
        print(f"   • 總技能數量: {total_skills:,}")
        print(f"   • 獨特技能名稱: {unique_skills:,}")
        print(f"   • 寶可夢技能估計: {pokemon_cards:,}")
        print(f"   • 訓練家技能估計: {total_skills - pokemon_cards:,}")
        print(f"   • 平均每技能使用次數: {total_skills/unique_skills:.2f}")
        print(f"   • 中文關鍵字種類: {len(self.chinese_keywords):,}")
        print(f"   • 總關鍵字出現次數: {sum(self.chinese_keywords.values()):,}")
        print()

        # Most common skill categories
        print("🎲 技能分類分析")
        print("-" * 25)

        # Categorize skills by their effects
        attack_skills = sum(count for name, count in self.skill_names.items()
                          if any(word in name for word in ['撞擊', '衝撞', '咬', '抓', '踢', '擊', '攻']))
        support_skills = sum(count for name, count in self.skill_names.items()
                           if any(word in name for word in ['呼喚', '支援', '幫助', '守護']))
        special_skills = sum(count for name, count in self.skill_names.items()
                           if any(word in name for word in ['GX', 'VMAX', 'VSTAR', '太晶', 'EX']))

        print(f"   • 攻擊型技能: {attack_skills:,} ({attack_skills/total_skills*100:.1f}%)")
        print(f"   • 支援型技能: {support_skills:,} ({support_skills/total_skills*100:.1f}%)")
        print(f"   • 特殊型技能: {special_skills:,} ({special_skills/total_skills*100:.1f}%)")
        print()

    def export_detailed_analysis(self):
        """Export detailed analysis to multiple CSV files"""
        # Export skill names
        with open('skill_names_detailed.csv', 'w', newline='', encoding='utf-8-sig') as file:
            writer = csv.writer(file)
            writer.writerow(['Skill Name', 'Frequency', 'Category'])
            for name, count in sorted(self.skill_names.items(), key=lambda x: x[1], reverse=True):
                # Categorize skill
                if any(word in name for word in ['GX', 'VMAX', 'VSTAR', '太晶', 'EX']):
                    category = '特殊技能'
                elif any(word in name for word in ['撞擊', '衝撞', '咬', '抓', '踢', '擊', '攻']):
                    category = '攻擊技能'
                elif any(word in name for word in ['呼喚', '支援', '幫助', '守護']):
                    category = '支援技能'
                elif '[物品規則]' in name or '[支援者規則]' in name or '[寶可夢道具規則]' in name:
                    category = '規則技能'
                else:
                    category = '一般技能'

                writer.writerow([name, count, category])

        # Export Chinese keywords
        with open('chinese_keywords_detailed.csv', 'w', newline='', encoding='utf-8-sig') as file:
            writer = csv.writer(file)
            writer.writerow(['Keyword', 'Frequency', 'Category'])
            for keyword, count in sorted(self.chinese_keywords.items(), key=lambda x: x[1], reverse=True):
                # Categorize keyword
                if keyword in ['抽牌', '棄牌', '丟棄', '搜尋', '找']:
                    category = '資源操作'
                elif keyword in ['進化', '切換', '互換', '撤退']:
                    category = '戰鬥操作'
                elif keyword in ['傷害', '治療', '回復']:
                    category = '數值操作'
                elif keyword in ['中毒', '燃燒', '麻痺', '睡眠', '混亂']:
                    category = '狀態異常'
                elif keyword in ['選擇', '選出', '挑選', '任意']:
                    category = '選擇操作'
                elif keyword in ['GX', 'VMAX', 'VSTAR', 'EX', '太晶']:
                    category = '特殊機制'
                else:
                    category = '一般關鍵字'

                writer.writerow([keyword, count, category])

        # Export effect patterns
        with open('effect_patterns_detailed.csv', 'w', newline='', encoding='utf-8-sig') as file:
            writer = csv.writer(file)
            writer.writerow(['Effect Pattern', 'Frequency', 'Description'])
            pattern_descriptions = {
                'DRAW_CARDS': '抽牌效果',
                'DISCARD': '棄牌效果',
                'SEARCH': '搜尋效果',
                'ATTACH_ENERGY': '附能量效果',
                'EVOLVE': '進化效果',
                'SWITCH': '切換效果',
                'COIN_FLIP': '擲硬幣效果',
                'DAMAGE': '傷害效果',
                'HEAL': '治療效果',
                'POISON': '中毒效果',
                'BURN': '燃燒效果',
                'PARALYZE': '麻痺效果',
                'SLEEP': '睡眠效果',
                'CONFUSE': '混亂效果',
                'GX': 'GX技能',
                'VMAX': 'VMAX技能',
                'VSTAR': 'VSTAR技能',
                'TERA': '太晶技能'
            }

            for pattern, count in sorted(self.effect_keywords.items(), key=lambda x: x[1], reverse=True):
                description = pattern_descriptions.get(pattern, pattern)
                writer.writerow([pattern, count, description])

        print("📁 詳細分析已匯出至 CSV 文件:")
        print("   • skill_names_detailed.csv - 技能名稱及分類")
        print("   • chinese_keywords_detailed.csv - 中文關鍵字及分類")
        print("   • effect_patterns_detailed.csv - 效果模式分析")

def main():
    analyzer = EnhancedSkillAnalyzer()

    # Analyze the main card database
    csv_file = 'scripts/cards_output_all_mega_rated.csv'
    analyzer.load_card_data(csv_file)

    # Print comprehensive analysis
    analyzer.print_comprehensive_analysis()

    # Export detailed data
    analyzer.export_detailed_analysis()

    print("✅ 技能關鍵字深度分析完成！")

if __name__ == "__main__":
    main()