class CriteriaFilter {
    constructor() {
        this.selectedCriteria = new Set();
        this.criteriaList = [];
        this.fetchCriteria();
        this.initializeFilter();
    }

    async fetchCriteria() {
        const response = await fetch('https://api.scryfall.com/catalog/card-mechanics');
        const data = await response.json();
        
        // Update dropdown with fetched criteria
        const select = document.getElementById('criteria-select');
        
        // Add default empty option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Select a mechanic...';
        select.appendChild(defaultOption);
        
        // Add all mechanics as options
        data.data.forEach(mechanic => {
            const option = document.createElement('option');
            option.value = mechanic;
            option.textContent = mechanic.replace('_', ' ');
            select.appendChild(option);
        });
    }

    initializeFilter() {
        const container = document.getElementById('criteria-filters');
        if (!container) return;

        // Create dropdown
        const select = document.createElement('select');
        select.id = 'criteria-select';
        
        // Create tags container
        const tagsContainer = document.createElement('div');
        tagsContainer.className = 'criteria-tags';
        
        select.addEventListener('change', (e) => {
            if (e.target.value) {
                this.addCriteriaTag(e.target.value, tagsContainer);
                e.target.value = ''; // Reset selection
            }
        });

        container.appendChild(select);
        container.appendChild(tagsContainer);
    }

    addCriteriaTag(criterion, container) {
        if (this.selectedCriteria.has(criterion)) return;
        
        const tag = document.createElement('div');
        tag.className = 'criteria-tag';
        tag.textContent = criterion;
        
        const removeButton = document.createElement('span');
        removeButton.className = 'remove-tag';
        removeButton.textContent = '×';
        removeButton.onclick = () => {
            this.selectedCriteria.delete(criterion);
            tag.remove();
            this.triggerUpdate();
        };
        
        tag.appendChild(removeButton);
        container.appendChild(tag);
        this.selectedCriteria.add(criterion);
        this.triggerUpdate();
    }

    triggerUpdate() {
        document.dispatchEvent(new CustomEvent('criteriaUpdated', {
            detail: { criteria: Array.from(this.selectedCriteria) }
        }));
    }

    getCriteriaQuery() {
        return Array.from(this.selectedCriteria)
            .map(criterion => `is:${criterion}`)
            .join(' OR ');
    }
}

export default CriteriaFilter;