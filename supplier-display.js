document.addEventListener('DOMContentLoaded', function () {
    // Check if suppliers state exists
    if (!window.suppliersState) {
        console.error('Suppliers state not initialized');
        return;
    }

    const suppliers = window.suppliersState;

    function updateSupplierTables() {
        const tableIds = {
            'bank-express': 'bank-express-table-body',
            'bank-saver': 'bank-saver-table-body',
            'enterprise': 'enterprise-table-body',
            'usd-transfer': 'usd-transfer-table-body',
            'alipay': 'alipay-table-body'
        };

        const tables = {};
        
        for (const [key, id] of Object.entries(tableIds)) {
            const table = document.getElementById(id);
            if (table) {
                tables[key] = table;
            } else {
                console.warn(`Table with ID "${id}" not found in the DOM`);
            }
        }

        // Clear existing tables safely
        for (const table of Object.values(tables)) {
            if (table && table.innerHTML !== undefined) {
                table.innerHTML = '';
            }
        }

        // Check if suppliers.data exists and is an array
        if (!Array.isArray(suppliers.data)) {
            console.warn('No valid suppliers data found');
            return;
        }

        suppliers.data.forEach((supplier, supplierIndex) => {
            try {
                if (!supplier || !supplier.services) {
                    console.warn(`Invalid supplier data at index ${supplierIndex}`);
                    return;
                }

                if (!Array.isArray(supplier.services)) {
                    console.warn(`Supplier "${supplier.name}" does not have a valid services array`);
                    return;
                }

                supplier.services.forEach((service, serviceIndex) => {
                    if (!service || !service.serviceType) {
                        console.warn(`Invalid service data for supplier "${supplier.name}"`);
                        return;
                    }

                    const tabKey = service.serviceType;
                    if (!tables[tabKey]) {
                        console.warn(`Table for service type "${tabKey}" not found`);
                        return;
                    }

                    const additionalQuestions = service.additionalQuestions || [];
                    const row = document.createElement('tr');
                    
                    row.innerHTML = `
                        <td>${supplier.name || 'N/A'}</td>
                        <td>${(service.amountLimits || []).map(a => a.limit).join(', ') || 'N/A'}</td>
                        <td>${(service.serviceCharges || []).map(c => `${c.condition}: ${c.charge}`).join(', ') || 'N/A'}</td>
                        <td>${additionalQuestions.map(q => `${q.label}: ${q.value || 'N/A'}`).join(', ') || 'N/A'}</td>
                        <td>
                            <button class="status-toggle-btn ${supplier.isActive ? 'active' : 'inactive'}">
                                ${supplier.isActive ? 'Active' : 'Inactive'}
                            </button>
                        </td>
                        <td>
                            <button class="edit-btn">Edit</button>
                            <button class="delete-btn">Delete</button>
                        </td>
                    `;

                    const statusBtn = row.querySelector('.status-toggle-btn');
                    const deleteBtn = row.querySelector('.delete-btn');
                    const editBtn = row.querySelector('.edit-btn');

                    if (statusBtn) {
                        statusBtn.addEventListener('click', () => toggleSupplierStatus(supplierIndex));
                    }
                    if (deleteBtn) {
                        deleteBtn.addEventListener('click', () => deleteSupplier(supplierIndex));
                    }
                    if (editBtn) {
                        editBtn.addEventListener('click', () => editSupplier(supplierIndex, serviceIndex));
                    }

                    tables[tabKey].appendChild(row);
                });
            } catch (error) {
                console.error(`Error processing supplier at index ${supplierIndex}:`, error);
            }
        });
    }

    function toggleSupplierStatus(index) {
        try {
            if (suppliers.data[index]) {
                suppliers.data[index].isActive = !suppliers.data[index].isActive;
                suppliers.save();
                updateSupplierTables();
                showNotification(
                    `Supplier "${suppliers.data[index].name}" is now ${suppliers.data[index].isActive ? 'Active' : 'Inactive'}!`,
                    'success'
                );
                // Trigger sync after status change
                window.dispatchEvent(new Event('suppliersStateChanged'));
            }
        } catch (error) {
            console.error('Error toggling supplier status:', error);
            showNotification('Failed to update supplier status', 'error');
        }
    }

    function deleteSupplier(index) {
        try {
            const confirmDelete = confirm("Are you sure you want to delete this supplier?");
            if (!confirmDelete) return;

            const supplierName = suppliers.data[index]?.name || 'Unknown supplier';
            
            suppliers.data.splice(index, 1);
            suppliers.save();
            updateSupplierTables();
            if (typeof updateDailyRateSection === 'function') {
                updateDailyRateSection();
            }
            showNotification(`Supplier "${supplierName}" deleted successfully!`, 'success');
            // Trigger sync after deletion
            window.dispatchEvent(new Event('suppliersStateChanged'));
        } catch (error) {
            console.error('Error deleting supplier:', error);
            showNotification('Failed to delete supplier', 'error');
        }
    }

    // Initialize tabs
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', function () {
            const target = this.dataset.service;
            if (!target) return;

            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(tc => tc.classList.remove('active'));

            this.classList.add('active');
            const targetTab = document.getElementById(`${target}-tab`);
            if (targetTab) {
                targetTab.classList.add('active');
            }
        });
    });

    // Listen for updates from the API
    window.addEventListener('suppliersUpdated', function() {
        updateSupplierTables();
    });

    // Initial update
    updateSupplierTables();
    window.updateSupplierTables = updateSupplierTables;
});
