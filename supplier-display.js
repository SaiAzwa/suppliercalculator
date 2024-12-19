document.addEventListener('DOMContentLoaded', function () {
    // Use the shared state
    const suppliers = window.suppliersState;
    suppliers.load();

    function updateSupplierTables() {
        // Define table IDs and get references
        const tableIds = {
            'bank-express': 'bank-express-table-body',
            'bank-saver': 'bank-saver-table-body',
            'enterprise': 'enterprise-table-body',
            'usd-transfer': 'usd-transfer-table-body',
            'alipay': 'alipay-table-body'
        };

        const tables = {};
        
        // Safely get table references and log warnings for missing tables
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

        // Iterate through the suppliers array and populate the tables
        suppliers.data.forEach((supplier, supplierIndex) => {
            // Ensure supplier has required properties
            if (!supplier || !supplier.services) {
                console.warn(`Invalid supplier data at index ${supplierIndex}`);
                return;
            }

            // Ensure 'supplier.services' is an array
            if (!Array.isArray(supplier.services)) {
                console.warn(`Supplier "${supplier.name}" does not have a valid services array`);
                return;
            }

            supplier.services.forEach((service, serviceIndex) => {
                const tabKey = service.serviceType;
                if (!tables[tabKey]) {
                    console.warn(`Table for service type "${tabKey}" not found`);
                    return;
                }

                const additionalQuestions = service.additionalQuestions || [];
                const row = document.createElement('tr');
                
                // Create row content with null checks
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

                // Add event listeners
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
        });
    }

    function toggleSupplierStatus(index) {
        if (suppliers.data[index]) {
            suppliers.data[index].isActive = !suppliers.data[index].isActive;
            suppliers.save();
            updateSupplierTables();
            showNotification(
                `Supplier "${suppliers.data[index].name}" is now ${suppliers.data[index].isActive ? 'Active' : 'Inactive'}!`,
                'success'
            );
        }
    }

    function deleteSupplier(index) {
        const confirmDelete = confirm("Are you sure you want to delete this supplier?");
        if (!confirmDelete) return;

        suppliers.data.splice(index, 1);
        suppliers.save();
        updateSupplierTables();
        if (typeof updateDailyRateSection === 'function') {
            updateDailyRateSection();
        }
        showNotification('Supplier deleted successfully!', 'success');
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

    // Initial update
    updateSupplierTables();
    window.updateSupplierTables = updateSupplierTables;
});
