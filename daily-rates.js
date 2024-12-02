// Daily Rate Section

document.addEventListener('DOMContentLoaded', function () {
    function updateDailyRateSection() {
        const dailyRateSection = document.getElementById('daily-rate-section');
        if (!dailyRateSection) {
            console.error('Daily rate section element not found.');
            return;
        }

        dailyRateSection.innerHTML = '';

        if (suppliers.length === 0) {
            const noSuppliersMessage = document.createElement('p');
            noSuppliersMessage.textContent = 'No suppliers available to display daily rates.';
            noSuppliersMessage.style.color = '#555';
            noSuppliersMessage.style.fontStyle = 'italic';
            dailyRateSection.appendChild(noSuppliersMessage);
            return;
        }

        suppliers.forEach(supplier => {
            const supplierHeader = document.createElement('h4');
            supplierHeader.textContent = `Supplier: ${supplier.name}`;
            dailyRateSection.appendChild(supplierHeader);

            supplier.services.forEach(service => {
                const serviceHeader = document.createElement('h5');
                serviceHeader.textContent = `Service: ${service.serviceType.replace(/-/g, ' ')}`;
                dailyRateSection.appendChild(serviceHeader);

                service.amountLimits.forEach(limit => {
                    const rateRow = document.createElement('div');
                    rateRow.classList.add('form-row');
                    rateRow.innerHTML = `
                        <label>Amount Limit: ${limit.limit} - Rate:</label>
                        <input 
                            type="number" 
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
    }

    function saveDailyRates() {
        const rateInputs = document.querySelectorAll('#daily-rate-section input');
        if (rateInputs.length === 0) {
            console.warn('No daily rates to save.');
            return;
        }

        rateInputs.forEach(input => {
            const supplierName = input.getAttribute('data-supplier');
            const serviceType = input.getAttribute('data-service');
            const limit = input.getAttribute('data-limit');
            const rate = parseFloat(input.value);

            const supplier = suppliers.find(s => s.name === supplierName);
            if (supplier) {
                const service = supplier.services.find(s => s.serviceType === serviceType);
                if (service) {
                    const amountLimit = service.amountLimits.find(a => a.limit === limit);
                    if (amountLimit) {
                        amountLimit.rate = isNaN(rate) ? null : rate;
                    }
                }
            }
        });

        localStorage.setItem('suppliers', JSON.stringify(suppliers));
        console.log('Daily rates saved successfully.');
    }

    // Load suppliers from localStorage if available
    const storedSuppliers = localStorage.getItem('suppliers');
    if (storedSuppliers) {
        suppliers = JSON.parse(storedSuppliers);
    }

    // Update daily rate section on load
    updateDailyRateSection();

    // Add event listener to save rates when necessary
    document.getElementById('daily-rate-section')?.addEventListener('input', () => {
        saveDailyRates();
    });

    // Ensure daily rate section is updated when suppliers are modified
    window.addEventListener('suppliersUpdated', function() {
        updateDailyRateSection();
    });

    // Function to refresh daily rates (if needed)
    function refreshDailyRates() {
        updateDailyRateSection();
        console.log('Daily rates refreshed.');
    }

    // Expose the refresh function globally if needed
    window.refreshDailyRates = refreshDailyRates;
});
