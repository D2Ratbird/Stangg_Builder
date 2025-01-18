class TagFilter { 
    constructor() { 
        this.selectedTags = new Set(); 
    }

    initialize() {
        // Basic initialization
        console.log('Tag Filter initialized');
    }

    getSelectedTags() {
        return Array.from(this.selectedTags).join(' ');
    }
}