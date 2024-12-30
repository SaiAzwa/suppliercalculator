// calculator.js

// Function to normalize service type names for comparison
const normalizeServiceType = (serviceType) => {
  return serviceType.toLowerCase().replace(/[^a-z]/g, '');
};

// Function to parse additional information and ignore 'ref' and 'mark'
const parseAdditionalInfo = (additionalInfoText) => {
  const parsedInfo = {};
  const lines = additionalInfoText.split('\n').map(line => line.trim());

  lines.forEach(line => {
    if (line.startsWith('English Account:')) {
      parsedInfo.englishAccount = line.split(':')[1].trim();
    } else if (line.startsWith('Chinese Account:')) {
      parsedInfo.chineseAccount = line.split(':')[1].trim();
    } else if (line.startsWith('工商银行 Account:')) {
      parsedInfo.icbcAccount = line.split(':')[1].trim();
    } else if (line.startsWith('农业银行 Account:')) {
      parsedInfo.abcAccount = line.split(':')[1].trim();
    }
    // Ignore 'ref' and 'mark' fields
  });

  return parsedInfo;
};

// Function to check if a supplier matches the order
const checkSupplierMatch = (order, supplier) => {
  const orderInfo = parseAdditionalInfo(order.additionalInfoText);

  for (const service of supplier.services) {
    if (normalizeServiceType(service.serviceType) === normalizeServiceType(order.serviceType)) {
      // Check additional questions (ignore ref and mark)
      const additionalQuestionsMatch = service.additionalQuestions.every(question => {
        const orderValue = orderInfo[question.label.toLowerCase().replace(/ /g, '')];
        return orderValue === question.value;
      });

      if (additionalQuestionsMatch) {
        return true; // Supplier matches
      }
    }
  }

  return false; // No match found
};

// Function to process a single order and find matching suppliers
const processOrder = (order, suppliers) => {
  console.log(`=== Processing Order ===`);
  console.log(`Service Type: ${order.serviceType}`);
  console.log(`Order Amount: ${order.amount}`);
  console.log(`Additional Info Text: ${order.additionalInfoText}`);

  const parsedInfo = parseAdditionalInfo(order.additionalInfoText);
  console.log(`Parsed Additional Info:`, parsedInfo);

  const matchingSuppliers = [];

  for (const supplier of suppliers) {
    console.log(`Checking Supplier: ${supplier.name}`);
    if (checkSupplierMatch(order, supplier)) {
      console.log(`✅ Supplier ${supplier.name} matched!`);
      matchingSuppliers.push(supplier);
    } else {
      console.log(`❌ Supplier ${supplier.name} did not match.`);
    }
  }

  return matchingSuppliers;
};

// Main calculation function to process all orders
const calculate = (orders, suppliers) => {
  console.log('=== Starting Calculation ===');
  console.log('Available Suppliers:', suppliers);
  console.log('Orders to Process:', orders);

  const results = [];

  for (const order of orders) {
    const matchingSuppliers = processOrder(order, suppliers);
    results.push({
      order,
      matchingSuppliers,
    });
  }

  console.log('=== Calculation Complete ===');
  return results;
};

// Export the calculate function for use in other modules
module.exports = { calculate };
