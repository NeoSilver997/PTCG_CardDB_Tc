#!/usr/bin/env node

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

class BeehiveTCGPriceScraper {
    constructor(expansionCode = 'sv8af') {
        this.baseUrl = 'https://beehivetcg.com';
        this.expansionCode = expansionCode.toUpperCase();
        // Special handling for MBF -> use mbdf in URL but MBDF in content
        const urlCode = expansionCode.toLowerCase() === 'mbf' ? 'mbf' : expansionCode.toLowerCase();
        this.collectionUrl = `https://beehivetcg.com/collections/${urlCode}`;
        this.marketPricesFile = path.join(__dirname, '..', 'data', 'market-prices.json');
        this.scrapedPrices = [];
        
        // Determine the pattern to search for based on expansion code
        this.cardPattern = this.getCardPattern(expansionCode);
    }
    
    getCardPattern(expansionCode) {
        const code = expansionCode.toUpperCase();
        // Return regex pattern for finding card titles with capturing group for card number
        if (code === 'MBF') {
            return /MBDF\s+(\d+)\/\d+/;
        } else {
            // For other expansions like M1LF, SV10F, etc.
            return new RegExp(`${code}\\s+(\\d+)\\/\\d+`);
        }
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async fetchPage(url) {
        try {
            console.log(`Fetching: ${url}`);
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1',
                },
                timeout: 10000
            });
            return response.data;
        } catch (error) {
            console.error(`Error fetching ${url}:`, error.message);
            return null;
        }
    }

    parseCardInfo(productElement, pageCheerio = null) {
        let $;
        if (pageCheerio) {
            $ = pageCheerio;
        } else {
            $ = cheerio.load(productElement);
        }

        // Extract product title and URL from the product element
        const productLink = $(productElement).find('a').first().attr('href');
        const productTitle = $(productElement).find('a').first().text().trim();

        console.log(`Processing product element. Title: "${productTitle}", Link: ${productLink}`);
        console.log(`Product element HTML length: ${productElement.length || productElement.toString().length}`);

        if (!productTitle || !productLink) {
            return null;
        }

        // Extract card ID from title (e.g., "M1LF 001/063 超級妙蛙花ex" -> 1)
        const cardIdMatch = productTitle.match(this.cardPattern);
        if (!cardIdMatch) {
            console.log(`Skipping non-card product: ${productTitle}`);
            return null;
        }

        const cardNumber = parseInt(cardIdMatch[1]);

        // Extract price - look within the product element itself
        let price = 0;
        let priceText = '';

        // Try to find price within the product element - look for SPAN elements containing HK$
        const spans = $(productElement).find('span');
        console.log(`Found ${spans.length} spans in product element`);
        for (let i = 0; i < spans.length; i++) {
            const spanText = $(spans[i]).text().trim();
            console.log(`Span ${i}: "${spanText}"`);
            if (spanText.startsWith('HK$')) {
                priceText = spanText;
                console.log(`Found price in span: ${priceText}`);
                break;
            }
        }

        // If still no price found, try other selectors
        if (!priceText) {
            const priceSelectors = [
                '.product-price',
                'span.product-price',
                '.price',
                'span.price',
                '.money',
                'span.money',
                '[class*="price"]',
                '[class*="money"]',
                '.price__current',
                '[data-price]',
                '.product-item-price',
                '.card-price',
                '.sale-price',
                '.regular-price'
            ];

            for (const selector of priceSelectors) {
                const element = $(productElement).find(selector).first();
                if (element.length > 0) {
                    priceText = element.text().trim();
                    if (priceText) {
                        console.log(`Found price with selector ${selector}: ${priceText}`);
                        break;
                    }
                }
            }
        }

        // If still no price found, try to extract from the entire product HTML
        if (!priceText) {
            const fullText = productElement;
            const hkPriceMatches = fullText.match(/HK\$[0-9,]+\.?[0-9]*/g);
            if (hkPriceMatches && hkPriceMatches.length > 0) {
                priceText = hkPriceMatches[0];
                console.log(`Found price from product HTML: ${priceText}`);
            }
        }

        // Parse the price
        const priceMatch = priceText.match(/HK\$([0-9,]+\.?[0-9]*)/);
        price = priceMatch ? parseFloat(priceMatch[1].replace(',', '')) : 0;

        if (price === 0 && priceText) {
            console.log(`Warning: Could not parse price from text: ${priceText}`);
        }

        // Extract stock status - look for "Sold Out" or stock quantity
        const isSoldOut = productElement.includes('Sold Out') || productElement.includes('售罄');
        let stockQuantity = 1; // Default to 1 if available

        // Try to find stock information
        const stockMatch = productElement.match(/庫存：(\d+)/) || productElement.match(/Stock:\s*(\d+)/i);
        if (stockMatch) {
            stockQuantity = parseInt(stockMatch[1]);
        } else if (isSoldOut) {
            stockQuantity = 0;
        }

        // Extract rarity from title
        const rarityMatch = productTitle.match(/\b(SAR|UR|SR|RR|ACE)\b/);
        const rarity = rarityMatch ? rarityMatch[1] : 'Unknown';

        // Extract card name (remove the expansion prefix and rarity suffix)
        let cardName = productTitle
            .replace(new RegExp(`^${this.expansionCode}\\s+\\d+\\/\\d+\\s*`), '') // Remove prefix
            .replace(/\s+(SAR|UR|SR|RR|ACE|MUR)$/, '') // Remove rarity suffix
            .replace(/\s*-\s*$/, '') // Remove trailing ' -'
            .trim();

        return {
            cardId: cardNumber,
            cardName: cardName,
            price: price,
            currency: 'HKD',
            rarity: rarity,
            stockQuantity: stockQuantity,
            isSoldOut: isSoldOut,
            productUrl: productLink.startsWith('http') ? productLink : `${this.baseUrl}${productLink}`,
            scrapedAt: new Date().toISOString()
        };
    }

    async scrapeCollectionPage(pageUrl) {
        const html = await this.fetchPage(pageUrl);
        if (!html) return [];

        const $ = cheerio.load(html);
        const products = [];

        // Find all elements containing card titles (expansion code followed by numbers)
        const titleElements = $('*').filter((i, el) => {
            const text = $(el).text().trim();
            return this.cardPattern.test(text);
        });

        console.log(`Found ${titleElements.length} title elements containing "${this.expansionCode}"`);

        titleElements.each((index, titleElement) => {
            const titleText = $(titleElement).text().trim();
            console.log(`Processing title ${index + 1}: "${titleText}"`);

            // Extract card ID from title
            const cardIdMatch = titleText.match(this.cardPattern);
            if (!cardIdMatch) {
                console.log(`Skipping invalid title: ${titleText}`);
                return;
            }

            const cardNumber = parseInt(cardIdMatch[1]);

            // Skip if we already processed this card
            const existingCard = products.find(p => p.cardId === cardNumber);
            if (existingCard) {
                console.log(`Skipping duplicate card ${cardNumber}`);
                return;
            }

            // Extract card name (everything after the card number)
            const nameMatch = titleText.match(new RegExp(`${this.expansionCode}\\s+\\d+\\/\\d+\\s+(.+)`));
            let cardName = nameMatch ? nameMatch[1].trim() : 'Unknown';
            
            // Clean card name
            cardName = cardName
                .replace(/\s+(SAR|UR|SR|RR|ACE|MUR)$/, '') // Remove rarity suffix
                .replace(/\s*-\s*$/, '') // Remove trailing ' -'
                .trim();

            // Find the price - look for SPAN elements containing HK$ in the vicinity of this title
            let price = 0;
            let foundPrice = false;

            // Start from the title element and search through siblings and nearby elements
            let currentElement = $(titleElement);
            let searchDepth = 0;
            const maxSearchDepth = 20; // Search up to 20 elements away

            while (searchDepth < maxSearchDepth && !foundPrice) {
                // Check current element and its children for price spans
                const priceSpans = currentElement.find('span').filter((i, span) => {
                    const spanText = $(span).text().trim();
                    return spanText.startsWith('HK$');
                });

                if (priceSpans.length > 0) {
                    const priceText = $(priceSpans.first()).text().trim();
                    const priceMatch = priceText.match(/HK\$([0-9,]+\.?[0-9]*)/);
                    if (priceMatch) {
                        price = parseFloat(priceMatch[1].replace(',', ''));
                        foundPrice = true;
                        console.log(`Found price for card ${cardNumber}: HK$${price}`);
                    }
                }

                // Move to next sibling
                currentElement = currentElement.next();
                searchDepth++;

                if (!currentElement.length) break;
            }

            // Extract rarity from title
            const rarityMatch = titleText.match(/\b(SAR|UR|SR|RR|ACE)\b/);
            const rarity = rarityMatch ? rarityMatch[1] : 'Unknown';

            // Extract stock status - look for "Sold Out" in nearby elements
            let stockQuantity = 1;
            let isSoldOut = false;

            // Search for "Sold Out" in nearby elements
            currentElement = $(titleElement);
            searchDepth = 0;
            while (searchDepth < maxSearchDepth) {
                const elementText = currentElement.text();
                if (elementText.includes('Sold Out') || elementText.includes('售罄')) {
                    isSoldOut = true;
                    stockQuantity = 0;
                    break;
                }

                // Check for stock quantity
                const stockMatch = elementText.match(/庫存：(\d+)/) || elementText.match(/Stock:\s*(\d+)/i);
                if (stockMatch) {
                    stockQuantity = parseInt(stockMatch[1]);
                    break;
                }

                currentElement = currentElement.next();
                searchDepth++;

                if (!currentElement.length) break;
            }

            const cardInfo = {
                cardId: cardNumber,
                cardName: cardName,
                price: price,
                rarity: rarity,
                stockQuantity: stockQuantity,
                isSoldOut: isSoldOut,
                expansionCode: 'SV8a'
            };

            products.push(cardInfo);
            console.log(`Found card: ${cardInfo.cardId} - ${cardInfo.cardName} - HK$${cardInfo.price}`);
        });

        return products;
    }

    async scrapeAllPages() {
        const allProducts = [];
        let pageNum = 1;
        let hasNextPage = true;

        while (hasNextPage && pageNum <= 20) { // Limit to 20 pages to avoid infinite loops
            const pageUrl = pageNum === 1 ? this.collectionUrl : `${this.collectionUrl}?page=${pageNum}`;
            console.log(`\n=== Scraping page ${pageNum} ===`);

            const products = await this.scrapeCollectionPage(pageUrl);
            allProducts.push(...products);

            // Check if there's a next page
            const nextPageHtml = await this.fetchPage(pageUrl);
            if (nextPageHtml) {
                const $ = cheerio.load(nextPageHtml);
                const nextLink = $('a[href*="page=' + (pageNum + 1) + '"], .pagination a:contains("下一頁"), .pagination a:contains("Next")').length > 0;
                hasNextPage = nextLink;
            } else {
                hasNextPage = false;
            }

            pageNum++;

            // Be respectful to the server
            if (hasNextPage) {
                console.log('Waiting 2 seconds before next page...');
                await this.delay(2000);
            }
        }

        return allProducts;
    }

    loadExistingMarketPrices() {
        try {
            if (fs.existsSync(this.marketPricesFile)) {
                const data = fs.readFileSync(this.marketPricesFile, 'utf8');
                return JSON.parse(data);
            }
        } catch (error) {
            console.error('Error loading existing market prices:', error);
        }
        return {};
    }

    saveMarketPrices(marketPrices) {
        try {
            // Ensure data directory exists
            const dataDir = path.dirname(this.marketPricesFile);
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }

            fs.writeFileSync(this.marketPricesFile, JSON.stringify(marketPrices, null, 2), 'utf8');
            console.log(`Market prices saved to ${this.marketPricesFile}`);
        } catch (error) {
            console.error('Error saving market prices:', error);
        }
    }

    convertToMarketPriceFormat(cardInfo) {
        const now = new Date().toISOString();
        return {
            cardId: cardInfo.cardId,
            price: cardInfo.price,
            currency: cardInfo.currency || 'HKD',
            source: 'BeehiveTCG',
            condition: 'Near Mint', // Assuming Near Mint for TCG singles
            date: cardInfo.scrapedAt || now,
            updatedAt: cardInfo.scrapedAt || now,
            metadata: {
                cardName: cardInfo.cardName,
                rarity: cardInfo.rarity,
                stockQuantity: cardInfo.stockQuantity,
                isSoldOut: cardInfo.isSoldOut,
                productUrl: cardInfo.productUrl || `https://beehivetcg.com/products/${this.expansionCode.toLowerCase()}-${cardInfo.cardId.toString().padStart(3, '0')}-063-${encodeURIComponent(cardInfo.cardName)}`
            }
        };
    }

    async scrapeAndSave() {
        console.log(`Starting Beehive TCG price scraping for expansion ${this.expansionCode}...`);
        console.log('Collection URL:', this.collectionUrl);

        // Scrape all products
        const scrapedProducts = await this.scrapeAllPages();
        console.log(`\nScraped ${scrapedProducts.length} products`);

        if (scrapedProducts.length === 0) {
            console.log('No products found. The page structure may have changed.');
            return;
        }

        // Load existing market prices
        const existingPrices = this.loadExistingMarketPrices();

        // Convert scraped data to market price format and merge
        let newPricesCount = 0;
        scrapedProducts.forEach(product => {
            const marketPrice = this.convertToMarketPriceFormat(product);
            const cardIdStr = product.cardId.toString();

            if (!existingPrices[cardIdStr]) {
                existingPrices[cardIdStr] = [];
            }

            // Check if we already have this price (avoid duplicates)
            const existingEntry = existingPrices[cardIdStr].find(
                p => p.source === 'BeehiveTCG' &&
                     p.date === marketPrice.date &&
                     p.price === marketPrice.price
            );

            if (!existingEntry) {
                existingPrices[cardIdStr].push(marketPrice);
                newPricesCount++;
                console.log(`Added price for card ${product.cardId}: HK$${product.price}`);
            }
        });

        // Save updated market prices
        this.saveMarketPrices(existingPrices);

        console.log(`\n=== Scraping Complete ===`);
        console.log(`Total products scraped: ${scrapedProducts.length}`);
        console.log(`New prices added: ${newPricesCount}`);
        console.log(`Market prices file updated: ${this.marketPricesFile}`);
    }
}

// Run the scraper if this script is executed directly
if (require.main === module) {
    // Get expansion code from command line arguments
    const expansionCode = process.argv[2] || 'sv8af';

    console.log(`Starting scraper for expansion: ${expansionCode.toUpperCase()}`);
    console.log(`Collection URL: https://beehivetcg.com/collections/${expansionCode}`);

    // Create a scraper instance with the specified expansion
    const scraper = new BeehiveTCGPriceScraper(expansionCode);
    scraper.scrapeAndSave().catch(console.error);
}

module.exports = BeehiveTCGPriceScraper;