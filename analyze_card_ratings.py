#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PTCG Card Rating Analysis
Analyzes the rated cards and provides insights into tier distribution and top cards
"""

import csv
from collections import defaultdict, Counter

def analyze_rated_cards(input_file):
    """Analyze the rated cards and provide detailed insights"""
    
    # Read the CSV file
    cards = []
    with open(input_file, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            row['Score'] = float(row['Score'])
            cards.append(row)
    
    print("=== PTCG Card Rating Analysis ===\n")
    
    # Basic statistics
    total_cards = len(cards)
    scores = [card['Score'] for card in cards]
    avg_score = sum(scores) / len(scores) if scores else 0
    max_score = max(scores) if scores else 0
    min_score = min(scores) if scores else 0
    
    print(f"Total cards analyzed: {total_cards}")
    print(f"Average score: {avg_score:.2f}")
    print(f"Highest score: {max_score:.2f}")
    print(f"Lowest score: {min_score:.2f}")
    print()
    
    # Tier distribution
    tier_counts = Counter(card['Tier'] for card in cards)
    print("=== Tier Distribution ===")
    for tier in ['S+', 'S', 'A+', 'A', 'B+', 'B', 'C+', 'C', 'D']:
        count = tier_counts.get(tier, 0)
        percentage = (count / total_cards * 100) if total_cards > 0 else 0
        print(f"{tier:3s}: {count:4d} cards ({percentage:5.1f}%)")
    print()
    
    # Top 20 highest-rated cards
    print("=== Top 20 Highest-Rated Cards ===")
    top_cards = sorted(cards, key=lambda x: x['Score'], reverse=True)[:20]
    for i, card in enumerate(top_cards, 1):
        print(f"{i:2d}. {card['Name']:<25} | {card['CardType']:<12} | {card['Tier']:<3} | {card['Score']:5.2f} | {card['ExpansionCode']}")
    print()
    
    # Card type analysis
    print("=== Card Type Analysis ===")
    type_stats = defaultdict(lambda: {'scores': [], 'tiers': []})
    for card in cards:
        card_type = card['CardType']
        type_stats[card_type]['scores'].append(card['Score'])
        type_stats[card_type]['tiers'].append(card['Tier'])
    
    type_analysis = []
    for card_type, stats in type_stats.items():
        count = len(stats['scores'])
        avg_score = sum(stats['scores']) / count if count > 0 else 0
        max_score = max(stats['scores']) if stats['scores'] else 0
        most_common_tier = Counter(stats['tiers']).most_common(1)[0][0] if stats['tiers'] else 'N/A'
        type_analysis.append((card_type, count, avg_score, max_score, most_common_tier))
    
    type_analysis.sort(key=lambda x: x[2], reverse=True)  # Sort by avg score
    print(f"{'Type':<15} | {'Count':<6} | {'Avg Score':<9} | {'Max Score':<9} | {'Common Tier'}")
    print("-" * 70)
    for card_type, count, avg_score, max_score, common_tier in type_analysis:
        print(f"{card_type:<15} | {count:<6} | {avg_score:<9.2f} | {max_score:<9.2f} | {common_tier}")
    print()
    
    # Expansion analysis
    print("=== Top Expansions by Average Card Score ===")
    expansion_stats = defaultdict(lambda: {'scores': [], 'count': 0})
    for card in cards:
        expansion = card['ExpansionCode']
        expansion_stats[expansion]['scores'].append(card['Score'])
        expansion_stats[expansion]['count'] += 1
    
    expansion_analysis = []
    for expansion, stats in expansion_stats.items():
        if stats['count'] >= 10:  # Only expansions with 10+ cards
            avg_score = sum(stats['scores']) / stats['count']
            max_score = max(stats['scores'])
            expansion_analysis.append((expansion, stats['count'], avg_score, max_score))
    
    expansion_analysis.sort(key=lambda x: x[2], reverse=True)
    print(f"{'Expansion':<12} | {'Cards':<6} | {'Avg Score':<9} | {'Max Score'}")
    print("-" * 50)
    for expansion, count, avg_score, max_score in expansion_analysis[:15]:
        print(f"{expansion:<12} | {count:<6} | {avg_score:<9.2f} | {max_score:<9.2f}")
    print()
    
    # S+ and S tier cards
    print("=== S+ Tier Cards (Meta-Defining) ===")
    s_plus_cards = [card for card in cards if card['Tier'] == 'S+']
    s_plus_cards.sort(key=lambda x: x['Score'], reverse=True)
    for card in s_plus_cards[:15]:
        print(f"• {card['Name']:<25} | {card['CardType']:<12} | {card['Score']:5.2f} | {card['ExpansionCode']}")
    print()
    
    print("=== S Tier Cards (Essential Competitive Cards) ===")
    s_cards = [card for card in cards if card['Tier'] == 'S']
    s_cards.sort(key=lambda x: x['Score'], reverse=True)
    for card in s_cards[:15]:
        print(f"• {card['Name']:<25} | {card['CardType']:<12} | {card['Score']:5.2f} | {card['ExpansionCode']}")
    print()
    
    # Rarity analysis
    print("=== Rarity Analysis ===")
    rarity_stats = defaultdict(lambda: {'scores': [], 'tiers': []})
    for card in cards:
        rarity = card['Rarity']
        if rarity:  # Skip empty rarities
            rarity_stats[rarity]['scores'].append(card['Score'])
            rarity_stats[rarity]['tiers'].append(card['Tier'])
    
    for rarity, stats in rarity_stats.items():
        count = len(stats['scores'])
        avg_score = sum(stats['scores']) / count if count > 0 else 0
        top_tiers = Counter(stats['tiers']).most_common(3)
        print(f"{rarity:<12}: {count:4d} cards, avg score {avg_score:5.2f}, top tiers: {top_tiers}")
    print()

def main():
    input_file = 'scripts/cards_output_all_mega_rated.csv'
    
    try:
        analyze_rated_cards(input_file)
    except FileNotFoundError:
        print(f"Error: Could not find rated file '{input_file}'")
        print("Please run the rating system first with card_rating_system.py")
    except Exception as e:
        print(f"Error analyzing file: {str(e)}")

if __name__ == "__main__":
    main()