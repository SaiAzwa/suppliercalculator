// Initialize shared state
window.orderProcessor = {
    processedOrders: [], // Store processed orders
    onOrdersProcessed: null, // Callback for when orders are processed
};

// Declare functions that need to be globally accessible
let processFile;
let showLoadingIndicator;
let hideLoadingIndicator;
let updateLoadingText;
let showNotification;

document.addEventListener('DOMContentLoaded', function() {
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
                const parts = line.match(/\S+/g) || [];
                console.log('Line parts:', parts);
                
                if (parts.length < 10) {
                    console.log('Skipping line - insufficient parts:', line);
                    return null;
                }

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
                    customerName: parts[parts.length - 1]
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
    }

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function highlight(e) {
        document.getElementById('drop-zone')?.classList.add('dragover');
    }

    function unhighlight(e) {
        document.getElementById('drop-zone')?.classList.remove('dragover');
    }

    async function handleDrop(e) {
        const dt = e.dataTransfer;
        const file = dt.files[0];

        if (file && file.type.startsWith('image/')) {
            document.getElementById('order-image').files = dt.files;
            await processFile(file);
        } else {
            showNotification('Please drop an image file', 'error');
        }
    }

    // Define UI Helper functions
    showLoadingIndicator = function(message) {
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'flex';
            updateLoadingText({ status: 'loading', message: message });
        }
    };

    hideLoadingIndicator = function() {
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
    };

    updateLoadingText = function(progress) {
        const loadingText = document.querySelector('.loading-text');
        if (loadingText) {
            if (progress.status === 'loading') {
                loadingText.textContent = progress.message;
            } else if (progress.progress) {
                loadingText.textContent = `Processing image... ${Math.round(progress.progress * 100)}%`;
            }
        }
    };

    // Define process file function
    processFile = async function(file) {
        showNotification('Processing image...', 'info');
        const orders = await processOrderImage(file);

        if (orders.length > 0) {
            window.orderProcessor.processedOrders = [
                ...window.orderProcessor.processedOrders,
                ...orders
            ];
            
            // Notify the table manager about new orders
            if (window.orderProcessor.onOrdersProcessed) {
                window.orderProcessor.onOrdersProcessed(window.orderProcessor.processedOrders);
            }

            showNotification(`Successfully processed ${orders.length} orders`, 'success');
            document.getElementById('order-image').value = '';
        } else {
            showNotification('No valid orders found in image', 'error');
        }
    };

    showNotification = function(message, type = 'info') {
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
    };

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

    // Initialize drag and drop
    setupDragAndDrop();
});

// Expose necessary functions globally
window.orderProcessor.processFile = processFile;
window.orderProcessor.showLoadingIndicator = showLoadingIndicator;
window.orderProcessor.hideLoadingIndicator = hideLoadingIndicator;
window.orderProcessor.showNotification = showNotification;
