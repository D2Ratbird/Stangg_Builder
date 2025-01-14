// Mana cost and color identity filtering
class ManaFilter {
    constructor() {
        this.selectedManaCost = new Set();
        this.selectedColorIdentity = new Set();
        this.manaCostMode = 'exact';
        this.colorIdentityMode = 'exact';
        this.currentResults = [];
    
        document.addEventListener('DOMContentLoaded', () => {
            this.initialize();
        });
    
        document.addEventListener('searchProgress', (event) => {
            console.log('Received search results:', event.detail);
            this.currentResults = event.detail.results.name || [];
            console.log('Updated currentResults:', this.currentResults);
        });
    }

    initialize() {
        // Setup filter overlay
        const filterButton = document.getElementById('openFilters');
        const filterOverlay = document.getElementById('filterOverlay');
        const closeButton = filterOverlay.querySelector('.close-button');

        filterButton.addEventListener('click', () => {
            filterOverlay.style.display = 'block';
        });

        closeButton.addEventListener('click', () => {
            filterOverlay.style.display = 'none';
        });

        // Initialize mana filters
        this.initializeManaFilters();

        // Setup the search button
        this.setupSearchButton();
    }

    applyFilter(cards) {
        return cards.filter(card => this.matchesManaRequirements(card));
    }

    setupSearchButton() {
        const searchButton = document.getElementById('manaSearchButton');
        searchButton.addEventListener('click', async () => {
            const manaCostSymbols = Array.from(this.selectedManaCost);
            const colorIdentitySymbols = Array.from(this.selectedColorIdentity);
            
            let searchParts = [];
            
            // Add mana cost query if symbols are selected
            if (manaCostSymbols.length > 0) {
                const isExactMode = document.getElementById('manaCostToggle').checked;
                searchParts.push(isExactMode ? `c=${manaCostSymbols.join('')}` : `c:${manaCostSymbols.join('')}`);
            }
            
            // Add color identity query if symbols are selected
            if (colorIdentitySymbols.length > 0) {
                const isExactIdentityMode = document.getElementById('colorIdentityToggle').checked;
                searchParts.push(isExactIdentityMode ? `id=${colorIdentitySymbols.join('')}` : `id:${colorIdentitySymbols.join('')}`);
            }
            
            const searchQuery = searchParts.join(' ');
            if (searchQuery) {
                document.dispatchEvent(new CustomEvent('initiateSearch', {
                    detail: { searchTerm: searchQuery }
                }));
            }
        });
    }

    createToggleSwitch(label = 'Including', checkedLabel = 'Exactly') {
        const toggleContainer = document.createElement('div');
        toggleContainer.className = 'toggle-container';
        toggleContainer.innerHTML = `
            <span class="toggle-label-left">${label}</span>
            <label class="switch">
                <input type="checkbox">
                <span class="slider round"></span>
            </label>
            <span class="toggle-label-right">${checkedLabel}</span>
        `;
        return toggleContainer;
    }

    initializeManaFilters() {
        const manaSymbols = ['W', 'U', 'B', 'R', 'G'];
        const colorlessSymbol = 'C';
        
        // Setup mana cost filter
        const manaCostFilter = document.getElementById('manaCostFilter');
        const manaCostToggle = this.createToggleSwitch('Including Colors', 'Exactly These Colors');
        manaCostToggle.querySelector('input').id = 'manaCostToggle';
        manaCostFilter.appendChild(manaCostToggle);
        this.createManaButtons(manaSymbols, manaCostFilter, this.selectedManaCost);
        
        // Setup color identity filter with colorless option
        const colorIdentityFilter = document.getElementById('colorIdentityFilter');
        const colorIdentityToggle = this.createToggleSwitch('Including Identity', 'Exactly This Identity');
        colorIdentityToggle.querySelector('input').id = 'colorIdentityToggle';
        colorIdentityFilter.appendChild(colorIdentityToggle);
        this.createManaButtons(manaSymbols, colorIdentityFilter, this.selectedColorIdentity);
        this.createColorlessButton(colorIdentityFilter, this.selectedColorIdentity);
    }

    createManaButtons(symbols, container, selectedSet) {
        symbols.forEach(symbol => {
            const symbolElement = document.createElement('div');
            symbolElement.className = 'mana-symbol';
            symbolElement.dataset.symbol = symbol;
            symbolElement.innerHTML = `<i class="ms ms-${symbol.toLowerCase()}"></i>`;
            
            symbolElement.addEventListener('click', () => {
                symbolElement.classList.toggle('selected');
                if (symbolElement.classList.contains('selected')) {
                    selectedSet.add(symbol);
                } else {
                    selectedSet.delete(symbol);
                }
                console.log(`Updated ${container.id}:`, Array.from(selectedSet));
            });
            
            container.appendChild(symbolElement);
        });
    }

    createColorlessButton(container, selectedSet) {
        const symbolElement = document.createElement('div');
        symbolElement.className = 'mana-symbol colorless';
        symbolElement.dataset.symbol = 'C';
        symbolElement.innerHTML = `<i class="ms ms-c"></i>`;
        
        symbolElement.addEventListener('click', () => {
            const allManaSymbols = container.querySelectorAll('.mana-symbol:not(.colorless)');
            
            symbolElement.classList.toggle('selected');
            if (symbolElement.classList.contains('selected')) {
                // Deselect all other symbols
                allManaSymbols.forEach(symbol => {
                    symbol.classList.remove('selected');
                    selectedSet.delete(symbol.dataset.symbol);
                });
                selectedSet.add('C');
            } else {
                selectedSet.delete('C');
            }
        });
        
        container.appendChild(symbolElement);
    }

    matchesManaRequirements(card) {
        const costMatch = this.matchesManaCost(card);
        const identityMatch = this.matchesColorIdentity(card);
        return costMatch && identityMatch;
    }

    matchesManaCost(card) {
        if (this.selectedManaCost.size === 0) return true;
        
        // Get mana cost from card
        const manaCost = card.mana_cost || '';
        
        // Convert mana cost string to array of symbols
        const cardSymbols = Array.from(manaCost.matchAll(/\{([WUBRG])\}/g))
            .map(match => match[1]);
        
        if (this.manaCostMode === 'exact') {
            // Card must contain exactly these symbols
            const selectedSymbols = Array.from(this.selectedManaCost);
            return cardSymbols.length === selectedSymbols.length &&
                   selectedSymbols.every(symbol => cardSymbols.includes(symbol));
        } else {
            // Card must contain at least these symbols
            return Array.from(this.selectedManaCost)
                .every(symbol => cardSymbols.includes(symbol));
        }
    }

    matchesColorIdentity(card) {
        if (this.selectedColorIdentity.size === 0) return true;
        // Implement color identity matching logic here
        return true;
    }
}

window.ManaFilter = ManaFilter;
