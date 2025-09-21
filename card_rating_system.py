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
        rarity_modifier = self.calculate_rarity_modifier(card_data.get('Rarity', ''))
        
        # Calculate total score
        raw_score = base_score + meta_score + expansion_score + function_score + synergy_score
        final_score = raw_score * rarity_modifier
        
        # Determine tier based on final score
        if final_score >= 20:
            tier = 'S+'
        elif final_score >= 17:
            tier = 'S'
        elif final_score >= 14:
            tier = 'A+'
        elif final_score >= 11:
            tier = 'A'
        elif final_score >= 8:
            tier = 'B+'
        elif final_score >= 6:
            tier = 'B'
        elif final_score >= 4:
            tier = 'C+'
        elif final_score >= 2:
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
                    row['ScoreBreakdown'] = f"Base:{breakdown['base_score']:.1f}|Meta:{breakdown['meta_score']:.1f}|Exp:{breakdown['expansion_score']:.1f}|Func:{breakdown['function_score']:.1f}|Syn:{breakdown['synergy_score']:.1f}|Mod:{breakdown['rarity_modifier']:.2f}"
                    
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
    input_file = 'scripts/cards_output_all_mega.csv'
    output_file = 'scripts/cards_output_all_mega_rated_updated.csv'
    
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