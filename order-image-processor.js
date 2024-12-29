document.addEventListener('DOMContentLoaded', function () {
    // Ensure window.orderProcessor is initialized
    if (!window.orderProcessor) {
        console.error('window.orderProcessor is not initialized');
        return;
    }

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
                !order.serviceType.includes('VIP')
            );

            await worker.terminate();
            return filteredOrders;
        } catch (error) {
            console.error('Error processing image:', error);
            window.sharedUtils.showNotification('Error processing image', 'error');
            return [];
        } finally {
            hideLoadingIndicator();
        }
    }

    function parseOrderText(text) {
        const lines = text.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);

        return lines.map(line => {
            try {
                // Updated regex to handle variations in the text format
                const regex = /(\d{2}-\w{3}-\d{2})\s+(\d+)\s+(\w+[\s\w]*)\s+MYR\s+([\d,.]+)\s+([\w\s]+)\s+CNY\s+([\d,.]+)\s+(.+)/i;
                const match = line.match(regex);

                if (!match) {
                    console.log('Skipping line - invalid format:', line);
                    return null;
                }

                const order = {
                    date: match[1],
                    referenceNumber: match[2],
                    paymentMethod: match[3].trim(),
                    paymentAmount: extractAmount(match[4], 'MYR'),
                    markingNumber: match[5].trim(),
                    orderAmount: extractAmount(match[6], 'CNY'),
                    serviceType: extractServiceType(match[7]),
                    timeSinceOrder: 'N/A', // Not in the image
                    accountType: 'N/A', // Not in the image
                    additionalQuestions: [], // Will be added manually
                    requiresAdditionalQuestions: true // Mark for manual input
                };

                return isValidOrder(order) ? order : null;
            } catch (error) {
                console.error('Error parsing line:', line, error);
                return null;
            }
        }).filter(order => order !== null);
    }

    function extractServiceType(text) {
        const serviceTypeMap = {
            'BANK TRANSFER (SAVER)': 'Bank Transfer (Saver)',
            'BANK TRANSFER (EXPRESS)': 'Bank Transfer (Express)',
            'ALIPAY TRANSFER': 'Alipay Transfer',
            'ENTERPRISE TO ENTERPRISE': 'Enterprise to Enterprise',
            '1688 PAYMENT': '1688 Payment', // Add if needed
            'VIP': 'VIP' // Add if needed
        };

        for (const [key, value] of Object.entries(serviceTypeMap)) {
            if (text.includes(key)) return value;
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
        if (!order) {
            console.log('Invalid order: Order object is null or undefined');
            return false;
        }

        const hasRequiredFields = (
            order.orderAmount > 0 &&
            order.serviceType &&
            order.referenceNumber &&
            order.markingNumber
        );

        if (!hasRequiredFields) {
            console.log('Invalid order: Missing required fields', {
                orderAmount: order.orderAmount,
                serviceType: order.serviceType,
                referenceNumber: order.referenceNumber,
                markingNumber: order.markingNumber
            });
            return false;
        }

        const isInvalidService = (
            order.serviceType.includes('1688') ||
            order.serviceType.includes('VIP')
        );

        if (isInvalidService) {
            console.log('Invalid order: 1688 or VIP service type', {
                serviceType: order.serviceType
            });
            return false;
        }

        console.log('Valid order:', order);
        return true;
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
            window.sharedUtils.showNotification('Please drop an image file', 'error');
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
        window.sharedUtils.showNotification('Processing image...', 'info');
        const orders = await processOrderImage(file);

        // Ensure window.orderProcessor is initialized
        if (!window.orderProcessor) {
            console.error('window.orderProcessor is not initialized');
            return;
        }

        if (orders.length > 0) {
            window.orderProcessor.processedOrders = [
                ...window.orderProcessor.processedOrders,
                ...orders
            ];
            
            // Notify the table manager about new orders
            if (window.orderProcessor.onOrdersProcessed) {
                window.orderProcessor.onOrdersProcessed(window.orderProcessor.processedOrders);
            }

            window.sharedUtils.showNotification(`Successfully processed ${orders.length} orders`, 'success');
            document.getElementById('order-image').value = '';
        } else {
            window.sharedUtils.showNotification('No valid orders found in image', 'error');
        }
    };

    // Event Listeners
    const processImageBtn = document.getElementById('process-image-btn');
    if (processImageBtn) {
        processImageBtn.addEventListener('click', async () => {
            const fileInput = document.getElementById('order-image');
            const file = fileInput?.files[0];

            if (!file) {
                window.sharedUtils.showNotification('Please select an image file first', 'error');
                return;
            }

            await processFile(file);
        });
    }

    // Initialize drag and drop
    setupDragAndDrop();
});
