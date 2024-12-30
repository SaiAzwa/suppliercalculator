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
      // Filter relevant questions based on keys in orderInfo
      const relevantQuestions = service.additionalQuestions.filter(question => 
        Object.keys(orderInfo).includes(question.label.toLowerCase().replace(/ /g, ''))
      );

      // Check if all relevant questions match
      const additionalQuestionsMatch = relevantQuestions.every(question => {
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

// Example usage
const orders = [
  {
    serviceType: 'Alipay Transfer',
    amount: 7696.7,
    additionalInfoText: `Ref: 887593
                    Mark: 1596BST
                    English Account: Yes
                    Chinese Account: No`,
  },
  {
    serviceType: 'Bank Transfer (Express)',
    amount: 235.72,
    additionalInfoText: `Ref: 737976
                    Mark: 2487EEE
                    English Account: Yes
                    工商银行 Account: No
                    农业银行 Account: Yes`,
  },
  // Add more orders as needed
];

const suppliers = [
  {
    name: 'Atvantic',
    isActive: true,
    services: [
      {
        serviceType: 'alipay',
        amountLimits: [{ limit: '> 0.01', rate: null }],
        serviceCharges: [],
        additionalQuestions: [
          { label: 'English Account', value: 'yes' },
          { label: 'Chinese Account', value: 'yes' },
        ],
      },
    ],
  },
  {
    name: 'Union',
    isActive: true,
    services: [
      {
        serviceType: 'alipay',
        amountLimits: [{ limit: '> 500', rate: null }],
        serviceCharges: [
          { condition: '< 10000', charge: '50 CNY' },
          { condition: '10001 - 20000', charge: '30 CNY' },
          { condition: '20001 - 30000', charge: '25 CNY' },
        ],
        additionalQuestions: [
          { label: 'English Account', value: 'yes' },
          { label: 'Chinese Account', value: 'yes' },
        ],
      },
    ],
  },
  // Add more suppliers as needed
];

// Run the calculation
const results = calculate(orders, suppliers);

// Log the final results
console.log('Final Results:', results);
