const fs = require('fs');
const path = require('path');
const https = require('https');
const Papa = require('papaparse');

// Configuration
const CSV_FILE = path.join(__dirname, 'source', 'cards_output_all_mega.csv');
const CARDS_DIR = path.join(__dirname, 'cards');
const MAX_CONCURRENT_DOWNLOADS = 5;
const DOWNLOAD_DELAY = 100; // ms between downloads to be respectful

// Ensure cards directory exists
if (!fs.existsSync(CARDS_DIR)) {
    fs.mkdirSync(CARDS_DIR, { recursive: true });
}

// Function to download a single image
function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);
        
        const request = https.get(url, (response) => {
            if (response.statusCode === 200) {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    console.log(`✓ Downloaded: ${path.basename(filepath)}`);
                    resolve();
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

// Function to process downloads with concurrency control
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

        // Download with concurrency control
        const downloadQueue = [...missingImages];
        const activeDownloads = [];

        while (downloadQueue.length > 0 || activeDownloads.length > 0) {
            // Start new downloads up to the concurrent limit
            while (activeDownloads.length < MAX_CONCURRENT_DOWNLOADS && downloadQueue.length > 0) {
                const image = downloadQueue.shift();
                const filepath = path.join(CARDS_DIR, image.filename);
                
                const downloadPromise = downloadImage(image.url, filepath)
                    .then(() => {
                        downloaded++;
                        console.log(`📈 Progress: ${downloaded}/${total} (${((downloaded/total)*100).toFixed(1)}%) - Success: ${image.filename}`);
                    })
                    .catch((error) => {
                        failed++;
                        console.error(`❌ Failed: ${image.filename} - ${error.message}`);
                    });

                activeDownloads.push(downloadPromise);
            }

            // Wait for at least one download to complete
            if (activeDownloads.length > 0) {
                await Promise.race(activeDownloads);
                
                // Remove completed downloads
                for (let i = activeDownloads.length - 1; i >= 0; i--) {
                    if (activeDownloads[i].isCompleted) {
                        activeDownloads.splice(i, 1);
                    }
                }
                
                // Small delay to be respectful to the server
                if (downloadQueue.length > 0) {
                    await new Promise(resolve => setTimeout(resolve, DOWNLOAD_DELAY));
                }
            }
        }

        // Wait for all remaining downloads to complete
        await Promise.allSettled(activeDownloads);

        console.log(`\n✅ Download complete!`);
        console.log(`📊 Summary:`);
        console.log(`   - Total images: ${total}`);
        console.log(`   - Successfully downloaded: ${downloaded}`);
        console.log(`   - Failed: ${failed}`);
        
        if (failed > 0) {
            console.log(`\n⚠️  Some downloads failed. You can run this script again to retry failed downloads.`);
        }

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

// Run the download process
console.log('🎴 Pokemon Card Image Downloader');
console.log('================================\n');

downloadMissingImages()
    .then(() => {
        console.log('\n🎉 All done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Fatal error:', error);
        process.exit(1);
    });