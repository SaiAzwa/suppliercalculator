// Calculator.js
document.addEventListener('DOMContentLoaded', function () {
    // Best Supplier Calculation Functionality
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

        if (rows.length === 0) {
            showNotification('No orders to process.', 'error');
            return;
        }

        if (!suppliers || suppliers.length === 0) {
            showNotification('No suppliers available.', 'error');
            return;
        }

        rows.forEach((row, index) => {
            const serviceType = row.cells[0].textContent.trim().toLowerCase().replace(/\s/g, '-');
            const orderAmount = parseFloat(row.cells[1].textContent.trim());
            const additionalInfoText = row.cells[2].textContent.trim();
            let bestSupplier = null;
            let lowestTotalCost = Infinity;

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

                // Calculate total cost
                const serviceCharge = calculateServiceCharge(orderAmount, service.serviceCharges);
                const totalCost = (orderAmount + serviceCharge) / dailyRate;

                console.log('- Service Charge:', serviceCharge);
                console.log('- Total Cost:', totalCost);

                // Update best supplier if this one has lower cost
                if (totalCost < lowestTotalCost) {
                    lowestTotalCost = totalCost;
                    bestSupplier = supplier.name;
                    console.log('- New best supplier!');
                }
            });

            // Update the best supplier cell in the table
            const bestSupplierCell = row.querySelector('.best-supplier');
            if (bestSupplierCell) {
                bestSupplierCell.textContent = bestSupplier || 'No suitable supplier found';
            }
        });

        showNotification('Best supplier calculation completed.', 'success');
    });

    // Utility Functions
    function calculateServiceCharge(orderAmount, serviceCharges) {
        let totalServiceCharge = 0;

        serviceCharges.forEach(charge => {
            const condition = charge.condition;
            const chargeAmount = parseFloat(charge.charge.replace(/[^0-9.]/g, ''));
            if (evaluateCondition(condition, orderAmount)) {
                totalServiceCharge += chargeAmount;
            }
        });

        return totalServiceCharge;
    }

    function evaluateCondition(condition, amount) {
        try {
            if (!condition) return false;
            condition = condition.toLowerCase().trim();

            const match = condition.match(/([<>]=?)\s*([\d,]+)\s*cny/i);
            if (!match) return false;

            const operator = match[1];
            const value = parseFloat(match[2].replace(/,/g, ''));

            switch (operator) {
                case '>':
                    return amount > value;
                case '<':
                    return amount < value;
                case '>=':
                    return amount >= value;
                case '<=':
                    return amount <= value;
                default:
                    return false;
            }
        } catch (error) {
            console.error(`Error evaluating condition: ${condition}`, error);
            return false;
        }
    }

    // Helper function to show notifications
    function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
});
