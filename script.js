// Pokemon Card Database Script

// Global variables
let allCards = [];
let filteredCards = [];
let attributeFilters = new Set();
let expansionFilters = new Set();
let hpMinFilter = 0;
let hpMaxFilter = 1000;
let nameFilter = '';

// DOM elements
const cardsContainer = document.getElementById('cards-container');
const loadingElement = document.getElementById('loading');
const noResultsElement = document.getElementById('no-results');
const attributeFiltersContainer = document.getElementById('attribute-filters');
const expansionFiltersContainer = document.getElementById('expansion-filters');
const hpMinInput = document.getElementById('hp-min');
const hpMaxInput = document.getElementById('hp-max');
const nameSearchInput = document.getElementById('name-search');
const applyFiltersButton = document.getElementById('apply-filters');
const resetFiltersButton = document.getElementById('reset-filters');
const cardModal = document.getElementById('card-modal');
const modalCardDetails = document.getElementById('modal-card-details');
const closeModalButton = document.querySelector('.close');

// Initialize the application
async function initApp() {
    try {
        // Load the CSV data
        const cards = await loadCardData();
        allCards = cards;
        filteredCards = [...allCards];
        
        // Populate filter options
        populateFilterOptions();
        
        // Display all cards initially
        displayCards(filteredCards);
        
        // Set up event listeners
        setupEventListeners();
        
        // Hide loading indicator
        loadingElement.style.display = 'none';
    } catch (error) {
        console.error('Error initializing app:', error);
        loadingElement.textContent = 'Error loading cards. Please try again later.';
    }
}

// Load card data from CSV file
async function loadCardData() {
    try {
        const response = await fetch('masterdb/all_cards.json');
        const cards = await response.json();
        return cards;
    } catch (error) {
        console.error('Error loading JSON data:', error);
        throw error;
    }
}

// Parse CSV data into an array of card objects
// JSON data is already parsed by fetch

// Populate filter options based on card data
function populateFilterOptions() {
    // Get unique attributes and expansions
    const attributes = new Set();
    const expansions = new Set();
    
    allCards.forEach(card => {
        if (card.Attribute) attributes.add(card.Attribute);
        if (card.Expansion) expansions.add(card.Expansion);
    });
    
    // Create attribute filter checkboxes
    attributes.forEach(attribute => {
        const filterOption = createFilterOption(attribute, 'attribute');
        attributeFiltersContainer.appendChild(filterOption);
    });
    
    // Create expansion filter checkboxes
    expansions.forEach(expansion => {
        const filterOption = createFilterOption(expansion, 'expansion');
        expansionFiltersContainer.appendChild(filterOption);
    });
}

// Create a filter option checkbox
function createFilterOption(value, type) {
    const div = document.createElement('div');
    div.className = 'filter-option';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `${type}-${value}`;
    checkbox.value = value;
    checkbox.dataset.filterType = type;
    
    const label = document.createElement('label');
    label.htmlFor = `${type}-${value}`;
    label.textContent = value;
    
    div.appendChild(checkbox);
    div.appendChild(label);
    
    return div;
}

// Set up event listeners
function setupEventListeners() {
    // Apply filters button
    applyFiltersButton.addEventListener('click', applyFilters);
    
    // Reset filters button
    resetFiltersButton.addEventListener('click', resetFilters);
    
    // Close modal
    closeModalButton.addEventListener('click', () => {
        cardModal.style.display = 'none';
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === cardModal) {
            cardModal.style.display = 'none';
        }
    });
    
    // Name search input (apply filter on enter key)
    nameSearchInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            applyFilters();
        }
    });
}

// Apply all filters
function applyFilters() {
    // Get selected attribute filters
    attributeFilters.clear();
    document.querySelectorAll('#attribute-filters input:checked').forEach(checkbox => {
        attributeFilters.add(checkbox.value);
    });
    
    // Get selected expansion filters
    expansionFilters.clear();
    document.querySelectorAll('#expansion-filters input:checked').forEach(checkbox => {
        expansionFilters.add(checkbox.value);
    });
    
    // Get HP range filters
    hpMinFilter = hpMinInput.value ? parseInt(hpMinInput.value) : 0;
    hpMaxFilter = hpMaxInput.value ? parseInt(hpMaxInput.value) : 1000;
    
    // Get name search filter
    nameFilter = nameSearchInput.value.trim().toLowerCase();
    
    // Apply filters to cards
    filteredCards = allCards.filter(card => {
        // Filter by attribute
        if (attributeFilters.size > 0 && !attributeFilters.has(card.Attribute)) {
            return false;
        }
        
        // Filter by expansion
        if (expansionFilters.size > 0 && !expansionFilters.has(card.Expansion)) {
            return false;
        }
        
        // Filter by HP range
        const hp = parseInt(card.HP) || 0;
        if (hp < hpMinFilter || hp > hpMaxFilter) {
            return false;
        }
        
        // Filter by name
        if (nameFilter && !card.Name.toLowerCase().includes(nameFilter)) {
            return false;
        }
        
        return true;
    });
    
    // Display filtered cards
    displayCards(filteredCards);
}

// Reset all filters
function resetFilters() {
    // Clear attribute filters
    document.querySelectorAll('#attribute-filters input').forEach(checkbox => {
        checkbox.checked = false;
    });
    attributeFilters.clear();
    
    // Clear expansion filters
    document.querySelectorAll('#expansion-filters input').forEach(checkbox => {
        checkbox.checked = false;
    });
    expansionFilters.clear();
    
    // Clear HP range filters
    hpMinInput.value = '';
    hpMaxInput.value = '';
    hpMinFilter = 0;
    hpMaxFilter = 1000;
    
    // Clear name search filter
    nameSearchInput.value = '';
    nameFilter = '';
    
    // Reset filtered cards to all cards
    filteredCards = [...allCards];
    
    // Display all cards
    displayCards(filteredCards);
}

// Display cards in the container
function displayCards(cards) {
    // Clear the container
    cardsContainer.innerHTML = '';
    
    // Show no results message if no cards match filters
    if (cards.length === 0) {
        noResultsElement.style.display = 'block';
        return;
    }
    
    // Hide no results message
    noResultsElement.style.display = 'none';
    
    // Create and append card elements
    cards.forEach(card => {
        const cardElement = createCardElement(card);
        cardsContainer.appendChild(cardElement);
    });
}

// Create a card element
function createCardElement(card) {
    const cardElement = document.createElement('div');
    cardElement.className = 'card';
    cardElement.dataset.cardId = card['Web Card ID'];
    
    // Add click event to show card details
    cardElement.addEventListener('click', () => showCardDetails(card));
    
    // Card image
    const imageElement = document.createElement('img');
    imageElement.className = 'card-image';
    imageElement.src = card['Image URL'];
    imageElement.alt = card.Name;
    imageElement.loading = 'lazy'; // Lazy load images
    
    // Card info
    const infoElement = document.createElement('div');
    infoElement.className = 'card-info';
    
    // Card name
    const nameElement = document.createElement('div');
    nameElement.className = 'card-name';
    nameElement.textContent = card.Name;
    
    // Card type/attribute
    const typeElement = document.createElement('div');
    typeElement.className = `card-type ${card.Attribute}`;
    typeElement.textContent = card.Attribute;
    
    // Card expansion
    const expansionElement = document.createElement('div');
    expansionElement.className = 'card-expansion';
    expansionElement.textContent = card.Expansion;
    
    // Card HP
    const hpElement = document.createElement('div');
    hpElement.className = 'card-hp';
    hpElement.textContent = `HP: ${card.HP}`;
    
    // Append elements
    infoElement.appendChild(nameElement);
    infoElement.appendChild(typeElement);
    infoElement.appendChild(expansionElement);
    infoElement.appendChild(hpElement);
    
    cardElement.appendChild(imageElement);
    cardElement.appendChild(infoElement);
    
    return cardElement;
}

// Show card details in modal
function showCardDetails(card) {
    // Clear previous content
    modalCardDetails.innerHTML = '';
    
    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-card';
    
    // Card image
    const imageContainer = document.createElement('div');
    imageContainer.className = 'modal-card-image';
    const image = document.createElement('img');
    image.src = card['Image URL'];
    image.alt = card.Name;
    imageContainer.appendChild(image);
    
    // Card details
    const detailsContainer = document.createElement('div');
    detailsContainer.className = 'modal-card-details';
    
    // Card name
    const nameElement = document.createElement('h2');
    nameElement.className = 'modal-card-name';
    nameElement.textContent = card.Name;
    
    // Card info
    const infoElement = document.createElement('div');
    infoElement.className = 'modal-card-info';
    
    // Add basic info
    infoElement.innerHTML = `
        <p><strong>Type:</strong> ${card.Attribute || 'N/A'}</p>
        <p><strong>Expansion:</strong> ${card.Expansion || 'N/A'}</p>
        <p><strong>Number:</strong> ${card.Number || 'N/A'}</p>
        <p><strong>HP:</strong> ${card.HP || 'N/A'}</p>
        <p><strong>Weakness:</strong> ${card.Weakness || 'N/A'}</p>
        <p><strong>Resistance:</strong> ${card.Resistance || 'N/A'}</p>
        <p><strong>Retreat Cost:</strong> ${card.Retreat_Cost || 'N/A'}</p>
    `;
    
    // Add attacks if available
    if (card.Skill1_Name || card.Skill2_Name) {
        const attacksElement = document.createElement('div');
        attacksElement.className = 'modal-card-attacks';
        attacksElement.innerHTML = '<h3>Attacks</h3>';
        
        // Skill 1
        if (card.Skill1_Name && card.Skill1_Name !== 'N/A') {
            const attack1 = document.createElement('div');
            attack1.className = 'attack';
            attack1.innerHTML = `
                <div>
                    <span class="attack-name">${card.Skill1_Name}</span>
                    <span class="attack-cost">${card.Skill1_Cost || ''}</span>
                </div>
                <div class="attack-damage">${card.Skill1_Damage || ''}</div>
                <div class="attack-effect">${card.Skill1_Effect || ''}</div>
            `;
            attacksElement.appendChild(attack1);
        }
        
        // Skill 2
        if (card.Skill2_Name && card.Skill2_Name !== 'N/A') {
            const attack2 = document.createElement('div');
            attack2.className = 'attack';
            attack2.innerHTML = `
                <div>
                    <span class="attack-name">${card.Skill2_Name}</span>
                    <span class="attack-cost">${card.Skill2_Cost || ''}</span>
                </div>
                <div class="attack-damage">${card.Skill2_Damage || ''}</div>
                <div class="attack-effect">${card.Skill2_Effect || ''}</div>
            `;
            attacksElement.appendChild(attack2);
        }
        
        detailsContainer.appendChild(attacksElement);
    }
    
    // Add ability if available
    if (card['[特性]'] && card['[特性]'] !== '') {
        const abilityElement = document.createElement('div');
        abilityElement.className = 'modal-card-ability';
        abilityElement.innerHTML = `
            <h3>Ability</h3>
            <div class="ability">
                <div class="ability-effect">${card['[特性]']}</div>
            </div>
        `;
        detailsContainer.appendChild(abilityElement);
    }
    
    // Add Pokemon info if available
    if (card.Pokemon_Info && card.Pokemon_Info !== '') {
        const infoTextElement = document.createElement('div');
        infoTextElement.className = 'modal-card-pokemon-info';
        infoTextElement.innerHTML = `
            <h3>Pokemon Info</h3>
            <div class="pokemon-info-text">${card.Pokemon_Info}</div>
        `;
        detailsContainer.appendChild(infoTextElement);
    }
    
    // Add artist info if available
    if (card.Artist && card.Artist !== '') {
        const artistElement = document.createElement('div');
        artistElement.className = 'modal-card-artist';
        artistElement.innerHTML = `<p><strong>Artist:</strong> ${card.Artist}</p>`;
        detailsContainer.appendChild(artistElement);
    }
    
    // Add card URL if available
    if (card['Card URL'] && card['Card URL'] !== '') {
        const urlElement = document.createElement('div');
        urlElement.className = 'modal-card-url';
        urlElement.innerHTML = `<p><a href="${card['Card URL']}" target="_blank">View on Official Site</a></p>`;
        detailsContainer.appendChild(urlElement);
    }
    
    // Append elements to modal content
    detailsContainer.insertBefore(nameElement, detailsContainer.firstChild);
    detailsContainer.insertBefore(infoElement, detailsContainer.children[1]);
    
    modalContent.appendChild(imageContainer);
    modalContent.appendChild(detailsContainer);
    
    modalCardDetails.appendChild(modalContent);
    
    // Show modal
    cardModal.style.display = 'block';
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);