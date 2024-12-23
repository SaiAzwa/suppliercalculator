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
                        isActive: item.supplier_status === 'active',
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

            console.log('Formatted data:', formattedData);

            if (window.suppliersState) {
                window.suppliersState.data = formattedData;
                window.suppliersState.save();
                window.dispatchEvent(new Event('suppliersUpdated'));
                showNotification('Suppliers data loaded successfully', 'success');
            } else {
                console.error('suppliersState not found');
                showNotification('Error: Unable to update state', 'error');
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
            const formattedData = window.suppliersState.data.map(supplier => {
                const service = supplier.services[0] || {};
                return {
                    supplier_name: supplier.name || '',
                    supplier_status: supplier.isActive ? 'active' : 'inactive',
                    service_type: service.serviceType || '',
                    amount_limits: Array.isArray(service.amountLimits) ? 
                        JSON.stringify(service.amountLimits) : '[]',
                    service_charges: Array.isArray(service.serviceCharges) ? 
                        JSON.stringify(service.serviceCharges) : '[]',
                    additional_questions: Array.isArray(service.additionalQuestions) ? 
                        JSON.stringify(service.additionalQuestions) : '[]'
                };
            });

            console.log('Sending formatted data to SheetDB:', formattedData);

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    data: formattedData
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);
            }

            const result = await response.json();
            console.log('SheetDB save response:', result);
            showNotification('Suppliers data saved successfully', 'success');
            return true;
        } catch (error) {
            console.error('Error saving to API:', error);
            showNotification('Failed to save suppliers data', 'error');
            return false;
        }
    },

    // Delete a supplier from API
    async deleteSupplier(supplierName) {
        try {
            console.log('Deleting supplier:', supplierName);
            const response = await fetch(`${API_URL}/supplier_name/${supplierName}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Delete response:', data);
            showNotification('Supplier deleted successfully', 'success');
            return true;
        } catch (error) {
            console.error('Error deleting supplier:', error);
            showNotification('Failed to delete supplier', 'error');
            return false;
        }
    },

    // Update a specific supplier's status
    async updateSupplierStatus(supplierName, isActive) {
        try {
            const response = await fetch(`${API_URL}/supplier_name/${supplierName}`, {
                method: 'PATCH',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    data: {
                        supplier_status: isActive ? 'active' : 'inactive'
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('Status update response:', result);
            showNotification('Supplier status updated successfully', 'success');
            return true;
        } catch (error) {
            console.error('Error updating supplier status:', error);
            showNotification('Failed to update supplier status', 'error');
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

        console.log('Supplier sync initialized');
    }
};

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
    supplierSync.init();
});

// Export for use in other files
window.supplierSync = supplierSync;

// Helper notification function
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    
    Object.assign(notification.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        backgroundColor: type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#f59e0b',
        color: 'white',
        padding: '15px',
        borderRadius: '8px',
        boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.2)',
        fontSize: '16px',
        zIndex: '1000'
    });

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}
