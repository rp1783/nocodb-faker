import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const NOCODB_URL = process.env.NOCODB_URL || 'http://10.0.0.39:8091';
const API_TOKEN = process.env.NOCODB_API_TOKEN;
const BASE_ID = 'pqdvpqhfx2l3dw1'; // Your base ID
const SOURCE_ID = 'bsmdkew643xgry5'; // Your source ID

async function createStatusTable() {
  try {
    console.log('Creating Status table...\n');

    // Create the table
    const tableResponse = await axios.post(
      `${NOCODB_URL}/api/v2/meta/bases/${BASE_ID}/tables`,
      {
        table_name: 'Status',
        title: 'Status',
        source_id: SOURCE_ID,
        columns: [
          {
            column_name: 'id',
            title: 'Id',
            uidt: 'ID',
            dt: 'integer',
            pk: true,
            ai: true,
            rqd: true,
            un: true
          },
          {
            column_name: 'Status',
            title: 'Status',
            uidt: 'Number',
            dt: 'integer'
          }
        ]
      },
      {
        headers: {
          'xc-token': API_TOKEN,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Status table created successfully!');
    const tableId = tableResponse.data.id;
    console.log('Table ID:', tableId);
    console.log('\nAdd this to your .env file:');
    console.log(`STATUS_TABLE_ID=${tableId}`);

    // Wait a moment for table to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Create the initial row with Status = 0 (Away)
    console.log('\nCreating initial status row...');
    const recordResponse = await axios.post(
      `${NOCODB_URL}/api/v2/tables/${tableId}/records`,
      {
        Status: 0
      },
      {
        headers: {
          'xc-token': API_TOKEN,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Initial status row created!');
    console.log('Status: 0 (Away)');
    console.log('Row ID:', recordResponse.data.Id);

    console.log('\n📝 Next steps:');
    console.log('1. Add STATUS_TABLE_ID to your .env file');
    console.log('2. Restart the API wrapper');
    console.log('3. Use GET /api/status to read current status');
    console.log('4. Use PUT /api/status to update status (0=Away, 1=Present)');

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

createStatusTable();
