class CardSearch {
    constructor(filterManager) {
        this.filterManager = filterManager;
        this.filters = {
            searchTerm: '',
            tags: [],
            colors: []
        };
        this.initialize();
    }

    initialize() {
        // Set up search input listener
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filters.searchTerm = e.target.value;
                this.performSearch();
            });
        }

        // Listen for the search event from your existing setup
        document.addEventListener('initiateSearch', (event) => {
            this.filters.searchTerm = event.detail.searchTerm;
            this.performSearch();
        });
    }

    performSearch() {
        const cards = window.cardData;
        console.log('Performing search with filters:', this.filters);
        const filteredCards = this.filterManager.filterCards(cards, this.filters);
        console.log('Filtered results:', filteredCards);
        this.updateResults(filteredCards);
    }

    updateResults(filteredCards) {
        const resultsContainer = document.getElementById('searchResults');
        if (resultsContainer) {
            resultsContainer.innerHTML = ''; // Clear existing results
            filteredCards.forEach(card => {
                // Use your existing card display logic
                const cardElement = this.createCardElement(card);
                resultsContainer.appendChild(cardElement);
            });
        }
    }

    createCardElement(card) {
        // Your existing card element creation logic
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        // Add your card display logic here
        return cardElement;
    }
}

// Usage in your main.js or app.js
const filterManager = new FilterManager();
const cardSearch = new CardSearch(filterManager);