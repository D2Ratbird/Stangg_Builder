class FilterManager {
    constructor() {
        this.tagFilter = new TagFilter();
        this.typeFilter = new TypeFilter();
        this.manaFilter = new ManaFilter();
        this.priceFilter = new PriceFilter();
        this.activeFilters = new Set();
    }

    setupFilterControls() {
        const filterOverlay = document.getElementById('filterOverlay');
        const openFiltersButton = document.getElementById('openFilters');
        const closeButton = filterOverlay.querySelector('.close-button');
        const combinedSearchButton = document.getElementById('combinedSearchButton');
    
        openFiltersButton.addEventListener('click', () => {
            filterOverlay.style.display = 'block';
        });
        
        closeButton.addEventListener('click', () => {
            filterOverlay.style.display = 'none';
        });
        
        filterOverlay.addEventListener('click', (e) => {
            if (e.target === filterOverlay) {
                filterOverlay.style.display = 'none';
            }
        });
        
        combinedSearchButton.addEventListener('click', () => {
            const searchQueries = [];
            
            // Get name/text filter query
            const nameTextQuery = document.getElementById('searchInput').value;
            if (nameTextQuery) {
                searchQueries.push(nameTextQuery);
            }
            
            // Get tag filter query
            if (this.tagFilter && typeof this.tagFilter.getSelectedTags === 'function') {
                const tagQuery = this.tagFilter.getSelectedTags();
                if (tagQuery) {
                    searchQueries.push(tagQuery);
                }
            }
            
            // Get type filter query
            const typeQuery = this.typeFilter.getSelectedTypes();
            if (typeQuery && typeQuery.length > 0) {
                searchQueries.push(`type:${typeQuery.join(' ')}`);
            }
            
            // Get mana cost filter queries
            const manaCostSymbols = Array.from(this.manaFilter.selectedManaCost);
            if (manaCostSymbols.length > 0) {
                const manaCostQuery = this.manaFilter.buildSearchQuery();
                if (manaCostQuery) {
                    searchQueries.push(manaCostQuery);
                }
            }
            
            // Get color identity filter queries
            const colorIdentitySymbols = Array.from(this.manaFilter.selectedColorIdentity);
            if (colorIdentitySymbols.length > 0) {
                const isExactMode = document.getElementById('colorIdentityToggle').checked;
                searchQueries.push(isExactMode ? `id=${colorIdentitySymbols.join('')}` : `id:${colorIdentitySymbols.join('')}`);
            }
            
            // Get exact mana cost query
            if (this.manaFilter.selectedExactCosts.length > 0) {
                const exactManaQuery = this.manaFilter.buildSearchQuery();
                if (exactManaQuery) {
                    searchQueries.push(exactManaQuery);
                }
            }
            
            // Get price filter query
            const priceQuery = this.priceFilter.buildSearchQuery();
            if (priceQuery) {
                searchQueries.push(priceQuery);
            }
            
            const combinedQuery = searchQueries.join(' ');
            
            if (combinedQuery) {
                document.dispatchEvent(new CustomEvent('initiateSearch', {
                    detail: { searchTerm: combinedQuery }
                }));
            }
        });
    }

    async initialize() {
        try {
            await this.typeFilter.initialize();
            this.manaFilter.initialize();
            this.priceFilter.initialize();
            if (this.tagFilter && typeof this.tagFilter.initialize === 'function') {
                this.tagFilter.initialize();
            }
            this.setupFilterControls();
        } catch (error) {
            console.log('Error during initialization:', error);
        }
    }

    applyFilters(cards) {
        let filtered = cards;
        if (this.activeFilters.has('type')) {
            filtered = this.typeFilter.applyFilter(filtered);
        }
        if (this.activeFilters.has('mana')) {
            filtered = this.manaFilter.applyFilter(filtered);
        }
        if (this.activeFilters.has('price')) {
            filtered = this.priceFilter.applyFilter(filtered);
        }
        return filtered;
    }
}

