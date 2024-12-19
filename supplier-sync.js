const googleSheetApiUrl = "https://script.google.com/macros/s/AKfycby38uh27bicDY5jQ2kKNBTy8ZRKtNJUL9GoL9FGnQ8gEa2qtE-iFID2xd7TRG6uMWxZ/exec";

async function fetchSuppliersFromGoogleSheet() {
    try {
        console.log('Starting fetch...');
        const response = await fetch(googleSheetApiUrl);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Server error:', errorData);
            throw new Error(errorData.message || `Failed to fetch data: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        if (data.status !== "success") {
            console.error('Data status not success:', data);
            throw new Error(data.message || 'Unknown error occurred.');
        }

        const suppliersFromSheet = data.data;
        if (!Array.isArray(suppliersFromSheet)) {
            throw new Error('Invalid data format received from server');
        }

        const transformedSuppliers = [];

        suppliersFromSheet.forEach(sheetSupplier => {
            try {
                if (!sheetSupplier.Name || !sheetSupplier['Service Type']) {
                    console.warn('Skipping invalid supplier entry:', sheetSupplier);
                    return;
                }

                const existingSupplier = transformedSuppliers.find(s => s.name === sheetSupplier.Name);
                const service = {
                    serviceType: sheetSupplier['Service Type'],
                    amountLimits: parseJsonSafely(sheetSupplier['Amount Limits']),
                    serviceCharges: parseJsonSafely(sheetSupplier['Service Charges']),
                    additionalQuestions: parseJsonSafely(sheetSupplier['Additional Questions'])
                };

                if (existingSupplier) {
                    existingSupplier.services.push(service);
                } else {
                    transformedSuppliers.push({
                        name: sheetSupplier.Name,
                        isActive: true,
                        services: [service]
                    });
                }
            } catch (e) {
                console.error('Error processing supplier:', sheetSupplier, e);
            }
        });

        console.log('Transformed suppliers:', transformedSuppliers);

        localStorage.setItem('suppliers', JSON.stringify(transformedSuppliers));
        window.suppliers = transformedSuppliers;

        if (typeof updateSupplierTables === 'function') updateSupplierTables();
        if (typeof updateDailyRateSection === 'function') updateDailyRateSection();

        showNotification('Suppliers successfully fetched and loaded from Google Sheets.', 'success');
    } catch (error) {
        console.error('Error fetching suppliers:', error);
        showNotification(`Error: ${error.message}`, 'error');
    }
}

async function syncSuppliersToGoogleSheet() {
    try {
        console.log('Starting sync...');
        const suppliersData = localStorage.getItem('suppliers');
        if (!suppliersData) {
            showNotification('No suppliers to sync.', 'info');
            return;
        }

        const suppliers = JSON.parse(suppliersData);
        if (!Array.isArray(suppliers)) {
            throw new Error('Invalid suppliers data in localStorage.');
        }

        const formattedData = suppliers.flatMap(supplier => 
            supplier.services.map(service => ({
                Name: supplier.name,
                'Service Type': service.serviceType,
                'Amount Limits': JSON.stringify(service.amountLimits),
                'Service Charges': JSON.stringify(service.serviceCharges),
                'Additional Questions': JSON.stringify(service.additionalQuestions)
            }))
        );

        console.log('Formatted data to sync:', formattedData);

        const response = await fetch(googleSheetApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ suppliers: formattedData })
        });

        const result = await response.json();
        if (!response.ok || result.status !== "success") {
            throw new Error(result.message || 'Failed to sync suppliers');
        }

        showNotification('Suppliers successfully synced to Google Sheet.', 'success');
    } catch (error) {
        console.error('Error syncing suppliers:', error);
        showNotification(`Error syncing suppliers: ${error.message}`, 'error');
    }
}

function parseJsonSafely(jsonString) {
    try {
        return typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
    } catch (error) {
        console.error('Invalid JSON:', jsonString, error);
        return null;
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.addEventListener('click', () => notification.remove());

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
        zIndex: '1000',
        cursor: 'pointer'
    });

    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

document.addEventListener('click', function(event) {
    if (event.target.id === 'fetch-suppliers-btn') {
        console.log('Fetch button clicked');
        fetchSuppliersFromGoogleSheet();
    }
    if (event.target.id === 'sync-suppliers-btn') {
        console.log('Sync button clicked');
        syncSuppliersToGoogleSheet();
    }
});
