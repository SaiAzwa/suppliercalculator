document.addEventListener('DOMContentLoaded', function () {
    // Ensure window.orderProcessor is initialized
    if (!window.orderProcessor) {
        console.error('window.orderProcessor is not initialized');
        return;
    }

    // Initialize with the shared state
    const orders = window.orderProcessor.processedOrders;

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
        `;

        const orderTable = document.getElementById('orderTable');
        if (orderTable) {
            orderTable.parentNode.insertBefore(filterContainer, orderTable);
        }

        // Add event listeners
        document.getElementById('service-filter')?.addEventListener('change', filterOrders);
        document.getElementById('clear-orders-btn')?.addEventListener('click', clearOrders);
    }

    function updateOrderTable(orders) {
        const orderTable = document.getElementById('orderTable')?.querySelector('tbody');
        if (!orderTable) return;

        orderTable.innerHTML = '';
        orders.forEach((order, index) => {
            const newRow = document.createElement('tr');
            newRow.innerHTML = `
                <td>${order.serviceType}</td>
                <td>${order.orderAmount.toFixed(2)} CNY</td>
                <td>
                    Ref: ${order.referenceNumber}<br>
                    Mark: ${order.markingNumber}
                </td>
                <td>
                    ${order.additionalQuestions.map(q => `${q.label}: ${q.value}`).join('<br>')}
                </td>
                <td class="best-supplier">Calculating...</td>
                <td>
                    <button class="btn edit-btn" onclick="tableManager.editOrder(${index})">Edit</button>
                    <button class="btn delete-btn" onclick="tableManager.deleteOrder(${index})">Delete</button>
                    ${order.requiresAdditionalQuestions ? '<span class="warning">!</span>' : ''}
                </td>
            `;
            orderTable.appendChild(newRow);
        });
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
            window.sharedUtils.showNotification('All orders cleared', 'info');
        }
    }

    // Define editOrder function
    function editOrder(index) {
        const order = window.orderProcessor.processedOrders[index];
        console.log('Editing order:', order);
        // Add your edit logic here (e.g., open a pop-up form)
        window.sharedUtils.showNotification(`Editing order at index ${index}`, 'info');
    }

    // Define deleteOrder function
    function deleteOrder(index) {
        if (confirm('Are you sure you want to delete this order?')) {
            window.orderProcessor.processedOrders.splice(index, 1);
            updateOrderTable(window.orderProcessor.processedOrders);
            window.sharedUtils.showNotification('Order deleted successfully', 'success');
        }
    }

    // Initialize functionality
    addFilterControls();
    updateOrderTable(window.orderProcessor.processedOrders);

    // Make functions available globally
    window.tableManager = {
        editOrder,
        deleteOrder,
        filterOrders,
        clearOrders,
        updateOrderTable
    };
});
