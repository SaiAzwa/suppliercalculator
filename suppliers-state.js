// suppliers-state.js
console.log('Initializing suppliers state...');

window.suppliersState = {
    data: [],
    
    load() {
        try {
            console.log('Loading suppliers from localStorage...');
            const stored = localStorage.getItem('suppliers');
            console.log('Raw stored suppliers:', stored);
            
            if (stored) {
                this.data = JSON.parse(stored);
                console.log('Parsed suppliers:', this.data);
            } else {
                console.log('No suppliers found in localStorage');
                this.data = [];
            }
        } catch (error) {
            console.error('Error loading suppliers:', error);
            this.data = [];
        }
        
        // Log the current state after loading
        console.log('Current suppliers state after load:', {
            hasData: Array.isArray(this.data),
            dataLength: this.data.length,
            data: this.data
        });
    },

    save() {
        try {
            console.log('Saving suppliers to localStorage...');
            console.log('Data being saved:', this.data);
            
            localStorage.setItem('suppliers', JSON.stringify(this.data));
            
            // Verify the save
            const savedData = localStorage.getItem('suppliers');
            console.log('Verified saved data:', savedData);
            
            // Dispatch event for UI updates
            window.dispatchEvent(new Event('suppliersUpdated'));
            
            console.log('Save complete');
        } catch (error) {
            console.error('Error saving suppliers:', error);
        }
    },

    addSupplier(supplier) {
        console.log('Adding new supplier:', supplier);
        
        if (!this.data) {
            console.log('Initializing data array');
            this.data = [];
        }
        
        this.data.push(supplier);
        console.log('Current suppliers after add:', this.data);
        
        this.save();
    },

    updateSupplier(index, supplier) {
        console.log('Updating supplier at index:', index);
        console.log('New supplier data:', supplier);
        
        this.data[index] = supplier;
        this.save();
    },

    deleteSupplier(index) {
        console.log('Deleting supplier at index:', index);
        
        this.data.splice(index, 1);
        this.save();
    },

    getSuppliers() {
        return this.data;
    }
};

// Initialize
console.log('Loading initial supplier data...');
window.suppliersState.load();

// Add test method to window for debugging
window.checkSuppliersState = function() {
    console.log('Current suppliers state:', {
        stateExists: !!window.suppliersState,
        hasData: Array.isArray(window.suppliersState.data),
        dataLength: window.suppliersState.data.length,
        data: window.suppliersState.data,
        localStorage: localStorage.getItem('suppliers')
    });
};

// Log initial state
console.log('Suppliers state initialization complete:', {
    stateExists: !!window.suppliersState,
    hasData: Array.isArray(window.suppliersState.data),
    dataLength: window.suppliersState.data.length
});
