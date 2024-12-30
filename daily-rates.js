document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM fully loaded'); // Debugging log

    // Check if suppliers state exists
    if (!window.suppliersState) {
        console.error('Suppliers state not initialized');
        return;
    }

    const suppliers = window.suppliersState;

    // Function to show notifications
    function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.position = 'fixed';
        notification.style.bottom = '20px';
        notification.style.right = '20px';
        notification.style.padding = '10px 20px';
        notification.style.borderRadius = '4px';
        notification.style.color = '#fff';
        notification.style.backgroundColor = type === 'success' ? '#28a745' : '#dc3545';
        notification.style.zIndex = '1000';
        notification.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
        document.body.appendChild(notification);

        // Remove the notification after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Function to load rates from localStorage
    function loadRatesFromLocalStorage() {
        console.log('Loading rates from localStorage'); // Debugging log
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
        console.log('Saving rates to localStorage'); // Debugging log
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
        console.log('Clearing rates'); // Debugging log
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

    // Function to update the daily rate section in the UI
    function updateDailyRateSection() {
        console.log('Updating daily rate section'); // Debugging log
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

        // Group rates by service type
        const ratesByService = {};

        suppliers.data.forEach(supplier => {
            if (!supplier || !supplier.services) return;

            supplier.services.forEach(service => {
                if (!service || !service.serviceType || !Array.isArray(service.amountLimits)) return;

                const serviceType = service.serviceType.replace(/-/g, ' ');
                if (!ratesByService[serviceType]) {
                    ratesByService[serviceType] = [];
                }

                service.amountLimits.forEach(limit => {
                    if (!limit) return;
                    ratesByService[serviceType].push({
                        supplier: supplier.name,
                        limit: limit.limit,
                        rate: limit.rate
                    });
                });
            });
        });

        // Create a table for each service type
        for (const [serviceType, rates] of Object.entries(ratesByService)) {
            // Add a heading for the service type
            const serviceHeading = document.createElement('h3');
            serviceHeading.textContent = `Service: ${serviceType}`;
            dailyRateSection.appendChild(serviceHeading);

            // Create the table
            const table = document.createElement('table');
            table.classList.add('rate-table');

            // Table header
            const thead = document.createElement('thead');
            thead.innerHTML = `
                <tr>
                    <th>Supplier</th>
                    <th>Amount Limit</th>
                    <th>Rate</th>
                </tr>
            `;
            table.appendChild(thead);

            // Table body
            const tbody = document.createElement('tbody');
            rates.forEach(rate => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${rate.supplier}</td>
                    <td>${rate.limit || 'N/A'}</td>
                    <td>
                        <input 
                            type="number" 
                            step="0.01"
                            min="0"
                            placeholder="Enter daily rate" 
                            value="${rate.rate || ''}" 
                            data-supplier="${rate.supplier}" 
                            data-service="${serviceType}" 
                            data-limit="${rate.limit}"
                        >
                    </td>
                `;
                tbody.appendChild(row);
            });
            table.appendChild(tbody);

            // Add the table to the daily rate section
            dailyRateSection.appendChild(table);
        }

        // Add Save and Clear buttons
        const buttonContainer = document.createElement('div');
        buttonContainer.style.marginTop = '20px';

        const saveButton = document.createElement('button');
        saveButton.textContent = 'Save Rates';
        saveButton.style.marginRight = '10px';
        saveButton.style.backgroundColor = '#007bff';
        saveButton.style.color = '#fff';
        saveButton.style.border = 'none';
        saveButton.style.padding = '8px 12px';
        saveButton.style.borderRadius = '4px';
        saveButton.style.cursor = 'pointer';
        saveButton.addEventListener('click', saveDailyRates);

        const clearButton = document.createElement('button');
        clearButton.textContent = 'Clear Rates';
        clearButton.style.backgroundColor = '#dc3545';
        clearButton.style.color = '#fff';
        clearButton.style.border = 'none';
        clearButton.style.padding = '8px 12px';
        clearButton.style.borderRadius = '4px';
        clearButton.style.cursor = 'pointer';
        clearButton.addEventListener('click', clearRates);

        buttonContainer.appendChild(saveButton);
        buttonContainer.appendChild(clearButton);
        dailyRateSection.appendChild(buttonContainer);
    }

    // Function to save daily rates
    function saveDailyRates() {
        console.log('Saving daily rates'); // Debugging log
        const rateInputs = document.querySelectorAll('#daily-rate-section input');
        if (!rateInputs || rateInputs.length === 0) {
            console.warn('No daily rates to save.');
            showNotification('No changes to save', 'error');
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
        } else {
            showNotification('No changes to save', 'error');
        }
    }

    // Load rates from localStorage on page load
    loadRatesFromLocalStorage();

    // Add event listener to the "Update Daily Rates" button for toggle functionality
    const dailyRatesBtn = document.getElementById('DailyRatesBtn');
    const dailyRateContainer = document.getElementById('dailyratesection');

    if (dailyRatesBtn && dailyRateContainer) {
        console.log('Button and container found'); // Debugging log
        // Toggle visibility when the button is clicked
        dailyRatesBtn.addEventListener('click', function () {
            console.log('Button clicked'); // Debugging log
            if (dailyRateContainer.classList.contains('hidden')) {
                dailyRateContainer.classList.remove('hidden');
                updateDailyRateSection(); // Update the content when shown
            } else {
                dailyRateContainer.classList.add('hidden');
            }
        });
    }

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
