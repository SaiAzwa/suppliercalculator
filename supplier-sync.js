// Define your Google Sheets API URL here
const googleSheetApiUrl = 'https://script.google.com/macros/s/AKfycbwQLQpGsurv6DZnsEi4sH1l_S2FkmD1UP69z4fhJn7wf5qluS40wIIW3Gv0ptQuVgPG/exec';

// POST request to sync suppliers data
fetch(googleSheetApiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ suppliers: window.suppliers }), // Using window.suppliers directly
    mode: 'cors', // Ensure CORS is configured in the Apps Script
})
.then(response => {
    if (!response.ok) {
        return response.json().then(errorData => {
            console.error('Error response:', errorData);
            throw new Error(errorData.message || `POST failed: ${response.status} ${response.statusText}`);
        });
    }
    return response.json();
})
.then(data => console.log('Response:', data))
.catch(error => console.error('Error:', error));

// Function to fetch suppliers from Google Sheets and populate window.suppliers
async function fetchSuppliersFromGoogleSheet() {
    try {
        console.log('Starting fetch...');
        const response = await fetch(googleSheetApiUrl, {
            method: 'GET',
            mode: 'cors',
        });

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
            if (!sheetSupplier.name || !sheetSupplier.serviceType) {
                console.warn('Skipping invalid supplier entry:', sheetSupplier);
                return acc;
            }

            const existingSupplier = acc.find(s => s.name === sheetSupplier.name);
            const service = {
                serviceType: sheetSupplier.serviceType,
                amountLimits: parseJsonSafely(sheetSupplier.amountLimits),
                serviceCharges: parseJsonSafely(sheetSupplier.serviceCharges),
                additionalQuestions: parseJsonSafely(sheetSupplier.additionalQuestions),
            };

            if (existingSupplier) {
                existingSupplier.services.push(service);
            } else {
                acc.push({
                    name: sheetSupplier.name,
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
