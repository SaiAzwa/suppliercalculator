// Add this to the calculateBestSupplierBtn click handler at the start
document.getElementById('calculateBestSupplierBtn').addEventListener('click', function () {
    const rows = document.querySelectorAll('#orderTable tbody tr');
    const suppliers = window.suppliersState.data;

    console.log('All Suppliers:', suppliers);
    console.log('All Orders:', Array.from(rows).map(row => ({
        serviceType: row.cells[0].textContent.trim(),
        amount: parseFloat(row.cells[1].textContent.trim()),
        additionalInfo: row.cells[2].textContent.trim()
    })));

    // Debug daily rates
    const dailyRates = {};
    suppliers.forEach(supplier => {
        supplier.services.forEach(service => {
            const rateInput = document.querySelector(
                `input[data-supplier="${supplier.name}"][data-service="${service.serviceType}"]`
            );
            if (rateInput) {
                dailyRates[`${supplier.name}-${service.serviceType}`] = rateInput.value;
            }
        });
    });
    console.log('Daily Rates:', dailyRates);

    rows.forEach((row, index) => {
        const serviceType = row.cells[0].textContent.trim().toLowerCase().replace(/\s/g, '-');
        const orderAmount = parseFloat(row.cells[1].textContent.trim());
        const additionalInfoText = row.cells[2].textContent.trim();

        console.log(`\nProcessing Order ${index + 1}:`);
        console.log('Service Type:', serviceType);
        console.log('Order Amount:', orderAmount);
        console.log('Additional Info:', additionalInfoText);

        // Parse additional info
        const additionalInfo = {};
        additionalInfoText.split(',').forEach(info => {
            const [key, value] = info.split(':').map(s => s.trim());
            if (key && value) {
                additionalInfo[key.toLowerCase()] = value.toLowerCase();
            }
        });
        console.log('Parsed Additional Info:', additionalInfo);

        suppliers.filter(supplier => supplier.isActive).forEach(supplier => {
            console.log(`\nChecking Supplier: ${supplier.name}`);
            
            // Find matching service
            const service = supplier.services.find(s => s.serviceType.toLowerCase() === serviceType);
            if (!service) {
                console.log(`- No matching service found (${serviceType})`);
                return;
            }
            console.log('- Matching service found');

            // Check amount limits
            const amountLimit = service.amountLimits.find(a => {
                const [min, max] = a.limit.split('-').map(num => parseFloat(num.trim()));
                return orderAmount >= min && orderAmount <= max;
            });
            if (!amountLimit) {
                console.log(`- Amount ${orderAmount} outside limits`);
                return;
            }
            console.log('- Amount within limits');

            // Check additional questions
            const matchesQuestions = service.additionalQuestions.every(question => {
                const questionKey = question.label.toLowerCase();
                const expectedValue = question.value.toLowerCase();
                const orderValue = additionalInfo[questionKey];
                console.log(`- Checking question: ${questionKey}`);
                console.log(`  Expected: ${expectedValue}`);
                console.log(`  Got: ${orderValue}`);
                return orderValue === expectedValue;
            });
            if (!matchesQuestions) {
                console.log('- Additional questions do not match');
                return;
            }
            console.log('- All questions match');

            // Check daily rate
            const dailyRate = parseFloat(dailyRates[`${supplier.name}-${service.serviceType}`]);
            if (!dailyRate || dailyRate <= 0) {
                console.log('- Invalid daily rate');
                return;
            }
            console.log('- Valid daily rate:', dailyRate);
        });
    });
});
