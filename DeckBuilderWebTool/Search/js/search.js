class CardSearch {
    constructor() {
        this.searchInput = document.getElementById('searchInput');
        this.loadingIndicator = document.getElementById('searchLoading');
        this.searchResults = [];
        this.currentQuery = '';
    }

    initialize() {
        const searchButton = document.getElementById('directSearch');
        searchButton.addEventListener('click', () => {
            const query = this.searchInput.value.trim();
            if (query) {
                this.executeTypeSearch(query);
            }
        });
        
        // Add enter key support
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = this.searchInput.value.trim();
                if (query) {
                    this.executeTypeSearch(query);
                }
            }
        });
    }

    async executeTypeSearch(query) {
        console.log('Type Search Starting');
        console.log('Type query:', query);
        
        if (!query) {
            console.log('No query provided, returning');
            return;
        }
        
        try {
            let allResults = [];
            let hasMore = true;
            let page = 1;

            const firstPageUrl = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}&order=name&dir=asc&unique=cards&page=1`;
            console.log('Type search URL:', firstPageUrl);
            
            const firstPageResponse = await fetch(firstPageUrl);
            console.log('Type search response status:', firstPageResponse.status);
            
            if (!firstPageResponse.ok) {
                console.log('Response not OK, dispatching empty results');
                // Your existing error handling...
                return;
            }
            
            const firstPageData = await firstPageResponse.json();
            console.log('Type search data received:', firstPageData.total_cards, 'total cards');
            
            const totalCards = firstPageData.total_cards;
            allResults = [...firstPageData.data];
            
            // Dispatch initial results
            document.dispatchEvent(new CustomEvent('searchProgress', {
                detail: { 
                    results: { name: allResults },
                    progress: {
                        current: allResults.length,
                        total: totalCards
                    }
                }
            }));
            console.log('searchProgress event dispatched with', allResults.length, 'results');
            console.log('Search dispatching results structure:', { name: allResults });
            
            // Continue loading remaining pages
            hasMore = firstPageData.has_more;
            page++;
            
            while (hasMore) {
                const url = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}&page=${page}`;
                await globalRateLimiter.throttle();
                const data = await (await fetch(url)).json();
                
                allResults = [...allResults, ...data.data];
                
                document.dispatchEvent(new CustomEvent('searchProgress', {
                    detail: { 
                        results: { name: allResults },
                        progress: {
                            current: allResults.length,
                            total: totalCards
                        }
                    }
                }));
                console.log('searchProgress event dispatched with', allResults.length, 'results');
                console.log('Search dispatching results structure:', { name: allResults });
                
                hasMore = data.has_more;
                page++;
            }
        } catch (error) {
            console.error('Search failed:', error);
        }
    }

    async tryAPISearch(searchTerm) {
        const response = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(searchTerm)}`);
        const data = await response.json();
        return {
            name: data.data || [],
            exact: [],
            text: []
        };
    }

    async handleFuzzyFallback(searchTerm) {
        // Your existing fuzzy search logic here
    }

    getResults() {
        return this.searchResults;
    }
}

const cardSearch = new CardSearch();
cardSearch.initialize();

class Search {
    constructor() {
        this.nameInput = document.getElementById('nameSearch');
        this.textInput = document.getElementById('textSearch');
        this.searchMode = document.getElementById('searchMode');
        this.loadingIndicator = document.getElementById('loadingIndicator');
        this.setupEventListeners();
        this.initializeSearch();
    }

    initializeSearch() {
        $('#searchButton').on('click', () => {
            this.executeSearch();
        });
    }

    async fetchAllCards(query) {
        let allCards = [];
        let hasMore = true;
        let page = 1;
        
        while (hasMore) {
            const url = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}&unique=cards&page=${page}`;
            const response = await fetch(url);
            const data = await response.json();
            
            allCards = [...allCards, ...data.data];
            hasMore = data.has_more;
            page++;
            
            await globalRateLimiter.throttle();
        }
        
        return allCards;
    }

    buildSearchQuery(nameQuery, textQuery) {
        const queries = [];
        const isEitherMode = !this.searchMode.checked;
        
        if (isEitherMode) {
            const conditions = [];
            if (nameQuery) conditions.push(`name:"${nameQuery}"`);
            if (textQuery) conditions.push(`oracle:"${textQuery}"`);
            
            const finalQuery = `(${conditions.join(' OR ')})`;
            console.log('Query components:', {
                nameCondition: nameQuery ? `name:"${nameQuery}"` : null,
                textCondition: textQuery ? `oracle:"${textQuery}"` : null,
                finalQuery: finalQuery
            });
            return finalQuery;
        } else {
            if (nameQuery) queries.push(`name:"${nameQuery}"`);
            if (textQuery) queries.push(`oracle:"${textQuery}"`);
            return queries.join(' ');
        }
    }

    setupEventListeners() {
        const searchButton = document.getElementById('filterSearch');
        
        const executeSearchOnce = () => {
            if (!this.isSearching) {
                this.isSearching = true;
                this.executeSearch().finally(() => {
                    this.isSearching = false;
                });
            }
        };
    
        searchButton.addEventListener('click', executeSearchOnce.bind(this));
    
        [this.nameInput, this.textInput].forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    executeSearchOnce.bind(this)();
                }
            });
        });
    }

    async executeSearch() {
        console.log('Search executed');
        const nameQuery = this.nameInput.value.trim();
        const textQuery = this.textInput.value.trim();

        console.log('Queries:', { nameQuery, textQuery });
        
        if (!nameQuery && !textQuery) return;
        
        try {
            document.getElementById('resultsOverlay').style.display = 'block';
            
            let searchQuery = this.buildSearchQuery(nameQuery, textQuery);
            let allResults = [];
            let hasMore = true;
            let page = 1;
            let totalCards = null;
            
            // First page fetch
            const firstPageUrl = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(searchQuery)}&order=name&dir=asc&unique=cards&page=1`;
            console.log('First page URL:', firstPageUrl);
        
            const firstPageResponse = await fetch(firstPageUrl);
            console.log('First page response status:', firstPageResponse.status);
        
            const firstPageData = await firstPageResponse.json();
            console.log('First page data received:', firstPageData.total_cards, 'total cards');
            
            totalCards = firstPageData.total_cards;
            allResults = [...firstPageData.data];
            
            // Initial results dispatch
            document.dispatchEvent(new CustomEvent('searchProgress', {
                detail: { 
                    results: { name: allResults },
                    progress: {
                        current: allResults.length,
                        total: totalCards
                    }
                }
            }));
            console.log('searchProgress event dispatched with', allResults.length, 'results');
            console.log('Search dispatching results structure:', { name: allResults });
            
            // Continue with remaining pages
            hasMore = firstPageData.has_more;
            page++;
            
            while (hasMore) {
                const url = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(searchQuery)}&order=name&dir=asc&unique=cards&page=${page}`;
                await globalRateLimiter.throttle();
                const data = await (await fetch(url)).json();
                
                allResults = [...allResults, ...data.data];
                
                document.dispatchEvent(new CustomEvent('searchProgress', {
                    detail: { 
                        results: { name: allResults },
                        progress: {
                            current: allResults.length,
                            total: totalCards
                        }
                    }
                }));
                console.log('searchProgress event dispatched with', allResults.length, 'results');
                console.log('Search dispatching results structure:', { name: allResults });
                
                hasMore = data.has_more && allResults.length < totalCards;
                page++;
            }
        } catch (error) {
            console.error('Search failed:', error);
        }
    }
}

const search = new Search();
