const axios = require('axios');
const cheerio = require('cheerio');

async function getExpansionsFromCollection(collectionUrl) {
  try {
    console.log(`Fetching expansions from ${collectionUrl}...`);

    const response = await axios.get(`https://beehivetcg.com${collectionUrl}`);
    const $ = cheerio.load(response.data);

    const expansions = new Set();

    // Look for product links with expansion codes
    $('a[href*="/products/"]').each((i, elem) => {
      const href = $(elem).attr('href');
      if (href && href.includes('/products/')) {
        // Extract expansion code from URL pattern like /products/sv10f-001-063-...
        const match = href.match(/\/products\/([^\/]+)-\d+-\d+-/);
        if (match) {
          const expansionCode = match[1];
          expansions.add(expansionCode);
        }
      }
    });

    return Array.from(expansions);

  } catch (error) {
    console.error(`Error fetching ${collectionUrl}:`, error.message);
    return [];
  }
}

async function getAllPokemonExpansions() {
  const pokemonCollections = [
    '/collections/pokemon-tcg-%E6%97%A5%E6%96%87%E7%89%88', // Japanese
    '/collections/pokemon-tcg-english-version', // English
    '/collections/pkmjpsv8a', // Japanese singles
    '/collections/sv8-5-pre-prismatic-evolutions' // English singles
  ];

  const allExpansions = new Set();

  for (const collection of pokemonCollections) {
    const expansions = await getExpansionsFromCollection(collection);
    expansions.forEach(exp => allExpansions.add(exp));
    console.log(`Found ${expansions.length} expansions in ${collection}`);
  }

  const sortedExpansions = Array.from(allExpansions).sort();
  console.log(`\nTotal unique Pokemon TCG expansions found: ${sortedExpansions.length}`);
  sortedExpansions.forEach(exp => console.log(`  - ${exp}`));

  return sortedExpansions;
}

getAllPokemonExpansions();