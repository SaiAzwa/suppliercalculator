document.addEventListener('DOMContentLoaded', function () {
    // Initialize with the shared state
    const orders = window.orderProcessor.processedOrders;
    let editingOrderIndex = -1;

    // Set up callback for when new orders are processed
    window.orderProcessor.onOrdersProcessed = function (updatedOrders) {
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

    // Order manipulation functions
    function editOrder(index) {
        editingOrderIndex = index;
        const order = window.orderProcessor.processedOrders[index];

        // Create a pop-up form
        const popup = document.createElement('div');
        popup.className = 'popup';
        popup.innerHTML = `
            <div class="popup-content">
                <h2>Edit ${order.serviceType}</h2>
                <label for="serviceType">Service Type:</label>
                <select id="serviceType" class="form-control">
                    <option value="Bank Transfer (Saver)" ${order.serviceType === 'Bank Transfer (Saver)' ? 'selected' : ''}>Bank Transfer (Saver)</option>
                    <option value="Bank Transfer (Express)" ${order.serviceType === 'Bank Transfer (Express)' ? 'selected' : ''}>Bank Transfer (Express)</option>
                    <option value="Alipay Transfer" ${order.serviceType === 'Alipay Transfer' ? 'selected' : ''}>Alipay Transfer</option>
                    <option value="Enterprise to Enterprise" ${order.serviceType === 'Enterprise to Enterprise' ? 'selected' : ''}>Enterprise to Enterprise</option>
                </select>
                <label for="orderAmount">Order Amount:</label>
                <input type="number" id="orderAmount" class="form-control" value="${order.orderAmount}" step="0.01" min="0">
                <label for="referenceNumber">Reference Number:</label>
                <input type="text" id="referenceNumber" class="form-control" value="${order.referenceNumber}">
                <label for="markingNumber">Marking Number:</label>
                <input type="text" id="markingNumber" class="form-control" value="${order.markingNumber}">
                <!-- Additional Questions -->
                ${getAdditionalQuestionsHTML(order.serviceType, order.additionalQuestions)}
                <button class="btn btn-primary" id="saveButton">Save</button>
                <button class="btn btn-secondary" id="cancelButton">Cancel</button>
            </div>
        `;

        document.body.appendChild(popup);

        // Handle save button click
        document.getElementById('saveButton').addEventListener('click', function () {
            try {
                const updatedOrder = {
                    ...order,
                    serviceType: document.getElementById('serviceType').value,
                    orderAmount: parseFloat(document.getElementById('orderAmount').value),
                    referenceNumber: document.getElementById('referenceNumber').value,
                    markingNumber: document.getElementById('markingNumber').value,
                    additionalQuestions: getAdditionalQuestionsFromPopup(order.serviceType),
                    requiresAdditionalQuestions: false // Clear the "!" after saving
                };

                validateOrder(updatedOrder);
                window.orderProcessor.processedOrders[editingOrderIndex] = updatedOrder;
                updateOrderTable(window.orderProcessor.processedOrders);
                document.body.removeChild(popup);
                window.sharedUtils.showNotification('Order updated successfully', 'success');
            } catch (error) {
                window.sharedUtils.showNotification(error.message, 'error');
            }
        });

        // Handle cancel button click
        document.getElementById('cancelButton').addEventListener('click', function () {
            document.body.removeChild(popup);
        });
    }

    function deleteOrder(index) {
        if (confirm('Are you sure you want to delete this order?')) {
            window.orderProcessor.processedOrders.splice(index, 1);
            updateOrderTable(window.orderProcessor.processedOrders);
            window.sharedUtils.showNotification('Order deleted successfully', 'success');
        }
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

    // Helper function to get additional questions HTML based on service type
    function getAdditionalQuestionsHTML(serviceType, existingQuestions = []) {
        const questions = getQuestionsForServiceType(serviceType);
        return questions.map(q => `
            <div>
                <label>${q.label}</label>
                <select class="form-control additional-question-edit" data-label="${q.label}">
                    ${q.options.map(option => `
                        <option value="${option}" ${existingQuestions.find(eq => eq.label === q.label && eq.value === option) ? 'selected' : ''}>
                            ${option}
                        </option>
                    `).join('')}
                </select>
            </div>
        `).join('');
    }

    // Helper function to get additional questions from the pop-up
    function getAdditionalQuestionsFromPopup(serviceType) {
        const questions = getQuestionsForServiceType(serviceType);
        return questions.map(q => ({
            label: q.label,
            value: document.querySelector(`.additional-question-edit[data-label="${q.label}"]`)?.value || ''
        }));
    }

    // Helper function to get questions for a specific service type
    function getQuestionsForServiceType(serviceType) {
        // Define additional questions for each service type
        const additionalQuestionsMap = {
            'Bank Transfer (Express)': [
                { label: 'English Account', type: 'select', options: ['Yes', 'No'] },
                { label: '工商银行 Account', type: 'select', options: ['Yes', 'No'] },
                { label: '农业银行 Account', type: 'select', options: ['Yes', 'No'] }
            ],
            'Bank Transfer (Saver)': [
                { label: 'English Account', type: 'select', options: ['Yes', 'No'] },
                { label: '工商银行 Account', type: 'select', options: ['Yes', 'No'] },
                { label: '农业银行 Account', type: 'select', options: ['Yes', 'No'] }
            ],
            'Alipay Transfer': [
                { label: 'English Account', type: 'select', options: ['Yes', 'No'] },
                { label: 'Chinese Account', type: 'select', options: ['Yes', 'No'] }
            ]
        };
        return additionalQuestionsMap[serviceType] || [];
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
