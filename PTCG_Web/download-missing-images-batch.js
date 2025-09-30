const fs = require('fs');
const path = require('path');
const https = require('https');
const Papa = require('papaparse');

// Configuration
const CSV_FILE = path.join(__dirname, 'source', 'cards_output_all_mega.csv');
const CARDS_DIR = path.join(__dirname, 'cards');
const MAX_CONCURRENT_DOWNLOADS = 3;
const DOWNLOAD_DELAY = 200; // ms between batches to be respectful

// Ensure cards directory exists
if (!fs.existsSync(CARDS_DIR)) {
    fs.mkdirSync(CARDS_DIR, { recursive: true });
}

// Function to download a single image
function downloadImage(url, filepath, cardName) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);
        
        const request = https.get(url, (response) => {
            if (response.statusCode === 200) {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    resolve({ success: true, filename: path.basename(filepath), cardName });
                });
            } else {
                fs.unlink(filepath, () => {}); // Delete the file on error
                reject(new Error(`HTTP ${response.statusCode}: ${url}`));
            }
        });

        request.on('error', (err) => {
            fs.unlink(filepath, () => {}); // Delete the file on error
            reject(err);
        });

        file.on('error', (err) => {
            fs.unlink(filepath, () => {}); // Delete the file on error
            reject(err);
        });
    });
}

// Function to sleep for a given number of milliseconds
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Function to process downloads in batches
async function downloadMissingImages() {
    try {
        console.log('📖 Reading card data from CSV...');
        
        // Read and parse CSV file
        const csvContent = fs.readFileSync(CSV_FILE, 'utf-8');
        const result = Papa.parse(csvContent, {
            header: true,
            skipEmptyLines: true
        });

        const cards = result.data;
        console.log(`Found ${cards.length} cards in CSV`);

        // Get existing image files
        const existingFiles = new Set();
        if (fs.existsSync(CARDS_DIR)) {
            const files = fs.readdirSync(CARDS_DIR);
            files.forEach(file => {
                if (file.endsWith('.png')) {
                    existingFiles.add(file);
                }
            });
        }
        console.log(`Found ${existingFiles.size} existing image files`);

        // Find missing images
        const missingImages = [];
        for (const card of cards) {
            const cardId = card.WebCardID;
            const imageUrl = card.ImageURL;
            
            if (cardId && imageUrl) {
                const filename = `hk${cardId.toString().padStart(8, '0')}.png`;
                
                if (!existingFiles.has(filename)) {
                    missingImages.push({
                        cardId,
                        filename,
                        url: imageUrl,
                        cardName: card.Name || `Card #${cardId}`
                    });
                }
            }
        }

        console.log(`\n🔍 Found ${missingImages.length} missing images to download`);
        
        if (missingImages.length === 0) {
            console.log('✅ All images are already downloaded!');
            return;
        }

        // Show first few missing images
        console.log('\nFirst few missing images:');
        missingImages.slice(0, 10).forEach(img => {
            console.log(`  - ${img.filename} (${img.cardName})`);
        });

        console.log(`\n🚀 Starting download of ${missingImages.length} images...`);
        console.log(`📊 Progress will be shown below:\n`);

        let downloaded = 0;
        let failed = 0;
        const total = missingImages.length;

        // Process downloads in batches
        for (let i = 0; i < missingImages.length; i += MAX_CONCURRENT_DOWNLOADS) {
            const batch = missingImages.slice(i, i + MAX_CONCURRENT_DOWNLOADS);
            
            const downloadPromises = batch.map(image => {
                const filepath = path.join(CARDS_DIR, image.filename);
                return downloadImage(image.url, filepath, image.cardName)
                    .then(result => {
                        downloaded++;
                        console.log(`✓ Downloaded: ${result.filename} (${result.cardName})`);
                        console.log(`📈 Progress: ${downloaded}/${total} (${((downloaded/total)*100).toFixed(1)}%)`);
                        return result;
                    })
                    .catch(error => {
                        failed++;
                        console.error(`❌ Failed: ${image.filename} (${image.cardName}) - ${error.message}`);
                        return { success: false, filename: image.filename, error: error.message };
                    });
            });

            // Wait for all downloads in this batch to complete
            await Promise.allSettled(downloadPromises);
            
            // Small delay between batches to be respectful to the server
            if (i + MAX_CONCURRENT_DOWNLOADS < missingImages.length) {
                await sleep(DOWNLOAD_DELAY);
            }

            // Show batch completion
            console.log(`🔄 Batch ${Math.floor(i / MAX_CONCURRENT_DOWNLOADS) + 1}/${Math.ceil(missingImages.length / MAX_CONCURRENT_DOWNLOADS)} completed\n`);
        }

        console.log(`\n✅ Download complete!`);
        console.log(`📊 Summary:`);
        console.log(`   - Total images: ${total}`);
        console.log(`   - Successfully downloaded: ${downloaded}`);
        console.log(`   - Failed: ${failed}`);
        console.log(`   - Success rate: ${((downloaded/total)*100).toFixed(1)}%`);
        
        if (failed > 0) {
            console.log(`\n⚠️  Some downloads failed. You can run this script again to retry failed downloads.`);
        }

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

// Run the download process
console.log('🎴 Pokemon Card Image Downloader (Batch Version)');
console.log('=================================================\n');

downloadMissingImages()
    .then(() => {
        console.log('\n🎉 All done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Fatal error:', error);
        process.exit(1);
    });