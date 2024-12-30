// ==========================================
// Calculator Section
// ==========================================

document.addEventListener('DOMContentLoaded', function () {
    // ==========================================
    // Handle Additional Questions Based on Service Type
    // ==========================================
    function handleAdditionalQuestionsBasedOnService(serviceType) {
        const questionsContainer = document.getElementById('additionalQuestions');
        questionsContainer.innerHTML = '';

        const additionalQuestionsMap = {
            'bankTransferSaver': [
                { label: 'English Account', type: 'select', options: ['Yes', 'No'] },
                { label: '工商银行 Account', type: 'select', options: ['Yes', 'No'] },
                { label: '农业银行 Account', type: 'select', options: ['Yes', 'No'] }
            ],
            'bankTransferExpress': [
                { label: 'English Account', type: 'select', options: ['Yes', 'No'] },
                { label: '工商银行 Account', type: 'select', options: ['Yes', 'No'] },
                { label: '农业银行 Account', type: 'select', options: ['Yes', 'No'] }
            ],
            'bankTransferUSD': [
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
        if (serviceType === 'bankTransferSaver' || serviceType === 'bankTransferExpress') {
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
        } else if (serviceType === 'bankTransferUSD') {
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
            <td>${serviceType.replace(/([A-Z])/g, ' $1').trim()}</td>
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

        rows.forEach(row => {
            const serviceTypeCell = row.cells[0].textContent.trim().toLowerCase();
            const orderAmount = parseFloat(row.cells[1].textContent.trim());
            const additionalInfoCell = row.cells[2].textContent.trim();
            let bestSupplier = null;
            let lowestTotalCost = Infinity;

            const additionalInfo = {};
            additionalInfoCell.split(',').forEach(info => {
                const [key, value] = info.split(':').map(s => s.trim());
                additionalInfo[key.toLowerCase()] = value.toLowerCase();
            });

            suppliers.filter(supplier => supplier.isActive).forEach(supplier => {
                const service = supplier.services.find(s => s.serviceType.replace(/-/g, ' ').toLowerCase() === serviceTypeCell);
                if (!service) return;

                const amountLimit = service.amountLimits.find(a => {
                    const [min, max] = a.limit.split('-').map(num => parseFloat(num.trim()));
                    return orderAmount >= min && orderAmount <= max;
                });

                const matchesAdditionalQuestions = service.additionalQuestions.every(question => {
                    const questionKey = question.label.toLowerCase();
                    const expectedValue = question.value.toLowerCase();
                    return additionalInfo[questionKey] === expectedValue;
                });

                if (amountLimit && matchesAdditionalQuestions) {
                    const dailyRateInput = document.querySelector(
                        `input[data-supplier="${supplier.name}"][data-service="${service.serviceType}"]`
                    );
                    const dailyRate = dailyRateInput ? parseFloat(dailyRateInput.value) : null;

                    if (dailyRate && dailyRate > 0) {
                        const serviceCharge = calculateServiceCharge(orderAmount, service.serviceCharges);
                        const totalCost = (orderAmount + serviceCharge) / dailyRate;

                        if (totalCost < lowestTotalCost) {
                            lowestTotalCost = totalCost;
                            bestSupplier = supplier.name;
                        }
                    } else {
                        console.error(`Invalid daily rate for supplier: ${supplier.name}`);
                    }
                }
            });

            const bestSupplierCell = row.querySelector('.best-supplier');
            if (bestSupplierCell) {
                bestSupplierCell.textContent = bestSupplier ? bestSupplier : 'No suitable supplier found';
            } else {
                console.error('Best Supplier Cell not found for row:', row);
            }
        });

        alert('Best supplier calculation completed.');
    });
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
