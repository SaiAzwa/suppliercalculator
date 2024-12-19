document.addEventListener('DOMContentLoaded', function () {
    // Check if suppliers state exists
    if (!window.suppliersState) {
        console.error('Suppliers state not initialized');
        return;
    }

    const suppliers = window.suppliersState;
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
            // Adding new supplier
            suppliers.data.push(supplierData);
            showNotification(`Supplier "${name}" added successfully!`, 'success');
        } else {
            // Updating existing supplier
            suppliers.data[editingSupplierIndex] = supplierData;
            editingSupplierIndex = -1;
            document.getElementById('add-supplier-btn').textContent = 'Add Supplier';
            showNotification(`Supplier "${name}" updated successfully!`, 'success');
        }

        // Save to state and trigger sync
        suppliers.save();
        window.dispatchEvent(new Event('suppliersStateChanged'));

        // Update UI
        if (typeof window.updateSupplierTables === 'function') {
            window.updateSupplierTables();
        }
        if (typeof window.updateDailyRateSection === 'function') {
            window.updateDailyRateSection();
        }
        clearSupplierForm();
    }

    function editSupplier(index) {
        const supplier = suppliers.data[index];
        if (!supplier) return;

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
            `;
            document.getElementById('service-charge-section').appendChild(serviceChargeItem);
        });

        handleAdditionalQuestions(supplier.services[0].serviceType);

        editingSupplierIndex = index;
        document.getElementById('add-supplier-btn').textContent = 'Update Supplier';
    }

    // Your existing handleAdditionalQuestions function remains the same
    function handleAdditionalQuestions(serviceType) {
        // ... existing code ...
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

    // Make removeItem function available globally
    window.removeItem = function(button) {
        const item = button.parentNode;
        item.parentNode.removeChild(item);
    };

    // Event Listeners
    document.getElementById('add-supplier-btn')?.addEventListener('click', addOrUpdateSupplier);

    document.getElementById('add-amount-range-btn')?.addEventListener('click', () => {
        const amountRangeItem = document.createElement('div');
        amountRangeItem.classList.add('amount-range-item');
        amountRangeItem.innerHTML = `
            <input type="text" class="amount-range" placeholder="e.g. '> 0.01' or '10000 - 20000'" />
            <button class="remove-item-btn" onclick="removeItem(this)">Remove</button>
        `;
        document.getElementById('amount-limits-section').appendChild(amountRangeItem);
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
            <button class="remove-item-btn" onclick="removeItem(this)">Remove</button>
        `;
        document.getElementById('service-charge-section').appendChild(serviceChargeItem);
    });

    document.getElementById('service-type')?.addEventListener('change', function() {
        handleAdditionalQuestions(this.value);
    });

    // Make the edit function available globally
    window.editSupplier = editSupplier;
});
