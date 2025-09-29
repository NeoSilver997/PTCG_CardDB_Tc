const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const CSV_FILE = '../card_price_tracker.csv';
const cardMapping = {};
const nameMapping = {};

// SV-only expansion mappings for Chinese BeehiveTCG
const expansionMappings = {
    'SV11W': 'sv11wf',
    'SV11B': 'sv11bf',
   'SV10': 'sv10f',
   'SV9a': 'sv9af',
   'SV9': 'sv9f',
  'SV8a': 'sv8af',
  'SV8': 'sv8f',
  'SV7a': 'sv7af',
  'SV7': 'sv7f',
  'SV6a': 'sv6af',
  'SV6': 'sv6f',
  'SV5M': 'sv5mf',
  'SV5K': 'sv5kf',
  'SV5': 'sv5f',
  'SV4a': 'sv4af',
  'SV4': 'sv4f',
  'SV3a': 'sv3af',
  'SV3': 'sv3f',
  'SV2a': 'sv2af',
  'SV2': 'sv2f',
  'SV1a': 'sv1af',
  'SV1': 'sv1f'
};

async function loadCardMappings() {
  console.log('\n🔄 Loading CSV data...');
  try {
    const csvData = fs.readFileSync(CSV_FILE, 'utf8');
    const lines = csvData.split('\n');
    
    let processedLines = 0;
    let validCards = 0;
    
    lines.forEach((line, index) => {
      processedLines++;
      if (index === 0) return; // Skip header
      
      const [name, card_id, expansion, rarity, price, average, lowest, image_url] = line.split(',').map(s => s.trim());
      
      // Debug: Show first few lines being processed
      if (index <= 5) {
        console.log(`🔍 Processing line ${index}: ${name} | ${card_id} | ${expansion}`);
      }
      
      // Filter for SV series only
      if (expansion && expansion.startsWith('SV')) {
        validCards++;
        
        if (index <= 5) {
          console.log(`   ✅ Valid SV card found`);
        }
        
        if (card_id) {
          cardMapping[card_id] = {
            name: name,
            expansion: expansion,
            rarity: rarity,
            id: card_id
          };
        }
        
        if (name) {
          nameMapping[name.toLowerCase()] = {
            name: name,
            expansion: expansion,
            rarity: rarity,
            id: card_id
          };
        }
      }
    });
    
    // Create reverse mapping from Chinese BeehiveTCG codes back to CSV codes
    const reverseExpansionMappings = {};
    Object.entries(expansionMappings).forEach(([csvCode, chineseCode]) => {
      reverseExpansionMappings[chineseCode] = csvCode;
    });
    
    console.log(`📊 CSV Processing Summary:`);
    console.log(`   📄 Processed lines: ${processedLines}`);
    console.log(`   ✅ Valid SV cards: ${validCards}`);
    console.log(`   📋 Card mappings created: ${Object.keys(cardMapping).length}`);
    console.log(`   📝 Name-based mappings: ${Object.keys(nameMapping).length}`);
    
    // Show sample mappings
    const sampleMappings = Object.entries(cardMapping).slice(0, 5);
    console.log(`🔍 Sample mappings:`);
    sampleMappings.forEach(([key, value]) => {
      console.log(`   ${key} -> ${value}`);
    });
    
    return reverseExpansionMappings;
    
  } catch (error) {
    console.error('❌ Error loading CSV:', error.message);
    return {};
  }
}

async function searchChineseExpansions() {
  const reverseExpansionMappings = await loadCardMappings();
  
  console.log('\n🔍 Searching for Chinese card collections...');
  console.log(`🎯 Filtering for SV series only (${Object.keys(expansionMappings).length} expansions)`);
  
  const chineseCards = [];
  
  for (const [csvCode, chineseCode] of Object.entries(expansionMappings)) {
    const url = `https://beehivetcg.com/collections/${chineseCode}`;
    console.log(`\n🔍 Checking: ${url} (CSV: ${csvCode})`);
    
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      console.log(`📡 Response status: ${response.status}`);
      console.log(`📄 Content length: ${response.data.length} characters`);
      
      const $ = cheerio.load(response.data);
      
      // Check various selectors for card links
      const productLinks = $('a[href*="/products/"]');
      console.log(`🔗 Found ${productLinks.length} product links`);
      
      if (productLinks.length > 0) {
        console.log(`   📋 Parsing ${productLinks.length} products for Chinese cards...`);
      }
      
      productLinks.each((index, element) => {
        const $link = $(element);
        const href = $link.attr('href');
        const text = $link.text().trim();
        
        // Debug: Show first few links
        if (index < 3) {
          console.log(`   🔗 Link ${index + 1}: ${href} - "${text}"`);
        }
        
        // Check if text contains Chinese characters
        if (containsChinese(text)) {
          const fullUrl = href.startsWith('http') ? href : `https://beehivetcg.com${href}`;
          
          // Extract card ID from URL
          const cardIdMatch = href.match(/\/hk(\d+)$/);
          let cardId = null;
          
          if (cardIdMatch) {
            cardId = cardIdMatch[1];
          }
          
          // Try to match with CSV data using multiple strategies
          let matchedCard = null;
          
          // Strategy 1: Direct card ID match
          if (cardId && cardMapping[cardId]) {
            matchedCard = cardMapping[cardId];
            console.log(`   ✅ Direct match found: ${cardId} -> ${matchedCard.name}`);
          }
          
          // Strategy 2: Name-based matching
          if (!matchedCard) {
            const cleanName = text.replace(/[^\w\s]/g, '').toLowerCase();
            if (nameMapping[cleanName]) {
              matchedCard = nameMapping[cleanName];
              console.log(`   ✅ Name match found: "${cleanName}" -> ${matchedCard.name}`);
            }
          }
          
          chineseCards.push({
            name: text,
            url: fullUrl,
            expansion: csvCode,
            chineseExpansion: chineseCode,
            cardId: cardId,
            matched: !!matchedCard,
            csvData: matchedCard
          });
          
          console.log(`   🎴 Chinese card found: ${text} (${fullUrl}) [Matched: ${!!matchedCard}]`);
        }
      });
      
      console.log(`✅ Completed scanning ${chineseCode} - Found ${chineseCards.filter(c => c.chineseExpansion === chineseCode).length} Chinese cards`);
      
      // Small delay to be polite to the server
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`❌ Error fetching ${url}:`, error.message);
    }
  }
  
  console.log(`\n📊 Final Results:`);
  console.log(`🎴 Total Chinese cards found: ${chineseCards.length}`);
  console.log(`✅ Cards matched with CSV: ${chineseCards.filter(c => c.matched).length}`);
  console.log(`❌ Cards not matched: ${chineseCards.filter(c => !c.matched).length}`);
  
  // Group by expansion
  const byExpansion = {};
  chineseCards.forEach(card => {
    if (!byExpansion[card.expansion]) {
      byExpansion[card.expansion] = [];
    }
    byExpansion[card.expansion].push(card);
  });
  
  console.log(`\n📋 Cards by expansion:`);
  Object.entries(byExpansion).forEach(([expansion, cards]) => {
    console.log(`   ${expansion}: ${cards.length} cards (${cards.filter(c => c.matched).length} matched)`);
  });
  
  // Save results
  const results = {
    summary: {
      totalCards: chineseCards.length,
      matchedCards: chineseCards.filter(c => c.matched).length,
      unmatchedCards: chineseCards.filter(c => !c.matched).length,
      byExpansion: byExpansion
    },
    cards: chineseCards,
    timestamp: new Date().toISOString()
  };
  
  fs.writeFileSync('market-prices.json', JSON.stringify(results, null, 2));
  console.log(`\n💾 Results saved to market-prices.json`);
}

function containsChinese(text) {
  return /[\u4e00-\u9fff]/.test(text);
}

// Run the search
searchChineseExpansions().catch(console.error);