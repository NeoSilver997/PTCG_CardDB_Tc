const axios = require('axios');
const cheerio = require('cheerio');

// All known available Pokemon TCG expansions from BeehiveTCG
const allExpansions = [
  'sv10f', 'mbf', 'm1lf', 'mbdf', 'sv8af',  // Already have these
  'ex1', 'ex12', 'ex3', 'ex6', 'ex9',      // EX series
  'sm1', 'sm11', 'sm2', 'sm5', 'sm8',     // Sun & Moon series
  'sv1', 'sv1a', 'sv3', 'sv3a', 'sv3f',   // Scarlet & Violet series
  'sv4a', 'sv5a', 'sv6', 'sv6a', 'sv6f',  // More SV series
  'sv7', 'sv7f', 'sv8', 'sv9'             // More SV series
];

// Expansions we already have
const existingExpansions = ['sv10f', 'mbf', 'm1lf', 'mbdf', 'sv8af'];

const missingExpansions = allExpansions.filter(exp => !existingExpansions.includes(exp));

console.log(`Found ${allExpansions.length} total known expansions on BeehiveTCG`);
console.log(`Already have ${existingExpansions.length} expansions`);
console.log(`Need to download ${missingExpansions.length} expansions:`);
missingExpansions.forEach(exp => console.log(`  - ${exp}`));

async function downloadExpansion(expansion, retryCount = 0) {
  try {
    console.log(`\n=== Downloading ${expansion} ===`);

    const fs = require('fs');
    const path = require('path');
    const MARKET_PRICES_FILE = path.join(process.cwd(), 'data', 'market-prices.json');

    // Load existing data
    let marketPricesData = {};
    if (fs.existsSync(MARKET_PRICES_FILE)) {
      const data = fs.readFileSync(MARKET_PRICES_FILE, 'utf8');
      marketPricesData = JSON.parse(data);
    }

    // Search for products in this expansion
    const searchUrl = `https://beehivetcg.com/search?q=${expansion}&view=products`;
    console.log(`Fetching: ${searchUrl}`);

    const response = await axios.get(searchUrl, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    let productsFound = 0;

    // Process each product
    $(`a[href*="/products/${expansion}-"]`).each((i, elem) => {
      const href = $(elem).attr('href');
      if (href) {
        productsFound++;

        // Extract card number from URL
        const match = href.match(new RegExp(`/${expansion}-(\\d+)-\\d+-`));
        if (match) {
          const cardNumber = parseInt(match[1]);
          const tempCardId = cardNumber;

          // Get product details
          const productName = $(elem).find('img').attr('alt') ||
                             $(elem).find('.product-title').text().trim() ||
                             $(elem).text().trim();

          const priceText = $(elem).closest('.product-item, .product-card').find('.price, .product-price').text().trim();
          const stockText = $(elem).closest('.product-item, .product-card').find('.stock, .product-stock').text().trim();

          // Extract price (HKD)
          const priceMatch = priceText.match(/HK\$?(\d+(?:\.\d+)?)/);
          const price = priceMatch ? parseFloat(priceMatch[1]) : 0;

          // Extract stock
          const stockMatch = stockText.match(/(\d+)/);
          const stockQuantity = stockMatch ? parseInt(stockMatch[1]) : 0;

          // Check if sold out
          const isSoldOut = $(elem).closest('.product-item, .product-card').find('.sold-out, .out-of-stock').length > 0;

          // Create price entry
          const priceEntry = {
            cardId: tempCardId,
            price: price,
            currency: 'HKD',
            source: 'BeehiveTCG',
            condition: 'Near Mint',
            date: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            metadata: {
              cardName: productName.replace(new RegExp(`^${expansion}-\\d+-\\d+-\\s*`), '').trim() || 'Unknown',
              rarity: 'Unknown',
              stockQuantity: stockQuantity,
              isSoldOut: isSoldOut,
              productUrl: `https://beehivetcg.com${href}`
            }
          };

          // Add to market prices data
          if (!marketPricesData[tempCardId]) {
            marketPricesData[tempCardId] = [];
          }
          marketPricesData[tempCardId].push(priceEntry);
        }
      }
    });

    // Save updated data
    fs.writeFileSync(MARKET_PRICES_FILE, JSON.stringify(marketPricesData, null, 2));
    console.log(`✓ Saved ${productsFound} products for ${expansion}`);

    return productsFound;

  } catch (error) {
    if (error.response?.status === 429 && retryCount < 3) {
      const waitTime = Math.pow(2, retryCount) * 10000; // Exponential backoff
      console.log(`⚠ 429 Too Many Requests for ${expansion}. Retrying in ${waitTime/1000}s...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return downloadExpansion(expansion, retryCount + 1);
    }

    console.error(`✗ Error downloading ${expansion}:`, error.message);
    return 0;
  }
}

async function downloadAllMissingExpansions() {
  console.log('=== STARTING BATCH DOWNLOAD ===');
  console.log('Rate limiting: 5-10 seconds between expansions\n');

  let totalProducts = 0;
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < missingExpansions.length; i++) {
    const expansion = missingExpansions[i];
    console.log(`\n[${i + 1}/${missingExpansions.length}] Processing ${expansion}...`);

    const products = await downloadExpansion(expansion);
    totalProducts += products;

    if (products > 0) {
      successCount++;
    } else {
      failCount++;
    }

    // Longer delay between expansions
    if (i < missingExpansions.length - 1) {
      const waitTime = 5000 + Math.random() * 5000; // 5-10 seconds
      console.log(`⏳ Waiting ${Math.round(waitTime/1000)} seconds before next expansion...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  console.log(`\n=== DOWNLOAD COMPLETE ===`);
  console.log(`✅ Successfully downloaded: ${successCount} expansions`);
  console.log(`❌ Failed to download: ${failCount} expansions`);
  console.log(`📦 Total products added: ${totalProducts}`);
  console.log(`📊 Final database now has: ${Object.keys(require('./data/market-prices.json')).length} card entries`);
}

downloadAllMissingExpansions();