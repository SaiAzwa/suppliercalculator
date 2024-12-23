document.addEventListener('DOMContentLoaded', function() {
    // Initialize with the shared state
    const orders = window.orderProcessor.processedOrders;
    let editingOrderIndex = -1;

    // Set up callback for when new orders are processed
    window.orderProcessor.onOrdersProcessed = function(updatedOrders) {
        updateOrderTable(updatedOrders);
    };

    // Add filter controls to the page
    function addFilterControls() {
        const filterContainer = document.createElement('div');
        filterContainer.className = 'form-group';
        filterContainer.innerHTML = `
            <div style="margin-bottom: 15px;">
                <label for="service-filter">Filter by Service Type:</label>
                <select id="service-filter" class="form-control">
                    <option value="">All Services</option>
                    <option value="Bank Transfer (Saver)">Bank Transfer (Saver)</option>
                    <option value="Bank Transfer (Express)">Bank Transfer (Express)</option>
                    <option value="Alipay Transfer">Alipay Transfer</option>
                    <option value="Enterprise to Enterprise">Enterprise to Enterprise</option>
                </select>
            </div>
            <button class="btn" id="clear-orders-btn">Clear All Orders</button>
            <button class="btn" id="add-manual-order-btn">Add Manual Order</button>
        `;

        const orderTable = document.getElementById('orderTable');
        if (orderTable) {
            orderTable.parentNode.insertBefore(filterContainer, orderTable);
        }

        // Add event listeners
        document.getElementById('service-filter')?.addEventListener('change', filterOrders);
        document.getElementById('clear-orders-btn')?.addEventListener('click', clearOrders);
        document.getElementById('add-manual-order-btn')?.addEventListener('click', addManualOrder);
    }

    function updateOrderTable(orders) {
        const orderTable = document.getElementById('orderTable')?.querySelector('tbody');
        if (!orderTable) return;

        orderTable.innerHTML = '';
        orders.forEach((order, index) => {
            const newRow = document.createElement('tr');
            if (order.isEditing) {
                // Editable row
                newRow.innerHTML = `
                    <td>
                        <select class="service-type-edit">
                            <option value="Bank Transfer (Saver)" ${order.serviceType === 'Bank Transfer (Saver)' ? 'selected' : ''}>Bank Transfer (Saver)</option>
                            <option value="Bank Transfer (Express)" ${order.serviceType === 'Bank Transfer (Express)' ? 'selected' : ''}>Bank Transfer (Express)</option>
                            <option value="Alipay Transfer" ${order.serviceType === 'Alipay Transfer' ? 'selected' : ''}>Alipay Transfer</option>
                            <option value="Enterprise to Enterprise" ${order.serviceType === 'Enterprise to Enterprise' ? 'selected' : ''}>Enterprise to Enterprise</option>
                        </select>
                    </td>
                    <td>
                        <input type="number" class="order-amount-edit" value="${order.orderAmount}" step="0.01" min="0.01">
                    </td>
                    <td>
                        <input type="text" class="ref-edit" value="${order.referenceNumber}" placeholder="Reference Number"><br>
                        <input type="text" class="mark-edit" value="${order.markingNumber}" placeholder="Marking Number"><br>
                        <input type="text" class="customer-edit" value="${order.customerName}" placeholder="Customer Name">
                    </td>
                    <td class="best-supplier">Calculating...</td>
                    <td>
                        <button class="btn save-btn" onclick="saveOrder(${index})">Save</button>
                        <button class="btn cancel-btn" onclick="cancelEdit(${index})">Cancel</button>
                    </td>
                `;
            } else {
                // Display row
                newRow.innerHTML = `
                    <td>${order.serviceType}</td>
                    <td>${order.orderAmount.toFixed(2)} CNY</td>
                    <td>
                        Ref: ${order.referenceNumber}<br>
                        Mark: ${order.markingNumber}<br>
                        Customer: ${order.customerName}
                    </td>
                    <td class="best-supplier">Calculating...</td>
                    <td>
                        <button class="btn edit-btn" onclick="editOrder(${index})">Edit</button>
                        <button class="btn delete-btn" onclick="deleteOrder(${index})">Delete</button>
                    </td>
                `;
            }
            orderTable.appendChild(newRow);
        });
    }

    function addManualOrder() {
        const newOrder = {
            date: new Date().toISOString().split('T')[0],
            referenceNumber: '',
            paymentMethod: '',
            paymentAmount: 0,
            markingNumber: '',
            orderAmount: 0,
            serviceType: '',
            timeSinceOrder: 'just now',
            accountType: '',
            customerName: '',
            isEditing: true
        };
        window.orderProcessor.processedOrders.unshift(newOrder);
        updateOrderTable(window.orderProcessor.processedOrders);
        showNotification('New order ready for editing', 'info');
    }

    function validateOrder(orderData) {
        if (!orderData.serviceType) {
            throw new Error('Service type is required');
        }
        if (!orderData.orderAmount || orderData.orderAmount <= 0) {
            throw new Error('Valid order amount is required');
        }
        if (!orderData.referenceNumber) {
            throw new Error('Reference number is required');
        }
        return true;
    }

    // Order manipulation functions
    function editOrder(index) {
        window.orderProcessor.processedOrders[index].isEditing = true;
        updateOrderTable(window.orderProcessor.processedOrders);
    }

    function saveOrder(index) {
        try {
            const row = document.querySelector(`tr:nth-child(${index + 1})`);
            const updatedOrder = {
                ...window.orderProcessor.processedOrders[index],
                serviceType: row.querySelector('.service-type-edit').value,
                orderAmount: parseFloat(row.querySelector('.order-amount-edit').value),
                referenceNumber: row.querySelector('.ref-edit').value,
                markingNumber: row.querySelector('.mark-edit').value,
                customerName: row.querySelector('.customer-edit').value,
                isEditing: false
            };

            validateOrder(updatedOrder);
            window.orderProcessor.processedOrders[index] = updatedOrder;
            updateOrderTable(window.orderProcessor.processedOrders);
            showNotification('Order updated successfully', 'success');
        } catch (error) {
            showNotification(error.message, 'error');
        }
    }

    function cancelEdit(index) {
        window.orderProcessor.processedOrders[index].isEditing = false;
        updateOrderTable(window.orderProcessor.processedOrders);
    }

    function deleteOrder(index) {
        if (confirm('Are you sure you want to delete this order?')) {
            window.orderProcessor.processedOrders.splice(index, 1);
            updateOrderTable(window.orderProcessor.processedOrders);
            showNotification('Order deleted successfully', 'success');
        }
    }

    function filterOrders() {
        const serviceType = document.getElementById('service-filter')?.value;
        const filteredOrders = serviceType ? 
            window.orderProcessor.processedOrders.filter(order => order.serviceType === serviceType) : 
            window.orderProcessor.processedOrders;
        
        updateOrderTable(filteredOrders);
    }

    function clearOrders() {
        if (confirm('Are you sure you want to clear all orders?')) {
            window.orderProcessor.processedOrders = [];
            updateOrderTable([]);
            showNotification('All orders cleared', 'info');
        }
    }

    // Initialize functionality
    addFilterControls();
    updateOrderTable(window.orderProcessor.processedOrders);

    // Make functions available globally
    window.tableManager = {
        editOrder,
        saveOrder,
        cancelEdit,
        deleteOrder,
        filterOrders,
        clearOrders,
        updateOrderTable,
        addManualOrder
    };
});
