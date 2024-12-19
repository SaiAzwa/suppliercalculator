// API URL for SheetDB
const API_URL = 'https://sheetdb.io/api/v1/yp17r75g86k93';

// Function to handle GET request (fetch suppliers data)
function getSuppliersData() {
  fetch(API_URL, {
    method: 'GET',
    mode: 'cors', // Ensures CORS is handled correctly
    headers: {
      'Content-Type': 'application/json', // Set content type for the request
      'Origin': 'https://saiazwa.github.io', // Ensure the origin is correct
    }
  })
  .then(response => response.json())
  .then(data => {
    console.log('Suppliers Data:', data);
    // Handle the suppliers data as needed (e.g., display in a table or use elsewhere)
  })
  .catch(error => {
    console.error('Error fetching data:', error);
  });
}

// Function to handle POST request (submit new suppliers data)
function postSuppliersData(suppliers) {
  // Format the suppliers data for posting to SheetDB
  const requestBody = suppliers.map(supplier => ({
    supplier_name: supplier.name,
    service_type: supplier.serviceType,
    amount_limits: supplier.amountLimits,
    service_charges: supplier.serviceCharges,
    additional_questions: supplier.additionalQuestions,
  }));

  fetch(API_URL, {
    method: 'POST',
    mode: 'cors', // Ensures CORS is handled correctly
    headers: {
      'Content-Type': 'application/json', // Set content type for the request
      'Origin': 'https://saiazwa.github.io', // Ensure the origin is correct
    },
    body: JSON.stringify(requestBody) // Convert suppliers data to JSON format
  })
  .then(response => response.json())
  .then(data => {
    console.log('Response from API:', data);
    // Handle the response from the API (e.g., confirmation or error message)
  })
  .catch(error => {
    console.error('Error posting data:', error);
  });
}

// Example usage (GET request)
getSuppliersData();

// Example usage (POST request)
const suppliers = [
  { name: 'Supplier 1', serviceType: 'Bank Transfer Saver', amountLimits: '{}', serviceCharges: '{}', additionalQuestions: '[]' },
  { name: 'Supplier 2', serviceType: 'Alipay', amountLimits: '{}', serviceCharges: '{}', additionalQuestions: '[]' }
];
postSuppliersData(suppliers);
