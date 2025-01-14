class TypeFilter {
    constructor() {
        this.selectedTypes = new Set();
        this.typeData = {
            supertypes: [],
            types: [],
            subtypes: []
        };
        this.tagContainer = document.createElement('div');
        this.tagContainer.className = 'tag-container';
        this.currentCapsule = null;
        this.capsuleCount = 0;
    }

    buildTypeQuery() {
        console.log('Building type query...');
        console.log('Tag container:', this.tagContainer);
        
        if (!this.tagContainer) {
            console.log('No tag container found');
            return '';
        }
        
        const capsules = Array.from(this.tagContainer.querySelectorAll('.type-capsule'));
        const mainTags = Array.from(this.tagContainer.querySelectorAll(':scope > .type-tag'));
        
        console.log('Found capsules:', capsules);
        console.log('Found main tags:', mainTags);
        const mainConditions = mainTags.map(tag => `t:${tag.dataset.type}`).join(' ');
        
        // If we only have main tags, return them directly
        if (!capsules.length) {
            return mainConditions;
        }
        
        // Handle capsules with main conditions applied to each
        const capsuleQueries = capsules.map(capsule => {
            const capsuleTags = Array.from(capsule.querySelectorAll('.type-tag'));
            const capsuleConditions = capsuleTags.map(tag => `t:${tag.dataset.type}`).join(' ');
            return mainConditions 
                ? `(${mainConditions} ${capsuleConditions})`
                : capsuleConditions;
        });
        
        return capsuleQueries.join(' OR ');
    }

    async initialize() {
        const typeFilterSection = document.getElementById('typeFilter');
        
        // Create search container to hold search and buttons
        const searchContainer = document.createElement('div');
        searchContainer.className = 'type-search-row';
        
        // Create capsule button
        const capsuleButton = document.createElement('button');
        capsuleButton.className = 'capsule-button';
        capsuleButton.textContent = 'New Type Group';
        capsuleButton.onclick = () => this.createNewCapsule();
        
        // Create search button
        const searchButton = document.createElement('button');
        searchButton.className = 'search-button';
        searchButton.textContent = 'Search Types';
        searchButton.onclick = () => {
            console.log('Search button clicked');
            const query = this.buildTypeQuery();
            console.log('Built query:', query);
            if (query) {
                console.log('Executing search with query:', query);
                this.executeTypeSearch(query);
            }
        };
        
        // Initialize components in order
        await this.fetchAllTypeData();
        this.setupTypeSearch();
        
        // Add search and buttons to the same row
        searchContainer.appendChild(document.querySelector('.type-search-container'));
        searchContainer.appendChild(capsuleButton);
        searchContainer.appendChild(searchButton);
        typeFilterSection.appendChild(searchContainer);
        
        // Add tag container after search row
        this.setupTagContainer();
        typeFilterSection.appendChild(this.tagContainer);
        
        // Add dropdowns last
        this.setupTypeDropdowns();
    }

    async fetchAllTypeData() {
        const endpoints = [
            'supertypes',
            'card-types',
            'creature-types',
            'artifact-types',
            'enchantment-types',
            'planeswalker-types',
            'land-types',
            'spell-types'
        ];
    
        this.typeCategories = {
            creatures: [],
            artifacts: [],
            lands: [],
            spells: []
        };
    
        for (const endpoint of endpoints) {
            await globalRateLimiter.throttle();
            const response = await fetch(`https://api.scryfall.com/catalog/${endpoint}`);
            const data = await response.json();
            console.log(`${endpoint} data:`, data.data);
            
            switch(endpoint) {
                case 'creature-types':
                    this.typeCategories.creatures = data.data;
                    break;
                case 'artifact-types':
                    this.typeCategories.artifacts = data.data;
                    break;
                case 'land-types':
                    this.typeCategories.lands = data.data;
                    break;
                case 'spell-types':
                    this.typeCategories.spells = data.data;
                    break;
                case 'supertypes':
                    this.typeData.supertypes = data.data;
                    break;
                case 'card-types':
                    this.typeData.types = data.data;
                    break;
            }
        }
        console.log('Final type categories:', this.typeCategories);
    }

    isCreatureType(type) {
        return this.typeCategories.creatures.includes(type);
    }
    
    isArtifactType(type) {
        return this.typeCategories.artifacts.includes(type);
    }
    
    isLandType(type) {
        return this.typeCategories.lands.includes(type);
    }
    
    isSpellType(type) {
        return this.typeCategories.spells.includes(type);
    }

    setupTypeSearch() {
        this.setupTagContainer();
        const searchContainer = document.createElement('div');
        searchContainer.className = 'type-search-container';
        
        const searchInput = document.createElement('input');
        searchInput.id = 'type-search';
        searchInput.type = 'text';
        searchInput.placeholder = 'Search card types...';
        searchInput.autocomplete = 'off';  // Disable browser autocomplete
        
        const dropdown = document.createElement('div');
        dropdown.className = 'type-search-dropdown';
        dropdown.style.display = 'none';
        
        let selectedIndex = -1;
        
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            dropdown.innerHTML = '';
            
            const allTypes = [
                ...this.typeData.supertypes,
                ...this.typeData.types,
                ...this.typeCategories.creatures,
                ...this.typeCategories.artifacts,
                ...this.typeCategories.lands,
                ...this.typeCategories.spells
            ].filter(Boolean);
            
            const matches = allTypes.filter(type => 
                type.toLowerCase().includes(searchTerm)
            );
            
            if (matches.length && searchTerm) {
                dropdown.style.display = 'block';
                matches.forEach((match, index) => {
                    const option = document.createElement('div');
                    option.className = 'type-option';
                    option.textContent = match;
                    option.addEventListener('click', () => {
                        this.addTypeTag(match);
                        searchInput.value = '';
                        dropdown.style.display = 'none';
                        selectedIndex = -1;
                    });
                    dropdown.appendChild(option);
                });
            } else {
                dropdown.style.display = 'none';
                selectedIndex = -1;
            }
        });
        
        searchInput.addEventListener('keydown', (e) => {
            const options = dropdown.querySelectorAll('.type-option');
            
            switch(e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    selectedIndex = Math.min(selectedIndex + 1, options.length - 1);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    selectedIndex = Math.max(selectedIndex - 1, 0);
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (selectedIndex >= 0 && options[selectedIndex]) {
                        this.addTypeTag(options[selectedIndex].textContent);
                        searchInput.value = '';
                        dropdown.style.display = 'none';
                        selectedIndex = -1;
                    }
                    break;
                case 'Escape':
                    dropdown.style.display = 'none';
                    selectedIndex = -1;
                    break;
                case 'Tab':
                    if (dropdown.style.display === 'block') {
                        e.preventDefault();
                        selectedIndex = (selectedIndex + 1) % options.length;
                    }
                    break;
            }
            
            // Update visual selection
            options.forEach((option, index) => {
                option.classList.toggle('selected', index === selectedIndex);
            });
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!searchContainer.contains(e.target)) {
                dropdown.style.display = 'none';
                selectedIndex = -1;
            }
        });
        
        searchContainer.appendChild(searchInput);
        searchContainer.appendChild(dropdown);
        document.getElementById('typeFilter').appendChild(searchContainer);
    }

    setupTypeSearchHandlers(searchInput) {
        const datalist = document.createElement('datalist');
        datalist.id = 'type-suggestions';
        searchInput.setAttribute('list', 'type-suggestions');
        
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            datalist.innerHTML = '';
            
            const allTypes = [
                ...this.typeData.supertypes,
                ...this.typeData.types,
                ...this.typeData.subtypes
            ];
            
            const matches = allTypes.filter(type => 
                type.toLowerCase().includes(searchTerm)
            );
            
            matches.forEach(match => {
                const option = document.createElement('option');
                option.value = match;
                datalist.appendChild(option);
            });
        });
        
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && searchInput.value) {
                this.addTypeTag(searchInput.value);
                searchInput.value = '';
            }
        });
        
        searchInput.parentNode.appendChild(datalist);
    }

    createDropdownSection(title, types) {
        const section = document.createElement('div');
        section.className = 'dropdown-section';
        
        const sectionHeader = document.createElement('div');
        sectionHeader.className = 'dropdown-section-header';
        sectionHeader.innerHTML = `
            ${title}
            <span class="dropdown-toggle">▼</span>
        `;
        
        const sectionContent = document.createElement('div');
        sectionContent.className = 'dropdown-content';
        
        types.forEach(type => {
            const typeButton = document.createElement('button');
            typeButton.className = 'type-option';
            typeButton.textContent = type;
            typeButton.onclick = () => this.addTypeTag(type);
            sectionContent.appendChild(typeButton);
        });
        
        sectionHeader.onclick = () => {
            sectionContent.style.display = 
                sectionContent.style.display === 'none' ? 'block' : 'none';
            sectionHeader.querySelector('.dropdown-toggle').textContent = 
                sectionContent.style.display === 'none' ? '▼' : '▲';
        };
        
        section.appendChild(sectionHeader);
        section.appendChild(sectionContent);
        return section;
    }

    setupTypeDropdowns() {
        const dropdownsContainer = document.createElement('div');
        dropdownsContainer.className = 'type-dropdowns';
        
        const header = document.createElement('div');
        header.className = 'type-dropdowns-header';
        header.innerHTML = `
            Type Categories
            <span class="dropdown-toggle">▼</span>
        `;
        
        const content = document.createElement('div');
        content.className = 'type-dropdowns-content';
        content.style.display = 'none';
        
        // Create sections using our API data
        const sections = [
            { title: 'Card Types', types: this.typeData.types },
            { title: 'Supertypes', types: this.typeData.supertypes },
            { title: 'Creature Types', types: this.typeCategories.creatures },
            { title: 'Artifact Types', types: this.typeCategories.artifacts },
            { title: 'Land Types', types: this.typeCategories.lands },
            { title: 'Spell Types', types: this.typeCategories.spells }
        ];
    
        sections.forEach(section => {
            if (section.types && section.types.length > 0) {
                const sectionDiv = this.createDropdownSection(section.title, section.types);
                content.appendChild(sectionDiv);
            }
        });
        
        header.onclick = () => {
            if (content.style.display === 'none') {
                content.style.display = 'flex';
            } else {
                content.style.display = 'none';
            }
            header.querySelector('.dropdown-toggle').textContent = 
                content.style.display === 'none' ? '▼' : '▲';
        };
        
        dropdownsContainer.appendChild(header);
        dropdownsContainer.appendChild(content);
        document.getElementById('typeFilter').appendChild(dropdownsContainer);
    }

    createDropdown(title, items) {
        const section = document.createElement('div');
        section.className = 'type-dropdown-section';
        
        const header = document.createElement('div');
        header.className = 'dropdown-header';
        header.textContent = title;
        
        const content = document.createElement('div');
        content.className = 'dropdown-content';
        
        items.forEach(item => {
            const button = document.createElement('button');
            button.className = 'type-option';
            button.textContent = item;
            button.onclick = () => this.addTypeTag(item);
            content.appendChild(button);
        });
        
        section.appendChild(header);
        section.appendChild(content);
        return section;
    }

    setupTagContainer() {
        this.tagContainer = document.createElement('div');
        this.tagContainer.className = 'selected-types-container';
        document.getElementById('typeFilter').appendChild(this.tagContainer);
    }

    createNewCapsule() {
        this.capsuleCount++;
        const capsule = document.createElement('div');
        capsule.className = 'type-capsule';
        capsule.dataset.capsuleId = this.capsuleCount;
        
        const capsuleHeader = document.createElement('div');
        capsuleHeader.className = 'capsule-header';
        capsuleHeader.textContent = `Type Group ${this.capsuleCount}`;
        
        const tagArea = document.createElement('div');
        tagArea.className = 'capsule-tags';
        
        capsule.appendChild(capsuleHeader);
        capsule.appendChild(tagArea);
        this.tagContainer.appendChild(capsule);
        
        this.currentCapsule = capsule;
    }

    addTypeTag(type) {
        const tag = document.createElement('div');
        tag.className = 'type-tag';
        tag.dataset.type = type;
        
        const removeButton = document.createElement('span');
        removeButton.className = 'remove-tag';
        removeButton.textContent = '×';
        removeButton.onclick = this.removeType.bind(this, type, tag);
        
        tag.textContent = type;
        tag.appendChild(removeButton);
        
        const targetContainer = this.currentCapsule 
            ? this.currentCapsule.querySelector('.capsule-tags')
            : this.tagContainer;
        
        targetContainer.appendChild(tag);
        this.selectedTypes.add({
            type: type,
            capsuleId: this.currentCapsule?.dataset.capsuleId || 'main'
        });
    }

    removeType(type, tagElement) {
        this.selectedTypes.delete(type);
        tagElement.remove();
    }

    handleTypeSearch(event) {
        const searchTerm = event.target.value.toLowerCase();
        const datalist = document.getElementById('type-suggestions');
        datalist.innerHTML = '';
        
        const allTypes = [
            ...this.typeData.supertypes,
            ...this.typeData.types,
            ...this.typeData.subtypes
        ];
        
        const matches = allTypes.filter(type => 
            type.toLowerCase().includes(searchTerm)
        );
        
        matches.forEach(match => {
            const option = document.createElement('option');
            option.value = match;
            datalist.appendChild(option);
        });
    }

    async executeTypeSearch(query) {
        if (!query) return;
        
        try {
            let allResults = [];
            let hasMore = true;
            let page = 1;
            let totalCards = null;
            
            // First page fetch
            const firstPageUrl = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}&order=name&dir=asc&unique=cards&page=${page}`;
            const firstPageResponse = await fetch(firstPageUrl);
            
            // Handle no results found
            if (!firstPageResponse.ok) {
                document.dispatchEvent(new CustomEvent('searchProgress', {
                    detail: { 
                        results: { name: [] },
                        progress: {
                            current: 0,
                            total: 0
                        }
                    }
                }));
                console.log('searchProgress event dispatched with', allResults.length, 'results');
                console.log('Search dispatching results structure:', { name: allResults });

                return;
            }
            
            const firstPageData = await firstPageResponse.json();
            totalCards = firstPageData.total_cards;
            allResults = [...firstPageData.data];
            
            // Dispatch initial results
            document.dispatchEvent(new CustomEvent('searchProgress', {
                detail: { 
                    results: { name: allResults },
                    progress: {
                        current: allResults.length,
                        total: totalCards
                    }
                }
            }));
            console.log('searchProgress event dispatched with', allResults.length, 'results');
            console.log('Search dispatching results structure:', { name: allResults });
            
            // Continue loading remaining pages
            hasMore = firstPageData.has_more;
            page++;
            
            while (hasMore) {
                const url = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}&order=name&dir=asc&unique=cards&page=${page}`;
                await globalRateLimiter.throttle();
                const data = await (await fetch(url)).json();
                
                allResults = [...allResults, ...data.data];
                
                // Update progress
                document.dispatchEvent(new CustomEvent('searchProgress', {
                    detail: { 
                        results: { name: allResults },
                        progress: {
                            current: allResults.length,
                            total: totalCards
                        }
                    }
                }));
                console.log('searchProgress event dispatched with', allResults.length, 'results');
                console.log('Search dispatching results structure:', { name: allResults });
                
                hasMore = data.has_more && allResults.length < totalCards;
                page++;
            }
        } catch (error) {
            console.error('Type search failed:', error);
            // Dispatch empty results on error
            document.dispatchEvent(new CustomEvent('searchProgress', {
                detail: { 
                    results: { name: [] },
                    progress: {
                        current: 0,
                        total: 0
                    }
                }
            }));
            console.log('searchProgress event dispatched with', allResults.length, 'results');
            console.log('Search dispatching results structure:', { name: allResults });
        }
    }
}
