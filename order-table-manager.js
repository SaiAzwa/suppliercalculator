document.addEventListener('DOMContentLoaded', function () {
    // Ensure window.orderProcessor is initialized
    if (!window.orderProcessor) {
        console.error('window.orderProcessor is not initialized');
        return;
    }

    // Initialize tableManager object
    window.tableManager = {
        editOrder: function(index) {
            const order = window.orderProcessor.processedOrders[index];
            console.log('Editing order:', order);
            // Add your edit logic here (e.g., open a pop-up form)
            window.sharedUtils.showNotification(`Editing order at index ${index}`, 'info');
        },
        deleteOrder: function(index) {
            if (confirm('Are you sure you want to delete this order?')) {
                window.orderProcessor.processedOrders.splice(index, 1);
                updateOrderTable(window.orderProcessor.processedOrders);
                window.sharedUtils.showNotification('Order deleted successfully', 'success');
            }
        },
        filterOrders: function() {
            const serviceType = document.getElementById('service-filter')?.value;
            const filteredOrders = serviceType ?
                window.orderProcessor.processedOrders.filter(order => order.serviceType === serviceType) :
                window.orderProcessor.processedOrders;

            updateOrderTable(filteredOrders);
        },
        clearOrders: function() {
            if (confirm('Are you sure you want to clear all orders?')) {
                window.orderProcessor.processedOrders = [];
                updateOrderTable([]);
                window.sharedUtils.showNotification('All orders cleared', 'info');
            }
        },
        showAdditionalQuestionsPopup: function(index) {
            const order = window.orderProcessor.processedOrders[index];
            if (!order) return;

            // Create the popup
            const popup = document.createElement('div');
            popup.className = 'popup';
            popup.innerHTML = `
                <div class="popup-content">
                    <h3>Additional Questions for Order ${order.referenceNumber}</h3>
                    <div id="additional-questions-form"></div>
                    <button class="btn" onclick="tableManager.saveAdditionalQuestions(${index})">Save</button>
                    <button class="btn" onclick="tableManager.closePopup()">Close</button>
                </div>
            `;

            // Add the popup to the body
            document.body.appendChild(popup);

            // Populate the additional questions form based on the service type
            const form = popup.querySelector('#additional-questions-form');
            const questions = getAdditionalQuestionsForService(order.serviceType);
            questions.forEach(question => {
                const questionDiv = document.createElement('div');
                questionDiv.className = 'form-group';
                questionDiv.innerHTML = `
                    <label>${question.label}</label>
                    <select class="question-answer">
                        ${question.options.map(option => `<option value="${option}">${option}</option>`).join('')}
                    </select>
                `;
                form.appendChild(questionDiv);
            });
        },
        saveAdditionalQuestions: function(index) {
            const order = window.orderProcessor.processedOrders[index];
            if (!order) return;

            const popup = document.querySelector('.popup');
            const questions = Array.from(popup.querySelectorAll('.form-group')).map(group => {
                const label = group.querySelector('label').textContent;
                const value = group.querySelector('.question-answer').value;
                return { label, value };
            });

            order.additionalQuestions = questions;
            order.requiresAdditionalQuestions = false; // Mark as resolved

            // Close the popup and update the table
            this.closePopup();
            updateOrderTable(window.orderProcessor.processedOrders);
        },
        closePopup: function() {
            const popup = document.querySelector('.popup');
            if (popup) popup.remove();
        }
    };

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
        document.getElementById('service-filter')?.addEventListener('change', () => window.tableManager.filterOrders());
        document.getElementById('clear-orders-btn')?.addEventListener('click', () => window.tableManager.clearOrders());
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
                    ${order.requiresAdditionalQuestions ? '<span class="warning" onclick="tableManager.showAdditionalQuestionsPopup(' + index + ')">!</span>' : ''}
                </td>
            `;
            orderTable.appendChild(newRow);
        });
    }

    // Function to get additional questions based on the service type
    function getAdditionalQuestionsForService(serviceType) {
        const additionalQuestionsMap = {
            'Alipay Transfer': [
                { label: 'English Account', options: ['Yes', 'No'] },
                { label: 'Chinese Account', options: ['Yes', 'No'] }
            ],
            'Bank Transfer (Express)': [
                { label: 'English Account', options: ['Yes', 'No'] },
                { label: '工商银行 Account', options: ['Yes', 'No'] },
                { label: '农业银行 Account', options: ['Yes', 'No'] }
            ],
            'Bank Transfer (Saver)': [
                { label: 'English Account', options: ['Yes', 'No'] },
                { label: '工商银行 Account', options: ['Yes', 'No'] },
                { label: '农业银行 Account', options: ['Yes', 'No'] }
            ]
        };

        return additionalQuestionsMap[serviceType] || [];
    }

    // Initialize functionality
    addFilterControls();
    updateOrderTable(window.orderProcessor.processedOrders);

    console.log('tableManager initialized:', window.tableManager);
});
