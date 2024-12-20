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
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const apiData = await response.json();
            console.log('Received API data:', apiData);

            if (!Array.isArray(apiData)) {
                console.warn('API did not return an array:', apiData);
                return null;
            }
            
            // Convert API data to application format
            const formattedData = apiData.map(item => {
                try {
                    return {
                        name: item.supplier_name,
                        isActive: true,
                        services: [{
                            serviceType: item.service_type,
                            amountLimits: JSON.parse(item.amount_limits || '[]'),
                            serviceCharges: JSON.parse(item.service_charges || '[]'),
                            additionalQuestions: JSON.parse(item.additional_questions || '[]')
                        }]
                    };
                } catch (error) {
                    console.error('Error parsing item:', item, error);
                    return null;
                }
            }).filter(Boolean);

            if (window.suppliersState) {
                window.suppliersState.data = formattedData;
                window.suppliersState.save();
                window.dispatchEvent(new Event('suppliersUpdated'));
                showNotification('Suppliers data loaded successfully', 'success');
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
            if (!window.suppliersState?.data) {
                throw new Error('No supplier data to save');
            }

            // Format data for SheetDB
            const data = window.suppliersState.data.map(supplier => {
                const service = supplier.services[0] || {};
                // Ensure all fields are strings for Google Sheets
                return {
                    supplier_name: String(supplier.name || ''),
                    service_type: String(service.serviceType || ''),
                    amount_limits: JSON.stringify(service.amountLimits || []),
                    service_charges: JSON.stringify(service.serviceCharges || []),
                    additional_questions: JSON.stringify(service.additionalQuestions || [])
                };
            });

            console.log('Sending data to SheetDB:', { data });

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ data })
            });

            const responseText = await response.text();
            console.log('SheetDB Response:', responseText);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}, response: ${responseText}`);
            }

            showNotification('Suppliers synced to Google Sheets successfully', 'success');
            return true;
        } catch (error) {
            console.error('Error saving to API:', error);
            showNotification('Failed to sync suppliers to Google Sheets', 'error');
            return false;
        }
    },

    // Initialize sync functionality
    init() {
        console.log('Initializing supplier sync...');
        
        // Add event listeners for manual sync buttons
        const syncButton = document.getElementById('sync-suppliers-btn');
        const fetchButton = document.getElementById('fetch-suppliers-btn');

        if (syncButton) {
            syncButton.addEventListener('click', async () => {
                console.log('Manual sync requested');
                await this.saveStateToAPI();
            });
        }

        if (fetchButton) {
            fetchButton.addEventListener('click', async () => {
                console.log('Manual fetch requested');
                await this.fetchAndUpdateState();
            });
        }

        // Listen for state changes
        window.addEventListener('suppliersStateChanged', () => {
            console.log('Suppliers state changed - manual sync required');
            showNotification('Changes detected - Click "Sync" to save to Google Sheets', 'info');
        });
    }
};

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
    supplierSync.init();
});

// Export for use in other files
window.supplierSync = supplierSync;
