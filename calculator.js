// Calculator.js
document.addEventListener('DOMContentLoaded', function () {
    function debugSupplierMatching(order, supplier) {
        console.log('\n=== Debug Info ===');
        console.log('Order:', {
            serviceType: order.serviceType,
            amount: order.amount,
            additionalInfo: order.additionalInfo
        });
        
        console.log('Supplier:', {
            name: supplier.name,
            isActive: supplier.isActive,
            serviceType: supplier.services[0]?.serviceType,
            amountLimits: supplier.services[0]?.amountLimits,
            additionalQuestions: supplier.services[0]?.additionalQuestions
        });

        // Check service type match
        const serviceTypeMatch = supplier.services.some(s => 
            s.serviceType.toLowerCase() === order.serviceType.toLowerCase()
        );
        console.log('Service Type Match:', serviceTypeMatch);

        // Check amount limits
        const amountLimit = supplier.services[0]?.amountLimits.find(a => {
            if (!a?.limit) return false;
            if (a.limit.includes('>')) {
                const minValue = parseFloat(a.limit.replace('>', '').trim());
                return order.amount > minValue;
            }
            const [min, max] = a.limit.split('-').map(num => parseFloat(num.trim()));
            return order.amount >= min && order.amount <= max;
        });
        console.log('Amount Limit:', amountLimit);
        console.log('Amount Limit Match:', !!amountLimit);

        // Check additional questions
        const additionalQuestionsMatch = supplier.services[0]?.additionalQuestions.every(q => {
            const orderValue = order.additionalInfo[q.label.toLowerCase()];
            console.log(`Question: ${q.label}`);
            console.log(`Expected: ${q.value}`);
            console.log(`Got: ${orderValue}`);
            return orderValue?.toLowerCase() === q.value.toLowerCase();
        });
        console.log('Additional Questions Match:', additionalQuestionsMatch);

        // Check daily rate
        const rateKey = `${supplier.name}-${supplier.services[0]?.serviceType}-${amountLimit?.limit}`;
        const dailyRate = parseFloat(JSON.parse(localStorage.getItem('dailyRates') || '{}')[rateKey]);
        console.log('Daily Rate Key:', rateKey);
        console.log('Daily Rate:', dailyRate);

        return {
            serviceTypeMatch,
            amountLimitMatch: !!amountLimit,
            additionalQuestionsMatch,
            hasDailyRate: !isNaN(dailyRate) && dailyRate > 0
        };
    }

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
            const serviceType = row.cells[0].textContent.trim().toLowerCase();
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
                
                const matchResults = debugSupplierMatching({
                    serviceType,
                    amount: orderAmount,
                    additionalInfo
                }, supplier);

                if (!matchResults.serviceTypeMatch) {
                    console.log('❌ Service type mismatch');
                    return;
                }
                console.log('✓ Service type matched');

                if (!matchResults.amountLimitMatch) {
                    console.log('❌ Amount limit mismatch');
                    return;
                }
                console.log('✓ Amount limit matched');

                if (!matchResults.additionalQuestionsMatch) {
                    console.log('❌ Additional questions mismatch');
                    return;
                }
                console.log('✓ Additional questions matched');

                if (!matchResults.hasDailyRate) {
                    console.log('❌ No valid daily rate');
                    return;
                }
                console.log('✓ Valid daily rate found');

                // Find matching service
                const service = supplier.services.find(s => s.serviceType.toLowerCase() === serviceType);
                const amountLimit = service.amountLimits.find(a => {
                    if (a.limit.includes('>')) {
                        const minValue = parseFloat(a.limit.replace('>', '').trim());
                        return orderAmount > minValue;
                    }
                    const [min, max] = a.limit.split('-').map(num => parseFloat(num.trim()));
                    return orderAmount >= min && orderAmount <= max;
                });

                // Get daily rate and calculate cost
                const rateKey = `${supplier.name}-${service.serviceType}-${amountLimit.limit}`;
                const dailyRate = parseFloat(savedRates[rateKey]);
                const serviceCharge = calculateServiceCharge(orderAmount, service.serviceCharges);
                const totalCost = (orderAmount + serviceCharge) / dailyRate;

                console.log('Service Charge:', serviceCharge);
                console.log('Total Cost:', totalCost);

                if (totalCost < lowestTotalCost) {
                    lowestTotalCost = totalCost;
                    bestSupplier = supplier.name;
                    matchFound = true;
                    console.log('✓ New best supplier!');
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
