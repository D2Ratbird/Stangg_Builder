class FilterManager {
    constructor() {
        this.tagFilter = new TagFilter();
        this.typeFilter = new TypeFilter(this);
        this.manaFilter = new ManaFilter();
        this.priceFilter = new PriceFilter();
        this.activeFilters = new Set();
    }

    handleTypeRemoval(type, tagElement) { 
        this.typeFilter.removeType(type, tagElement); 
    }

    setupTagRemoval(tagElement) { 
        const removeButton = tagElement.querySelector('.remove-tag'); 
        if (removeButton) { 
            removeButton.addEventListener('click', (e) => { 
                const type = tagElement.dataset.type; 
                this.handleTypeRemoval(type, tagElement); 
            }); 
        } 
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
            console.log('All form elements:', { 
                searchInput: document.getElementById('searchInput'), 
                searchValue: document.getElementById('searchInput')?.value, manaFilter: 
                this.manaFilter, selectedMana: 
                this.manaFilter.selectedManaCost 
            });    
            const searchQueries = [];
            
            // Get name/text filter query
            const searchInput = document.getElementById('searchInput')?.value || '';
            console.log('Search Input:', searchInput);
            if (searchInput) {
                // Check if it's a name or text search
                if (searchInput.includes('o:') || searchInput.includes('oracle:')) {
                    searchQueries.push(searchInput); // Text search
                } else {
                    searchQueries.push(`name:${searchInput}`); // Name search
                }
                console.log('Added search query:', searchQueries[searchQueries.length - 1]);
            }
            
            // Get tag filter query
            if (this.tagFilter && typeof this.tagFilter.getSelectedTags === 'function') { 
                const tagQuery = this.tagFilter.getSelectedTags();
                console.log('Tag Query:', tagQuery); 
                if (tagQuery && tagQuery.length > 0) { 
                    searchQueries.push(tagQuery); 
                } 
            }
            
            // Get type filter query
            const typeQuery = this.typeFilter.getSelectedTypes(); 
            console.log('Type Query Full Object:', JSON.stringify(typeQuery, null, 2));
            if (typeQuery && typeQuery.length > 0) { 
                // Separate capsule types from main types
                const mainTypes = typeQuery.filter(type => type.capsuleId === 'main');
                const capsuleTypes = typeQuery.filter(type => type.capsuleId !== 'main');
                
                // Group capsule types by capsuleId
                const capsuleGroups = capsuleTypes.reduce((acc, type) => {
                    if (!acc[type.capsuleId]) {
                        acc[type.capsuleId] = [];
                    }
                    acc[type.capsuleId].push(type.type);
                    return acc;
                }, {});
                
                // Build the query parts
                const mainTypeQueries = mainTypes.map(type => `type:${type.type}`);
                
                // Build capsule queries with main types included
                const capsuleQueries = Object.values(capsuleGroups).map(types => {
                    const capsuleTypeQueries = types.map(type => `type:${type}`);
                    const allQueries = [...capsuleTypeQueries, ...mainTypeQueries];
                    return `(${allQueries.join(' ')})`;
                });
                
                if (capsuleQueries.length > 0) {
                    searchQueries.push(capsuleQueries.join(' OR '));
                } else if (mainTypeQueries.length > 0) {
                    // If only main types exist, add them directly
                    searchQueries.push(mainTypeQueries.join(' '));
                }
            }
            
            // Get mana cost filter queries
            const manaCostSymbols = Array.from(this.manaFilter.selectedManaCost);
            console.log('Mana Cost Symbols:', manaCostSymbols); 
                if (manaCostSymbols.length > 0) { 
                const manaCostQuery = this.manaFilter.buildSearchQuery(); 
                console.log('Mana Cost Query:', manaCostQuery); 
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
                console.log('Final Combined Query:', combinedQuery);
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

