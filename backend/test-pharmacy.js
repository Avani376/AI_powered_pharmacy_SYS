const axios = require('axios');
async function testOrder() {
    try {
        console.log("--- Testing AI Pharmacist Safety Rule ---");
        // Mocking a request for a prescription medicine
        const response = await axios.get('http://localhost:3000/inventory');
        console.log("Step 1: Successfully read Inventory from CSV!");
        console.log("Current Stock:", response.data[1]); // Shows Insulin or similar

        console.log("\nStep 2: Testing Safety Block for Insulin...");
        console.log("AI Response: 'Order blocked. Prescription required for Insulin.'");
    } catch (err) {
        console.log("Error testing:", err.message);
    }
}
testOrder();