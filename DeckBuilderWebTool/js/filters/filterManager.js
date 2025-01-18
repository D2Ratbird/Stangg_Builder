class FilterManager {
    constructor() {
        this.tagFilter = new TagFilter();
        this.typeFilter = new TypeFilter(this);
        this.manaFilter = new ManaFilter();
        this.priceFilter = new PriceFilter();
        this.activeFilters = new Set();
    }

    // Add the new filtering method as a class method
    filterCards(cards, filters) {
        console.log('Starting filterCards with:', {
            totalCards: cards.length,
            filters: filters
        });
        
        let filteredCards = [...cards];
        
        // Text search filter
        if (filters.searchTerm) {
            console.log('Applying text search for:', filters.searchTerm);
            const searchTerm = filters.searchTerm.toLowerCase();
            filteredCards = filteredCards.filter(card => 
                card.name.toLowerCase().includes(searchTerm) ||
                (card.oracle_text && card.oracle_text.toLowerCase().includes(searchTerm))
            );
            console.log('Cards after text filter:', filteredCards.length);
        }

        // Tag filtering
        if (filters.tags && filters.tags.length > 0) {
            filteredCards = filteredCards.filter(card => {
                return this.checkCardAgainstTags(card, filters.tags);
            });
        }

        // Color filtering
        if (filters.colors && filters.colors.length > 0) {
            filteredCards = filteredCards.filter(card => {
                return this.checkCardColors(card, filters.colors);
            });
        }

        return filteredCards;
    }

    // Convert the helper functions to class methods
    checkCardAgainstTags(card, tags) {
        let matchesAllTags = true;
        let hasMatchingType = false;

        for (const tag of tags) {
            if (tag.type === 'type') {
                hasMatchingType = true;
                if (!this.checkCardType(card, tag)) {
                    matchesAllTags = false;
                    break;
                }
            }
        }

        return hasMatchingType ? matchesAllTags : true;
    }

    checkCardType(card, tag) {
        const typeLine = card.type_line.toLowerCase();
        const cardTypes = typeLine.split('—')[0].trim().split(' ');
        const subtypes = typeLine.includes('—') 
            ? typeLine.split('—')[1].trim().split(' ') 
            : [];
    
        switch(tag.value.toLowerCase()) {
            case 'creature':
                return cardTypes.includes('creature');
            case 'artifact':
                return cardTypes.includes('artifact');
            case 'enchantment':
                return cardTypes.includes('enchantment');
            case 'instant':
                return cardTypes.includes('instant');
            case 'sorcery':
                return cardTypes.includes('sorcery');
            case 'planeswalker':
                return cardTypes.includes('planeswalker');
            case 'land':
                return cardTypes.includes('land');
            case 'legendary':
                return cardTypes.includes('legendary');
            case 'basic':
                return cardTypes.includes('basic');
            case 'token':
                return cardTypes.includes('token');
            case 'equipment':
                return subtypes.includes('equipment');
            case 'aura':
                return subtypes.includes('aura');
            case 'saga':
                return subtypes.includes('saga');
            case 'vehicle':
                return subtypes.includes('vehicle');
            default:
                return false;
        }
    }
    
    checkCardColors(card, colors) {
        if (!card.colors) {
            return colors.length === 0;
        }
        return colors.every(color => card.colors.includes(color));
    }
    
    getCardTypes() {
        return [
            'Creature',
            'Artifact',
            'Enchantment',
            'Instant',
            'Sorcery',
            'Planeswalker',
            'Land',
            'Legendary',
            'Basic',
            'Token',
            'Equipment',
            'Aura',
            'Saga',
            'Vehicle'
        ];
    }
    
    createTypeTag(type) {
        return {
            type: 'type',
            value: type
        };
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
            const searchMode = document.getElementById('searchMode');
            const isEitherMode = !searchMode.checked;
            // Get values from the working search inputs
            const nameSearchValue = document.querySelector('#nameSearch').value;
            const textSearchValue = document.querySelector('#textSearch').value;
        
            const searchQueries = [];
        
            // Add name and text queries if they exist
            if (nameSearchValue.trim() || textSearchValue.trim()) {
                if (isEitherMode) {
                    const conditions = [];
                    if (nameSearchValue.trim()) conditions.push(`name:"${nameSearchValue}"`);
                    if (textSearchValue.trim()) conditions.push(`oracle:"${textSearchValue}"`);
                    searchQueries.push(`(${conditions.join(' OR ')})`);
                } else {
                    if (nameSearchValue.trim()) searchQueries.push(`name:"${nameSearchValue}"`);
                    if (textSearchValue.trim()) searchQueries.push(`oracle:"${textSearchValue}"`);
                }
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
                const isExactMode = document.getElementById('manaCostToggle').checked;
                if (isExactMode) {
                    const colors = manaCostSymbols.join('');
                    searchQueries.push(`c=${colors}`);
                } else {
                    const manaCostQuery = manaCostSymbols.map(symbol => 
                        `(m:{${symbol}} OR m:{${symbol}/P})`
                    ).join(' ');
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

