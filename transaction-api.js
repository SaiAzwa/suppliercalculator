// API URL for Transactions
const API_KEY =
  "510acd13d8d24375cf038ad626c282565451461a9c2399357e0b65365300787e";
const TRANSACTION_API_URL = "https://dev.exchange.izyim.com/public/api/v1/transactions";

// Function to sync data between the API and local state
const transactionApi = {
  // Fetch data from API and update local state
  async fetchOrderTransactions(payload) {
    try {
      console.log("Fetching data from Exchange Order API...");
      const {
        page,
        per_page,
        original_currency_id_in, // CNY: 2
        transaction_service_id,
      } = payload;

      // the following payload usually will be same, so we hardcode here for now
      const status = 2; // approved status
      const type = 1; // type payment
      const does_not_have_refund_in_progress = true;
      const does_not_have_group = true; // does not have white form
      const order_by = {
        column: "id",
        DESC: true,
      };

      const params = new URLSearchParams({
        "api-key": API_KEY,
        page,
        filters: JSON.stringify({
          per_page,
          status,
          type,
          original_currency_id_in: [original_currency_id_in],
          transaction_service_id,
          does_not_have_refund_in_progress,
          does_not_have_group,
          order_by,
        }),
      });

      const response = await fetch(`${TRANSACTION_API_URL}/list?${params}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      console.log(response);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const apiData = await response.json();
      console.log("Received API data:", apiData);
    } catch (error) {
      console.error("Error fetching data:", error);
      window.sharedUtils.showNotification(
        "Failed to fetch order transactions data",
        "error"
      );
      return null;
    }
  },

  // create white form for orders
  async createWhiteForm(payload) {
    try {
      console.log("Creating white form for Orders...");
      const {
        supplier_id
      } = payload;

      const params = new URLSearchParams({
        "api-key": API_KEY,
      });

      const response = await fetch(`${TRANSACTION_API_URL}/supplier/${supplier_id}/bill/create?${params}`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            ...payload
        })
    });

      console.log(response);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const apiData = await response.json();
      console.log("Received API data:", apiData);
    } catch (error) {
      console.error("Error fetching data:", error);
      window.sharedUtils.showNotification(
        "Failed to create white form",
        "error"
      );
      return null;
    }
  },
};

document.addEventListener("DOMContentLoaded", () => {
  // example
 
  // transactionApi.fetchOrderTransactions({
  //   page: 1,
  //   per_page: 10000,
  //   original_currency_id_in: 2,
  //   transaction_service_id: 1,
  // });

  // transactionApi.createWhiteForm({supplier_id: 2, payments: [{id: 403958}], rate:"1.5210"});
});

// Export for use in other files
window.transactionApi = transactionApi;
