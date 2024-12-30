// suppliers-state.js
window.suppliersState = {
    data: [],
    
    load() {
        try {
            console.log('Attempting to load from localStorage...');
            const stored = localStorage.getItem('suppliers');
            console.log('Raw stored data:', stored);
            
            if (stored) {
                this.data = JSON.parse(stored);
                console.log('Parsed suppliers data:', this.data);
                
                // Validate supplier structure
                this.data.forEach((supplier, index) => {
                    console.log(`Supplier ${index + 1}:`, {
                        name: supplier.name,
                        isActive: supplier.isActive,
                        services: supplier.services?.map(service => ({
                            type: service.serviceType,
                            amountLimits: service.amountLimits,
                            additionalQuestions: service.additionalQuestions
                        }))
                    });
                });
            }
        } catch (error) {
            console.error('Error loading suppliers:', error);
            this.data = [];
        }
    },

    save() {
        try {
            console.log('Saving suppliers state...');
            console.log('Data being saved:', JSON.stringify(this.data, null, 2));
            localStorage.setItem('suppliers', JSON.stringify(this.data));
            
            // Dispatch event for daily rates update
            window.dispatchEvent(new Event('suppliersUpdated'));
            
            console.log('Suppliers saved successfully');
        } catch (error) {
            console.error('Error saving suppliers:', error);
        }
    },

    addSupplier(supplier) {
        console.log('Adding new supplier:', supplier);
        this.data.push(supplier);
        this.save();
        console.log('Current suppliers after add:', this.data);
    },

    updateSupplier(index, supplier) {
        console.log('Updating supplier at index', index, 'with:', supplier);
        this.data[index] = supplier;
        this.save();
        console.log('Current suppliers after update:', this.data);
    },

    deleteSupplier(index) {
        console.log('Deleting supplier at index:', index);
        this.data.splice(index, 1);
        this.save();
        console.log('Current suppliers after delete:', this.data);
    },

    getSupplierByName(name) {
        return this.data.find(s => s.name === name);
    }
};

// Load initial data
window.suppliersState.load();

// Log initial state
console.log('Initial suppliers state:', {
    stateExists: !!window.suppliersState,
    dataArray: Array.isArray(window.suppliersState.data),
    dataLength: window.suppliersState.data.length,
    suppliers: window.suppliersState.data
});
