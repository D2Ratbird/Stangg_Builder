class DisplayManager {
    constructor() {
        this.resultsContainer = document.getElementById('searchResults');
        this.resultsOverlay = document.getElementById('resultsOverlay');
        this.cardPreview = document.getElementById('cardPreview');
        this.previewImage = document.getElementById('previewImage');
        this.previewManager = new PreviewManager();
        this.variantManager = new VariantManager();
        this.progressBar = this.createProgressBar();
    }

    createProgressBar() {
        const progressContainer = document.createElement('div');
        progressContainer.className = 'progress-container';
        
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        
        const progressText = document.createElement('div');
        progressText.className = 'progress-text';
        
        progressContainer.appendChild(progressBar);
        progressContainer.appendChild(progressText);
        this.resultsContainer.parentElement.prepend(progressContainer);
        
        return { bar: progressBar, text: progressText, container: progressContainer };
    }

    initialize() {
        this.setupEventListeners();
        this.setupViewToggle();
        
        document.addEventListener('searchProgress', (event) => {
            console.log('DisplayManager received searchProgress event:', event.detail);
            console.log('Filter search progress:', event.detail);
            console.log('Results structure:', event.detail.results);
            const { results, progress } = event.detail;
            this.updateProgress(progress);
            this.displaySearchResults(results);
        });
    }
    

    updateProgress({ current, total }) {
        const percentage = (current / total) * 100;
        this.progressBar.bar.style.width = `${percentage}%`;
        this.progressBar.text.textContent = `Loading ${current} of ${total} cards`;
        
        if (current === total) {
            setTimeout(() => {
                this.progressBar.container.style.display = 'none';
            }, 1000);
        } else {
            this.progressBar.container.style.display = 'block';
        }
    }
   
    setupEventListeners() {
    // Close button handlers
    document.querySelectorAll('.close-button').forEach(button => {
    button.addEventListener('click', () => this.hideOverlays());
    });
   
    // Click outside modal to close
    this.resultsOverlay.addEventListener('click', (e) => {
    if (e.target === this.resultsOverlay) {
    this.hideOverlays();
    }
    });
    }
   
    displaySearchResults(results) {
        console.log('DisplayManager displaying results:', results);
        this.resultsContainer.innerHTML = '';
        this.resultsOverlay.style.display = 'block';
        
        // Clear existing counter and add new one
        const modalHeader = this.resultsContainer.parentElement.querySelector('.modal-header');
        const existingCounter = modalHeader.querySelector('.results-counter');
        if (existingCounter) {
            existingCounter.remove();
        }
        
        const counterDiv = document.createElement('div');
        counterDiv.className = 'results-counter';
        counterDiv.textContent = `Found ${results.name.length} cards`;
        modalHeader.appendChild(counterDiv);
    
        results.name.forEach(card => {
            const cardElement = this.createCardElement(card);
            this.resultsContainer.appendChild(cardElement);
        });
    }
   
    setupViewToggle() {
    const viewToggle = document.getElementById('viewToggle');
    if (viewToggle) {
    viewToggle.addEventListener('click', () => {
    const currentView = this.resultsContainer.classList.contains('grid-view') ? 'list' : 'grid';
    this.resultsContainer.classList.remove('grid-view', 'list-view');
    this.resultsContainer.classList.add(`${currentView}-view`);
    viewToggle.textContent = `Switch to ${currentView === 'grid' ? 'list' : 'grid'} view`;
    });
    }
    }
   
    createCardElement(card) {
        console.log('Creating element for card:', card.name)
        const div = document.createElement('div');
        div.className = 'card-item';
        
        const img = document.createElement('img');
        img.className = 'card-image';
        
        // Better image handling
        if (card.image_uris?.normal) {
            img.src = card.image_uris.normal;
        } else if (card.card_faces && card.card_faces[0].image_uris) {
            img.src = card.card_faces[0].image_uris.normal;
        } else {
            img.src = '/assets/card-back.jpg';  // Create this directory and add a MTG card back image
        }
        img.alt = card.name;
        
        const name = document.createElement('div');
        name.className = 'card-name';
        name.textContent = card.flavor_name 
            ? `${card.flavor_name} (${card.name})`
            : card.name;
        
        div.addEventListener('click', () => this.previewManager.showPreview(card));
        
        div.appendChild(img);
        div.appendChild(name);
        return div;
    }
   
    flipCard(card) {
    // Implementation for flipping double-faced cards
    const currentFace = this.cardPreview.querySelector('img').src.includes(card.card_faces[0].image_uris.large) ? 1 : 0;
    this.cardPreview.querySelector('img').src = card.card_faces[currentFace].image_uris.large;
    }
   
    hidePreview() {
    this.cardPreview.style.display = 'none';
    }
   
    hideOverlays() {
    this.resultsOverlay.style.display = 'none';
    this.cardPreview.style.display = 'none';
    }
} 
   
class PreviewManager {
    constructor() {
    this.previewElement = document.getElementById('cardPreview');
    this.imageContainer = this.previewElement.querySelector('.card-image-container');
    this.detailsContainer = this.previewElement.querySelector('.card-details');
    this.previewImage = this.imageContainer.querySelector('img');
    this.variantManager = new VariantManager();
    this.previewElement.style.display = 'none';
    const closeButton = this.previewElement.querySelector('.close-preview');
    closeButton.addEventListener('click', () => {
        this.previewElement.style.display = 'none';
    });
    }
    
   showPreview(card) {
    this.clearExistingButtons();
    this.updateCardImage(card);
    this.updateCardDetails(card);
    this.handleDualFaces(card);
    this.addVariantsButton(card);
    this.updateLegalities(card);
    this.updatePriceInfo(card);
    this.previewElement.style.display = 'block';
    }
    
   clearExistingButtons() {
    const existingButtons = this.imageContainer.querySelectorAll('.show-variants, .flip-card-button');
    existingButtons.forEach(button => button.remove());
    }
    
   updateCardImage(card) {
    const imageUrl = card.card_faces 
   ? card.card_faces[0].image_uris.normal 
   : card.image_uris.normal;
    this.previewImage.src = imageUrl;
    }
    
   updateCardDetails(card) {
    const displayName = card.flavor_name 
   ? `${card.flavor_name} (${card.name})`
    : card.name;
    
   this.detailsContainer.querySelector('.card-name').textContent = displayName;
    
   // For double-faced cards, get mana cost from first face
    const manaCost = card.card_faces 
   ? card.card_faces[0].mana_cost 
   : card.mana_cost;
    
   this.detailsContainer.querySelector('.mana-info').innerHTML = `
    <div>Mana Cost: ${formatManaText(manaCost || '')}</div>
    <div>CMC: ${card.cmc || '0'}</div>
    `;
    
   // Similarly for oracle text
    const oracleText = card.card_faces 
   ? card.card_faces[0].oracle_text 
   : card.oracle_text;
    
   this.detailsContainer.querySelector('.oracle-text').innerHTML = 
   formatManaText(oracleText || '');
    }
    
    handleDualFaces(card) {
        if (!card.card_faces) return;
    
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'button-container';
    
        const flipButton = document.createElement('button');
        flipButton.className = 'flip-card-button';
        flipButton.textContent = '↻ Flip';
    
        let showingFront = true;
        flipButton.onclick = (e) => {
            e.stopPropagation();
            showingFront = !showingFront;
            const face = card.card_faces[showingFront ? 0 : 1];
            this.previewImage.src = face.image_uris.normal;
            this.updateCardDetails(card, showingFront ? 0 : 1);
        };
    
        buttonContainer.appendChild(flipButton);
        this.imageContainer.appendChild(buttonContainer);
    }
    
    addVariantsButton(card) {
        const variantsButton = document.createElement('button');
        variantsButton.className = 'show-variants';
        variantsButton.textContent = 'Show Variants';
        variantsButton.onclick = async (e) => {
            e.stopPropagation();
            const variants = await this.fetchVariants(card.name);
            if (variants) {
                this.variantManager.showVariants(variants);
            }
        };
        
        let buttonContainer = this.imageContainer.querySelector('.button-container');
        if (!buttonContainer) {
            buttonContainer = document.createElement('div');
            buttonContainer.className = 'button-container';
            this.imageContainer.appendChild(buttonContainer);
        }
        
        buttonContainer.appendChild(variantsButton);
    }    
    
   updateLegalities(card) {
    const legalitiesContainer = this.detailsContainer.querySelector('.legalities-container');
    legalitiesContainer.innerHTML = '';
    
   Object.entries(card.legalities).forEach(([format, status]) => {
    const formatDiv = document.createElement('div');
    formatDiv.className = `format-legality ${status}`;
    formatDiv.textContent = `${format}: ${status}`;
    legalitiesContainer.appendChild(formatDiv);
    });
    }
    
    async fetchVariants(cardName) {
        try {
            await globalRateLimiter.throttle();
            const cleanCardName = cardName.split('//')[0].trim();
            const response = await fetch(
                `https://api.scryfall.com/cards/search?q=!"${encodeURIComponent(cleanCardName)}" unique:prints`
            );
            const data = await response.json();
            return data.data;
        } catch (error) {
            console.error('Error fetching variants:', error);
            return null;
        }
    }
   
    async updatePriceInfo(card) {
        const formattedPrices = await this.formatPrices(card);
        
        const priceInfo = this.detailsContainer.querySelector('.price-info');
        priceInfo.innerHTML = `
            <h3>Prices</h3>
            <div class="current-prices">
                ${formattedPrices}
            </div>
        `;
    }
    
   findCheapestPrice(variants) {
    return variants.reduce((cheapest, variant) => {
    const prices = [
    parseFloat(variant.prices.usd) || Infinity,
    parseFloat(variant.prices.usd_foil) || Infinity,
    parseFloat(variant.prices.usd_etched) || Infinity
    ];
    const variantMin = Math.min(...prices);
    return Math.min(cheapest, variantMin);
    }, Infinity);
    }

    async formatPrices(card) {
        const prices = [];
        const variants = await this.fetchVariants(card.name);
        
        if (card.flavor_name) {
            // Keep existing flavor card logic
            const flavorVersions = variants.filter(v => v.flavor_name);
            const cheapestFlavor = this.findCheapestPrice(flavorVersions);
            prices.push(`Cheapest Flavor Version: $${cheapestFlavor === Infinity ? 'N/A' : cheapestFlavor.toFixed(2)}`);
            
            const standardVersions = variants.filter(v => !v.flavor_name);
            const cheapestStandard = this.findCheapestPrice(standardVersions);
            prices.push(`Cheapest Standard Version: $${cheapestStandard === Infinity ? 'N/A' : cheapestStandard.toFixed(2)}`);
        } else {
            // For non-flavor cards, show only the cheapest price
            const cheapestPrice = this.findCheapestPrice(variants);
            prices.push(`Cheapest Available: $${cheapestPrice === Infinity ? 'N/A' : cheapestPrice.toFixed(2)}`);
        }
        
        return prices.join('<br>');
    }
    
   formatPrices(prices) {
    const priceTypes = {
    usd: 'Regular',
    usd_foil: 'Foil',
    usd_etched: 'Etched'
    };
    
   return Object.entries(priceTypes)
    .filter(([key]) => prices[key])
    .map(([key, label]) => `
    <div class="price-row">
    ${label}: $${parseFloat(prices[key]).toFixed(2)}
    </div>
    `).join('');
    } 
}
   
class VariantManager {
    constructor() {
    this.variantOverlay = null;
    }
    
   showVariants(variants) {
    this.createOverlay();
    this.populateVariants(variants);
    this.setupOverlayControls();
    }
    
   createOverlay() {
    this.variantOverlay = document.createElement('div');
    this.variantOverlay.className = 'variants-overlay filter-modal-overlay';
    this.variantOverlay.style.display = 'flex';
    
   const variantsModal = document.createElement('div');
    variantsModal.className = 'variants-modal filter-modal-content';
    
   const closeButton = document.createElement('button');
    closeButton.className = 'close-variants';
    closeButton.innerHTML = '&times;';
    
   const variantsGrid = document.createElement('div');
    variantsGrid.className = 'variants-grid';
    
   variantsModal.appendChild(closeButton);
    variantsModal.appendChild(variantsGrid);
    this.variantOverlay.appendChild(variantsModal);
    document.body.appendChild(this.variantOverlay);
    }
    
   populateVariants(variants) {
    const variantsGrid = this.variantOverlay.querySelector('.variants-grid');
    
   variants.forEach(variant => {
    const variantCard = this.createVariantCard(variant);
    variantsGrid.appendChild(variantCard);
    });
    }
    
   createVariantCard(variant) {
    const variantCard = document.createElement('div');
    variantCard.className = 'variant-card';
    
   const img = document.createElement('img');
    img.src = variant.image_uris?.normal || variant.card_faces?.[0]?.image_uris?.normal;
    
   const info = document.createElement('div');
    info.className = 'variant-info';
    
   const prices = this.getVariantPrices(variant);
    
   info.innerHTML = `
    <div class="variant-set">${variant.set_name}</div>
    ${prices.map(([type, price]) => `
    <div class="variant-price">
    ${type}: $${parseFloat(price).toFixed(2)}
    </div>
    `).join('')}
    `;
    
   variantCard.appendChild(img);
    variantCard.appendChild(info);
    return variantCard;
    }
    
   getVariantPrices(variant) {
    const prices = [];
    if (variant.prices.usd) prices.push(['Regular', variant.prices.usd]);
    if (variant.prices.usd_foil) prices.push(['Foil', variant.prices.usd_foil]);
    if (variant.prices.usd_etched) prices.push(['Etched', variant.prices.usd_etched]);
    return prices;
    }
    
   setupOverlayControls() {
    this.variantOverlay.addEventListener('click', (e) => {
    if (e.target === this.variantOverlay) {
    this.closeVariants();
    }
    });
    
   const closeButton = this.variantOverlay.querySelector('.close-variants');
    closeButton.onclick = (e) => {
    e.stopPropagation();
    this.closeVariants();
    };
    }
    
   closeVariants() {
    this.variantOverlay.remove();
    this.variantOverlay = null;
    }
}
