// Create a self-executing function to avoid global scope pollution
(function() {
    console.log('Initializing suppliers state...');
    
    // Initialize the suppliers state
    window.suppliersState = {
        data: [],
        load() {
            try {
                const stored = localStorage.getItem('suppliers');
                console.log('Loading from localStorage:', stored);
                this.data = stored ? JSON.parse(stored) : [];
                console.log('State loaded:', this.data);
                return true;
            } catch (error) {
                console.error('Error loading suppliers:', error);
                this.data = [];
                return false;
            }
        },
        save() {
            try {
                localStorage.setItem('suppliers', JSON.stringify(this.data));
                console.log('State saved:', this.data);
                return true;
            } catch (error) {
                console.error('Error saving suppliers:', error);
                return false;
            }
        }
    };

    // Load the initial data
    const loadSuccess = window.suppliersState.load();
    console.log('Initial state load ' + (loadSuccess ? 'successful' : 'failed'));
    console.log('Suppliers state initialized:', window.suppliersState);

    // Add a method to verify state
    window.suppliersState.verify = function() {
        console.log('State verification:', {
            stateExists: !!window.suppliersState,
            hasData: Array.isArray(this.data),
            dataLength: this.data.length,
            currentData: this.data
        });
    };

    // Verify state after initialization
    window.suppliersState.verify();
})();
