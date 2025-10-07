#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Complex PTCG Card Rating System
Rates Pokemon Trading Card Game cards based on multiple criteria including:
- Card type and function
- Meta relevance 
- Synergy potential
- Rarity and availability
- Expansion power level
"""

import csv
import re
from typing import Dict, List, Tuple

class PTCGCardRater:
    def __init__(self):
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
            if max_damage >= 300:
                damage_score = 8  # Ultra high damage (ex cards, etc.)    
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
        if final_score >= 30:
            tier = 'S+'
        elif final_score >= 26:
            tier = 'S'
        elif final_score >= 21:
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

    def process_csv(self, input_file: str, output_file: str) -> None:
        """Process entire CSV file and add ratings"""
        with open(input_file, 'r', encoding='utf-8-sig', newline='') as infile:
            reader = csv.DictReader(infile)
            fieldnames = list(reader.fieldnames) + ['Tier', 'Score', 'ScoreBreakdown']
            
            with open(output_file, 'w', encoding='utf-8-sig', newline='') as outfile:
                writer = csv.DictWriter(outfile, fieldnames=fieldnames)
                writer.writeheader()
                
                tier_counts = {}
                total_cards = 0
                
                for row in reader:
                    tier, score, breakdown = self.rate_card(row)
                    
                    # Add rating data to row
                    row['Tier'] = tier
                    row['Score'] = f"{score:.2f}"
                    row['ScoreBreakdown'] = f"Base:{breakdown['base_score']:.1f}|Meta:{breakdown['meta_score']:.1f}|Exp:{breakdown['expansion_score']:.1f}|Func:{breakdown['function_score']:.1f}|Syn:{breakdown['synergy_score']:.1f}|Eff:{breakdown['effect_score']:.1f}|Dmg:{breakdown['damage_score']:.1f}|Mod:{breakdown['rarity_modifier']:.2f}"
                    
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

def main():
    """Main execution function"""
    # Initialize the rating system
    rater = PTCGCardRater()
    
    # File paths
    input_file = 'cards_output_all_mega_with_effects_smart_merged_final_success_with_ability_stats.csv'
    output_file = 'cards_output_all_mega_with_effects_smart_merged_final_success_with_ability_stats_rated.csv'
    
    try:
        print("Starting PTCG Card Rating System...")
        print(f"Input file: {input_file}")
        
        # Process the CSV file
        rater.process_csv(input_file, output_file)
        
        print("\n=== Rating Complete! ===")
        print(f"Rated cards saved to: {output_file}")
        print("\nTier Explanations:")
        print("S+/S: Meta-defining cards, essential for competitive play")
        print("A+/A: Strong cards with wide applicability")
        print("B+/B: Situational cards, good in specific decks")
        print("C+/C: Niche cards, limited use cases")
        print("D: Generally weak or outdated cards")
        
    except FileNotFoundError:
        print(f"Error: Could not find input file '{input_file}'")
        print("Please ensure the CSV file is in the same directory as this script.")
    except Exception as e:
        print(f"Error processing file: {str(e)}")

if __name__ == "__main__":
    main()