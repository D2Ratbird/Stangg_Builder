// Mana cost and color identity filtering
class ManaFilter {
    constructor() {
        this.selectedManaCost = new Set();
        this.selectedColorIdentity = new Set();
        this.manaCostMode = 'exact';
        this.colorIdentityMode = 'exact';
        this.currentResults = [];
        this.selectedExactCosts = [];
        this.SPECIAL_MANA_TYPES = {
            basic: ['W', 'U', 'B', 'R', 'G'],
            phyrexian: ['W/P', 'U/P', 'B/P', 'R/P', 'G/P'],
            snow: ['S'],
            special: ['X']
        };  
        this.genericInput = null;
    
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

    initializeManaFilters() {
        const manaSymbols = ['W', 'U', 'B', 'R', 'G'];
        
        // Setup mana cost filter
        const manaCostFilter = document.getElementById('manaCostFilter');
        const manaCostToggle = this.createToggleSwitch('Including', 'Exactly');
        manaCostToggle.querySelector('input').id = 'manaCostToggle';
        manaCostFilter.appendChild(manaCostToggle);
        this.createManaButtons(manaSymbols, manaCostFilter, this.selectedManaCost);
        this.createColorlessButton(manaCostFilter, this.selectedManaCost);

        // Setup color identity filter
        const colorIdentityFilter = document.getElementById('colorIdentityFilter');
        const colorIdentityToggle = this.createToggleSwitch('Including', 'Exactly');
        colorIdentityToggle.querySelector('input').id = 'colorIdentityToggle';
        colorIdentityFilter.appendChild(colorIdentityToggle);
        this.createManaButtons(manaSymbols, colorIdentityFilter, this.selectedColorIdentity);
        this.createColorlessButton(colorIdentityFilter, this.selectedColorIdentity);

        // Add the exact mana cost section
        const exactManaSection = this.createExactCostSection();
        colorIdentityFilter.parentNode.appendChild(exactManaSection);
    }

    buildSearchQuery() {
        const costs = [];
        const isIncludeMode = document.querySelector('#exactManaCost .toggle-container input').checked;
        const minCmc = document.querySelector('#exactManaCost .cmc-input[placeholder="Min CMC"]').value;
        const maxCmc = document.querySelector('#exactManaCost .cmc-input[placeholder="Max CMC"]').value;
        
        if (this.genericInput.value) {
            costs.push(`{${this.genericInput.value}}`);
        }
        
        const pattern = costs.join('') + this.selectedExactCosts.map(cost => {
            if (!cost.includes('/P')) {
                return cost;
            }
            return cost;
        }).join('');
        
        const phyrexianPattern = costs.join('') + this.selectedExactCosts.map(cost => {
            if (!cost.includes('/P')) {
                const baseSymbol = cost.replace(/[{}]/g, '');
                return `{${baseSymbol}/P}`;
            }
            return cost;
        }).join('');
        
        let query = [];
        
        if (pattern) {
            // Use >= for including mode, = for exact mode
            const operator = isIncludeMode ? '>=' : '=';
            query.push(`(mana${operator}${pattern} OR mana${operator}${phyrexianPattern})`);
        }
        
        if (minCmc) query.push(`cmc>=${minCmc}`);
        if (maxCmc) query.push(`cmc<=${maxCmc}`);
        
        return query.join(' ');
    }
    
    createExactCostSection() {
        const container = document.createElement('div');
        container.id = 'exactManaCost';
        container.innerHTML = `
            <h3>Exact Mana Cost</h3>
            <div class="exact-cost-controls">
                ${this.createToggleSwitch('Exact Cost', 'Including Cost').outerHTML}
                <div class="cmc-range">
                    <input type="number" class="cmc-input" min="0" placeholder="Min CMC">
                    <span>to</span>
                    <input type="number" class="cmc-input" min="0" placeholder="Max CMC">
                </div>
            </div>
            <div class="exact-mana-input-section">
                <input type="number" class="generic-mana-input" min="0" placeholder="Generic">
                <div class="mana-symbol-groups"></div>
            </div>
            <div class="selected-mana-costs"></div>
        `;
    
        // Add mana symbol groups
        const symbolGroups = container.querySelector('.mana-symbol-groups');
        Object.entries(this.SPECIAL_MANA_TYPES).forEach(([type, symbols]) => {
            const group = document.createElement('div');
            group.className = 'mana-group';

            const getSymbolClass = (symbol, type) => {
                if (type === 'phyrexian') {
                    return `ms-${symbol[0].toLowerCase()}p`;
                }
                return `ms-${symbol.toLowerCase()}`;
            };
        
            group.innerHTML = `
                <div class="mana-group-title">${type.toUpperCase()}</div>
                <div class="mana-symbols">
                    ${symbols.map(symbol => `
                        <div class="mana-symbol" data-symbol="${symbol}">
                            <i class="ms ${getSymbolClass(symbol, type)}"></i>
                        </div>
                    `).join('')}
                </div>
            `;
    
            // Add click handlers
            group.querySelectorAll('.mana-symbol').forEach(symbol => {
                symbol.addEventListener('click', () => this.handleManaSelection(symbol.dataset.symbol, type));
            });
    
            symbolGroups.appendChild(group);
        });
    
        this.genericInput = container.querySelector('.generic-mana-input');
        this.genericInput.addEventListener('input', () => this.updateDisplayedCosts());
        return container;
    }

    handleManaSelection(symbol, type) {
        let cost;
        switch(type) {
            case 'phyrexian':
                cost = `{${symbol}}`;
                break;
            case 'snow':
                // Snow mana is represented as {S}
                cost = '{S}';
                break;
            default:
                cost = type === 'basic' ? `{${symbol}}` : symbol;
        }
        this.selectedExactCosts.push(cost);
        this.updateDisplayedCosts();
    }
    
    updateDisplayedCosts() {
        const display = document.querySelector('.selected-mana-costs');
        display.innerHTML = '';
        
        const genericInput = document.querySelector('.generic-mana-input');
        if (genericInput.value) {
            this.addCostTag(display, `{${genericInput.value}}`);
        }
        
        this.selectedExactCosts.forEach(cost => {
            this.addCostTag(display, cost);
        });
    }
    
    addCostTag(container, cost) {
        const tag = document.createElement('div');
        tag.className = 'mana-cost-tag';
    
        // Handle Phyrexian mana symbols
        let symbolClass;
        if (cost.includes('/P')) {
            symbolClass = `ms-${cost[1].toLowerCase()}p`;
        } else {
            symbolClass = `ms-${cost.replace(/[{}]/g, '').toLowerCase()}`;
        }
    
        tag.innerHTML = `
            <i class="ms ${symbolClass}"></i>
            <span class="remove-cost">×</span>
        `;
    
        // Add color classes based on mana type
        const symbol = cost.replace(/[{}]/g, '');
        tag.querySelector('i').classList.add(`ms-${symbol[0].toLowerCase()}-color`);
    
        tag.querySelector('.remove-cost').addEventListener('click', () => {
            if (cost === `{${this.genericInput.value}}`) {
                this.genericInput.value = '';
            } else {
                this.selectedExactCosts = this.selectedExactCosts.filter(c => c !== cost);
            }
            this.updateDisplayedCosts();
        });
    
        container.appendChild(tag);
    }

    setupSearchButton() {
        const searchButton = document.getElementById('manaSearchButton');
        searchButton.addEventListener('click', async () => {
            const manaCostSymbols = Array.from(this.selectedManaCost);
            const colorIdentitySymbols = Array.from(this.selectedColorIdentity);
            
            let searchParts = [];
            let symbolQueries = [];

            // Handle exact mana cost if any are selected
            if (this.selectedExactCosts.length > 0) {
                searchParts.push(this.buildSearchQuery());
            }
            // Otherwise use the color-based search
            else if (manaCostSymbols.length > 0) {
                const isExactMode = document.getElementById('manaCostToggle').checked;
                if (manaCostSymbols.includes('C')) {
                    searchParts.push('-m:/[WUBRG]/');
                } else {
                    symbolQueries = manaCostSymbols.map(symbol => {
                        return `(m:{${symbol}} OR m:{${symbol}/P})`;
                    });
    
                    // Get colors to exclude (same for both modes)
                    const otherColors = ['W', 'U', 'B', 'R', 'G'].filter(c => !manaCostSymbols.includes(c));
                    const excludeOthers = otherColors.map(c => `-m:{${c}} -m:{${c}/P}`).join(' ');
    
                    if (isExactMode) {
                        // Exact mode: must have all selected colors and no others
                        searchParts.push(`(${symbolQueries.join(' ')}) ${excludeOthers}`);
                    } else {
                        // Include mode: can have any combination of selected colors, but no others
                        searchParts.push(`(${symbolQueries.join(' OR ')}) ${excludeOthers}`);
                    }
                }
            }

            // Add color identity query
            if (colorIdentitySymbols.length > 0) {
                const isExactMode = document.getElementById('colorIdentityToggle').checked;
                searchParts.push(isExactMode ? `id=${colorIdentitySymbols.join('')}` : `id:${colorIdentitySymbols.join('')}`);
            }

            const searchQuery = searchParts.join(' ');
            if (searchQuery) {
                document.dispatchEvent(new CustomEvent('initiateSearch', {
                    detail: { searchTerm: searchQuery }
                }));
            }
        });
    }

    createToggleSwitch(label = 'including', checkedLabel = 'exactly') {
        const toggleContainer = document.createElement('div');
        toggleContainer.className = 'toggle-container';
        let leftLabel, rightLabel;
        let isCheckedByDefault = false;

        if (label === 'Exact Cost') {
            leftLabel = 'Exact Cost';
            rightLabel = 'Including Cost';
            isCheckedByDefault = false;
        } else {
            leftLabel = 'Including';
            rightLabel = 'Exactly';
            isCheckedByDefault = false;
        }

        toggleContainer.innerHTML = `
            <span class="toggle-label-left">${leftLabel}</span>
            <label class="switch">
                <input type="checkbox" ${isCheckedByDefault ? 'checked' : ''}>
                <span class="slider round"></span>
            </label>
            <span class="toggle-label-right">${rightLabel}</span>
        `;

        return toggleContainer;
    }

    createManaButtons(symbols, container, selectedSet) {
        symbols.forEach(symbol => {
            const symbolElement = document.createElement('div');
            symbolElement.className = 'mana-symbol';
            symbolElement.dataset.symbol = symbol;
            symbolElement.innerHTML = `<i class="ms ms-${symbol.toLowerCase()}"></i>`;
            
            symbolElement.addEventListener('click', () => {
                symbolElement.classList.toggle('selected');
                const colorlessButton = container.querySelector('.mana-symbol.colorless');
                
                if (symbolElement.classList.contains('selected')) {
                    selectedSet.add(symbol);
                    // Deselect colorless if it's selected
                    if (colorlessButton && colorlessButton.classList.contains('selected')) {
                        colorlessButton.classList.remove('selected');
                        selectedSet.delete('C');
                    }
                } else {
                    selectedSet.delete(symbol);
                }
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
