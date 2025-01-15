class SearchManager {
    constructor() {
        console.log('SearchManager initialized');
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('initiateSearch', (event) => {
            console.log('Search initiated with term:', event.detail.searchTerm);
            this.executeSearch(event.detail.searchTerm);
        });
    }

    async executeSearch(query) {
        if (!query) return;
        
        try {
            let allResults = [];
            let hasMore = true;
            let page = 1;
            let totalCards = null;
            
            // First page fetch
            const firstPageUrl = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}&order=name&dir=asc&unique=cards&page=${page}`;
            const firstPageResponse = await fetch(firstPageUrl);
            
            if (!firstPageResponse.ok) {
                document.dispatchEvent(new CustomEvent('searchProgress', {
                    detail: { 
                        results: { name: [] },
                        progress: { current: 0, total: 0 }
                    }
                }));
                return;
            }
            
            const firstPageData = await firstPageResponse.json();
            totalCards = firstPageData.total_cards;
            allResults = [...firstPageData.data];
            
            // Dispatch initial results
            document.dispatchEvent(new CustomEvent('searchProgress', {
                detail: { 
                    results: { name: allResults },
                    progress: { current: allResults.length, total: totalCards }
                }
            }));
            
            // Continue loading remaining pages
            hasMore = firstPageData.has_more;
            page++;
            
            while (hasMore) {
                const url = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}&order=name&dir=asc&unique=cards&page=${page}`;
                await globalRateLimiter.throttle();
                const data = await (await fetch(url)).json();
                
                allResults = [...allResults, ...data.data];
                
                document.dispatchEvent(new CustomEvent('searchProgress', {
                    detail: { 
                        results: { name: allResults },
                        progress: { current: allResults.length, total: totalCards }
                    }
                }));
                
                hasMore = data.has_more && allResults.length < totalCards;
                page++;
            }
        } catch (error) {
            console.error('Search failed:', error);
            document.dispatchEvent(new CustomEvent('searchProgress', {
                detail: { 
                    results: { name: [] },
                    progress: { current: 0, total: 0 }
                }
            }));
        }
    }
}

window.SearchManager = SearchManager;
