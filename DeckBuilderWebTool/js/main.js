class App {
    constructor() {
        this.displayManager = new DisplayManager();
        this.filterManager = new FilterManager();
        this.cardSearch = new CardSearch();
        this.manaFilterUI = new ManaFilterUI();
        this.filterSearch = new Search();
    }

    async initialize() {
        await this.filterManager.initialize();
        this.cardSearch.initialize();
        this.displayManager.initialize();
        // Add this line to initialize the filter search
        this.filterSearch.setupEventListeners();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.initialize();
    const resultsManager = new ResultsManager();
});
