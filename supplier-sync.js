// API URL for SheetDB
const API_URL = 'https://sheetdb.io/api/v1/yp17r75g86k93';

// Function to handle GET request (fetch suppliers data)
async function getSuppliersData() {
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

        const data = await response.json();
        console.log('Suppliers Data:', data);
        return data;
    } catch (error) {
        console.error('Error fetching data:', error);
        showNotification('Failed to fetch suppliers data', 'error');
        return null;
    }
}

// Function to format supplier data for SheetDB
function formatSupplierForSheet(supplier) {
    return {
        supplier_name: supplier.name,
        service_type: supplier.serviceType,
        amount_limits: JSON.stringify(supplier.amountLimits || {}),
        service_charges: JSON.stringify(supplier.serviceCharges || {}),
        additional_questions: JSON.stringify(supplier.additionalQuestions || [])
    };
}

// Function to handle POST request (submit new suppliers data)
async function postSuppliersData(suppliers) {
    try {
        // Validate input
        if (!Array.isArray(suppliers)) {
            throw new Error('Suppliers must be an array');
        }

        // Format the suppliers data for posting to SheetDB
        const formattedData = suppliers.map(formatSupplierForSheet);

        // SheetDB expects data in a specific format
        const requestBody = {
            data: formattedData
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
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const data = await response.json();
        console.log('Response from API:', data);
        showNotification('Suppliers data saved successfully', 'success');
        return data;
    } catch (error) {
        console.error('Error posting data:', error);
        showNotification('Failed to save suppliers data', 'error');
        return null;
    }
}

// Function to update existing data (PUT request)
async function updateSuppliersData(suppliers) {
    try {
        const formattedData = suppliers.map(formatSupplierForSheet);
        const requestBody = {
            data: formattedData
        };

        const response = await fetch(API_URL, {
            method: 'PUT',
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
        console.log('Update Response:', data);
        showNotification('Suppliers data updated successfully', 'success');
        return data;
    } catch (error) {
        console.error('Error updating data:', error);
        showNotification('Failed to update suppliers data', 'error');
        return null;
    }
}

// Function to delete data
async function deleteSuppliersData(condition) {
    try {
        const response = await fetch(`${API_URL}/supplier_name/${condition}`, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Delete Response:', data);
        showNotification('Supplier deleted successfully', 'success');
        return data;
    } catch (error) {
        console.error('Error deleting data:', error);
        showNotification('Failed to delete supplier', 'error');
        return null;
    }
}

// Example usage:
async function example() {
    // GET example
    const data = await getSuppliersData();
    
    // POST example
    const newSuppliers = [
        {
            name: 'Test Supplier',
            serviceType: 'bank-saver',
            amountLimits: [{ limit: '1000' }],
            serviceCharges: [{ condition: 'standard', charge: '1%' }],
            additionalQuestions: [{ label: 'Account Number', value: '123456' }]
        }
    ];
    
    await postSuppliersData(newSuppliers);
}

// Export functions if using modules
export {
    getSuppliersData,
    postSuppliersData,
    updateSuppliersData,
    deleteSuppliersData
};
