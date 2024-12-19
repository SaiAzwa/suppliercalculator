const API_URL = 'https://script.google.com/macros/s/AKfycbw8y9bo_dw9nLuZxNmunJ_S03rgjmm3rbOI_zHKD6AnBRYUjbJbCck-qlG65If84KjA/exec';

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
    // Handle the suppliers data as needed
  })
  .catch(error => {
    console.error('Error fetching data:', error);
  });
}

// Function to handle POST request (submit new suppliers data)
function postSuppliersData(suppliers) {
  const requestBody = {
    suppliers: suppliers // Format your suppliers data here
  };

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
    // Handle the response from the API
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
