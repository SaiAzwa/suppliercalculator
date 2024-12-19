// API URL for SheetDB
const API_URL = 'https://sheetdb.io/api/v1/yp17r75g86k93';

// Function to sync data between the API and local state
const supplierSync = {
    // Fetch data from API and update local state
    async fetchAndUpdateState() {
        try {
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
            
            // Convert API data to application format
            const formattedData = apiData.map(item => ({
                name: item.supplier_name,
                serviceType: item.service_type,
                amountLimits: JSON.parse(item.amount_limits || '{}'),
                serviceCharges: JSON.parse(item.service_charges || '{}'),
                additionalQuestions: JSON.parse(item.additional_questions || '[]'),
                isActive: true
            }));

            // Update state
            if (window.suppliersState) {
                window.suppliersState.data = formattedData;
                window.suppliersState.save();
                
                // Trigger update event
                window.dispatchEvent(new Event('suppliersUpdated'));
            }

            return formattedData;
        } catch (error) {
            console.error('Error fetching data:', error);
            showNotification('Failed to fetch suppliers data', 'error');
            return null;
        }
    },

    // Save current state to API
    async saveStateToAPI() {
        try {
            if (!window.suppliersState) {
                throw new Error('Suppliers state not initialized');
            }

            const suppliers = window.suppliersState.data;
            
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

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            showNotification('Suppliers data saved successfully', 'success');
            return data;
        } catch (error) {
            console.error('Error saving data:', error);
            showNotification('Failed to save suppliers data', 'error');
            return null;
        }
    },

    // Initialize sync
    async init() {
        // Initial load from API
        await this.fetchAndUpdateState();

        // Set up auto-sync
        window.addEventListener('suppliersStateChanged', async () => {
            await this.saveStateToAPI();
        });
    }
};

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', async () => {
    await supplierSync.init();
});

// Export for use in other files
window.supplierSync = supplierSync;
