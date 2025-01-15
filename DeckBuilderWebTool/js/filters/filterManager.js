class FilterManager {
    constructor() {
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
            
            // Get type filter query
            const typeQuery = this.typeFilter.getSelectedTypes();
            if (typeQuery && typeQuery.length > 0) {
                searchQueries.push(`type:${typeQuery.join(' ')}`);
            }
            
            // Get mana filter queries
            const manaCostQuery = this.manaFilter.buildSearchQuery();
            if (manaCostQuery) {
                searchQueries.push(manaCostQuery);
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
        await this.typeFilter.initialize();
        this.manaFilter.initialize();
        this.priceFilter.initialize();
        this.setupFilterControls();
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

