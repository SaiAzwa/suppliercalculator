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
        // Use a library like SheetJS (xlsx) to parse the Excel file
        const reader = new FileReader();
        return new Promise((resolve, reject) => {
            reader.onload = function (e) {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const orders = XLSX.utils.sheet_to_json(worksheet);

                // Map Excel data to order structure
                const processedOrders = orders.map(row => ({
                    serviceType: row['Service Type'],
                    orderAmount: row['Order Amount'],
                    referenceNumber: row['Reference Number'],
                    markingNumber: row['Marking Number'],
                    additionalQuestions: [], // Add if needed
                    requiresAdditionalQuestions: false
                }));

                resolve(processedOrders);
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }
});
