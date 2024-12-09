// Add/Edit Supplier Section

document.addEventListener('DOMContentLoaded', function () {
    let editingSupplierIndex = -1;

    function addOrUpdateSupplier() {
        const name = document.getElementById('supplier-name').value.trim();
        const serviceType = document.getElementById('service-type').value;
        const isActive = document.getElementById('supplier-status')?.checked;
        const amountLimits = Array.from(document.querySelectorAll('.amount-range'))
            .map(input => input.value.trim())
            .filter(limit => limit);
        const serviceCharges = Array.from(document.querySelectorAll('.service-charge-item')).map(item => {
            return {
                condition: item.querySelector('.service-condition').value.trim(),
                charge: item.querySelector('.service-charge').value.trim()
            };
        });
        const additionalQuestions = Array.from(document.querySelectorAll('.additional-question-item')).map(item => {
            return {
                label: item.querySelector('.question-label').textContent.trim(),
                value: item.querySelector('.question-answer').value.trim()
            };
        });

        if (!name || !serviceType || amountLimits.length === 0) {
            alert('Please fill out all required fields.');
            return;
        }

        const supplierData = {
            name,
            isActive,
            services: [{
                serviceType,
                amountLimits: amountLimits.map(limit => ({ limit, rate: null })),
                serviceCharges,
                additionalQuestions
            }]
        };

        if (editingSupplierIndex === -1) {
            suppliers.push(supplierData);
            showNotification(`Supplier "${name}" added successfully!`, 'success');
        } else {
            suppliers[editingSupplierIndex] = supplierData;
            editingSupplierIndex = -1;
            document.getElementById('add-supplier-btn').textContent = 'Add Supplier';
            showNotification(`Supplier "${name}" updated successfully!`, 'success');
        }

        localStorage.setItem('suppliers', JSON.stringify(suppliers));
        updateSupplierTables();
        updateDailyRateSection();
        clearSupplierForm();
    }

    function editSupplier(index) {
        const supplier = suppliers[index];
        document.getElementById('supplier-name').value = supplier.name;
        document.getElementById('service-type').value = supplier.services[0].serviceType;
        document.getElementById('supplier-status').checked = supplier.isActive;

        document.getElementById('amount-limits-section').innerHTML = '';
        supplier.services[0].amountLimits.forEach(range => {
            const amountRangeItem = document.createElement('div');
            amountRangeItem.classList.add('amount-range-item');
            amountRangeItem.innerHTML = `
                <input type="text" class="amount-range" value="${range.limit}" />
                <button class="remove-item-btn" onclick="removeItem(this)">Remove</button>
            `;
            document.getElementById('amount-limits-section').appendChild(amountRangeItem);
        });

        document.getElementById('service-charge-section').innerHTML = '';
        supplier.services[0].serviceCharges.forEach(charge => {
            const serviceChargeItem = document.createElement('div');
            serviceChargeItem.classList.add('service-charge-item');
            serviceChargeItem.innerHTML = `
                <div>
                    <label>Condition</label>
                    <input type="text" class="service-condition" value="${charge.condition}" />
                </div>
                <div>
                    <label>Charge</label>
                    <input type="text" class="service-charge" value="${charge.charge}" />
                </div>
                <button class="remove-item-btn" onclick="removeItem(this)">Remove</button>
                <div class="additional-questions-container"></div>
            `;
            document.getElementById('service-charge-section').appendChild(serviceChargeItem);
        });

        handleAdditionalQuestions(supplier.services[0].serviceType);

        editingSupplierIndex = index;
        document.getElementById('add-supplier-btn').textContent = 'Update Supplier';
    }

    function handleAdditionalQuestions(serviceType) {
        const questionsContainer = document.getElementById('additional-questions-container');
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
                            ? `<select>${question.options.map(option => `<option value="${option.toLowerCase()}">${option}</option>`).join('')}</select>`
                            : `<input type="${question.type}" placeholder="${question.placeholder || ''}" />`
                    }
                `;
                questionsContainer.appendChild(questionDiv);
            });
        }
    }

    function clearSupplierForm() {
        document.getElementById('supplier-name').value = '';
        document.getElementById('service-type').value = '';
        document.getElementById('supplier-status').checked = false;
        document.getElementById('amount-limits-section').innerHTML = '';
        document.getElementById('service-charge-section').innerHTML = '';
        document.getElementById('additional-questions-container').innerHTML = '';
        document.getElementById('add-supplier-btn').textContent = 'Add Supplier';
        editingSupplierIndex = -1;
    }

    function removeItem(button) {
        const item = button.parentNode;
        item.parentNode.removeChild(item);
    }

    document.getElementById('add-supplier-btn').addEventListener('click', addOrUpdateSupplier);

    document.getElementById('add-amount-range-btn').addEventListener('click', () => {
        const amountRangeItem = document.createElement('div');
        amountRangeItem.classList.add('amount-range-item');
        amountRangeItem.innerHTML = `
            <input type="text" class="amount-range" placeholder="e.g. '> 0.01' or '10000 - 20000'" />
            <button class="remove-item-btn" onclick="removeItem(this)">Remove</button>
        `;
        document.getElementById('amount-limits-section').appendChild(amountRangeItem);
    });

    document.getElementById('add-service-charge-btn').addEventListener('click', () => {
        const serviceChargeItem = document.createElement('div');
        serviceChargeItem.classList.add('service-charge-item');
        serviceChargeItem.innerHTML = `
            <div>
                <label>Condition</label>
                <input type="text" class="service-condition" placeholder="e.g. '> 50,000 CNY'" />
            </div>
            <div>
                <label>Charge</label>
                <input type="text" class="service-charge" placeholder="e.g. '50 CNY'" />
            </div>
            <button class="remove-item-btn" onclick="removeItem(this)">Remove</button>
            <div class="additional-questions-container"></div>
        `;
        document.getElementById('service-charge-section').appendChild(serviceChargeItem);
    });

    document.getElementById('service-type').addEventListener('change', function() {
        handleAdditionalQuestions(this.value);
    });
});

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.right = '20px';
    notification.style.backgroundColor = type === 'success' ? '#10b981' : '#f59e0b';
    notification.style.color = 'white';
    notification.style.padding = '15px';
    notification.style.borderRadius = '8px';
    notification.style.boxShadow = '0px 4px 15px rgba(0, 0, 0, 0.2)';
    notification.style.fontSize = '16px';
    notification.style.zIndex = 1000;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function updateDailyRateSection() {
    const dailyRateSection = document.getElementById('daily-rate-section');
    if (!dailyRateSection) return;

    dailyRateSection.innerHTML = '';

    suppliers.forEach(supplier => {
        supplier.services.forEach(service => {
            const header = document.createElement('h4');
            header.textContent = `${supplier.name} - ${service.serviceType}`;
            dailyRateSection.appendChild(header);

            service.amountLimits.forEach(limit => {
                const rateInput = document.createElement('input');
                rateInput.type = 'number';
                rateInput.value = limit.rate || '';
                rateInput.placeholder = `Rate for ${limit.limit}`;
                rateInput.addEventListener('change', (e) => {
                    limit.rate = parseFloat(e.target.value);
                    localStorage.setItem('suppliers', JSON.stringify(suppliers));
                });
                dailyRateSection.appendChild(rateInput);
            });
        });
    });
}
