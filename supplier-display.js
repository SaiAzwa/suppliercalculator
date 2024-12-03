document.addEventListener('DOMContentLoaded', function () {
    function updateSupplierTables() {
        const tables = {
            'bank-express': document.getElementById('bank-express-table-body'),
            'bank-saver': document.getElementById('bank-saver-table-body'),
            'enterprise': document.getElementById('enterprise-table-body'),
            'usd-transfer': document.getElementById('usd-transfer-table-body'),
            'alipay': document.getElementById('alipay-table-body')
        };

        Object.values(tables).forEach(table => {
            if (table) table.innerHTML = '';
        });

        suppliers.forEach((supplier, supplierIndex) => {
            supplier.services.forEach((service, serviceIndex) => {
                const tabKey = service.serviceType;
                if (!tables[tabKey]) {
                    console.error(`Service type "${tabKey}" does not match any tab key.`);
                    return;
                }

                const additionalQuestions = service.additionalQuestions || [];
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${supplier.name}</td>
                    <td>${service.amountLimits.map(a => a.limit).join(', ')}</td>
                    <td>${service.serviceCharges.map(c => `${c.condition}: ${c.charge}`).join(', ')}</td>
                    <td>${additionalQuestions.map(q => `${q.label}: ${q.value || 'N/A'}`).join(', ')}</td>
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

                row.querySelector('.status-toggle-btn').addEventListener('click', function () {
                    toggleSupplierStatus(supplierIndex);
                });

                row.querySelector('.delete-btn').addEventListener('click', function () {
                    deleteSupplier(supplierIndex);
                });

                row.querySelector('.edit-btn').addEventListener('click', function () {
                    editSupplier(supplierIndex, serviceIndex);
                });

                tables[tabKey].appendChild(row);
            });
        });
    }

    function toggleSupplierStatus(index) {
        suppliers[index].isActive = !suppliers[index].isActive;
        localStorage.setItem('suppliers', JSON.stringify(suppliers));
        updateSupplierTables();
        showNotification(
            `Supplier "${suppliers[index].name}" is now ${suppliers[index].isActive ? 'Active' : 'Inactive'}!`,
            'success'
        );
    }

    function deleteSupplier(index) {
        const confirmDelete = confirm("Are you sure you want to delete this supplier?");
        if (!confirmDelete) return;

        suppliers.splice(index, 1);
        localStorage.setItem('suppliers', JSON.stringify(suppliers));
        updateSupplierTables();
        updateDailyRateSection();
        showNotification('Supplier deleted successfully!', 'success');
    }

    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', function () {
            const target = this.dataset.service;

            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(tc => tc.classList.remove('active'));

            this.classList.add('active');
            document.getElementById(`${target}-tab`).classList.add('active');
        });
    });

    updateSupplierTables();
    window.updateSupplierTables = updateSupplierTables;
});

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    
    Object.assign(notification.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        backgroundColor: type === 'success' ? '#10b981' : '#f59e0b',
        color: 'white',
        padding: '15px',
        borderRadius: '8px',
        boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.2)',
        fontSize: '16px',
        zIndex: '1000'
    });

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}
