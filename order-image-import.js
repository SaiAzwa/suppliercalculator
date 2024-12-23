document.addEventListener('DOMContentLoaded', function() {
    // Initialize Tesseract worker
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

    // Process image function
    async function processOrderImage(file) {
        try {
            showLoadingIndicator('Initializing OCR...');
            const worker = await initializeWorker();

            showLoadingIndicator('Processing image...');
            const result = await worker.recognize(file);
            console.log('OCR Result:', result);

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
        // Split text into lines and filter out empty lines
        const lines = text.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);

        console.log('Processing lines:', lines);

        return lines.map(line => {
            try {
                // Split line into parts
                const parts = line.split(/\s+/);
                if (parts.length < 9) return null; // Skip invalid lines

                // Extract the service type from the remaining parts
                const serviceType = extractServiceType(parts);
                
                // Create order object
                const order = {
                    date: parts[0],
                    referenceNumber: parts[1],
                    paymentMethod: parts[2],
                    paymentAmount: extractAmount(parts[3], 'MYR'),
                    markingNumber: parts[4],
                    orderAmount: extractAmount(parts[5], 'CNY'),
                    serviceType: serviceType,
                    timeSinceOrder: extractTime(parts.slice(-3)[0]),
                    accountType: parts.slice(-2)[0],
                    customerName: parts.slice(-1)[0]
                };

                return isValidOrder(order) ? order : null;
            } catch (error) {
                console.error('Error parsing line:', line, error);
                return null;
            }
        }).filter(order => order !== null);
    }

    function extractServiceType(parts) {
        // Find service type in the parts array
        const serviceTypes = [
            'BANK TRANSFER (SAVER)',
            'BANK TRANSFER (EXPRESS)',
            'ALIPAY TRANSFER',
            'ENTERPRISE TO ENTERPRISE'
        ];

        // Join remaining parts and look for service type
        const text = parts.join(' ');
        return serviceTypes.find(type => text.includes(type)) || 'Unknown';
    }

    function extractAmount(amountStr, currency) {
        try {
            return parseFloat(amountStr.replace(currency, '').replace(',', ''));
        } catch {
            return 0;
        }
    }

    function extractTime(timeStr) {
        return timeStr || 'Unknown';
    }

    function isValidOrder(order) {
        return (
            order &&
            order.orderAmount > 0 &&
            order.serviceType !== 'Unknown' &&
            !order.serviceType.includes('1688')
        );
    }

    function addOrdersToTable(orders) {
        const orderTable = document.getElementById('orderTable')?.querySelector('tbody');
        if (!orderTable) {
            console.error('Order table not found');
            return;
        }

        orders.forEach(order => {
            const newRow = document.createElement('tr');
            newRow.innerHTML = `
                <td>${order.serviceType}</td>
                <td>${order.orderAmount.toFixed(2)} CNY</td>
                <td>
                    Account: ${order.accountType}<br>
                    Customer: ${order.customerName}<br>
                    Ref: ${order.referenceNumber}
                </td>
                <td class="best-supplier">Calculating...</td>
            `;
            orderTable.appendChild(newRow);
        });
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

            showNotification('Processing image...', 'info');
            const orders = await processOrderImage(file);

            if (orders.length > 0) {
                addOrdersToTable(orders);
                showNotification(`Successfully processed ${orders.length} orders`, 'success');
                fileInput.value = ''; // Clear the file input
            } else {
                showNotification('No valid orders found in image', 'error');
            }
        });
    }
});

// Notification helper (make sure this matches your existing notification style)
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
