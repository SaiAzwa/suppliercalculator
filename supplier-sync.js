// Define your Google Sheets API URL here
const googleSheetApiUrl = 'https://script.google.com/macros/s/AKfycbyDLoMS-wOZ4PjcfFx50nPcUTOfDF8NZsWDqPTVIXcQLROm8YlBQUUnwdbBOqQLdhww/exec';

// POST request to sync suppliers data
fetch('https://script.google.com/macros/s/AKfycbyDLoMS-wOZ4PjcfFx50nPcUTOfDF8NZsWDqPTVIXcQLROm8YlBQUUnwdbBOqQLdhww/exec', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ suppliers: window.suppliers }), // Using window.suppliers directly
    mode: 'cors', // Ensure CORS is configured in the Apps Script
})
.then(response => response.json())
.then(data => console.log('Response:', data))
.catch(error => console.error('Error:', error));

// Function to fetch suppliers from Google Sheets and populate window.suppliers
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

        // Transform data into usable format for localStorage
        const transformedSuppliers = suppliersFromSheet.reduce((acc, sheetSupplier) => {
            if (!sheetSupplier.Name || !sheetSupplier['Service Type']) {
                console.warn('Skipping invalid supplier entry:', sheetSupplier);
                return acc;
            }

            const existingSupplier = acc.find(s => s.name === sheetSupplier.Name);
            const service = {
                serviceType: sheetSupplier['Service Type'],
                amountLimits: parseJsonSafely(sheetSupplier['Amount Limits']),
                serviceCharges: parseJsonSafely(sheetSupplier['Service Charges']),
                additionalQuestions: parseJsonSafely(sheetSupplier['Additional Questions']),
            };

            if (existingSupplier) {
                existingSupplier.services.push(service);
            } else {
                acc.push({
                    name: sheetSupplier.Name,
                    isActive: true,
                    services: [service],
                });
            }

            return acc;
        }, []);

        console.log('Transformed suppliers:', transformedSuppliers);

        // Save the transformed suppliers to window.suppliers
        window.suppliers = transformedSuppliers;

        // Update UI
        if (typeof updateSupplierTables === 'function') updateSupplierTables();
        if (typeof updateDailyRateSection === 'function') updateDailyRateSection();

        showNotification('Suppliers successfully fetched and loaded from Google Sheets.', 'success');
    } catch (error) {
        console.error('Error fetching suppliers:', error);
        showNotification(`Error: ${error.message}`, 'error');
    }
}

// Helper function to parse JSON safely
function parseJsonSafely(jsonString) {
    try {
        return typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
    } catch (error) {
        console.error('Invalid JSON:', jsonString, error);
        return null;
    }
}

// Show notification function
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
        cursor: 'pointer',
    });

    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

// Call this to fetch suppliers and populate window.suppliers
fetchSuppliersFromGoogleSheet();
