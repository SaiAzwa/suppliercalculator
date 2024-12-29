function parseOrderText(text) {
    const lines = text.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

    return lines.map(line => {
        try {
            // Updated regex to match the specific format
            const regex = /(\d{2}-\w{3}-\d{2})\s+(\d+)\s+(\w+[\s\w]*)\s+MYR\s+([\d,.]+)\s+([\w\d]+)\s+CNY\s+([\d,.]+)/i;
            const match = line.match(regex);

            if (!match) {
                console.log('Skipping line - invalid format:', line);
                return null;
            }

            const serviceType = extractServiceType(match[3]);
            const requiresAdditionalQuestions = serviceType !== 'Unknown'; // Set flag based on service type

            const order = {
                referenceNumber: match[2],
                markingNumber: match[5],
                orderAmount: parseFloat(match[6].replace(',', '')),
                serviceType: serviceType,
                accountType: 'Company', // Default to Company
                additionalQuestions: [], // Initialize as empty
                requiresAdditionalQuestions: requiresAdditionalQuestions // Flag for additional questions
            };

            return isValidOrder(order) ? order : null;
        } catch (error) {
            console.error('Error parsing line:', line, error);
            return null;
        }
    }).filter(order => order !== null);
}

function extractServiceType(paymentMethod) {
    const serviceTypeMap = {
        'wallet': 'Alipay Transfer',
        'payment_gateway': 'Bank Transfer (Express)',
        'cash': 'Bank Transfer (Saver)'
    };

    return serviceTypeMap[paymentMethod.toLowerCase()] || 'Unknown';
}
