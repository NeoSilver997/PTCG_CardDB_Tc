import csv
import re
from collections import defaultdict

def normalize_skill_text(skill_text):
    '''最終版本的標準化技能文字函數'''
    if not skill_text:
        return ''

    # 移除HTML標籤
    skill_text = re.sub(r'<[^>]+>', '', skill_text)

    # 修復常見的文字錯誤
    skill_text = skill_text.replace('寶可夢卡卡', '寶可夢卡')  # 修復雙重"卡"
    skill_text = skill_text.replace('【2階進化】寶可夢', '【2階進化】寶可夢卡')  # 統一術語

    # 統一術語變體
    skill_text = skill_text.replace('抽出1張', '選擇1張')  # 抽出 vs 選擇
    skill_text = skill_text.replace('抽出', '選擇')  # 統一抽卡術語
    skill_text = skill_text.replace('最初自己的回合', '自己的最初回合')  # 統一順序
    skill_text = skill_text.replace('這個回合剛使出的', '剛使出的')  # 簡化表達
    skill_text = skill_text.replace('或剛使出的寶可夢', '與這個回合剛使出的寶可夢')  # 統一限制語句
    skill_text = skill_text.replace('與剛使出的寶可夢', '與這個回合剛使出的寶可夢')  # 統一限制語句
    skill_text = skill_text.replace('或剛使出的', '與這個回合剛使出的')  # 統一限制語句

    # 統一數字和單位表達
    skill_text = skill_text.replace('剩餘獎賞卡張數', '剩餘獎賞卡的張數')  # 統一獎賞卡表達
    skill_text = skill_text.replace('選擇1隻', '選擇')  # 簡化選擇表達
    skill_text = skill_text.replace('選擇對手的1隻', '選擇對手的')  # 簡化選擇表達

    # 統一物品卡規則 - 這些通常可以忽略，因為它們是標準規則
    if skill_text.strip() == '在自己的回合時，物品卡可不限張數使用。':
        return ''  # 將標準物品卡規則視為空，因為它們總是相同的

    # 移除多餘空白和換行
    skill_text = re.sub(r'\s+', ' ', skill_text)
    return skill_text.strip()

def create_skill_key(card):
    '''為卡牌創建技能鍵，只考慮主要技能效果'''
    skill1 = normalize_skill_text(card.get('Skill1Effect', '').strip())
    # 忽略Skill2，因為它通常是標準規則
    return skill1

print('🔄 開始最終極智慧合併重複卡牌 (忽略標準規則)...')

# 第一階段：按名稱分組
name_groups = defaultdict(list)

with open('cards_output_all_mega_with_effects.csv', 'r', encoding='utf-8-sig') as f:
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
        skill_key = create_skill_key(card)
        skill_groups[skill_key].append(card)

    # 對於每個技能組，取第一張卡作為代表
    for skill_key, skill_cards in skill_groups.items():
        representative = skill_cards[0].copy()
        merged_cards.append(representative)
        total_merged += 1

# 寫入新CSV文件
output_file = 'cards_output_all_mega_with_effects_smart_merged_ultimate.csv'
with open(output_file, 'w', newline='', encoding='utf-8-sig') as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(merged_cards)

print(f'\n✅ 最終極智慧合併完成!')
print(f'原始卡牌數: {total_original}')
print(f'智慧合併後卡牌數: {total_merged}')
print(f'移除重複數: {total_original - total_merged}')
print(f'壓縮比例: {total_merged/total_original*100:.1f}%')
print(f'輸出文件: {output_file}')

# 驗證問題卡牌是否被正確合併
test_cards = ['大地之容器', '反擊捕捉器', '神奇糖果']
for test_card in test_cards:
    count = 0
    with open(output_file, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = row.get('Name', '').strip()
            if test_card in name:
                count += 1
    print(f'\n🔍 {test_card} 驗證: {count} 張 (應該是1張)')