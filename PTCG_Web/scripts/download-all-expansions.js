const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// All available Pokemon TCG expansions found on BeehiveTCG
const allExpansions = [
  'm1lf', 'mbf', 'sm10', 'sm11', 'sm12', 'sm7', 'sm8', 'sm9',
  'sv1', 'sv10f', 'sv1a', 'sv1f', 'sv2', 'sv2a', 'sv2f',
  'sv3', 'sv3a', 'sv3f', 'sv4', 'sv4a', 'sv4b', 'sv4f',
  'sv5', 'sv5a', 'sv5b', 'sv5f', 'sv6', 'sv6a', 'sv6b', 'sv6f',
  'sv7', 'sv7a', 'sv7b', 'sv7f', 'sv8a', 'sv8b', 'sv8f', 'sv9f',
  'swsh1', 'swsh10', 'swsh11', 'swsh12', 'swsh2', 'swsh3', 'swsh4',
  'swsh5', 'swsh6', 'swsh7', 'swsh8', 'swsh9'
];

// Expansions we already have
const existingExpansions = ['sv10f', 'mbf', 'm1lf', 'mbdf', 'sv8af'];

const missingExpansions = allExpansions.filter(exp => !existingExpansions.includes(exp));

console.log(`Found ${allExpansions.length} total expansions on BeehiveTCG`);
console.log(`Already have ${existingExpansions.length} expansions`);
console.log(`Need to download ${missingExpansions.length} expansions:`);
missingExpansions.forEach(exp => console.log(`  - ${exp}`));

async function downloadExpansion(expansion, retryCount = 0) {
  try {
    console.log(`\n=== Downloading ${expansion} ===`);

    const MARKET_PRICES_FILE = path.join(process.cwd(), 'data', 'market-prices.json');
    let marketPricesData = {};

    // Load existing data
    if (fs.existsSync(MARKET_PRICES_FILE)) {
      const data = fs.readFileSync(MARKET_PRICES_FILE, 'utf8');
      marketPricesData = JSON.parse(data);
    }

    // Search for products in this expansion
    const searchUrl = `https://beehivetcg.com/search?q=${expansion}&view=products`;
    console.log(`Fetching: ${searchUrl}`);

    const response = await axios.get(searchUrl, {
      timeout: 30000, // 30 second timeout
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    const $ = cheerio.load(response.data);

    let productsFound = 0;

    // Process each product
    $('a[href*="/products/"]').each((i, elem) => {
      const href = $(elem).attr('href');
      if (href && href.includes(`/${expansion}-`)) {
        productsFound++;
        console.log(`Processing: ${href}`);

        // Extract card number from URL
        const match = href.match(new RegExp(`/${expansion}-(\\d+)-\\d+-`));
        if (match) {
          const cardNumber = parseInt(match[1]);

          // For now, use cardNumber as temporary ID - we'll fix mapping later
          const tempCardId = cardNumber;

          // Get product details
          const productName = $(elem).find('img').attr('alt') || $(elem).text().trim();
          const priceText = $(elem).closest('.product-item').find('.price').text().trim();
          const stockText = $(elem).closest('.product-item').find('.stock').text().trim();

          // Extract price (HKD)
          const priceMatch = priceText.match(/HK\$?(\d+)/);
          const price = priceMatch ? parseInt(priceMatch[1]) : 0;

          // Extract stock
          const stockMatch = stockText.match(/(\d+)/);
          const stockQuantity = stockMatch ? parseInt(stockMatch[1]) : 0;

          // Check if sold out
          const isSoldOut = $(elem).closest('.product-item').find('.sold-out').length > 0;

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
              cardName: productName.replace(new RegExp(`^${expansion}-\\d+-\\d+-\\s*`), '').trim(),
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
    console.log(`Saved ${productsFound} products for ${expansion}`);

    return productsFound;

  } catch (error) {
    if (error.response?.status === 429 && retryCount < 3) {
      const waitTime = Math.pow(2, retryCount) * 10000; // Exponential backoff: 10s, 20s, 40s
      console.log(`429 Too Many Requests for ${expansion}. Retrying in ${waitTime/1000}s... (attempt ${retryCount + 1}/3)`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return downloadExpansion(expansion, retryCount + 1);
    }

    console.error(`Error downloading ${expansion} (attempt ${retryCount + 1}):`, error.message);
    return 0;
  }
}

async function downloadAllMissingExpansions() {
  console.log('Starting download of all missing expansions...\n');
  console.log('Rate limiting: 5-10 seconds between expansions to prevent 429 errors\n');

  let totalProducts = 0;

  for (let i = 0; i < missingExpansions.length; i++) {
    const expansion = missingExpansions[i];
    console.log(`\n[${i + 1}/${missingExpansions.length}] Processing ${expansion}...`);

    const products = await downloadExpansion(expansion);
    totalProducts += products;

    // Longer delay between expansions to prevent 429 errors
    if (i < missingExpansions.length - 1) {
      const waitTime = 5000 + Math.random() * 5000; // 5-10 seconds random delay
      console.log(`Waiting ${Math.round(waitTime/1000)} seconds before next expansion...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  console.log(`\n=== DOWNLOAD COMPLETE ===`);
  console.log(`Downloaded ${missingExpansions.length} expansions`);
  console.log(`Total products added: ${totalProducts}`);
}

downloadAllMissingExpansions();