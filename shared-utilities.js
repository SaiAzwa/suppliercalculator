// Shared utilities for all modules
window.sharedUtils = {
    showNotification: function(message, type = 'info') {
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.className = `notification ${type}`;
        
        Object.assign(notification.style, {
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            backgroundColor: type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#f59e0b',
            color: 'white',
            padding: '15px',
            borderRadius: '8px',
            boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.2)',
            fontSize: '16px',
            zIndex: '1000'
        });

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
};

// Initialize shared state
window.orderProcessor = {
    processedOrders: [], // Store processed orders
    onOrdersProcessed: null // Callback for when orders are processed
};
