document.addEventListener('DOMContentLoaded', function () {
    const page1 = document.getElementById('page1');
    const imageInput = document.getElementById('imageInput');
    const excelInput = document.getElementById('excelInput');
    const manualInput = document.getElementById('manualInput');

    // Show Image Input
    document.getElementById('imageBtn').addEventListener('click', function () {
        page1.style.display = 'none';
        imageInput.style.display = 'block';
        excelInput.style.display = 'none';
        manualInput.style.display = 'none';
    });

    // Show Excel Input
    document.getElementById('excelBtn').addEventListener('click', function () {
        page1.style.display = 'none';
        excelInput.style.display = 'block';
        imageInput.style.display = 'none';
        manualInput.style.display = 'none';
    });

    // Show Manual Input
    document.getElementById('manualBtn').addEventListener('click', function () {
        page1.style.display = 'none';
        manualInput.style.display = 'block';
        imageInput.style.display = 'none';
        excelInput.style.display = 'none';
    });

    // Handle Manual Form Submission
    document.getElementById('createOrderBtn').addEventListener('click', function () {
        const serviceType = document.getElementById('serviceType').value;
        const orderAmount = parseFloat(document.getElementById('orderAmount').value);

        if (!serviceType || !orderAmount || orderAmount <= 0) {
            window.sharedUtils.showNotification('Please fill out all fields correctly', 'error');
            return;
        }

        const order = {
            serviceType: serviceType,
            orderAmount: orderAmount,
            referenceNumber: '', // Add if needed
            markingNumber: '', // Add if needed
            additionalQuestions: [], // Add if needed
            requiresAdditionalQuestions: false
        };

        // Add the order to the shared state
        window.orderProcessor.processedOrders.push(order);
        window.orderProcessor.onOrdersProcessed(window.orderProcessor.processedOrders);
        window.sharedUtils.showNotification('Manual order added successfully', 'success');
    });

    // Handle Calculate Best Supplier Button
    // document.getElementById('calculateBestSupplierBtn').addEventListener('click', function () {
    //     if (window.orderProcessor.processedOrders.length === 0) {
    //         window.sharedUtils.showNotification('No orders to calculate', 'error');
    //         return;
    //     }

    //     // Call the function to calculate the best supplier
    //     calculateBestSupplier(window.orderProcessor.processedOrders);
    // });

    // // Function to calculate the best supplier (placeholder)
    // function calculateBestSupplier(orders) {
    //     // Add your logic to calculate the best supplier here
    //     window.sharedUtils.showNotification('Best supplier calculated', 'success');
    // }
});
