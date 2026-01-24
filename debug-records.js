import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const NOCODB_URL = process.env.NOCODB_URL || 'http://10.0.0.39:8091';
const API_TOKEN = process.env.NOCODB_API_TOKEN;
const TABLE_ID = process.env.TABLE_ID;

async function debugRecords() {
  try {
    const response = await axios.get(
      `${NOCODB_URL}/api/v2/tables/${TABLE_ID}/records`,
      {
        headers: {
          'xc-token': API_TOKEN
        },
        params: {
          limit: 3
        }
      }
    );

    const records = response.data.list || response.data.records || [];

    console.log('First 3 records structure:\n');
    records.forEach((record, idx) => {
      console.log(`Record ${idx + 1}:`);
      console.log(JSON.stringify(record, null, 2));
      console.log('\n');
    });

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

debugRecords();
