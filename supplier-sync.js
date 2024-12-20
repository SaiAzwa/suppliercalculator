// API URL for SheetDB
const API_URL = 'https://sheetdb.io/api/v1/yp17r75g86k93';

// Function to sync data between the API and local state
const supplierSync = {
    // Fetch data from API and update local state
    async fetchAndUpdateState() {
        try {
            console.log('Fetching data from API...');
            const response = await fetch(API_URL, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const apiData = await response.json();
            console.log('Received API data:', apiData);
            
            // Convert API data to application format
            const formattedData = apiData.map(item => ({
                name: item.supplier_name,
                serviceType: item.service_type,
                amountLimits: JSON.parse(item.amount_limits || '{}'),
                serviceCharges: JSON.parse(item.service_charges || '{}'),
                additionalQuestions: JSON.parse(item.additional_questions || '[]'),
                isActive: true
            }));

            console.log('Formatted data:', formattedData);

            // Update state
            if (window.suppliersState) {
                window.suppliersState.data = formattedData;
                window.suppliersState.save();
                console.log('State updated and saved:', window.suppliersState.data);
                
                // Trigger update event
                window.dispatchEvent(new Event('suppliersUpdated'));
                console.log('suppliersUpdated event dispatched');
            } else {
                console.error('suppliersState not found');
            }

            return formattedData;
        } catch (error) {
            console.error('Error in fetchAndUpdateState:', error);
            showNotification('Failed to fetch suppliers data', 'error');
            return null;
        }
    },

    // Save current state to API
    async saveStateToAPI() {
        try {
            console.log('Saving state to API...');
            if (!window.suppliersState) {
                throw new Error('Suppliers state not initialized');
            }

            const suppliers = window.suppliersState.data;
            console.log('Current state data:', suppliers);
            
            // Format data for API
            const requestBody = {
                data: suppliers.map(supplier => ({
                    supplier_name: supplier.name,
                    service_type: supplier.serviceType,
                    amount_limits: JSON.stringify(supplier.amountLimits || {}),
                    service_charges: JSON.stringify(supplier.serviceCharges || {}),
                    additional_questions: JSON.stringify(supplier.additionalQuestions || [])
                }))
            };

            console.log('Formatted request body:', requestBody);

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }

            const data = await response.json();
            console.log('API response:', data);
            showNotification('Suppliers data saved successfully', 'success');
            return data;
        } catch (error) {
            console.error('Error in saveStateToAPI:', error);
            showNotification('Failed to save suppliers data', 'error');
            return null;
        }
    },

    // Initialize sync
    async init() {
        console.log('Initializing supplier sync...');
        // Initial load from API
        await this.fetchAndUpdateState();

        // Set up auto-sync
        window.addEventListener('suppliersStateChanged', async () => {
            console.log('suppliersStateChanged event received');
            await this.saveStateToAPI();
        });

        console.log('Sync initialization complete');
    }
};

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM Content Loaded - Starting supplier sync init');
    await supplierSync.init();
});

// Export for use in other files
window.supplierSync = supplierSync;
