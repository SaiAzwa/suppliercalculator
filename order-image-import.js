document.addEventListener('DOMContentLoaded', function() {
    let processedOrders = []; // Store orders for filtering
    let editingOrderIndex = -1; // Track which order is being edited

    async function initializeWorker() {
        const worker = await Tesseract.createWorker({
            logger: m => {
                console.log(m);
                updateLoadingText(m);
            }
        });
        await worker.loadLanguage('eng+chi_sim');
        await worker.initialize('eng+chi_sim');
        return worker;
    }

    async function processOrderImage(file) {
        try {
            showLoadingIndicator('Initializing OCR...');
            const worker = await initializeWorker();

            showLoadingIndicator('Processing image...');
            const result = await worker.recognize(file);
            console.log('OCR Raw Result:', result.data.text);

            // Parse the text
            const orders = parseOrderText(result.data.text);
            console.log('Parsed orders:', orders);

            // Filter out 1688-related orders
            const filteredOrders = orders.filter(order => 
                !order.serviceType.includes('1688') && 
                !order.serviceType.includes('VIP') &&
                !order.serviceType.includes('1688 PAYMENT')
            );

            await worker.terminate();
            return filteredOrders;
        } catch (error) {
            console.error('Error processing image:', error);
            showNotification('Error processing image', 'error');
            return [];
        } finally {
            hideLoadingIndicator();
        }
    }

    function parseOrderText(text) {
        const lines = text.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);

        console.log('Processing lines:', lines);

        return lines.map(line => {
            try {
                // Split by multiple spaces and combine excess parts
                const parts = line.match(/\S+/g) || [];
                console.log('Line parts:', parts);
                
                if (parts.length < 10) {
                    console.log('Skipping line - insufficient parts:', line);
                    return null;
                }

                // Extract information based on known positions
                const order = {
                    date: parts[0],
                    referenceNumber: parts[1],
                    paymentMethod: parts[2],
                    paymentAmount: extractAmount(parts[3], 'MYR'),
                    markingNumber: parts[4],
                    orderAmount: extractAmount(parts[5], 'CNY'),
                    serviceType: extractServiceType(parts.slice(6)),
                    timeSinceOrder: parts[parts.length - 3],
                    accountType: parts[parts.length - 2],
                    customerName: parts[parts.length - 1],
                    isEditing: false // Add editing state to each order
                };

                console.log('Parsed order:', order);
                return isValidOrder(order) ? order : null;

            } catch (error) {
                console.error('Error parsing line:', line, error);
                return null;
            }
        }).filter(order => order !== null);
    }

    function extractServiceType(parts) {
        const serviceTypeMap = {
            'BANK TRANSFER (SAVER)': 'Bank Transfer (Saver)',
            'BANK TRANSFER (EXPRESS)': 'Bank Transfer (Express)',
            'ALIPAY TRANSFER': 'Alipay Transfer',
            'ENTERPRISE TO ENTERPRISE': 'Enterprise to Enterprise'
        };

        const fullText = parts.join(' ');
        for (const [key, value] of Object.entries(serviceTypeMap)) {
            if (fullText.includes(key)) return value;
        }
        return 'Unknown';
    }

    function extractAmount(amountStr, currency) {
        try {
            const cleanAmount = amountStr.replace(currency, '').replace(',', '');
            return parseFloat(cleanAmount) || 0;
        } catch {
            return 0;
        }
    }

    function isValidOrder(order) {
        const isValid = (
            order &&
            order.orderAmount > 0 &&
            order.serviceType !== 'Unknown' &&
            !order.serviceType.includes('1688')
        );

        console.log('Order validation:', { order, isValid });
        return isValid;
    }
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
                        <input type="number" class="order-amount-edit" value="${order.orderAmount}" step="0.01">
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

    function editOrder(index) {
        processedOrders[index].isEditing = true;
        updateOrderTable(processedOrders);
    }

    function saveOrder(index) {
        const row = document.querySelector(`tr:nth-child(${index + 1})`);
        processedOrders[index] = {
            ...processedOrders[index],
            serviceType: row.querySelector('.service-type-edit').value,
            orderAmount: parseFloat(row.querySelector('.order-amount-edit').value),
            referenceNumber: row.querySelector('.ref-edit').value,
            markingNumber: row.querySelector('.mark-edit').value,
            customerName: row.querySelector('.customer-edit').value,
            isEditing: false
        };
        updateOrderTable(processedOrders);
        showNotification('Order updated successfully', 'success');
    }

    function cancelEdit(index) {
        processedOrders[index].isEditing = false;
        updateOrderTable(processedOrders);
    }

    function deleteOrder(index) {
        if (confirm('Are you sure you want to delete this order?')) {
            processedOrders.splice(index, 1);
            updateOrderTable(processedOrders);
            showNotification('Order deleted successfully', 'success');
        }
    }

    function filterOrders() {
        const serviceType = document.getElementById('service-filter')?.value;
        const filteredOrders = serviceType ? 
            processedOrders.filter(order => order.serviceType === serviceType) : 
            processedOrders;
        
        updateOrderTable(filteredOrders);
    }

    function clearOrders() {
        processedOrders = [];
        updateOrderTable([]);
        showNotification('All orders cleared', 'info');
    }

    // Make functions available globally
window.editOrder = editOrder;
window.saveOrder = saveOrder;
window.cancelEdit = cancelEdit;
window.deleteOrder = deleteOrder;
window.filterOrders = filterOrders;
window.clearOrders = clearOrders;
window.updateOrderTable = updateOrderTable;
window.processedOrders = processedOrders; // Make the orders array accessible
window.addFilterControls = addFilterControls;

    // Add manual order entry
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
            isEditing: true  // Start in edit mode
        };
        processedOrders.unshift(newOrder);  // Add to beginning of array
        updateOrderTable(processedOrders);
        showNotification('New order added', 'info');
    }

    // Validate order data before saving
    function validateOrder(orderData) {
        if (!orderData.serviceType) {
            throw new Error('Service type

    // Setup drag and drop functionality
    function setupDragAndDrop() {
        const dropZone = document.getElementById('drop-zone');
        const fileInput = document.getElementById('order-image');

        if (!dropZone || !fileInput) return;

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, preventDefaults);
            document.body.addEventListener(eventName, preventDefaults);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, highlight);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, unhighlight);
        });

        dropZone.addEventListener('drop', handleDrop);

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        function highlight(e) {
            dropZone.classList.add('dragover');
        }

        function unhighlight(e) {
            dropZone.classList.remove('dragover');
        }

        async function handleDrop(e) {
            const dt = e.dataTransfer;
            const file = dt.files[0];

            if (file && file.type.startsWith('image/')) {
                fileInput.files = dt.files;
                await processFile(file);
            } else {
                showNotification('Please drop an image file', 'error');
            }
        }
    }

    // UI Helper functions
    function showLoadingIndicator(message) {
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'flex';
            updateLoadingText({ status: 'loading', message: message });
        }
    }

    function hideLoadingIndicator() {
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
    }

    function updateLoadingText(progress) {
        const loadingText = document.querySelector('.loading-text');
        if (loadingText) {
            if (progress.status === 'loading') {
                loadingText.textContent = progress.message;
            } else if (progress.progress) {
                loadingText.textContent = `Processing image... ${Math.round(progress.progress * 100)}%`;
            }
        }
    }

    async function processFile(file) {
        showNotification('Processing image...', 'info');
        const orders = await processOrderImage(file);

        if (orders.length > 0) {
            processedOrders = [...processedOrders, ...orders];
            updateOrderTable(processedOrders);
            showNotification(`Successfully processed ${orders.length} orders`, 'success');
            document.getElementById('order-image').value = '';
        } else {
            showNotification('No valid orders found in image', 'error');
        }
    }

    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.className = `notification ${type}`;
        
        Object.assign(notification.style, {
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            backgroundColor: type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#f59e0b',
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

    // Event Listeners
    const processImageBtn = document.getElementById('process-image-btn');
    if (processImageBtn) {
        processImageBtn.addEventListener('click', async () => {
            const fileInput = document.getElementById('order-image');
            const file = fileInput?.files[0];

            if (!file) {
                showNotification('Please select an image file first', 'error');
                return;
            }

            await processFile(file);
        });
    }

    // Add event listener for manual order entry
    const addOrderBtn = document.getElementById('add-order-btn');
    if (addOrderBtn) {
        addOrderBtn.addEventListener('click', () => {
            addManualOrder();
        });
    }

    // Initialize functionality
    setupDragAndDrop();
    addFilterControls();

    // Make helper functions available globally
    window.showNotification = showNotification;
    window.showLoadingIndicator = showLoadingIndicator;
    window.hideLoadingIndicator = hideLoadingIndicator;
    window.processFile = processFile;
});
