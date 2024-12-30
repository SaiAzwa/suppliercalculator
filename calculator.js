// Set a similarity threshold (e.g., 0.8 means 80% similarity)
const SIMILARITY_THRESHOLD = 0.8;

// List of irrelevant additional info keys to ignore
const IRRELEVANT_KEYS = ['referencenumber', 'markingnumber'];

// Normalize strings by removing special characters, spaces, and converting to lowercase
function normalizeString(str) {
    if (!str || typeof str !== 'string') return '';
    return str.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

// Filter out irrelevant additional info
function filterAdditionalInfo(additionalInfo) {
    const filteredInfo = {};
    for (const [key, value] of Object.entries(additionalInfo)) {
        if (!IRRELEVANT_KEYS.includes(key)) {
            filteredInfo[key] = value;
        }
    }
    return filteredInfo;
}

// Check if the amount falls within the specified limit
function checkAmountLimit(amount, limitStr) {
    if (typeof amount !== 'number' || isNaN(amount)) {
        console.error('Invalid amount:', amount);
        return false;
    }

    if (!limitStr || typeof limitStr !== 'string') {
        console.error('Invalid limit string:', limitStr);
        return false;
    }

    if (limitStr.includes('>')) {
        const minValue = parseFloat(limitStr.replace('>', '').trim());
        return amount > minValue;
    }

    if (limitStr.includes('-')) {
        const [min, max] = limitStr.split('-').map(num => parseFloat(num.trim()));
        return amount >= min && amount <= max;
    }

    return false;
}

// Debug supplier matching process
function debugSupplierMatching(order, supplier) {
    console.log('\n=== Debug Info ===');
    console.log('Order:', {
        serviceType: order.serviceType,
        normalizedServiceType: normalizeString(order.serviceType),
        amount: order.amount,
        additionalInfo: order.additionalInfo
    });

    console.log('Supplier:', {
        name: supplier.name,
        isActive: supplier.isActive,
        services: supplier.services.map(s => ({
            serviceType: s.serviceType,
            normalizedServiceType: normalizeString(s.serviceType),
            amountLimits: s.amountLimits,
            additionalQuestions: s.additionalQuestions
        }))
    });

    // Check service type match using fuzzy matching
    const serviceMatch = supplier.services.find(s => {
        const similarity = stringSimilarity.compareTwoStrings(
            normalizeString(order.serviceType),
            normalizeString(s.serviceType)
        );
        console.log('Comparing service types:', {
            supplierService: s.serviceType,
            orderService: order.serviceType,
            similarity: similarity
        });
        return similarity >= SIMILARITY_THRESHOLD;
    });

    if (!serviceMatch) {
        console.log('❌ Service type not matched');
        return { serviceTypeMatch: false };
    }
    console.log('✓ Service type matched');

    // Check amount limits
    const amountLimit = serviceMatch.amountLimits.find(a => {
        if (!a?.limit) return false;
        return checkAmountLimit(order.amount, a.limit);
    });

    if (!amountLimit) {
        console.log('❌ Amount limit not matched');
        console.log('Amount:', order.amount);
        console.log('Available limits:', serviceMatch.amountLimits.map(a => a.limit));
        return { serviceTypeMatch: true, amountLimitMatch: false };
    }
    console.log('✓ Amount limit matched:', amountLimit.limit);

    // Check additional questions
    const additionalQuestionsMatch = serviceMatch.additionalQuestions.every(q => {
        const normalizedQuestionLabel = normalizeString(q.label);
        const orderValue = order.additionalInfo[normalizedQuestionLabel];
        console.log(`Question: ${q.label} (Normalized: ${normalizedQuestionLabel})`);
        console.log(`Expected: ${q.value}`);
        console.log(`Got: ${orderValue}`);
        return orderValue?.toLowerCase() === q.value.toLowerCase();
    });

    if (!additionalQuestionsMatch) {
        console.log('❌ Additional questions not matched');
        return {
            serviceTypeMatch: true,
            amountLimitMatch: true,
            additionalQuestionsMatch: false
        };
    }
    console.log('✓ Additional questions matched');

    // Check daily rate
    const rateKey = `${supplier.name}-${serviceMatch.serviceType}-${amountLimit.limit}`;
    const dailyRate = parseFloat(JSON.parse(localStorage.getItem('dailyRates') || '{}')[rateKey]);
    console.log('Daily Rate Key:', rateKey);
    console.log('Daily Rate:', dailyRate);

    return {
        serviceTypeMatch: true,
        amountLimitMatch: true,
        additionalQuestionsMatch: true,
        hasDailyRate: !isNaN(dailyRate) && dailyRate > 0,
        service: serviceMatch,
        amountLimit,
        dailyRate
    };
}

// Calculate service charges based on conditions
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

// Evaluate conditions for service charges
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

// Show notifications to the user
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Add event listener for calculate button
document.getElementById('calculateBestSupplierBtn').addEventListener('click', function () {
    const rows = document.querySelectorAll('#orderTable tbody tr');
    const suppliers = window.suppliersState.data;
    const savedRates = JSON.parse(localStorage.getItem('dailyRates') || '{}');

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
        const serviceType = row.cells[0].textContent.trim();
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
                additionalInfo[normalizeString(key)] = value.toLowerCase();
            }
        });
        console.log('Parsed Additional Info:', additionalInfo);

        // Filter out irrelevant additional info
        const filteredAdditionalInfo = filterAdditionalInfo(additionalInfo);
        console.log('Filtered Additional Info:', filteredAdditionalInfo);

        let bestSupplier = null;
        let lowestTotalCost = Infinity;
        let matchFound = false;

        // Check each active supplier
        suppliers.filter(supplier => supplier.isActive).forEach(supplier => {
            console.log(`\nChecking Supplier: ${supplier.name}`);

            const matchResults = debugSupplierMatching({
                serviceType,
                amount: orderAmount,
                additionalInfo: filteredAdditionalInfo
            }, supplier);

            if (!matchResults.serviceTypeMatch ||
                !matchResults.amountLimitMatch ||
                !matchResults.additionalQuestionsMatch ||
                !matchResults.hasDailyRate) {
                return;
            }

            // Calculate total cost
            const serviceCharge = calculateServiceCharge(orderAmount, matchResults.service.serviceCharges);
            const totalCost = (orderAmount + serviceCharge) / matchResults.dailyRate;

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
