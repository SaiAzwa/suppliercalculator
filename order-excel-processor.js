document.addEventListener('DOMContentLoaded', function () {
    const processExcelBtn = document.getElementById('process-excel-btn');
    if (processExcelBtn) {
        processExcelBtn.addEventListener('click', async function () {
            const fileInput = document.getElementById('order-excel');
            const file = fileInput?.files[0];

            if (!file) {
                window.sharedUtils.showNotification('Please select an Excel file first', 'error');
                return;
            }

            try {
                const orders = await processExcelFile(file);
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
                    document.getElementById('order-excel').value = '';
                } else {
                    window.sharedUtils.showNotification('No valid orders found in Excel file', 'error');
                }
            } catch (error) {
                window.sharedUtils.showNotification('Error processing Excel file', 'error');
                console.error(error);
            }
        });
    }

    async function processExcelFile(file) {
        // Ensure XLSX is loaded
        if (typeof XLSX === 'undefined') {
            throw new Error('XLSX library is not loaded.');
        }

        const reader = new FileReader();
        return new Promise((resolve, reject) => {
            reader.onload = function (e) {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    let orders = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

                    // Normalize column headers: trim and convert to lowercase
                    const normalizedOrders = orders.map(row => {
                        const normalizedRow = {};
                        Object.keys(row).forEach(key => {
                            const normalizedKey = key.trim().toLowerCase();
                            normalizedRow[normalizedKey] = row[key];
                        });
                        return normalizedRow;
                    });

                    console.log('Normalized Orders:', normalizedOrders); // Debugging

                    // Map Excel data to order structure
                    const processedOrders = normalizedOrders.map(row => ({
                        serviceType: row['service type']?.toString().trim(),
                        orderAmount: parseOrderAmount(row['order amount']),
                        referenceNumber: row['reference number']?.toString().trim(),
                        markingNumber: row['marking number']?.toString().trim(),
                        additionalQuestions: [], // Add if needed
                        requiresAdditionalQuestions: false
                    })).filter(order => isValidOrder(order));

                    console.log('Processed Orders:', processedOrders); // Debugging

                    resolve(processedOrders);
                } catch (error) {
                    console.error('Error parsing Excel file:', error);
                    reject(error);
                }
            };
            reader.onerror = function (error) {
                console.error('FileReader error:', error);
                reject(error);
            };
            reader.readAsArrayBuffer(file);
        });
    }

    function parseOrderAmount(amountStr) {
        if (typeof amountStr !== 'string') return 0;
        // Remove currency prefix and commas
        const cleanedStr = amountStr.replace(/[A-Za-z\s,]/g, '');
        const amount = parseFloat(cleanedStr);
        return isNaN(amount) ? 0 : amount;
    }

    function isValidOrder(order) {
        const errors = [];

        if (!order.serviceType) {
            errors.push('Service Type is missing.');
        }

        if (!order.orderAmount || order.orderAmount <= 0) {
            errors.push('Order Amount is invalid.');
        }

        if (!order.referenceNumber) {
            errors.push('Reference Number is missing.');
        }

        if (!order.markingNumber) {
            errors.push('Marking Number is missing.');
        }

        if (errors.length > 0) {
            console.error('Invalid order:', order, 'Errors:', errors);
            return false;
        }

        // Additional validation if needed
        return true;
    }
});
