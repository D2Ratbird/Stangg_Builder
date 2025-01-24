class App {
    constructor() {
        this.displayManager = new DisplayManager();
        this.filterManager = new FilterManager();
        this.cardSearch = new CardSearch();
        this.manaFilterUI = new ManaFilter();
        this.filterSearch = new Search();
        this.searchManager = new SearchManager();
        if (!window.deckBuilder) {
            window.deckBuilder = new DeckBuilder();
        }    
    }

    async initialize() {
        await this.filterManager.initialize();
        this.cardSearch.initialize();
        this.displayManager.initialize();
        this.filterSearch.setupEventListeners();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.initialize();
    const resultsManager = new ResultsManager();
});
