class DeckBuilder {

    static manaColors = {
        'W': '#F8E7B9', // White
        'U': '#0E68AB', // Blue
        'B': '#A69F9D', // Black
        'R': '#D3202A', // Red
        'G': '#00733E'  // Green
    };

    static tabManaColors = {
        'W': '#F8E7B9', // White
        'U': '#0E68AB', // Blue
        'B': '#2B2B2B', // black
        'R': '#D3202A', // Red
        'G': '#00733E'  // Green
    };

    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.decks = [];
        this.activeDeckIndex = -1;
        console.log('DeckBuilder initialized with:', this.decks, this.activeDeckIndex);
    }

    initializeElements() {
        this.modal = document.getElementById('newDeckModal');
        this.form = document.getElementById('newDeckForm');
        this.colorSelector = document.getElementById('colorSelector');
        this.newDeckTab = document.getElementById('newDeckTab');
        
        // Create color checkboxes
        const colors = ['W', 'U', 'B', 'R', 'G'];
        colors.forEach(color => {
            const div = document.createElement('div');
            div.className = 'color-checkbox';
            
            const input = document.createElement('input');
            input.type = 'checkbox';
            input.id = `color-${color}`;
            input.value = color;
            
            const label = document.createElement('label');
            label.htmlFor = `color-${color}`;
            label.className = `ms ms-${color.toLowerCase()}`;
            
            div.appendChild(input);
            div.appendChild(label);
            this.colorSelector.appendChild(div);
        });
    }

    getActiveDeck() {
        console.log('Getting active deck:', this.activeDeckIndex, this.decks);
        if (this.activeDeckIndex === -1 || !this.decks.length) return null;
        return this.decks[this.activeDeckIndex];
    }

    bindEvents() {
        // New Deck tab click
        this.newDeckTab.addEventListener('click', () => {
            this.openModal();
        });

        // Form submission
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.createDeck();
        });

        // Cancel button
        this.form.querySelector('.cancel').addEventListener('click', () => {
            this.closeModal();
        });
    }

    openModal() {
        this.modal.style.display = 'block';
    }

    closeModal() {
        this.modal.style.display = 'none';
        this.form.reset();
    }

    createDeck() {
        const deckData = {
            name: document.getElementById('deckName').value,
            format: document.getElementById('deckFormat').value,
            colors: Array.from(this.colorSelector.querySelectorAll('input:checked')).map(input => input.value),
            notes: document.getElementById('deckNotes').value,
            cards: [],
            created: new Date().toISOString()
        };
    
        this.addDeckTab(deckData);
        this.createManaBackground(deckData.colors);
        this.closeModal();
    }

    addDeckTab(deckData) {
        const tab = document.createElement('div');
        tab.className = 'deck-tab';
        tab.textContent = deckData.name;
        tab.dataset.colors = JSON.stringify(deckData.colors);
        
        // Create gradient for any number of colors (including single color)
        if (deckData.colors.length > 0) {
            const colorStops = deckData.colors.length === 1 
                ? `${DeckBuilder.tabManaColors[deckData.colors[0]]}, ${DeckBuilder.tabManaColors[deckData.colors[0]]}` 
                : deckData.colors.map(color => DeckBuilder.tabManaColors[color]).join(', ');
            
            tab.style.background = `linear-gradient(45deg, ${colorStops})`;
            tab.style.color = '#fff';
            tab.style.textShadow = '1px 1px 2px rgba(0,0,0,0.7)';
        }
        
        tab.addEventListener('click', () => {
            this.activateTab(tab);
            this.createManaBackground(deckData.colors);
        });
        
        this.newDeckTab.parentNode.insertBefore(tab, this.newDeckTab);
        this.activateTab(tab);
    }
    
    activateTab(tab) {
        const allTabs = document.querySelectorAll('.deck-tab');
        allTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
    }

    createManaBackground(colors) {
        const workspace = document.querySelector('.deck-workspace');
        workspace.style.position = 'relative';
        
        // Clear existing symbols
        const existingSymbols = workspace.querySelectorAll('.background-mana');
        existingSymbols.forEach(symbol => symbol.remove());
        
        // Create random symbols
        colors.forEach(color => {
            for (let i = 0; i < 15; i++) {
                const symbol = document.createElement('i');
                symbol.className = `ms ms-${color.toLowerCase()} background-mana`;
                
                // Random positioning and size
                const size = Math.random() * 30 + 20; // 20-50px
                const x = Math.random() * 100;
                const y = Math.random() * 100;
                const opacity = Math.random() * 0.2 + 0.1; // 0.1-0.3
                
                symbol.style.cssText = `
                    position: absolute;
                    left: ${x}%;
                    top: ${y}%;
                    font-size: ${size}px;
                    opacity: ${opacity};
                    z-index: 0;
                    color: ${DeckBuilder.manaColors[color]};
                `;
                
                workspace.appendChild(symbol);
            }
        });
    }
}

const deckBuilder = new DeckBuilder();