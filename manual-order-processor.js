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
        this.serviceTypeSelect.addEventListener('change', (e) => {
            console.log('Service type changed:', e.target.value);
            this.handleServiceTypeChange(e);
        });
        this.createOrderBtn.addEventListener('click', () => this.handleCreateOrder());
    }

    handleServiceTypeChange(event) {
        const selectedValue = event.target.value;
        console.log('Selected service type:', selectedValue);
        this.additionalQuestionsDiv.innerHTML = '';

        if (!selectedValue) return;

        const serviceTypeMapping = {
            'bankTransferSaver': 'bank-saver',
            'bankTransferExpress': 'bank-express',
            'bankTransferUSD': 'usd-transfer',
            'enterpriseToEnterprise': 'enterprise',
            'alipay': 'alipay'
        };

        const mappedServiceType = serviceTypeMapping[selectedValue];
        console.log('Mapped service type:', mappedServiceType);
        
        // Get and render additional questions
        const questions = this.getAdditionalQuestions(mappedServiceType);
        console.log('Questions to render:', questions);
        this.renderAdditionalQuestions(questions);
    }

    getAdditionalQuestions(serviceType) {
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

        return additionalQuestionsMap[serviceType] || [];
    }

    renderAdditionalQuestions(questions) {
        console.log('Rendering questions:', questions);
        questions.forEach(question => {
            const formGroup = document.createElement('div');
            formGroup.className = 'form-group';

            const label = document.createElement('label');
            label.htmlFor = question.label.toLowerCase().replace(/\s/g, '');
            label.textContent = question.label;
            formGroup.appendChild(label);

            if (question.type === 'select') {
                const select = document.createElement('select');
                select.id = question.label.toLowerCase().replace(/\s/g, '');
                select.className = 'form-control';
                
                question.options.forEach(optionText => {
                    const option = document.createElement('option');
                    option.value = optionText.toLowerCase();
                    option.textContent = optionText;
                    select.appendChild(option);
                });
                
                formGroup.appendChild(select);
            } else {
                const input = document.createElement('input');
                input.type = question.type;
                input.id = question.label.toLowerCase().replace(/\s/g, '');
                input.className = 'form-control';
                formGroup.appendChild(input);
            }

            this.additionalQuestionsDiv.appendChild(formGroup);
        });
    }

    handleCreateOrder() {
        const serviceType = this.serviceTypeSelect.value;
        const orderAmount = parseFloat(this.orderAmountInput.value);
        const orderTable = document.getElementById('orderTable')?.querySelector('tbody');

        console.log('Creating order with:', {
            serviceType,
            orderAmount
        });

        // Validate inputs
        if (!serviceType || orderAmount <= 0.01) {
            showNotification('Please select a valid service type and enter a valid order amount.', 'error');
            return;
        }

        const serviceTypeMapping = {
            'bankTransferSaver': 'bank-saver',
            'bankTransferExpress': 'bank-express',
            'bankTransferUSD': 'usd-transfer',
            'enterpriseToEnterprise': 'enterprise',
            'alipay': 'alipay'
        };
        const mappedServiceType = serviceTypeMapping[serviceType];
        console.log('Mapped service type:', mappedServiceType);

        // Collect additional info based on service type
        let additionalInfo = '';
        if (mappedServiceType === 'bank-express' || mappedServiceType === 'bank-saver') {
            const englishAccount = document.getElementById('englishaccount')?.value;
            const gsyhAccount = document.getElementById('工商银行account')?.value;
            const nongyehAccount = document.getElementById('农业银行account')?.value;

            console.log('Bank transfer additional info:', {
                englishAccount,
                gsyhAccount,
                nongyehAccount
            });

            if (!englishAccount || !gsyhAccount || !nongyehAccount) {
                showNotification('Please complete all required additional fields.', 'error');
                return;
            }

            additionalInfo = `English Account: ${englishAccount}, 工商银行 Account: ${gsyhAccount}, 农业银行 Account: ${nongyehAccount}`;
        } else if (mappedServiceType === 'usd-transfer') {
            const accountType = document.getElementById('accounttype')?.value;

            console.log('USD transfer additional info:', {
                accountType
            });

            if (!accountType) {
                showNotification('Please select an Account Type.', 'error');
                return;
            }

            additionalInfo = `Account Type: ${accountType}`;
        } else if (mappedServiceType === 'alipay') {
            const englishAccount = document.getElementById('englishaccount')?.value;
            const chineseAccount = document.getElementById('chineseaccount')?.value;

            console.log('Alipay additional info:', {
                englishAccount,
                chineseAccount
            });

            if (!englishAccount || !chineseAccount) {
                showNotification('Please complete all required additional fields.', 'error');
                return;
            }

            additionalInfo = `English Account: ${englishAccount}, Chinese Account: ${chineseAccount}`;
        } else {
            additionalInfo = 'N/A';
        }

        console.log('Final order details:', {
            serviceType: mappedServiceType,
            amount: orderAmount,
            additionalInfo
        });

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
