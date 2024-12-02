document.addEventListener('DOMContentLoaded', function() {
    const toggleManagementBtn = document.getElementById('toggleManagementBtn');
    const supplierManagementSection = document.getElementById('supplierManagementSection');

    if (toggleManagementBtn && supplierManagementSection) {
        toggleManagementBtn.addEventListener('click', function() {
            supplierManagementSection.classList.toggle('hidden');
            this.textContent = supplierManagementSection.classList.contains('hidden') 
                ? 'Show Supplier Management' 
                : 'Hide Supplier Management';
        });
    }
});
