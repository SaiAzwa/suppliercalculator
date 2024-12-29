document.addEventListener('DOMContentLoaded', function () {
    // Check if suppliers state exists
    if (!window.suppliersState) {
        console.error('Suppliers state not initialized');
        return;
    }

    const suppliers = window.suppliersState;

    // Function to load rates from localStorage
    function loadRatesFromLocalStorage() {
        const savedRates = JSON.parse(localStorage.getItem('dailyRates')) || {};
        suppliers.data.forEach(supplier => {
            if (!supplier || !supplier.services) return;

            supplier.services.forEach(service => {
                if (!service || !service.serviceType || !Array.isArray(service.amountLimits)) return;

                service.amountLimits.forEach(limit => {
                    if (!limit) return;

                    const key = `${supplier.name}-${service.serviceType}-${limit.limit}`;
                    if (savedRates[key]) {
                        limit.rate = savedRates[key];
                    }
                });
            });
        });
    }

    // Function to save rates to localStorage
    function saveRatesToLocalStorage() {
        const savedRates = {};
        suppliers.data.forEach(supplier => {
            if (!supplier || !supplier.services) return;

            supplier.services.forEach(service => {
                if (!service || !service.serviceType || !Array.isArray(service.amountLimits)) return;

                service.amountLimits.forEach(limit => {
                    if (!limit) return;

                    const key = `${supplier.name}-${service.serviceType}-${limit.limit}`;
                    savedRates[key] = limit.rate;
                });
            });
        });
        localStorage.setItem('dailyRates', JSON.stringify(savedRates));
    }

    // Function to clear rates from localStorage and reset inputs
    function clearRates() {
        localStorage.removeItem('dailyRates');
        suppliers.data.forEach(supplier => {
            if (!supplier || !supplier.services) return;

            supplier.services.forEach(service => {
                if (!service || !service.serviceType || !Array.isArray(service.amountLimits)) return;

                service.amountLimits.forEach(limit => {
                    if (!limit) return;
                    limit.rate = null; // Reset the rate to null
                });
            });
        });
        updateDailyRateSection(); // Refresh the UI
        showNotification('Daily rates cleared', 'success');
    }

    function updateDailyRateSection() {
        const dailyRateSection = document.getElementById('daily-rate-section');
        if (!dailyRateSection) {
            console.error('Daily rate section element not found.');
            return;
        }

        dailyRateSection.innerHTML = '';

        if (!Array.isArray(suppliers.data) || suppliers.data.length === 0) {
            const noSuppliersMessage = document.createElement('p');
            noSuppliersMessage.textContent = 'No suppliers available to display daily rates.';
            noSuppliersMessage.style.color = '#555';
            noSuppliersMessage.style.fontStyle = 'italic';
            dailyRateSection.appendChild(noSuppliersMessage);
            return;
        }

        suppliers.data.forEach(supplier => {
            if (!supplier || !supplier.services) return;

            const supplierHeader = document.createElement('h4');
            supplierHeader.textContent = `Supplier: ${supplier.name || 'Unknown'}`;
            dailyRateSection.appendChild(supplierHeader);

            supplier.services.forEach(service => {
                if (!service || !service.serviceType || !Array.isArray(service.amountLimits)) return;

                const serviceHeader = document.createElement('h5');
                serviceHeader.textContent = `Service: ${service.serviceType.replace(/-/g, ' ')}`;
                dailyRateSection.appendChild(serviceHeader);

                service.amountLimits.forEach(limit => {
                    if (!limit) return;

                    const rateRow = document.createElement('div');
                    rateRow.classList.add('form-row');
                    rateRow.innerHTML = `
                        <label>Amount Limit: ${limit.limit || 'N/A'} - Rate:</label>
                        <input 
                            type="number" 
                            step="0.01"
                            min="0"
                            placeholder="Enter daily rate" 
                            value="${limit.rate || ''}" 
                            data-supplier="${supplier.name}" 
                            data-service="${service.serviceType}" 
                            data-limit="${limit.limit}"
                        >
                    `;
                    dailyRateSection.appendChild(rateRow);
                });
            });
        });

        // Add Save and Clear buttons
        const buttonContainer = document.createElement('div');
        buttonContainer.style.marginTop = '20px';

        const saveButton = document.createElement('button');
        saveButton.textContent = 'Save Rates';
        saveButton.style.marginRight = '10px';
        saveButton.addEventListener('click', saveDailyRates);

        const clearButton = document.createElement('button');
        clearButton.textContent = 'Clear Rates';
        clearButton.addEventListener('click', clearRates);

        buttonContainer.appendChild(saveButton);
        buttonContainer.appendChild(clearButton);
        dailyRateSection.appendChild(buttonContainer);
    }

    function saveDailyRates() {
        const rateInputs = document.querySelectorAll('#daily-rate-section input');
        if (!rateInputs || rateInputs.length === 0) {
            console.warn('No daily rates to save.');
            return;
        }

        let hasChanges = false;

        rateInputs.forEach(input => {
            const supplierName = input.getAttribute('data-supplier');
            const serviceType = input.getAttribute('data-service');
            const limit = input.getAttribute('data-limit');
            const rate = parseFloat(input.value);

            if (!supplierName || !serviceType || !limit) return;

            const supplier = suppliers.data.find(s => s && s.name === supplierName);
            if (supplier) {
                const service = supplier.services.find(s => s && s.serviceType === serviceType);
                if (service) {
                    const amountLimit = service.amountLimits.find(a => a && a.limit === limit);
                    if (amountLimit) {
                        const newRate = isNaN(rate) ? null : rate;
                        if (amountLimit.rate !== newRate) {
                            amountLimit.rate = newRate;
                            hasChanges = true;
                        }
                    }
                }
            }
        });

        if (hasChanges) {
            try {
                saveRatesToLocalStorage();
                showNotification('Daily rates saved successfully', 'success');
            } catch (error) {
                console.error('Error saving daily rates:', error);
                showNotification('Failed to save daily rates', 'error');
            }
        }
    }

    // Load rates from localStorage on page load
    loadRatesFromLocalStorage();

    // Update daily rate section on load
    updateDailyRateSection();

    // Listen for supplier updates
    window.addEventListener('suppliersUpdated', function() {
        updateDailyRateSection();
    });

    // Function to refresh daily rates (if needed)
    function refreshDailyRates() {
        updateDailyRateSection();
        showNotification('Daily rates refreshed', 'success');
    }

    // Expose necessary functions globally
    window.refreshDailyRates = refreshDailyRates;
    window.updateDailyRateSection = updateDailyRateSection;
});
