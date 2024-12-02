// Supplier Sync Functions

const googleSheetApiUrl = ""; // Replace with your Google Sheets API URL

async function fetchSuppliersFromGoogleSheet() {
    try {
        const response = await fetch(googleSheetApiUrl);

        if (!response.ok) {
            throw new Error('Failed to fetch data from Google Sheets.');
        }

        const data = await response.json();

        if (data.status === "success") {
            const suppliersFromSheet = data.data;

            const transformedSuppliers = suppliersFromSheet.map(sheetSupplier => ({
                name: sheetSupplier["Name"],
                isActive: sheetSupplier["Status"] === "Active",
                services: JSON.parse(sheetSupplier["Services"]).map(service => ({
                    serviceType: service.serviceType,
                    amountLimits: service.amountLimits.map(limit => ({
                        limit: limit.limit,
                        rate: limit.rate || null
                    })),
                    serviceCharges: service.serviceCharges,
                    additionalQuestions: service.additionalQuestions || []
                }))
            }));

            localStorage.setItem('suppliers', JSON.stringify(transformedSuppliers));
            window.suppliers = transformedSuppliers;

            if (typeof updateSupplierTables === 'function') {
                updateSupplierTables();
            }
            if (typeof updateDailyRateSection === 'function') {
                updateDailyRateSection();
            }

            showNotification('Suppliers successfully fetched and loaded from Google Sheets.', 'success');
        } else {
            throw new Error(data.message || 'Unknown error occurred.');
        }
    } catch (error) {
        console.error('Error fetching suppliers:', error);
        showNotification('An error occurred while fetching suppliers from Google Sheets.', 'error');
    }
}

async function syncSuppliersToGoogleSheet() {
    try {
        const suppliersData = localStorage.getItem('suppliers');
        if (!suppliersData) {
            showNotification('No suppliers to sync.', 'info');
            return;
        }

        const suppliers = JSON.parse(suppliersData);

        const formattedData = suppliers.map(supplier => ({
            Name: supplier.name,
            Status: supplier.isActive ? 'Active' : 'Inactive',
            Services: JSON.stringify(supplier.services.map(service => ({
                serviceType: service.serviceType,
                amountLimits: service.amountLimits.map(a => ({
                    limit: a.limit,
                    rate: a.rate
                })),
                serviceCharges: service.serviceCharges,
                additionalQuestions: service.additionalQuestions
            })))
        }));

        const response = await fetch(googleSheetApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ suppliers: formattedData })
        });

        if (response.ok) {
            showNotification('Suppliers successfully synced to Google Sheet.', 'success');
        } else {
            throw new Error('Failed to sync suppliers. Check your Google Sheet API setup.');
        }
    } catch (error) {
        console.error('Error syncing suppliers:', error);
        showNotification('An error occurred while syncing suppliers.', 'error');
    }
}

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

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('fetch-suppliers-btn')?.addEventListener('click', fetchSuppliersFromGoogleSheet);
    document.getElementById('sync-suppliers-btn')?.addEventListener('click', syncSuppliersToGoogleSheet);
});
