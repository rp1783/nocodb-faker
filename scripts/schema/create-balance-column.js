import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const NOCODB_URL = process.env.NOCODB_URL || 'http://10.0.0.39:8091';
const API_TOKEN = process.env.NOCODB_API_TOKEN;
const TABLE_ID = process.env.TABLE_ID; // customer-contacts table

async function createBalanceColumn() {
  try {
    console.log('Creating Balance column in customer-contacts table...\n');

    // Get the table info to check if column already exists
    const tableResponse = await axios.get(
      `${NOCODB_URL}/api/v2/meta/tables/${TABLE_ID}`,
      {
        headers: {
          'xc-token': API_TOKEN
        }
      }
    );

    // Check if Balance column already exists
    const existingColumn = tableResponse.data.columns.find(col => col.title === 'Balance');

    if (existingColumn) {
      console.log('⚠️  Balance column already exists!');
      console.log('Column ID:', existingColumn.id);
      return;
    }

    // Create the Balance column as a Number (Decimal) type
    const createResponse = await axios.post(
      `${NOCODB_URL}/api/v2/meta/tables/${TABLE_ID}/columns`,
      {
        title: 'Balance',
        column_name: 'Balance',
        uidt: 'Decimal', // Number type with decimals
        dt: 'decimal',
        dtxp: '10,2', // 10 digits total, 2 decimal places
        dtxs: '2',
        np: '10',
        ns: '2',
        order: 99
      },
      {
        headers: {
          'xc-token': API_TOKEN,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Balance column created successfully!');
    console.log('Column details:', createResponse.data);
    console.log('\nNext step: Run generate-balances.js to populate random balances');

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

createBalanceColumn();
