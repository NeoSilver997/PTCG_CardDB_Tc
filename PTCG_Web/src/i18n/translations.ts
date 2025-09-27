import { TranslationStrings } from './index';

export const translations: Record<'en' | 'zh' | 'zh-tw', TranslationStrings> = {
  // English
  en: {
    // Common
    loading: 'Loading PTCG cards...',
    error: 'Error',
    close: 'Close',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    view: 'View',
    clear: 'Clear',
    search: 'Search',
    filters: 'Filters',
    all: 'All',
    none: 'None',
    
    // Card related
    cardName: 'Card Name',
    cardType: 'Card Type',
    rarity: 'Rarity',
    tier: 'Tier',
    attribute: 'Attribute',
    ability: 'Ability',
    effectType: 'Effect Type',
    hp: 'HP',
    score: 'Score',
    evolution: 'Evolution',
    regulationMark: 'Regulation Mark',
    expansion: 'Expansion',
    weaknessType: 'Weakness Type',
    resistanceType: 'Resistance Type',
    retreatCost: 'Retreat Cost',
    relatedCards: 'Related Cards',
    viewDetails: 'View Details',
    closeDetails: 'Close Details',
    
    // Filters
    allAbilities: 'All Abilities',
    allEffectTypes: 'All Effect Types',
    allCardTypes: 'All Card Types',
    allRarities: 'All Rarities',
    allTiers: 'All Tiers',
    allAttributes: 'All Attributes',
    allRegulations: 'All Regulations',
    allExpansions: 'All Expansions',
    allWeaknessTypes: 'All Weakness Types',
    allResistanceTypes: 'All Resistance Types',
    
    // Deck management
    deckManager: 'Deck Manager',
    deckViewer: 'Deck Viewer',
    saveDeck: 'Save Deck',
    loadDeck: 'Load Deck',
    clearDeck: 'Clear Deck',
    exportDeck: 'Export Deck',
    copyDeckCode: 'Copy Deck Code',
    totalCards: 'Total Cards',
    energyCount: 'Energy Count',
    createNewDeck: 'Create New Deck',
    manageDecks: 'Manage and organize your Pokemon TCG decks',
    searchDecks: 'Search decks...',
    allFormats: 'All Formats',
    lastUpdated: 'Last Updated',
    dateCreated: 'Date Created',
    cardCount: 'Card Count',
    noDecksFound: 'No decks found',
    noDecksYet: 'You haven\'t created any decks yet. Create your first deck to get started!',
    noMatchingDecks: 'No decks match your current filters.',
    createFirstDeck: 'Create Your First Deck',
    valid: 'Valid',
    invalid: 'Invalid',
    duplicate: 'Duplicate',
    
    // Actions
    add: 'Add',
    remove: 'Remove',
    addToDeck: 'Add to Deck',
    removeFromDeck: 'Remove from Deck',
    quantity: 'Quantity',
    
    // Messages
    enterDeckName: 'Enter deck name',
    saveSuccess: 'Deck saved successfully!',
    saveFail: 'Failed to save deck',
    saveError: 'Error saving deck',
    deleteConfirm: 'Are you sure you want to delete this deck?',
    
    // Navigation
    cardSearch: 'PTCG Card Search',
    results: 'cards found',
    home: 'Home',
    cards: 'Cards',
    decks: 'Decks',
    settings: 'Settings',
    
    // Deck formats
    standard: 'Standard',
    expanded: 'Expanded',
    unlimited: 'Unlimited',
    
    // Card types
    pokemon: 'Pokémon',
    trainer: 'Trainer',
    energy: 'Energy',
    basic: 'Basic',
    stage1: 'Stage 1',
    stage2: 'Stage 2',
    
    // Special features
    noRetreat: 'No Retreat Cost',
    noResistance: 'No Resistance',
    noWeakness: 'No Weakness',
    specialPokemonType: 'Special Pokémon Type',
    
    // Misc
    created: 'Created',
    updated: 'Updated',
    sortBy: 'Sort By',
    searchPlaceholder: 'Search cards by name, ability, or effect...',
    adjustFilters: 'Try adjusting your filters or search terms.',
    tryAdjusting: 'Try adjusting your search terms.'
  },
  
  // Simplified Chinese
  zh: {
    // Common
    loading: '正在加载PTCG卡牌...',
    error: '错误',
    close: '关闭',
    cancel: '取消',
    save: '保存',
    delete: '删除',
    edit: '编辑',
    view: '查看',
    clear: '清除',
    search: '搜索',
    filters: '筛选',
    all: '全部',
    none: '无',
    
    // Card related
    cardName: '卡牌名称',
    cardType: '卡牌类型',
    rarity: '稀有度',
    tier: '等级',
    attribute: '属性',
    ability: '特性',
    effectType: '效果类型',
    hp: 'HP',
    score: '分数',
    evolution: '进化',
    regulationMark: '规则标记',
    expansion: '扩展包',
    weaknessType: '弱点属性',
    resistanceType: '抗性属性',
    retreatCost: '撤退费用',
    relatedCards: '相关卡牌',
    viewDetails: '查看详情',
    closeDetails: '关闭详情',
    
    // Filters
    allAbilities: '全部特性',
    allEffectTypes: '全部效果类型',
    allCardTypes: '全部卡牌类型',
    allRarities: '全部稀有度',
    allTiers: '全部等级',
    allAttributes: '全部属性',
    allRegulations: '全部规则',
    allExpansions: '全部扩展包',
    allWeaknessTypes: '全部弱点类型',
    allResistanceTypes: '全部抗性类型',
    
    // Deck management
    deckBuilder: '卡组构筑器',
    deckName: '卡组名称',
    deckManager: '卡组管理器',
    deckViewer: '卡组查看器',
    saveDeck: '保存卡组',
    loadDeck: '载入卡组',
    clearDeck: '清空卡组',
    exportDeck: '导出卡组',
    copyDeckCode: '复制卡组代码',
    totalCards: '总卡数',
    energyCount: '能量数量',
    createNewDeck: '创建新卡组',
    manageDecks: '管理和组织你的宝可梦卡组',
    searchDecks: '搜索卡组...',
    allFormats: '所有格式',
    lastUpdated: '最后更新',
    dateCreated: '创建日期',
    cardCount: '卡牌数量',
    noDecksFound: '未找到卡组',
    noDecksYet: '您尚未创建任何卡组。创建您的第一个卡组开始吧！',
    noMatchingDecks: '没有卡组符合您当前的筛选条件。',
    createFirstDeck: '创建您的第一个卡组',
    valid: '有效',
    invalid: '无效',
    duplicate: '复制',
    
    // Actions
    add: '添加',
    remove: '移除',
    addToDeck: '添加到卡组',
    removeFromDeck: '从卡组移除',
    quantity: '数量',
    
    // Messages
    enterDeckName: '请输入卡组名称',
    saveSuccess: '卡组保存成功！',
    saveFail: '卡组保存失败',
    saveError: '保存卡组时发生错误',
    deleteConfirm: '确定要删除这个卡组吗？',
    
    // Navigation
    cardSearch: 'PTCG 卡牌搜索',
    results: '张卡牌',
    home: '主页',
    cards: '卡牌',
    decks: '卡组',
    settings: '设置',
    
    // Deck formats
    standard: '标准',
    expanded: '扩展',
    unlimited: '无限制',
    
    // Card types
    pokemon: '宝可梦',
    trainer: '训练师',
    energy: '能量',
    basic: '基本',
    stage1: '一阶进化',
    stage2: '二阶进化',
    
    // Special features
    noRetreat: '无撤退费用',
    noResistance: '无抗性',
    noWeakness: '无弱点',
    specialPokemonType: '特殊宝可梦类型',
    
    // Misc
    created: '创建时间',
    updated: '更新时间',
    sortBy: '排序方式',
    searchPlaceholder: '搜索卡牌、特性、效果...',
    adjustFilters: '尝试调整您的筛选条件或搜索词。',
    tryAdjusting: '尝试调整您的搜索词。'
  },
  
  // Traditional Chinese
  'zh-tw': {
    // Common
    loading: '正在載入PTCG卡牌...',
    error: '錯誤',
    close: '關閉',
    cancel: '取消',
    save: '儲存',
    delete: '刪除',
    edit: '編輯',
    view: '檢視',
    clear: '清除',
    search: '搜尋',
    filters: '篩選',
    all: '全部',
    none: '無',
    
    // Card related
    cardName: '卡牌名稱',
    cardType: '卡牌類型',
    rarity: '稀有度',
    tier: '分級',
    attribute: '屬性',
    ability: '特性',
    effectType: '效果類型',
    hp: 'HP',
    score: '分數',
    evolution: '進化',
    regulationMark: '規則標記',
    expansion: '擴展包',
    weaknessType: '弱點屬性',
    resistanceType: '抗性屬性',
    retreatCost: '撤退費用',
    relatedCards: '相關卡牌',
    viewDetails: '檢視詳情',
    closeDetails: '關閉詳情',
    
    // Filters
    allAbilities: '全部特性',
    allEffectTypes: '全部效果類型',
    allCardTypes: '全部卡牌類型',
    allRarities: '全部稀有度',
    allTiers: '全部分級',
    allAttributes: '全部屬性',
    allRegulations: '全部規則',
    allExpansions: '全部擴展包',
    allWeaknessTypes: '全部弱點類型',
    allResistanceTypes: '全部抗性類型',
    
    // Deck management
    deckBuilder: '牌組建構器',
    deckName: '牌組名稱',
    deckManager: '牌組管理器',
    deckViewer: '牌組檢視器',
    saveDeck: '儲存牌組',
    loadDeck: '載入牌組',
    clearDeck: '清空牌組',
    exportDeck: '匯出牌組',
    copyDeckCode: '複製牌組代碼',
    totalCards: '總卡數',
    energyCount: '能量數量',
    createNewDeck: '創建新牌組',
    manageDecks: '管理和組織您的寶可夢牌組',
    searchDecks: '搜尋牌組...',
    allFormats: '所有格式',
    lastUpdated: '最後更新',
    dateCreated: '創建日期',
    cardCount: '卡牌數量',
    noDecksFound: '未找到牌組',
    noDecksYet: '您尚未創建任何牌組。創建您的第一個牌組開始吧！',
    noMatchingDecks: '沒有牌組符合您當前的篩選條件。',
    createFirstDeck: '創建您的第一個牌組',
    valid: '有效',
    invalid: '無效',
    duplicate: '複製',
    
    // Actions
    add: '加入',
    remove: '移除',
    addToDeck: '加入牌組',
    removeFromDeck: '從牌組移除',
    quantity: '數量',
    
    // Messages
    enterDeckName: '請輸入牌組名稱',
    saveSuccess: '牌組儲存成功！',
    saveFail: '牌組儲存失敗',
    saveError: '儲存牌組時發生錯誤',
    deleteConfirm: '確定要刪除這個牌組嗎？',
    
    // Navigation
    cardSearch: 'PTCG 卡牌搜索',
    results: '張卡牌',
    home: '首頁',
    cards: '卡牌',
    decks: '牌組',
    settings: '設定',
    
    // Deck formats
    standard: '標準',
    expanded: '擴展',
    unlimited: '無限制',
    
    // Card types
    pokemon: '寶可夢',
    trainer: '訓練家',
    energy: '能量',
    basic: '基本',
    stage1: '一階進化',
    stage2: '二階進化',
    
    // Special features
    noRetreat: '無撤退費用',
    noResistance: '無抗性',
    noWeakness: '無弱點',
    specialPokemonType: '特殊寶可夢類型',
    
    // Misc
    created: '創建時間',
    updated: '更新時間',
    sortBy: '排序方式',
    searchPlaceholder: '搜尋卡牌、特性、效果...',
    adjustFilters: '嘗試調整您的篩選條件或搜尋詞。',
    tryAdjusting: '嘗試調整您的搜尋詞。'
  }
};