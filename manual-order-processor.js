// Manual Order Processor
class ManualOrderProcessor {
    constructor() {
        this.additionalQuestionsDiv = document.getElementById('additionalQuestions');
        this.serviceTypeSelect = document.getElementById('serviceType');
        this.orderAmountInput = document.getElementById('orderAmount');
        this.createOrderBtn = document.getElementById('createOrderBtn');

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.serviceTypeSelect.addEventListener('change', () => this.handleServiceTypeChange());
        this.createOrderBtn.addEventListener('click', () => this.handleCreateOrder());
    }

    handleServiceTypeChange() {
        const serviceType = this.serviceTypeSelect.value;
        this.additionalQuestionsDiv.innerHTML = '';

        if (!serviceType) return;

        const serviceTypeMapping = {
            'bankTransferSaver': 'bank-saver',
            'bankTransferExpress': 'bank-express',
            'bankTransferUSD': 'usd-transfer',
            'enterpriseToEnterprise': 'enterprise',
            'alipay': 'alipay'
        };

        const mappedServiceType = serviceTypeMapping[serviceType];
        this.handleAdditionalQuestionsBasedOnService(mappedServiceType);
    }

    handleAdditionalQuestionsBasedOnService(serviceType) {
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
                this.additionalQuestionsDiv.appendChild(questionDiv);
            });
        }
    }

    handleCreateOrder() {
        const serviceType = this.serviceTypeSelect.value;
        const orderAmount = parseFloat(this.orderAmountInput.value);
        const orderTable = document.getElementById('orderTable')?.querySelector('tbody');

        // Validate inputs
        if (!serviceType || orderAmount <= 0.01) {
            showNotification('Please select a valid service type and enter a valid order amount.', 'error');
            return;
        }

        // Map the service type to the correct format
        const serviceTypeMapping = {
            'bankTransferSaver': 'bank-saver',
            'bankTransferExpress': 'bank-express',
            'bankTransferUSD': 'usd-transfer',
            'enterpriseToEnterprise': 'enterprise',
            'alipay': 'alipay'
        };
        const mappedServiceType = serviceTypeMapping[serviceType];

        // Collect additional info based on service type
        let additionalInfo = '';
        if (mappedServiceType === 'bank-express' || mappedServiceType === 'bank-saver') {
            const englishAccount = document.getElementById('englishaccount')?.value;
            const gsyhAccount = document.getElementById('工商银行account')?.value;
            const nongyehAccount = document.getElementById('农业银行account')?.value;

            if (!englishAccount || !gsyhAccount || !nongyehAccount) {
                showNotification('Please complete all required additional fields.', 'error');
                return;
            }

            additionalInfo = `
                English Account: ${englishAccount},
                工商银行 Account: ${gsyhAccount},
                农业银行 Account: ${nongyehAccount}
            `;
        } else if (mappedServiceType === 'usd-transfer') {
            const accountType = document.getElementById('accounttype')?.value;

            if (!accountType) {
                showNotification('Please select an Account Type.', 'error');
                return;
            }

            additionalInfo = `Account Type: ${accountType}`;
        } else if (mappedServiceType === 'alipay') {
            const englishAccount = document.getElementById('englishaccount')?.value;
            const chineseAccount = document.getElementById('chineseaccount')?.value;

            if (!englishAccount || !chineseAccount) {
                showNotification('Please complete all required additional fields.', 'error');
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
            <td>${mappedServiceType.replace(/-/g, ' ')}</td>
            <td>${orderAmount.toFixed(2)}</td>
            <td>${additionalInfo}</td>
            <td class="best-supplier">Calculating...</td>
            <td>
                <button class="btn edit-order-btn">Edit</button>
                <button class="btn delete-order-btn">Delete</button>
            </td>
        `;
        orderTable.appendChild(newRow);

        // Reset form
        this.resetForm();
        showNotification('Order added successfully!', 'success');
    }

    resetForm() {
        this.serviceTypeSelect.value = '';
        this.orderAmountInput.value = '';
        this.additionalQuestionsDiv.innerHTML = '';
    }
}

// Helper function to show notifications
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Initialize the manual order processor
document.addEventListener('DOMContentLoaded', () => {
    window.manualOrderProcessor = new ManualOrderProcessor();
});
