// Daily Rates Management
class DailyRatesManager {
    constructor() {
        // Initialize DOM elements
        this.dailyRateSection = document.getElementById('daily-rate-section');
        this.dailyRatesBtn = document.getElementById('DailyRatesBtn');
        this.dailyRateContainer = document.getElementById('dailyratesection');
        
        // Initialize event listeners
        if (this.dailyRatesBtn) {
            this.dailyRatesBtn.addEventListener('click', () => this.handleDailyRatesBtnClick());
        }

        // Listen for supplier updates
        window.addEventListener('suppliersUpdated', () => this.updateDailyRateSection());

        // Load initial rates
        this.loadRatesFromLocalStorage();
    }

    handleDailyRatesBtnClick() {
        if (this.dailyRateContainer.classList.contains('hidden')) {
            this.dailyRateContainer.classList.remove('hidden');
            this.updateDailyRateSection();
        } else {
            this.dailyRateContainer.classList.add('hidden');
        }
    }

    loadRatesFromLocalStorage() {
        try {
            const savedRates = JSON.parse(localStorage.getItem('dailyRates')) || {};
            const suppliers = window.suppliersState?.data || [];

            suppliers.forEach(supplier => {
                if (!supplier?.services) return;

                supplier.services.forEach(service => {
                    if (!service?.amountLimits) return;

                    service.amountLimits.forEach(limit => {
                        if (!limit) return;

                        const key = `${supplier.name}-${service.serviceType}-${limit.limit}`;
                        if (savedRates[key]) {
                            limit.rate = parseFloat(savedRates[key]);
                        }
                    });
                });
            });
        } catch (error) {
            console.error('Error loading rates:', error);
            this.showNotification('Error loading saved rates', 'error');
        }
    }

    saveDailyRates() {
        try {
            const rateInputs = document.querySelectorAll('#daily-rate-section input[type="number"]');
            const savedRates = {};
            let hasValidRates = false;

            rateInputs.forEach(input => {
                const rate = input.value.trim();
                if (rate) {
                    const key = `${input.dataset.supplier}-${input.dataset.service}-${input.dataset.limit}`;
                    savedRates[key] = parseFloat(rate);
                    hasValidRates = true;
                }
            });

            if (hasValidRates) {
                localStorage.setItem('dailyRates', JSON.stringify(savedRates));
                this.showNotification('Daily rates saved successfully', 'success');
            } else {
                this.showNotification('No valid rates to save', 'error');
            }
        } catch (error) {
            console.error('Error saving rates:', error);
            this.showNotification('Error saving rates', 'error');
        }
    }

    clearRates() {
        try {
            // Clear localStorage
            localStorage.removeItem('dailyRates');

            // Clear all input values
            const rateInputs = document.querySelectorAll('#daily-rate-section input[type="number"]');
            rateInputs.forEach(input => {
                input.value = '';
            });

            // Clear rates in suppliersState
            if (window.suppliersState?.data) {
                window.suppliersState.data.forEach(supplier => {
                    if (!supplier?.services) return;
                    supplier.services.forEach(service => {
                        if (!service?.amountLimits) return;
                        service.amountLimits.forEach(limit => {
                            if (limit) limit.rate = null;
                        });
                    });
                });
            }

            this.showNotification('Daily rates cleared successfully', 'success');
        } catch (error) {
            console.error('Error clearing rates:', error);
            this.showNotification('Error clearing rates', 'error');
        }
    }

    updateDailyRateSection() {
        if (!this.dailyRateSection) return;
        
        this.dailyRateSection.innerHTML = '';
        const suppliers = window.suppliersState?.data || [];

        if (suppliers.length === 0) {
            this.dailyRateSection.innerHTML = '<p>No suppliers available to display daily rates.</p>';
            return;
        }

        // Group rates by service type
        const ratesByService = {};

        suppliers.forEach(supplier => {
            if (!supplier?.services) return;

            supplier.services.forEach(service => {
                if (!service?.serviceType || !Array.isArray(service.amountLimits)) return;

                const serviceType = service.serviceType;
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

        // Create tables for each service type
        Object.entries(ratesByService).forEach(([serviceType, rates]) => {
            const section = document.createElement('div');
            section.className = 'service-section';

            // Service type heading
            const heading = document.createElement('h3');
            heading.textContent = `Service: ${serviceType.replace(/-/g, ' ')}`;
            section.appendChild(heading);

            // Create table
            const table = document.createElement('table');
            table.className = 'rate-table';

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
                const tr = document.createElement('tr');
                tr.innerHTML = `
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
                tbody.appendChild(tr);
            });
            table.appendChild(tbody);
            section.appendChild(table);
            this.dailyRateSection.appendChild(section);
        });

        // Add control buttons
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'button-container';
        buttonContainer.style.marginTop = '20px';

        const saveButton = document.createElement('button');
        saveButton.className = 'btn';
        saveButton.textContent = 'Save Rates';
        saveButton.addEventListener('click', () => this.saveDailyRates());

        const clearButton = document.createElement('button');
        clearButton.className = 'btn';
        clearButton.textContent = 'Clear Rates';
        clearButton.style.marginLeft = '10px';
        clearButton.addEventListener('click', () => this.clearRates());

        buttonContainer.appendChild(saveButton);
        buttonContainer.appendChild(clearButton);
        this.dailyRateSection.appendChild(buttonContainer);
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dailyRatesManager = new DailyRatesManager();
});
