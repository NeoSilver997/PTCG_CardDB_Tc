const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const CSV_FILE = '../source/cards_output_all_mega.csv';
const cardMapping = {};
const nameMapping = {};

// SV-only expansion mappings for Chinese BeehiveTCG
const expansionMappings = {
  'MBD': 'mbf',
  'MBG': 'mbf',
  'M1S': 'm1sf',
  'M1L': 'm1lf',
  'M': 'promof-m',
  'SVOF': 'svof',
  'SVOM': 'svof',
  'SVTG': 'svtgf',
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
  'SV2D': 'sv2df',
  'SV2P': 'sv2pf',
  'SV2a': 'sv2af',
  'SV2': 'sv2f',
  'SV1a': 'sv1af',
  'SV1V': 'sv1vf',
  'SV1S': 'sv1sf'
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
      
      const columns = line.split(',').map(s => s.trim());
      const name = columns[0]; // Name
      const card_id = columns[2]; // WebCardID
      const collector_number = columns[22]; // CollectorNumber
      const expansion = columns[26]; // ExpansionCode
      const rarity = columns[23]; // Rarity
      
      // Debug: Show first few lines being processed
      if (index <= 5) {
        console.log(`🔍 Processing line ${index}: ${name} | WebCardID: ${card_id} | CollectorNumber: ${collector_number} | ExpansionCode: ${expansion}`);
        if (index === 1) {
          console.log(`   📋 CSV columns: Name=${columns[0]}, WebCardID=${columns[2]}, CollectorNumber=${columns[22]}, ExpansionCode=${columns[26]}, Rarity=${columns[23]}`);
        }
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
            id: card_id,
            collectorNumber: collector_number
          };
        }
        
        // Create mapping by expansion + collector number
        if (expansion && collector_number) {
          const expansionKey = `${expansion}_${collector_number}`;
          cardMapping[expansionKey] = {
            name: name,
            expansion: expansion,
            rarity: rarity,
            id: card_id,
            collectorNumber: collector_number
          };
        }
        
        if (name) {
          nameMapping[name] = {
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
  
  // 🔴 BREAKPOINT: Card scanning starting
  debugger;
  
  const chineseCards = [];
  
  for (const [csvCode, chineseCode] of Object.entries(expansionMappings)) {
    console.log(`\n🔍 Checking expansion: ${chineseCode} (CSV: ${csvCode})`);

    let expansionTotalCards = 0;
    let expansionMatchedCards = 0;
    let page = 1;
    const maxPages = 10; // Maximum pages to check per expansion

    while (page <= maxPages) {
      const url = `https://beehivetcg.com/collections/${chineseCode}?page=${page}`;
      console.log(`\n� Page ${page}: ${url}`);

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
        console.log(`🔗 Found ${productLinks.length} product links on page ${page}`);

        // If no products found on this page, we've reached the end
        if (productLinks.length === 0) {
          console.log(`   ⏹️ No more products found on page ${page}, stopping pagination for ${chineseCode}`);
          break;
        }

        console.log(`   📋 Parsing ${productLinks.length} products for Chinese cards...`);

        // 🔴 BREAKPOINT: Before processing product links
        console.log(`🔴 DEBUG: Processing expansion ${chineseCode} page ${page} with ${productLinks.length} products`);
        debugger;

        let pageProcessedCards = 0;
        const maxProcessWithoutMatch = 20; // Allow more cards per page before early exit

        productLinks.each((index, element) => {
          const $link = $(element);
          const href = $link.attr('href');
          const text = $link.text().trim();

          // Debug: Show first few links per page
          if (index < 3) {
            console.log(`   🔗 Link ${index + 1}: ${href} - "${text}"`);
          }

          // Check if text contains Chinese characters
          if (containsChinese(text)) {
            pageProcessedCards++;
            expansionTotalCards++;
            const fullUrl = href.startsWith('http') ? href : `https://beehivetcg.com${href}`;

            // Extract price, stock, and qty from the list page first
            let listPrice = null;
            let listStock = null;
            let listQty = null;

            // Find the parent container of this product link to extract price/stock
            const $productContainer = $link.closest('.collection-product-card');

            if ($productContainer.length > 0) {
              // Extract price from .product-price span
              const $priceElement = $productContainer.find('.product-price').first();
              if ($priceElement.length > 0) {
                const priceText = $priceElement.text().trim();
                const priceMatch = priceText.match(/HK\$?([\d,]+(?:\.\d+)?)/i);
                if (priceMatch) {
                  listPrice = parseFloat(priceMatch[1].replace(/,/g, ''));
                  console.log(`   💰 List page price found: HK$${listPrice}`);
                }
              }

              // Extract stock from .real-qty span (contains just the number)
              const $stockElement = $productContainer.find('.real-qty').first();
              if ($stockElement.length > 0) {
                const stockText = $stockElement.text().trim();
                const stockNum = parseInt(stockText, 10);
                if (!isNaN(stockNum)) {
                  listStock = stockNum;
                  listQty = stockNum;
                  console.log(`   📦 List page stock found: ${listStock}`);
                }
              }

              // Check for "Add to Cart" button availability
              const $addToCart = $productContainer.find('button.CartBtn').filter(function() {
                return $(this).text().trim() === 'Add to Cart';
              });

              if ($addToCart.length > 0) {
                console.log(`   📦 List page: Add to Cart button found, item available`);
              } else {
                console.log(`   📦 List page: No Add to Cart button found`);
                // If no Add to Cart button, item might be out of stock
                if (listStock === null) {
                  listStock = 0;
                  listQty = 0;
                }
              }
            } else {
              console.log(`   ⚠️ Could not find product container for price/stock extraction`);
            }

            // Extract card ID from URL - try multiple patterns
            let cardId = null;

            

            

            // Extract expansion and card number from Chinese card name
            // Format: "SV11WF 174/086 萊希拉姆ex BWR"
            // Special formats: "[鏡面閃版-精靈球] SV11WF 174/086 萊希拉姆ex BWR"
            let extractedExpansion = null;
            let extractedCardNumber = null;
            let processedRarity = null;

            // Handle special rarity variants first
            let cleanText = text;
            let specialRarity = '';

            if (text.includes('[鏡面閃版-精靈球]')) {
              specialRarity = ' 精靈球';
              cleanText = text.replace('[鏡面閃版-精靈球]', '').trim();
              console.log(`   🎯 Special rarity found: 精靈球 variant`);
            } else if (text.includes('[鏡面閃版-大師球]')) {
              specialRarity = ' 大師球';
              cleanText = text.replace('[鏡面閃版-大師球]', '').trim();
              console.log(`   🎯 Special rarity found: 大師球 variant`);
            }

            const cardNameMatch = cleanText.match(/^(\w+)\s+(\d+)\/(\d+)\s+(.+) (\w+)$/);
            if (cardNameMatch) {
              const chineseExpansionCode = cardNameMatch[1]; // e.g., "SV11WF"
              const cardNumber = cardNameMatch[2]; // e.g., "174"
              const totalCards = cardNameMatch[3]; // e.g., "086"
              const cardName = cardNameMatch[4]; // e.g., "萊希拉姆ex"
              const rarity = cardNameMatch[5]; // e.g., "BWR"

              // Map Chinese expansion to CSV expansion
              extractedExpansion = reverseExpansionMappings[chineseCode]; // e.g., "SV11W"
              extractedCardNumber = cardNumber;

              // Combine rarity with special variant if present
              processedRarity = rarity + specialRarity;

              console.log(`   🎯 Parsed card: Expansion=${extractedExpansion}, Number=${extractedCardNumber}, Name=${cardName}, Rarity=${processedRarity}`);
            }

            // Try to match with CSV data using multiple strategies
            let matchedCard = null;


            // Strategy 2: Expansion + Card Number match (primary method)
            if (!matchedCard && extractedExpansion && extractedCardNumber) {
              const expansionKey = `${extractedExpansion}_${extractedCardNumber.replaceAll("0","")}`;
              if (cardMapping[expansionKey]) {
                // 🔴 BREAKPOINT: Expansion+Number match found
                console.log(`🔴 DEBUG: Expansion+Number match found! Key=${expansionKey}`);
                debugger;

                matchedCard = cardMapping[expansionKey];
                expansionMatchedCards++;
                console.log(`   ✅ Expansion+Number match found: ${expansionKey} -> ${matchedCard.name}`);
              } else {
                console.log(`   ❌ No match for expansion+number: ${expansionKey}`);
              }
            }

            // Strategy 3: Name-based matching (fallback)
            if (!matchedCard) {
              if (cardNameMatch) {
                const chineseExpansionCode = cardNameMatch[1]; // e.g., "SV11WF"
                const cardNumber = cardNameMatch[2]; // e.g., "174"
                const totalCards = cardNameMatch[3]; // e.g., "086"
                const cardName = cardNameMatch[4]; // e.g., "萊希拉姆ex"
                if (nameMapping[cardName]) {
                  matchedCard = nameMapping[cardName];
                  expansionMatchedCards++;
                  console.log(`   ✅ Name match found: "${cardName}" -> ${matchedCard.name}`);
                } else {
                  console.log(`   ❌ Name match not found for: "${cardName}"`);
                }
              }
            }

            chineseCards.push({
              name: text,
              url: fullUrl,
              expansion: csvCode,
              chineseExpansion: chineseCode,
              cardId: cardId,
              matched: !!matchedCard,
              csvData: matchedCard,
              listPrice: listPrice,
              listStock: listStock,
              listQty: listQty,
              processedRarity: processedRarity
            });

            console.log(`   🎴 Chinese card found: ${text} (${fullUrl}) [Matched: ${!!matchedCard}]`);

            // Early exit if no matches found after processing several cards on this page
            if (pageProcessedCards >= maxProcessWithoutMatch && (expansionMatchedCards === 0 || (pageProcessedCards - (expansionMatchedCards * 2)) > maxProcessWithoutMatch)) {
              // 🔴 BREAKPOINT: Early exit triggered
              console.log(`🔴 DEBUG: Early exit triggered on page ${page} - processed ${pageProcessedCards} cards, found ${expansionMatchedCards} total matches`);
              debugger;

              console.log(`   ⏭️ No matches found in first ${maxProcessWithoutMatch} cards on page ${page}, skipping rest of expansion`);
              return false; // Break out of .each() loop
            }
          }
        });

        console.log(`✅ Completed page ${page} for ${chineseCode} - Found ${pageProcessedCards} Chinese cards (${expansionMatchedCards} total matched so far)`);

        // Move to next page
        page++;

        // Small delay to be polite to the server
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`❌ Error fetching page ${page} for ${url}:`, error.message);
        break; // Stop pagination on error
      }
    }

    const expansionCards = chineseCards.filter(c => c.chineseExpansion === chineseCode);
    console.log(`🏁 Completed all pages for ${chineseCode} - Total: ${expansionCards.length} Chinese cards (${expansionMatchedCards} matched)`);

    if (expansionMatchedCards === 0) {
      console.log(`   ⚠️ No matches found for ${chineseCode}, but continuing to next expansion`);
    }

    // Small delay between expansions
    await new Promise(resolve => setTimeout(resolve, 2000));
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
  
  // Start price downloading for found cards
  console.log(`\n💰 Starting price download for ${chineseCards.length} Chinese cards...`);
  
  // 🔴 BREAKPOINT: Before price download
  console.log(`🔴 DEBUG: About to start price download for ${chineseCards.length} cards`);
  debugger;
  
  await downloadPrices(chineseCards);
  
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

async function downloadPrices(chineseCards) {
  console.log(`\n🏪 Downloading prices for ${chineseCards.length} cards...`);

  // Count cards that already have list page data
  const cardsWithListData = chineseCards.filter(card => card.listPrice !== null || card.listStock !== null);
  const cardsNeedingProductPage = chineseCards.filter(card => card.listPrice === null && card.listStock === null);

  console.log(`� Price data status:`);
  console.log(`   📋 Cards with list page data: ${cardsWithListData.length}`);
  console.log(`   🌐 Cards needing product page: ${cardsNeedingProductPage.length}`);

  let successCount = 0;
  let errorCount = 0;
  let listDataUsed = 0;

  // First, process cards that already have list page data
  for (const card of cardsWithListData) {
    console.log(`\n📄 Processing (list data): ${card.name}`);

    // Use list page data directly
    card.price = card.listPrice;
    card.currency = 'HKD';
    card.stock = card.listStock;
    card.qty = card.listQty;
    card.priceUpdated = new Date().toISOString();
    card.priceSource = 'list_page';

    if (card.price !== null) {
      console.log(`   💰 Using list page price: HK$${card.price}${card.stock !== null ? ` (Stock: ${card.stock})` : ''}`);
      successCount++;
      listDataUsed++;
    } else {
      console.log(`   ⚠️ List page data incomplete, will check product page`);
    }
  }

  // Then process cards that need product page data
  for (let i = 0; i < cardsNeedingProductPage.length; i++) {
    const card = cardsNeedingProductPage[i];
    console.log(`\n📄 [${i + 1}/${cardsNeedingProductPage.length}] Processing (product page): ${card.name}`);

    try {
      const response = await axios.get(card.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);

      // Try multiple selectors for price
      let price = null;
      const priceSelectors = [
        '.price',
        '.product-price',
        '.money',
        '.price-item',
        '[class*="price"]',
        '[class*="money"]'
      ];

      for (const selector of priceSelectors) {
        const priceElement = $(selector).first();
        if (priceElement.length) {
          const priceText = priceElement.text().trim();
          const priceMatch = priceText.match(/HK\$?([\d,]+(?:\.\d+)?)/i);
          if (priceMatch) {
            price = parseFloat(priceMatch[1].replace(/,/g, ''));
            break;
          }
        }
      }

      // Try to find stock/availability
      let stock = null;
      let qty = null;
      const stockSelectors = [
        '.stock',
        '.inventory',
        '.quantity',
        '[class*="stock"]',
        '[class*="inventory"]'
      ];

      for (const selector of stockSelectors) {
        const stockElement = $(selector).first();
        if (stockElement.length) {
          const stockText = stockElement.text().trim();
          const stockMatch = stockText.match(/(\d+)/);
          if (stockMatch) {
            stock = parseInt(stockMatch[1]);
            qty = stock;
            break;
          }
        }
      }

      // Update card with price information
      card.price = price;
      card.currency = 'HKD';
      card.stock = stock;
      card.qty = qty;
      card.priceUpdated = new Date().toISOString();
      card.priceSource = 'product_page';

      if (price) {
        console.log(`   💰 Product page price found: HK$${price}${stock !== null ? ` (Stock: ${stock})` : ''}`);
        successCount++;
      } else {
        console.log(`   ❌ No price found on product page`);
        errorCount++;
      }

      // Delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      console.log(`   ❌ Error fetching product page: ${error.message}`);
      errorCount++;
    }
  }

  console.log(`\n📊 Price Download Summary:`);
  console.log(`   📋 List page data used: ${listDataUsed} cards`);
  console.log(`   🌐 Product page requests: ${cardsNeedingProductPage.length}`);
  console.log(`   ✅ Total successful: ${successCount} prices`);
  console.log(`   ❌ Failed to download: ${errorCount} prices`);
  console.log(`   📈 Success rate: ${((successCount / chineseCards.length) * 100).toFixed(1)}%`);
}

function containsChinese(text) {
  return /[\u4e00-\u9fff]/.test(text);
}

// Run the search with enhanced error handling
searchChineseExpansions().catch(error => {
  console.error('🔴 FATAL ERROR occurred:');
  console.error('Error message:', error.message);
  console.error('Error stack:', error.stack);
  console.error('Error details:', error);
  process.exit(1);
});