// Calculator.js
document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('calculateBestSupplierBtn').addEventListener('click', function () {
        const rows = document.querySelectorAll('#orderTable tbody tr');
        const suppliers = window.suppliersState.data;
        const savedRates = JSON.parse(localStorage.getItem('dailyRates')) || {};

        console.log('=== Starting Calculation ===');
        console.log('Available Suppliers:', suppliers);
        console.log('Saved Daily Rates:', savedRates);

        if (rows.length === 0) {
            showNotification('No orders to process.', 'error');
            return;
        }

        if (!suppliers || suppliers.length === 0) {
            showNotification('No suppliers available.', 'error');
            return;
        }

        let totalMatchesFound = 0;

        rows.forEach((row, index) => {
            // Extract order details
            const serviceType = row.cells[0].textContent.trim().toLowerCase().replace(/\s/g, '-');
            const orderAmount = parseFloat(row.cells[1].textContent.trim());
            const additionalInfoText = row.cells[2].textContent.trim();

            console.log(`\n=== Processing Order ${index + 1} ===`);
            console.log('Service Type:', serviceType);
            console.log('Order Amount:', orderAmount);
            console.log('Additional Info Text:', additionalInfoText);

            // Parse additional info
            const additionalInfo = {};
            additionalInfoText.split(',').forEach(info => {
                const [key, value] = info.split(':').map(s => s.trim());
                if (key && value) {
                    additionalInfo[key.toLowerCase()] = value.toLowerCase();
                }
            });
            console.log('Parsed Additional Info:', additionalInfo);

            let bestSupplier = null;
            let lowestTotalCost = Infinity;
            let matchFound = false;

            // Check each active supplier
            suppliers.filter(supplier => supplier.isActive).forEach(supplier => {
                console.log(`\nChecking Supplier: ${supplier.name}`);
                
                // 1. Service Type Check
                const service = supplier.services.find(s => {
                    const matches = s.serviceType.toLowerCase() === serviceType;
                    console.log(`Service type check: ${s.serviceType} vs ${serviceType} = ${matches}`);
                    return matches;
                });

                if (!service) {
                    console.log('❌ Service type not matched');
                    return;
                }
                console.log('✓ Service type matched');

                // 2. Amount Limit Check
                const amountLimit = service.amountLimits.find(a => {
                    if (!a || !a.limit) {
                        console.log('Invalid amount limit definition');
                        return false;
                    }
                    const [min, max] = a.limit.split('-').map(num => parseFloat(num.trim()));
                    const withinLimit = orderAmount >= min && orderAmount <= max;
                    console.log(`Amount limit check: ${orderAmount} in range ${min}-${max} = ${withinLimit}`);
                    return withinLimit;
                });

                if (!amountLimit) {
                    console.log('❌ Amount not within limits');
                    return;
                }
                console.log('✓ Amount within limits');

                // 3. Additional Questions Check
                console.log('Checking additional questions:');
                const matchesQuestions = service.additionalQuestions.every(question => {
                    const questionKey = question.label.toLowerCase();
                    const expectedValue = question.value.toLowerCase();
                    const orderValue = additionalInfo[questionKey];
                    console.log(`Question: ${questionKey}`);
                    console.log(`Expected: ${expectedValue}`);
                    console.log(`Received: ${orderValue}`);
                    return orderValue === expectedValue;
                });

                if (!matchesQuestions) {
                    console.log('❌ Additional questions do not match');
                    return;
                }
                console.log('✓ Additional questions matched');

                // 4. Daily Rate Check
                const rateKey = `${supplier.name}-${service.serviceType}-${amountLimit.limit}`;
                const dailyRate = parseFloat(savedRates[rateKey]);
                
                console.log('Daily rate key:', rateKey);
                console.log('Daily rate found:', dailyRate);

                if (!dailyRate || dailyRate <= 0) {
                    console.log('❌ Invalid or missing daily rate');
                    return;
                }
                console.log('✓ Valid daily rate found');

                // 5. Calculate Total Cost
                const serviceCharge = calculateServiceCharge(orderAmount, service.serviceCharges);
                const totalCost = (orderAmount + serviceCharge) / dailyRate;

                console.log('Service Charge:', serviceCharge);
                console.log('Total Cost:', totalCost);

                // Update best supplier if this one has lower cost
                if (totalCost < lowestTotalCost) {
                    lowestTotalCost = totalCost;
                    bestSupplier = supplier.name;
                    matchFound = true;
                    console.log('✓ New best supplier found!');
                }
            });

            if (matchFound) totalMatchesFound++;

            // Update the best supplier cell in the table
            const bestSupplierCell = row.querySelector('.best-supplier');
            if (bestSupplierCell) {
                if (bestSupplier) {
                    bestSupplierCell.textContent = bestSupplier;
                    bestSupplierCell.style.color = '#28a745';
                } else {
                    bestSupplierCell.textContent = 'No suitable supplier found';
                    bestSupplierCell.style.color = '#dc3545';
                }
            }
        });

        // Show final result notification
        if (totalMatchesFound === 0) {
            showNotification('No suitable suppliers found. Check supplier settings and daily rates.', 'error');
        } else {
            showNotification(`Found matching suppliers for ${totalMatchesFound} order(s).`, 'success');
        }
    });

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
