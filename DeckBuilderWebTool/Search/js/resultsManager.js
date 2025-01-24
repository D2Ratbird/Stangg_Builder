class ResultsManager {
    constructor() {
        this.currentResults = [];
        this.categories = {
            types: new Set(),
            subtypes: new Set(),
            colors: new Set(),
            rarities: new Set(),
            sets: new Set()
        };
        this.filters = {
            included: new Set(),
            excluded: new Set()
        };
        this.sortOrder = 'name';
        this.sortDirection = 'asc';
        
        this.setupEventListeners();
        this.createFilterPanel();
    }
    

    setupEventListeners() {
        document.addEventListener('searchProgress', (event) => {
            if (event.detail.results.name !== this.currentResults) {
                console.log('ResultsManager received searchProgress event:', event.detail);
                console.log('Filter search progress:', event.detail);
                console.log('Results structure:', event.detail.results);
                this.updateResults(event.detail.results.name);
            }
        });
    }
    
    updateResults(newResults) {
        console.log('Updating results with:', newResults.length, 'cards');
        this.currentResults = newResults;
        this.extractCategories();
        this.updateFilterPanel();
        this.applyFiltersAndSort();
    }

    extractCategories() {
        this.categories = {
            types: new Set(),
            subtypes: new Set(),
            colors: new Set(),
            rarities: new Set(),
            sets: new Set(),
            legalities: new Set()
        };

        this.currentResults.forEach(card => {
            // Extract card types
            card.type_line?.split('—')[0].trim().split(' ').forEach(type => {
                this.categories.types.add(type);
            });
            
            // Extract subtypes
            const subtypes = card.type_line?.split('—')[1]?.trim().split(' ') || [];
            subtypes.forEach(subtype => {
                this.categories.subtypes.add(subtype);
            });

            Object.entries(card.legalities)
                .filter(([_, status]) => status === 'legal')
                .forEach(([format, _]) => this.categories.legalities.add(format));
            
            // Extract other categories
            card.colors?.forEach(color => this.categories.colors.add(color));
            this.categories.rarities.add(card.rarity);
            this.categories.sets.add(card.set_name);
        });
    }

    createFilterPanel() {
        const panel = document.createElement('div');
        panel.className = 'results-filter-panel';
        
        // Create sorting controls
        const sortingSection = this.createSortingControls();
        panel.appendChild(sortingSection);
        
        // Create category dropdowns
        const filterSection = document.createElement('div');
        filterSection.className = 'category-dropdowns';
        
        const categoryTypes = [
            { id: 'types', label: 'Card Types' },
            { id: 'subtypes', label: 'Subtypes' },
            { id: 'colors', label: 'Colors' },
            { id: 'rarities', label: 'Rarity' },
            { id: 'sets', label: 'Sets' },
            { id: 'legalities', label: 'Legalities' }
        ];
        
        categoryTypes.forEach(category => {
            const dropdown = this.createDropdown(category);
            filterSection.appendChild(dropdown);
        });
        
        panel.appendChild(filterSection);
        
        const resultsModal = document.querySelector('#resultsOverlay .modal');
        resultsModal.insertBefore(panel, document.getElementById('searchResults'));
    }
    
    createDropdown(category) {
        const container = document.createElement('div');
        container.className = 'category-dropdown';
        
        const button = document.createElement('button');
        button.className = 'dropdown-button';
        button.innerHTML = `${category.label} ▼`;
        
        const content = document.createElement('div');
        content.className = 'dropdown-content';
        content.id = `${category.id}-filters`;
        
        button.onclick = (e) => {
            e.stopPropagation();
            
            // Close all other dropdowns
            document.querySelectorAll('.dropdown-content').forEach(otherContent => {
                if (otherContent !== content) {
                    otherContent.classList.remove('show');
                    otherContent.previousElementSibling.innerHTML = 
                        `${otherContent.previousElementSibling.textContent.split(' ')[0]} ▼`;
                }
            });
            
            // Toggle current dropdown
            content.classList.toggle('show');
            button.innerHTML = `${category.label} ${content.classList.contains('show') ? '▲' : '▼'}`;
        };
        
        container.appendChild(button);
        container.appendChild(content);
        
        return container;
    }

    matchesFilters(card) {
        if (this.filters.included.size === 0) return true;
        
        return Array.from(this.filters.included).every(filter => {
            const [category, value] = filter.split(':');
            switch(category) {
                case 'types':
                    return card.type_line.includes(value);
                case 'subtypes':
                    return card.type_line.includes(value);
                case 'colors':
                    return card.colors?.includes(value);
                case 'rarities':
                    return card.rarity === value;
                case 'sets':
                    return card.set_name === value;
                default:
                    return true;
            }
        });
    }

    createSortingControls() {
        const sortingSection = document.createElement('div');
        sortingSection.className = 'sorting-controls';
        
        const sortOptions = [
            { value: 'name', label: 'Name' },
            { value: 'price', label: 'Price' },
            { value: 'color', label: 'Color Identity' },
            { value: 'cmc', label: 'Mana Value' },
            { value: 'date', label: 'Release Date' }
        ];
        
        const select = document.createElement('select');
        select.onchange = (e) => {
            this.sortOrder = e.target.value;
            this.applyFiltersAndSort();
        };
        
        sortOptions.forEach(option => {
            const opt = document.createElement('option');
            opt.value = option.value;
            opt.textContent = option.label;
            select.appendChild(opt);
        });
        
        const directionBtn = document.createElement('button');
        directionBtn.onclick = () => {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
            directionBtn.textContent = this.sortDirection === 'asc' ? '↑' : '↓';
            this.applyFiltersAndSort();
        
            // Update display with newly sorted results
            document.dispatchEvent(new CustomEvent('displayResults', {
                detail: { results: this.currentResults }
            }));
        };
        directionBtn.textContent = '↑';
    
        sortingSection.appendChild(select);
        sortingSection.appendChild(directionBtn);
    
        return sortingSection;
    }

    createCategorySection(category) {
        const container = document.createElement('div');
        container.className = 'category-section';
        
        const header = document.createElement('div');
        header.className = 'category-header';
        header.textContent = category.label;
        
        const content = document.createElement('div');
        content.className = 'category-content';
        content.id = `${category.id}-filters`;
        
        container.appendChild(header);
        container.appendChild(content);
        
        return container;
    }
    
    updateFilterPanel() {
        Object.entries(this.categories).forEach(([categoryId, values]) => {
            const content = document.getElementById(`${categoryId}-filters`);
            if (!content) return;
            
            content.innerHTML = '';
            Array.from(values).sort().forEach(value => {
                const item = document.createElement('div');
                item.className = 'filter-item';
                
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = `${categoryId}-${value}`;
                checkbox.checked = this.filters.included.has(`${categoryId}:${value}`);
                
                const count = this.currentResults.filter(card => {
                    switch(categoryId) {
                        case 'types':
                            return card.type_line?.includes(value);
                        case 'subtypes':
                            return card.type_line?.includes(value);
                        case 'colors':
                            return card.colors?.includes(value);
                        case 'rarities':
                            return card.rarity === value;
                        case 'sets':
                            return card.set_name === value;
                        case 'legalities':
                            return card.legalities[value] === 'legal';
                    }
                }).length;
                
                const label = document.createElement('label');
                label.htmlFor = checkbox.id;
                label.textContent = `${value} (${count})`;
                
                checkbox.addEventListener('change', (e) => {
                    e.stopPropagation();
                    const filterKey = `${categoryId}:${value}`;
                    if (checkbox.checked) {
                        this.filters.included.add(filterKey);
                        this.filters.excluded.delete(filterKey);
                    } else {
                        this.filters.included.delete(filterKey);
                    }
                    this.applyFiltersAndSort();
                    
                    document.dispatchEvent(new CustomEvent('displayResults', {
                        detail: { results: this.currentResults }
                    }));
                });
                
                item.appendChild(checkbox);
                item.appendChild(label);
                content.appendChild(item);
            });
        });
    }
    
    createFilterItem(categoryId, value) {
        const item = document.createElement('div');
        item.className = 'filter-item';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `${categoryId}-${value}`;
        checkbox.checked = this.filters.included.has(`${categoryId}:${value}`);
        
        const count = this.currentResults.filter(card => {
            switch(categoryId) {
                case 'types':
                    return card.type_line.includes(value);
                case 'subtypes':
                    return card.type_line.includes(value);
                case 'colors':
                    return card.colors?.includes(value);
                case 'rarities':
                    return card.rarity === value;
                case 'sets':
                    return card.set_name === value;
            }
        }).length;
        
        const label = document.createElement('label');
        label.htmlFor = checkbox.id;
        label.textContent = `${value} (${count})`;
        
        checkbox.addEventListener('change', (e) => {
            e.stopPropagation();
            const filterKey = `${categoryId}:${value}`;
            console.log('Checkbox changed:', filterKey);
            
            if (checkbox.checked) {
                this.filters.included.add(filterKey);
                console.log('Added to filters:', this.filters.included);
            } else {
                this.filters.included.delete(filterKey);
                console.log('Removed from filters:', this.filters.included);
            }
            
            this.applyFiltersAndSort();
            
            // Update the results display
            const filteredResults = this.currentResults.filter(card => this.matchesFilters(card));
            document.dispatchEvent(new CustomEvent('displayResults', {
                detail: { results: filteredResults }
            }));
        });
        
        item.appendChild(checkbox);
        item.appendChild(label);
        
        return item;
    }

    applyFiltersAndSort() {
        console.log('Applying filters and sort to', this.currentResults.length, 'cards');
        let filteredResults = [...this.currentResults];
        
        // Apply category filters
        if (this.filters.included.size > 0) {
            filteredResults = filteredResults.filter(card => {
                return Array.from(this.filters.included).every(filter => {
                    const [category, value] = filter.split(':');
                    switch(category) {
                        case 'types':
                            return card.type_line.includes(value);
                        case 'subtypes':
                            return card.type_line.includes(value);
                        case 'colors':
                            return card.colors?.includes(value);
                        case 'rarities':
                            return card.rarity === value;
                        case 'sets':
                            return card.set_name === value;
                        case 'legalities':
                            return card.legalities[value] === 'legal';
                        default:
                            return true;
                    }
                });
            });
        }
        
        // Sort results
        filteredResults.sort((a, b) => {
            let comparison = 0;
            switch(this.sortOrder) {
                case 'name':
                    comparison = a.name.localeCompare(b.name);
                    break;
                case 'price':
                    const getPriceValue = card => {
                        if (card.name === 'Mox Pearl') {
                            console.log('Mox Pearl full price data:', card.prices);
                        }
                        const price = parseFloat(card.prices?.usd || '0');
                        return price;
                    };
    
                    const priceA = getPriceValue(a);
                    const priceB = getPriceValue(b);

                    if (priceA === 0 && priceB === 0) return 0;
                    if (priceA === 0) return 1;
                    if (priceB === 0) return -1;
                    comparison = priceB - priceA;
                    break;
                case 'color':
                    comparison = this.compareColors(a.color_identity, b.color_identity);
                    break;
                case 'cmc':
                    comparison = (a.cmc || 0) - (b.cmc || 0);
                    break;
                case 'date':
                    comparison = new Date(a.released_at || 0) - new Date(b.released_at || 0);
                    break;
            }
            return this.sortDirection === 'asc' ? comparison : -comparison;
        });
        
        console.log('After filtering and sorting:', filteredResults.length, 'cards');
    
        // Use filterUpdate event instead of searchProgress
        document.dispatchEvent(new CustomEvent('filterUpdate', {
            detail: {
                results: { name: filteredResults },
                progress: { current: filteredResults.length, total: filteredResults.length }
            }
        }));
    }
    
    compareColors(colorsA, colorsB) {
        const colorOrder = ['W', 'U', 'B', 'R', 'G'];
        const getColorScore = colors => {
            if (!colors.length) return -1;
            return Math.min(...colors.map(c => colorOrder.indexOf(c)));
        };
        return getColorScore(colorsA) - getColorScore(colorsB);
    }
}

window.ResultsManager = ResultsManager;