alert('suppliers-state.js is loading');

console.log('Starting suppliers-state.js initialization...');

// Initialize suppliers state
window.suppliersState = {
    data: [],
    
    load() {
        try {
            console.log('Attempting to load from localStorage...');
            const stored = localStorage.getItem('suppliers');
            console.log('LoadedFromStorage:', stored);
            if (stored) {
                this.data = JSON.parse(stored);
            }
            console.log('Current state data:', this.data);
        } catch (error) {
            console.error('Error loading suppliers:', error);
            this.data = [];
        }
    },

    save() {
        try {
            console.log('Attempting to save to localStorage...');
            localStorage.setItem('suppliers', JSON.stringify(this.data));
            console.log('Saved data:', this.data);
        } catch (error) {
            console.error('Error saving suppliers:', error);
        }
    }
};

// Load initial data
window.suppliersState.load();

console.log('Suppliers state initialization complete:', {
    stateExists: !!window.suppliersState,
    dataArray: Array.isArray(window.suppliersState.data),
    dataLength: window.suppliersState.data.length
});
