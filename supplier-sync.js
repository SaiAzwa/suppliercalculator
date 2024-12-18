const googleSheetApiUrl = "https://script.google.com/macros/s/AKfycbzXX-_w6WW5eWowyYBkdZJdTo0BRMiw2dtdkhzaNh7OjC0G0vK4yToc2WbbeCgIHucv/exec";

async function fetchSuppliersFromGoogleSheet() {
   try {
       console.log('Starting fetch...');
       const response = await fetch(googleSheetApiUrl);
       console.log('Response received:', response);
       
       if (!response.ok) {
           console.error('Response not OK:', response.status, response.statusText);
           throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
       }
       
       const data = await response.json();
       console.log('Data received:', data);
       
       if (data.status !== "success") {
           console.error('Data status not success:', data);
           throw new Error(data.message || 'Unknown error occurred.');
       }

       const suppliersFromSheet = data.data;
       console.log('Suppliers from sheet:', suppliersFromSheet);
       
       if (!Array.isArray(suppliersFromSheet)) {
           throw new Error('Invalid data format received from server');
       }

       const transformedSuppliers = [];
       
       suppliersFromSheet.forEach(sheetSupplier => {
           try {
               const existingSupplier = transformedSuppliers.find(s => s.name === sheetSupplier.Name);
               const service = {
                   serviceType: sheetSupplier['Service Type'],
                   amountLimits: typeof sheetSupplier['Amount Limits'] === 'string' 
                       ? JSON.parse(sheetSupplier['Amount Limits']) 
                       : sheetSupplier['Amount Limits'],
                   serviceCharges: typeof sheetSupplier['Service Charges'] === 'string'
                       ? JSON.parse(sheetSupplier['Service Charges'])
                       : sheetSupplier['Service Charges'],
                   additionalQuestions: typeof sheetSupplier['Additional Questions'] === 'string'
                       ? JSON.parse(sheetSupplier['Additional Questions'])
                       : sheetSupplier['Additional Questions']
               };
               
               if (existingSupplier) {
                   existingSupplier.services.push(service);
               } else {
                   transformedSuppliers.push({
                       name: sheetSupplier.Name,
                       isActive: true,
                       services: [service]
                   });
               }
           } catch (e) {
               console.error('Error processing supplier:', sheetSupplier, e);
           }
       });

       console.log('Transformed suppliers:', transformedSuppliers);

       localStorage.setItem('suppliers', JSON.stringify(transformedSuppliers));
       window.suppliers = transformedSuppliers;

       if (typeof updateSupplierTables === 'function') updateSupplierTables();
       if (typeof updateDailyRateSection === 'function') updateDailyRateSection();

       showNotification('Suppliers successfully fetched and loaded from Google Sheets.', 'success');
   } catch (error) {
       console.error('Error fetching suppliers:', error);
       showNotification(`Error: ${error.message}`, 'error');
   }
}

async function syncSuppliersToGoogleSheet() {
   try {
       console.log('Starting sync...');
       const suppliersData = localStorage.getItem('suppliers');
       if (!suppliersData) {
           showNotification('No suppliers to sync.', 'info');
           return;
       }

       const suppliers = JSON.parse(suppliersData);
       const formattedData = [];

       suppliers.forEach(supplier => {
           supplier.services.forEach(service => {
               formattedData.push({
                   Name: supplier.name,
                   'Service Type': service.serviceType,
                   'Amount Limits': JSON.stringify(service.amountLimits),
                   'Service Charges': JSON.stringify(service.serviceCharges),
                   'Additional Questions': JSON.stringify(service.additionalQuestions)
               });
           });
       });

       console.log('Formatted data to sync:', formattedData);

       const response = await fetch(googleSheetApiUrl, {
           method: 'POST',
           headers: { 
               'Content-Type': 'application/json',
               'Accept': 'application/json'
           },
           body: JSON.stringify({ suppliers: formattedData })
       });

       console.log('Sync response received:', response);
       const result = await response.json();
       console.log('Sync result:', result);
       
       if (!response.ok || result.status !== "success") {
           throw new Error(result.message || 'Failed to sync suppliers');
       }

       showNotification('Suppliers successfully synced to Google Sheet.', 'success');
   } catch (error) {
       console.error('Error syncing suppliers:', error);
       showNotification(`Error syncing suppliers: ${error.message}`, 'error');
   }
}

function showNotification(message, type = 'info') {
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

document.addEventListener('DOMContentLoaded', function() {
    const fetchBtn = document.getElementById('fetch-suppliers-btn');
    const syncBtn = document.getElementById('sync-suppliers-btn');
    
    console.log('Fetch button found:', !!fetchBtn);
    console.log('Sync button found:', !!syncBtn);
    
    fetchBtn?.addEventListener('click', () => {
        console.log('Fetch button clicked');
        fetchSuppliersFromGoogleSheet();
    });
    
    syncBtn?.addEventListener('click', () => {
        console.log('Sync button clicked');
        syncSuppliersToGoogleSheet();
    });
});
