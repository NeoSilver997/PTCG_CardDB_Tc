#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
const Papa = require('papaparse');

// Path to the CSV file
const csvPath = 'X:\\Document\\PokemonDBDownload\\cards_output_all_mega_with_effects_smart_merged_final_success_with_ability_stats_rated_with_damage.csv';

// Path to the cards directory
const cardsDir = path.join(__dirname, 'public', 'cards');

// Ensure cards directory exists
if (!fs.existsSync(cardsDir)) {
  fs.mkdirSync(cardsDir, { recursive: true });
}

// Function to download a file
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    const request = https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        return;
      }

      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(filepath);
      });
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

// Read and parse CSV
fs.readFile(csvPath, 'utf8', (err, csvData) => {
  if (err) {
    console.error('Error reading CSV file:', err);
    return;
  }

  Papa.parse(csvData, {
    header: true,
    skipEmptyLines: true,
    complete: async (results) => {
      console.log(`Found ${results.data.length} cards to process`);

      let downloaded = 0;
      let skipped = 0;
      let errors = 0;

      for (const card of results.data) {
        const imageUrl = card.ImageURL;
        if (!imageUrl || !imageUrl.startsWith('https://')) {
          skipped++;
          continue;
        }

        // Extract filename from URL
        const urlParts = imageUrl.split('/');
        const filename = urlParts[urlParts.length - 1];
        const filepath = path.join(cardsDir, filename);

        // Check if file already exists
        if (fs.existsSync(filepath)) {
          console.log(`Skipping ${filename} (already exists)`);
          skipped++;
          continue;
        }

        try {
          console.log(`Downloading ${filename}...`);
          await downloadImage(imageUrl, filepath);
          downloaded++;
          console.log(`✓ Downloaded ${filename}`);
        } catch (error) {
          console.error(`✗ Failed to download ${filename}:`, error.message);
          errors++;
        }

        // Add a small delay to be respectful to the server
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log('\n=== Download Summary ===');
      console.log(`Downloaded: ${downloaded}`);
      console.log(`Skipped: ${skipped}`);
      console.log(`Errors: ${errors}`);
      console.log(`Total: ${results.data.length}`);
    },
    error: (error) => {
      console.error('Error parsing CSV:', error);
    }
  });
});