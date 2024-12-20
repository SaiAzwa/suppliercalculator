function addOrUpdateSupplier() {
    console.log('Starting addOrUpdateSupplier...');
    try {
        const name = document.getElementById('supplier-name').value.trim();
        const serviceType = document.getElementById('service-type').value;
        const isActive = document.getElementById('supplier-status')?.checked;
        
        console.log('Form values:', { name, serviceType, isActive });

        const amountLimits = Array.from(document.querySelectorAll('.amount-range'))
            .map(input => input.value.trim())
            .filter(limit => limit);
        
        console.log('Amount limits:', amountLimits);

        // ... rest of your code ...

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

        console.log('Prepared supplier data:', supplierData);

        if (editingSupplierIndex === -1) {
            // Adding new supplier
            if (!Array.isArray(window.suppliersState.data)) {
                console.error('suppliers.data is not an array:', window.suppliersState.data);
                window.suppliersState.data = [];
            }
            window.suppliersState.data.push(supplierData);
            console.log('Added new supplier. Current state:', window.suppliersState.data);
            showNotification(`Supplier "${name}" added successfully!`, 'success');
        } else {
            // ... update code ...
        }

        // Save to state and trigger sync
        window.suppliersState.save();
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

        clearSupplierForm();
        console.log('Form cleared');
    } catch (error) {
        console.error('Error in addOrUpdateSupplier:', error);
        showNotification('Error adding/updating supplier', 'error');
    }
}
