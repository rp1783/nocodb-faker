import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const NOCODB_URL = process.env.NOCODB_URL || 'http://10.0.0.39:8091';
const API_TOKEN = process.env.NOCODB_API_TOKEN;
const TABLE_ID = process.env.TABLE_ID;

async function getTableSchema() {
  try {
    console.log('Fetching table schema...\n');

    const response = await axios.get(
      `${NOCODB_URL}/api/v2/tables/${TABLE_ID}`,
      {
        headers: {
          'xc-token': API_TOKEN
        }
      }
    );

    const columns = response.data.columns || [];

    console.log('Table Name:', response.data.title);
    console.log('\nColumns in your table:');
    console.log('='.repeat(60));

    columns.forEach((col, index) => {
      console.log(`${index + 1}. Column Name: "${col.title}"`);
      console.log(`   Column Type: ${col.uidt}`);
      console.log(`   System Column: ${col.system || false}`);
      console.log('');
    });

    console.log('='.repeat(60));
    console.log('\nNOTE: Use the exact "Column Name" values in your script.');
    console.log('System columns (like Id, CreatedAt, etc.) are auto-managed.\n');

  } catch (error) {
    console.error('Error fetching table schema:', error.response?.data || error.message);
  }
}

getTableSchema();
