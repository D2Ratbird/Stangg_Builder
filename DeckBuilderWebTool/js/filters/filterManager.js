class FilterManager {
    constructor() {
        this.typeFilter = new TypeFilter();
        this.manaFilter = new ManaFilter();
        this.activeFilters = new Set();
    }

    setupFilterControls() {
        const filterOverlay = document.getElementById('filterOverlay');
        const openFiltersButton = document.getElementById('openFilters');
        const closeButton = filterOverlay.querySelector('.close-button');

        openFiltersButton.addEventListener('click', () => {
            filterOverlay.style.display = 'block';
        });

        closeButton.addEventListener('click', () => {
            filterOverlay.style.display = 'none';
        });

        // Close on outside click
        filterOverlay.addEventListener('click', (e) => {
            if (e.target === filterOverlay) {
                filterOverlay.style.display = 'none';
            }
        });
    }

    async initialize() {
        await this.typeFilter.initialize();
        this.manaFilter.initialize();
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
        return filtered;
    }
}

