class PriceFilter {
    constructor() {
        this.minPrice = null;
        this.maxPrice = null;
        
        document.addEventListener('DOMContentLoaded', () => {
            this.initialize();
        });
    }

    initialize() {
        const [minInput, maxInput] = document.querySelectorAll('.price-input');
        
        minInput.addEventListener('input', () => {
            this.minPrice = minInput.value ? parseFloat(minInput.value) : null;
        });
        
        maxInput.addEventListener('input', () => {
            this.maxPrice = maxInput.value ? parseFloat(maxInput.value) : null;
        });
    
        // Add search button handler
        const searchButton = document.getElementById('priceSearchButton');
        searchButton.addEventListener('click', () => {
            const searchQuery = this.buildSearchQuery();
            if (searchQuery) {
                document.dispatchEvent(new CustomEvent('initiateSearch', {
                    detail: { searchTerm: searchQuery }
                }));
            }
        });
    }

    buildSearchQuery() {
        const query = [];
        
        if (this.minPrice !== null) {
            query.push(`usd>=${this.minPrice}`);
        }
        
        if (this.maxPrice !== null) {
            query.push(`usd<=${this.maxPrice}`);
        }
        
        return query.join(' ');
    }

    applyFilter(cards) {
        return cards.filter(card => {
            const price = parseFloat(card.prices?.usd) || 0;
            const minOk = this.minPrice === null || price >= this.minPrice;
            const maxOk = this.maxPrice === null || price <= this.maxPrice;
            return minOk && maxOk;
        });
    }
}

window.PriceFilter = PriceFilter;