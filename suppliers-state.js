// suppliers-state.js - Create this new file
window.suppliersState = {
    data: [],
    load() {
        try {
            const stored = localStorage.getItem('suppliers');
            this.data = stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading suppliers:', error);
            this.data = [];
        }
    },
    save() {
        try {
            localStorage.setItem('suppliers', JSON.stringify(this.data));
        } catch (error) {
            console.error('Error saving suppliers:', error);
        }
    }
};
