class ManaFilterUI {
    constructor() {
        document.addEventListener('DOMContentLoaded', () => {
            this.initialize();
            this.initializeManaFilters();
        });
        this.selectedManaCost = new Set();
        this.selectedColorIdentity = new Set();
        this.initialize();
        this.initializeManaFilters();
    }

    initialize() {
        const filterButton = document.getElementById('openFilters');
        const filterOverlay = document.getElementById('filterOverlay');
        const closeButton = filterOverlay.querySelector('.close-button');

        filterButton.addEventListener('click', () => {
            filterOverlay.style.display = 'block';
        });

        closeButton.addEventListener('click', () => {
            filterOverlay.style.display = 'none';
        });
    }

    initializeManaFilters() {
        this.createManaSymbols();
        this.setupManaSymbolHandlers();
    }

    createManaSymbols() {
        const manaSymbols = ['W', 'U', 'B', 'R', 'G'];
        const manaCostFilter = document.getElementById('manaCostFilter');
        
        manaSymbols.forEach(symbol => {
            const symbolElement = document.createElement('div');
            symbolElement.className = 'mana-symbol';
            symbolElement.dataset.symbol = symbol;
            symbolElement.innerHTML = `<i class="ms ms-${symbol.toLowerCase()}"></i>`;
            manaCostFilter.appendChild(symbolElement);
        });
    }

    setupManaSymbolHandlers() {
        document.querySelectorAll('.mana-symbol').forEach(symbol => {
            symbol.addEventListener('click', () => {
                const manaSymbol = symbol.dataset.symbol;
                this.toggleManaSymbol(symbol, manaSymbol);
            });
        });
    }

    toggleManaSymbol(element, symbol) {
        element.classList.toggle('selected');
        if (element.classList.contains('selected')) {
            this.selectedManaCost.add(symbol);
        } else {
            this.selectedManaCost.delete(symbol);
        }
    }
}
