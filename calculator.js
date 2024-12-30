document.addEventListener('DOMContentLoaded', function () {
    // ==========================================
    // Handle Additional Questions Based on Service Type
    // ==========================================
    function handleAdditionalQuestionsBasedOnService(serviceType) {
        const questionsContainer = document.getElementById('additionalQuestions');
        questionsContainer.innerHTML = '';

        const additionalQuestionsMap = {
            'bank-express': [
                { label: 'English Account', type: 'select', options: ['Yes', 'No'] },
                { label: '工商银行 Account', type: 'select', options: ['Yes', 'No'] },
                { label: '农业银行 Account', type: 'select', options: ['Yes', 'No'] }
            ],
            'bank-saver': [
                { label: 'English Account', type: 'select', options: ['Yes', 'No'] },
                { label: '工商银行 Account', type: 'select', options: ['Yes', 'No'] },
                { label: '农业银行 Account', type: 'select', options: ['Yes', 'No'] }
            ],
            'usd-transfer': [
                { label: 'Account Type', type: 'select', options: ['Personal', 'Company'] }
            ],
            'alipay': [
                { label: 'English Account', type: 'select', options: ['Yes', 'No'] },
                { label: 'Chinese Account', type: 'select', options: ['Yes', 'No'] }
            ]
        };

        const questions = additionalQuestionsMap[serviceType];

        if (questions) {
            questions.forEach(question => {
                const questionDiv = document.createElement('div');
                questionDiv.classList.add('form-group');
                questionDiv.innerHTML = `
                    <label>${question.label}</label>
                    ${
                        question.type === 'select'
                            ? `<select id="${question.label.toLowerCase().replace(/\s/g, '')}">${question.options.map(option => `<option value="${option.toLowerCase()}">${option}</option>`).join('')}</select>`
                            : `<input type="${question.type}" id="${question.label.toLowerCase().replace(/\s/g, '')}" placeholder="${question.placeholder || ''}" />`
                    }
                `;
                questionsContainer.appendChild(questionDiv);
            });
        }
    }

    // ==========================================
    // Add Event Listener for Service Type Selection
    // ==========================================
    const serviceTypeElement = document.getElementById('serviceType');
    if (serviceTypeElement) {
        serviceTypeElement.addEventListener('change', function() {
            handleAdditionalQuestionsBasedOnService(this.value);
        });
    }

    // ==========================================
    // Order Creation Functionality
    // ==========================================
    document.getElementById('createOrderBtn').addEventListener('click', function () {
        const serviceType = document.getElementById('serviceType')?.value;
        const orderAmount = parseFloat(document.getElementById('orderAmount')?.value);
        const orderTable = document.getElementById('orderTable')?.querySelector('tbody');

        // Validate inputs
        if (!serviceType || orderAmount <= 0.01) {
            alert('Please select a valid service type and enter a valid order amount.');
            return;
        }

        // Collect additional info based on service type
        let additionalInfo = '';
        if (serviceType === 'bank-express' || serviceType === 'bank-saver') {
            const englishAccount = document.getElementById('englishaccount')?.value;
            const gsyhAccount = document.getElementById('工商银行account')?.value;
            const nongyehAccount = document.getElementById('农业银行account')?.value;

            if (!englishAccount || !gsyhAccount || !nongyehAccount) {
                alert('Please complete all required additional fields.');
                return;
            }

            additionalInfo = `
                English Account: ${englishAccount},
                工商银行 Account: ${gsyhAccount},
                农业银行 Account: ${nongyehAccount}
            `;
        } else if (serviceType === 'usd-transfer') {
            const accountType = document.getElementById('accounttype')?.value;

            if (!accountType) {
                alert('Please select an Account Type.');
                return;
            }

            additionalInfo = `Account Type: ${accountType}`;
        } else if (serviceType === 'alipay') {
            const englishAccount = document.getElementById('englishaccount')?.value;
            const chineseAccount = document.getElementById('chineseaccount')?.value;

            if (!englishAccount || !chineseAccount) {
                alert('Please complete all required additional fields.');
                return;
            }

            additionalInfo = `
                English Account: ${englishAccount},
                Chinese Account: ${chineseAccount}
            `;
        } else {
            additionalInfo = 'N/A';
        }

        // Create and append the new row to the order table
        const newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td>${serviceType.replace(/-/g, ' ')}</td>
            <td>${orderAmount.toFixed(2)}</td>
            <td>${additionalInfo}</td>
            <td class="best-supplier">Calculating...</td>
        `;
        orderTable.appendChild(newRow);

        // Confirmation
        alert('Order added successfully!');
    });

    // ==========================================
    // Best Supplier Calculation Functionality
    // ==========================================
    document.getElementById('calculateBestSupplierBtn').addEventListener('click', function () {
    const rows = document.querySelectorAll('#orderTable tbody tr');

    if (rows.length === 0) {
        alert('No orders to process.');
        return;
    }

    // Access suppliers data from window.suppliersState
    const suppliers = window.suppliersState.data;

    if (!suppliers || suppliers.length === 0) {
        alert('No suppliers available.');
        return;
    }

    console.log('Suppliers Data:', suppliers); // Debugging: Check suppliers data

    rows.forEach((row, orderIndex) => {
        const serviceTypeCell = row.cells[0].textContent.trim().toLowerCase().replace(/\s/g, '-');
        const orderAmount = parseFloat(row.cells[1].textContent.trim());
        const additionalInfoCell = row.cells[2].textContent.trim();
        let bestSupplier = null;
        let lowestTotalCost = Infinity;

        console.log(`Processing Order ${orderIndex + 1}:`, {
            serviceType: serviceTypeCell,
            orderAmount: orderAmount,
            additionalInfo: additionalInfoCell
        });

        // Parse additional info into key-value pairs
        const additionalInfo = {};
        additionalInfoCell.split(',').forEach(info => {
            const [key, value] = info.split(':').map(s => s.trim());
            additionalInfo[key.toLowerCase()] = value.toLowerCase();
        });

        console.log('Parsed Additional Info:', additionalInfo);

        suppliers.filter(supplier => supplier.isActive).forEach(supplier => {
            console.log(`Checking Supplier: ${supplier.name}`);

            // Find the service that matches the order's service type
            const service = supplier.services.find(s => s.serviceType.toLowerCase() === serviceTypeCell);
            if (!service) {
                console.log(`Supplier ${supplier.name} does not offer service: ${serviceTypeCell}`);
                return;
            }

            console.log(`Service Found: ${service.serviceType}`);

            // Check if the order amount falls within the supplier's amount limits
            const amountLimit = service.amountLimits.find(a => {
                const [min, max] = a.limit.split('-').map(num => parseFloat(num.trim()));
                return orderAmount >= min && orderAmount <= max;
            });

            if (!amountLimit) {
                console.log(`Supplier ${supplier.name} does not support order amount: ${orderAmount}`);
                return;
            }

            console.log(`Amount Limit Matched: ${amountLimit.limit}`);

            // Check if the supplier matches the additional questions
            const matchesAdditionalQuestions = service.additionalQuestions.every(question => {
                const questionKey = question.label.toLowerCase();
                const expectedValue = question.value.toLowerCase();
                const orderValue = additionalInfo[questionKey];
                console.log(`Checking Question: ${questionKey}, Expected: ${expectedValue}, Order Value: ${orderValue}`);
                return orderValue === expectedValue;
            });

            if (!matchesAdditionalQuestions) {
                console.log(`Supplier ${supplier.name} does not match additional questions`);
                return;
            }

            console.log('All Additional Questions Matched');

            // Get the daily rate for the supplier
            const dailyRateInput = document.querySelector(
                `input[data-supplier="${supplier.name}"][data-service="${service.serviceType}"]`
            );
            const dailyRate = dailyRateInput ? parseFloat(dailyRateInput.value) : null;

            if (!dailyRate || dailyRate <= 0) {
                console.log(`Invalid daily rate for supplier: ${supplier.name}`);
                return;
            }

            console.log(`Daily Rate: ${dailyRate}`);

            // Calculate the total cost
            const serviceCharge = calculateServiceCharge(orderAmount, service.serviceCharges);
            const totalCost = (orderAmount + serviceCharge) / dailyRate;

            console.log(`Supplier ${supplier.name} - Total Cost: ${totalCost}`);

            // Update the best supplier if this one has a lower cost
            if (totalCost < lowestTotalCost) {
                lowestTotalCost = totalCost;
                bestSupplier = supplier.name;
            }
        });

        // Update the best supplier cell in the table
        const bestSupplierCell = row.querySelector('.best-supplier');
        if (bestSupplierCell) {
            bestSupplierCell.textContent = bestSupplier || 'No suitable supplier found';
        } else {
            console.error('Best Supplier Cell not found for row:', orderIndex + 1);
        }
    });

    console.log('Best supplier calculation completed.');
});
    
// ==========================================
// Utility Functions
// ==========================================
function calculateServiceCharge(orderAmount, serviceCharges) {
    let totalServiceCharge = 0;

    serviceCharges.forEach(charge => {
        const condition = charge.condition;
        const chargeAmount = parseFloat(charge.charge.replace(/[^0-9.]/g, ''));
        if (evaluateCondition(condition, orderAmount)) {
            totalServiceCharge += chargeAmount;
        }
    });

    return totalServiceCharge;
}

function evaluateCondition(condition, amount) {
    try {
        if (!condition) return false;
        condition = condition.toLowerCase().trim();

        const match = condition.match(/([<>]=?)\s*([\d,]+)\s*cny/i);
        if (!match) return false;

        const operator = match[1];
        const value = parseFloat(match[2].replace(/,/g, ''));

        switch (operator) {
            case '>':
                return amount > value;
            case '<':
                return amount < value;
            case '>=':
                return amount >= value;
            case '<=':
                return amount <= value;
            default:
                return false;
        }
    } catch (error) {
        console.error(`Error evaluating condition: ${condition}`, error);
        return false;
    }
}
