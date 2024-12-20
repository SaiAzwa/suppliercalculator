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

            if (!Array.isArray(apiData)) {
                console.warn('API did not return an array:', apiData);
                return null;
            }
            
            // Convert API data to application format
            const formattedData = apiData.map(item => {
                try {
                    return {
                        name: item.supplier_name || '',
                        isActive: true,
                        services: [{
                            serviceType: item.service_type || '',
                            amountLimits: JSON.parse(item.amount_limits || '[]'),
                            serviceCharges: JSON.parse(item.service_charges || '[]'),
                            additionalQuestions: JSON.parse(item.additional_questions || '[]')
                        }]
                    };
                } catch (error) {
                    console.error('Error formatting supplier data:', error);
                    return null;
                }
            }).filter(item => item !== null);

            console.log('Formatted data:', formattedData);

            // Update state
            if (window.suppliersState) {
                window.suppliersState.data = formattedData;
                window.suppliersState.save();
                console.log('State updated and saved:', window.suppliersState.data);
                
                // Trigger update event
                window.dispatchEvent(new Event('suppliersUpdated'));
                console.log('suppliersUpdated event dispatched');
                
                showNotification('Suppliers data loaded successfully', 'success');
            } else {
                console.error('suppliersState not found');
                showNotification('Error: Supplier state not initialized', 'error');
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
            if (!Array.isArray(suppliers)) {
                throw new Error('Suppliers data is not an array');
            }

            console.log('Current state data:', suppliers);
            
            // Format data for API
            const requestBody = {
                data: suppliers.map(supplier => {
                    const service = supplier.services[0] || {};
                    return {
                        supplier_name: supplier.name,
                        service_type: service.serviceType || '',
                        amount_limits: JSON.stringify(service.amountLimits || []),
                        service_charges: JSON.stringify(service.serviceCharges || []),
                        additional_questions: JSON.stringify(service.additionalQuestions || [])
                    };
                })
            };

            console.log('Formatted request body:', requestBody);

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
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

    // Update a specific supplier
    async updateSupplier(supplierName, updatedData) {
        try {
            console.log('Updating supplier:', supplierName, updatedData);
            const response = await fetch(`${API_URL}/supplier_name/${supplierName}`, {
                method: 'PATCH',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    data: updatedData
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Update response:', data);
            showNotification('Supplier updated successfully', 'success');
            return true;
        } catch (error) {
            console.error('Error updating supplier:', error);
            showNotification('Failed to update supplier', 'error');
            return false;
        }
    },

    // Initialize sync
    async init() {
        console.log('Initializing supplier sync...');
        try {
            // Initial load from API
            await this.fetchAndUpdateState();

            // Set up auto-sync
            window.addEventListener('suppliersStateChanged', async () => {
                console.log('suppliersStateChanged event received');
                await this.saveStateToAPI();
            });

            console.log('Sync initialization complete');
            return true;
        } catch (error) {
            console.error('Error initializing sync:', error);
            showNotification('Failed to initialize sync', 'error');
            return false;
        }
    }
};

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM Content Loaded - Starting supplier sync init');
    if (window.suppliersState) {
        await supplierSync.init();
    } else {
        console.error('Suppliers state not initialized. Waiting for state...');
        // Wait a short time and try again
        setTimeout(async () => {
            if (window.suppliersState) {
                await supplierSync.init();
            } else {
                console.error('Failed to initialize supplier sync: state not available');
                showNotification('Failed to initialize sync', 'error');
            }
        }, 1000);
    }
});

// Export for use in other files
window.supplierSync = supplierSync;

// Helper function for notifications
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
