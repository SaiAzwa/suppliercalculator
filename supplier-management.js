document.addEventListener('DOMContentLoaded', function () {
    // Check if suppliers state exists
    if (!window.suppliersState) {
        console.error('Suppliers state not initialized');
        return;
    }

    const suppliers = window.suppliersState;
    let editingSupplierIndex = -1;

    function addOrUpdateSupplier() {
        console.log('Starting addOrUpdateSupplier...');
        try {
            const name = document.getElementById('supplier-name').value.trim();
            const serviceType = document.getElementById('service-type').value;
            const isActive = document.getElementById('supplier-status')?.checked ?? true;
            
            console.log('Form values:', { name, serviceType, isActive });

            const amountLimits = Array.from(document.querySelectorAll('.amount-range'))
                .map(input => input.value.trim())
                .filter(limit => limit);
            
            console.log('Amount limits:', amountLimits);

            const serviceCharges = Array.from(document.querySelectorAll('.service-charge-item'))
                .map(item => ({
                    condition: item.querySelector('.service-condition').value.trim(),
                    charge: item.querySelector('.service-charge').value.trim()
                }))
                .filter(charge => charge.condition && charge.charge);

            console.log('Service charges:', serviceCharges);

            // Collect additional questions with enhanced logging
            console.log('Collecting additional questions...');
            const additionalQuestions = Array.from(document.querySelectorAll('.additional-question-item'))
                .map(container => {
                    const label = container.querySelector('.question-label');
                    const select = container.querySelector('.question-answer');
                    console.log('Processing question element:', { 
                        labelElement: label, 
                        selectElement: select,
                        labelText: label?.textContent,
                        selectValue: select?.value
                    });
                    
                    if (label && select) {
                        const question = {
                            label: label.textContent.trim(),
                            value: select.value
                        };
                        console.log('Created question object:', question);
                        return question;
                    }
                    console.log('Skipping invalid question element');
                    return null;
                })
                .filter(q => q !== null);

            console.log('Collected additional questions:', additionalQuestions);

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

            console.log('Created supplier data:', JSON.stringify(supplierData, null, 2));

            // Verify additional questions data
            if (supplierData.services[0].additionalQuestions.length > 0) {
                console.log('Additional questions verified:', supplierData.services[0].additionalQuestions);
            } else {
                console.warn('No additional questions found in supplier data');
            }

            if (editingSupplierIndex === -1) {
                // Adding new supplier
                if (!Array.isArray(suppliers.data)) {
                    console.error('suppliers.data is not an array:', suppliers.data);
                    suppliers.data = [];
                }
                suppliers.data.push(supplierData);
                console.log('Added new supplier. Current state:', suppliers.data);
                window.sharedUtils.showNotification(`Supplier "${name}" added successfully!`, 'success');
            } else {
                // Updating existing supplier
                suppliers.data[editingSupplierIndex] = supplierData;
                editingSupplierIndex = -1;
                document.getElementById('add-supplier-btn').textContent = 'Add Supplier';
                window.sharedUtils.showNotification(`Supplier "${name}" updated successfully!`, 'success');
            }
            // Save to state and trigger sync
            suppliers.save();
            logStateAfterSave();
            console.log('State saved');
            
            // Trigger sync event
            window.dispatchEvent(new Event('suppliersStateChanged'));
            console.log('suppliersStateChanged event dispatched');

            // Update UI
            if (typeof window.updateSupplierTables === 'function') {
                console.log('Updating supplier tables...');
                window.updateSupplierTables();
            } else {
                console.error('updateSupplierTables function not found');
            }

            if (typeof window.updateDailyRateSection === 'function') {
                console.log('Updating daily rate section...');
                window.updateDailyRateSection();
            }

            clearSupplierForm();
            console.log('Form cleared');

        } catch (error) {
            console.error('Error in addOrUpdateSupplier:', error);
            window.sharedUtils.showNotification('Error adding/updating supplier', 'error');
        }
    }

    function editSupplier(index, serviceIndex) {
        console.log('Editing supplier:', { index, serviceIndex });
        try {
            const supplier = suppliers.data[index];
            if (!supplier) {
                console.error('Supplier not found for index:', index);
                return;
            }

            document.getElementById('supplier-name').value = supplier.name;
            document.getElementById('service-type').value = supplier.services[serviceIndex].serviceType;
            document.getElementById('supplier-status').checked = supplier.isActive;

            // Clear and populate amount limits section
            const amountLimitsSection = document.getElementById('amount-limits-section');
            amountLimitsSection.innerHTML = '';
            supplier.services[serviceIndex].amountLimits.forEach(range => {
                const amountRangeItem = document.createElement('div');
                amountRangeItem.classList.add('amount-range-item');
                amountRangeItem.innerHTML = `
                    <input type="text" class="amount-range" value="${range.limit}" />
                    <button type="button" class="remove-item-btn" onclick="removeItem(this)">Remove</button>
                `;
                amountLimitsSection.appendChild(amountRangeItem);
            });

            // Clear and populate service charges section
            const serviceChargeSection = document.getElementById('service-charge-section');
            serviceChargeSection.innerHTML = '';
            supplier.services[serviceIndex].serviceCharges.forEach(charge => {
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
                    <button type="button" class="remove-item-btn" onclick="removeItem(this)">Remove</button>
                `;
                serviceChargeSection.appendChild(serviceChargeItem);
            });

            handleAdditionalQuestions(supplier.services[serviceIndex].serviceType);

            // Set editing state
            editingSupplierIndex = index;
            document.getElementById('add-supplier-btn').textContent = 'Update Supplier';
            
            console.log('Supplier loaded for editing');

        } catch (error) {
            console.error('Error in editSupplier:', error);
            window.sharedUtils.showNotification('Error loading supplier for editing', 'error');
        }
    }
    function handleAdditionalQuestions(serviceType) {
        console.log('Handling additional questions for service type:', serviceType);
        const questionsContainer = document.getElementById('additional-questions-container');
        if (!questionsContainer) {
            console.error('Additional questions container not found');
            return;
        }

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
            'enterprise': [], // Add if you have specific questions
            'usd-transfer': [
                { label: 'Account Type', type: 'select', options: ['Personal', 'Company'] }
            ],
            'alipay': [
                { label: 'English Account', type: 'select', options: ['Yes', 'No'] },
                { label: 'Chinese Account', type: 'select', options: ['Yes', 'No'] }
            ]
        };

        const questions = additionalQuestionsMap[serviceType] || [];
        console.log('Questions for service type:', questions);

        questions.forEach(question => {
            const questionDiv = document.createElement('div');
            questionDiv.classList.add('additional-question-item', 'form-group');
            
            // Create the label element
            const label = document.createElement('label');
            label.className = 'question-label';
            label.textContent = question.label;
            questionDiv.appendChild(label);

            // Create the input/select element
            if (question.type === 'select') {
                const select = document.createElement('select');
                select.className = 'question-answer';
                question.options.forEach(optionText => {
                    const option = document.createElement('option');
                    option.value = optionText.toLowerCase();
                    option.textContent = optionText;
                    select.appendChild(option);
                });
                questionDiv.appendChild(select);
            } else {
                const input = document.createElement('input');
                input.type = question.type;
                input.className = 'question-answer';
                input.placeholder = question.placeholder || '';
                questionDiv.appendChild(input);
            }

            questionsContainer.appendChild(questionDiv);
        });
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

    // Helper function to log state after save
    function logStateAfterSave() {
        console.log('Current state after save:', {
            fullState: window.suppliersState.data,
            lastSupplier: window.suppliersState.data[window.suppliersState.data.length - 1]
        });
    }

    // Make removeItem function available globally
    window.removeItem = function(button) {
        button.closest('.amount-range-item, .service-charge-item')?.remove();
    };

    // Event Listeners
    document.getElementById('add-supplier-btn')?.addEventListener('click', addOrUpdateSupplier);

    document.getElementById('add-amount-range-btn')?.addEventListener('click', () => {
        const amountRangeItem = document.createElement('div');
        amountRangeItem.classList.add('amount-range-item');
        amountRangeItem.innerHTML = `
            <input type="text" class="amount-range" placeholder="e.g. '> 0.01' or '10000 - 20000'" />
            <button type="button" class="remove-item-btn" onclick="removeItem(this)">Remove</button>
        `;
        document.getElementById('amount-limits-section')?.appendChild(amountRangeItem);
    });

    document.getElementById('add-service-charge-btn')?.addEventListener('click', () => {
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
            <button type="button" class="remove-item-btn" onclick="removeItem(this)">Remove</button>
        `;
        document.getElementById('service-charge-section')?.appendChild(serviceChargeItem);
    });

    // Update service type change handler
    document.getElementById('service-type')?.addEventListener('change', function(event) {
        console.log('Service type changed to:', event.target.value);
        handleAdditionalQuestions(event.target.value);
    });

    // Make functions available globally
    window.editSupplier = editSupplier;
    window.handleAdditionalQuestions = handleAdditionalQuestions;

    // Initialize additional questions if service type is pre-selected
    const initialServiceType = document.getElementById('service-type')?.value;
    if (initialServiceType) {
        handleAdditionalQuestions(initialServiceType);
    }
});
