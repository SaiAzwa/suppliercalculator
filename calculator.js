// Calculator.js
document.addEventListener('DOMContentLoaded', function () {
    // Best Supplier Calculation Functionality
    document.getElementById('calculateBestSupplierBtn').addEventListener('click', function () {
        const rows = document.querySelectorAll('#orderTable tbody tr');
        const suppliers = window.suppliersState.data;

        console.log('Starting calculation...');
        console.log('All Suppliers:', suppliers);
        console.log('All Orders:', Array.from(rows).map(row => ({
            serviceType: row.cells[0].textContent.trim(),
            amount: parseFloat(row.cells[1].textContent.trim()),
            additionalInfo: row.cells[2].textContent.trim()
        })));

        // Load daily rates from localStorage
        const dailyRates = JSON.parse(localStorage.getItem('dailyRates')) || {};
        console.log('Loaded Daily Rates:', dailyRates);

        if (rows.length === 0) {
            showNotification('No orders to process.', 'error');
            return;
        }

        if (!suppliers || suppliers.length === 0) {
            showNotification('No suppliers available.', 'error');
            return;
        }

        let foundMatchingSupplier = false;

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

            // Filter active suppliers
            const activeSuppliers = suppliers.filter(supplier => supplier.isActive);
            console.log(`Found ${activeSuppliers.length} active suppliers`);

            activeSuppliers.forEach(supplier => {
                console.log(`\nChecking Supplier: ${supplier.name}`);
                
                // Find matching service
                const service = supplier.services.find(s => {
                    const matches = s.serviceType.toLowerCase() === serviceType;
                    console.log(`Checking service ${s.serviceType} against ${serviceType}: ${matches}`);
                    return matches;
                });

                if (!service) {
                    console.log(`- No matching service found for ${serviceType}`);
                    return;
                }
                console.log('- Matching service found');

                // Check amount limits
                const amountLimit = service.amountLimits.find(a => {
                    if (!a || !a.limit) return false;
                    const [min, max] = a.limit.split('-').map(num => parseFloat(num.trim()));
                    const withinLimit = orderAmount >= min && orderAmount <= max;
                    console.log(`Checking amount ${orderAmount} against limit ${a.limit}: ${withinLimit}`);
                    return withinLimit;
                });

                if (!amountLimit) {
                    console.log(`- Amount ${orderAmount} outside limits`);
                    return;
                }
                console.log('- Amount within limits:', amountLimit.limit);

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

                // Get daily rate
                const rateKey = `${supplier.name}-${service.serviceType}-${amountLimit.limit}`;
                const dailyRate = parseFloat(dailyRates[rateKey]);
                
                console.log('- Checking daily rate for key:', rateKey);
                console.log('- Daily rate found:', dailyRate);

                if (!dailyRate || dailyRate <= 0) {
                    console.log('- Invalid daily rate');
                    return;
                }

                // Calculate total cost
                const serviceCharge = calculateServiceCharge(orderAmount, service.serviceCharges);
                const totalCost = (orderAmount + serviceCharge) / dailyRate;

                console.log('- Service Charge:', serviceCharge);
                console.log('- Total Cost:', totalCost);

                // Update best supplier if this one has lower cost
                if (totalCost < lowestTotalCost) {
                    lowestTotalCost = totalCost;
                    bestSupplier = supplier.name;
                    foundMatchingSupplier = true;
                    console.log('- New best supplier!');
                }
            });

            // Update the best supplier cell in the table
            const bestSupplierCell = row.querySelector('.best-supplier');
            if (bestSupplierCell) {
                if (bestSupplier) {
                    bestSupplierCell.textContent = bestSupplier;
                    bestSupplierCell.style.color = '#28a745'; // Green for success
                } else {
                    bestSupplierCell.textContent = 'No suitable supplier found';
                    bestSupplierCell.style.color = '#dc3545'; // Red for no match
                }
            }
        });

        if (!foundMatchingSupplier) {
            showNotification('No suitable suppliers found. Please check daily rates and supplier settings.', 'error');
        } else {
            showNotification('Best supplier calculation completed.', 'success');
        }
    });

    // Utility Functions
    function calculateServiceCharge(orderAmount, serviceCharges) {
        let totalServiceCharge = 0;

        if (!Array.isArray(serviceCharges)) {
            console.warn('Invalid service charges:', serviceCharges);
            return 0;
        }

        serviceCharges.forEach(charge => {
            try {
                const condition = charge.condition;
                const chargeAmount = parseFloat(charge.charge.replace(/[^0-9.]/g, ''));
                if (evaluateCondition(condition, orderAmount)) {
                    totalServiceCharge += chargeAmount;
                }
            } catch (error) {
                console.error('Error calculating service charge:', error);
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
