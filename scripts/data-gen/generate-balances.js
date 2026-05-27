import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const NOCODB_URL = process.env.NOCODB_URL || 'http://10.0.0.39:8091';
const API_TOKEN = process.env.NOCODB_API_TOKEN;
const TABLE_ID = process.env.TABLE_ID; // customer-contacts table

// Generate random balance between $100 and $500
function generateRandomBalance() {
  const min = 100;
  const max = 500;
  const balance = Math.random() * (max - min) + min;
  return Math.round(balance * 100) / 100; // Round to 2 decimal places
}

async function generateBalances() {
  try {
    console.log('Fetching all customer contacts...\n');

    // Get all contacts
    const response = await axios.get(
      `${NOCODB_URL}/api/v2/tables/${TABLE_ID}/records`,
      {
        headers: { 'xc-token': API_TOKEN },
        params: {
          limit: 1000, // Get all records
          offset: 0
        }
      }
    );

    const contacts = response.data.list || [];
    console.log(`Found ${contacts.length} contacts\n`);

    if (contacts.length === 0) {
      console.log('No contacts found!');
      return;
    }

    console.log('Generating random balances between $100.00 and $500.00...\n');

    let successCount = 0;
    let errorCount = 0;

    // Update each contact with a random balance
    for (const contact of contacts) {
      const balance = generateRandomBalance();

      try {
        await axios.patch(
          `${NOCODB_URL}/api/v2/tables/${TABLE_ID}/records`,
          {
            Id: contact.Id,
            Balance: balance
          },
          {
            headers: {
              'xc-token': API_TOKEN,
              'Content-Type': 'application/json'
            }
          }
        );

        console.log(`✅ ${contact.Name} (Account #${contact.AccountNumber}) - Balance: $${balance.toFixed(2)}`);
        successCount++;

        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`❌ Failed to update ${contact.Name}:`, error.response?.data || error.message);
        errorCount++;
      }
    }

    console.log(`\n=== Summary ===`);
    console.log(`✅ Successfully updated: ${successCount} contacts`);
    console.log(`❌ Errors: ${errorCount} contacts`);
    console.log(`💰 Balance range: $100.00 - $500.00`);

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

generateBalances();
