const googleSheetApiUrl = "https://script.google.com/macros/s/AKfycbyYHJH-TADBBuoPxL5mpWoFcNWd0jiagGmmcU-ImLiY9ztKEIjUEMFTeTeMZ6-JOFOy/exec";

async function fetchSuppliersFromGoogleSheet() {
    try {
        const response = await fetch(googleSheetApiUrl);
        if (!response.ok) throw new Error('Failed to fetch data from Google Sheets.');
        
        const data = await response.json();
        if (data.status !== "success") throw new Error(data.message || 'Unknown error occurred.');

        const suppliersFromSheet = data.data;
        const transformedSuppliers = [];
        
        suppliersFromSheet.forEach(sheetSupplier => {
            const existingSupplier = transformedSuppliers.find(s => s.name === sheetSupplier.Name);
            const service = {
                serviceType: sheetSupplier['Service Type'],
                amountLimits: JSON.parse(sheetSupplier['Amount Limits']),
                serviceCharges: JSON.parse(sheetSupplier['Service Charges']),
                additionalQuestions: JSON.parse(sheetSupplier['Additional Questions'])
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
        });

        localStorage.setItem('suppliers', JSON.stringify(transformedSuppliers));
        window.suppliers = transformedSuppliers;

        if (typeof updateSupplierTables === 'function') updateSupplierTables();
        if (typeof updateDailyRateSection === 'function') updateDailyRateSection();

        showNotification('Suppliers successfully fetched and loaded from Google Sheets.', 'success');
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
        const formattedData = [];

        suppliers.forEach(supplier => {
            supplier.services.forEach(service => {
                formattedData.push({
                    Name: supplier.name,
                    'Service Type': service.serviceType,
                    'Amount Limits': JSON.stringify(service.amountLimits),
                    'Service Charges': JSON.stringify(service.serviceCharges),
                    'Additional Questions': JSON.stringify(service.additionalQuestions)
                });
            });
        });

        const response = await fetch(googleSheetApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ suppliers: formattedData })
        });

        if (!response.ok) throw new Error('Failed to sync suppliers. Check your Google Sheet API setup.');
        
        showNotification('Suppliers successfully synced to Google Sheet.', 'success');
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
