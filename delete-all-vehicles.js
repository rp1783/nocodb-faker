import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const NOCODB_URL = process.env.NOCODB_URL || 'http://10.0.0.39:8091';
const API_TOKEN = process.env.NOCODB_API_TOKEN;
const VEHICLES_TABLE_ID = process.env.VEHICLES_TABLE_ID;

async function deleteAllVehicles() {
  try {
    console.log('Fetching all vehicle records...\n');

    const response = await axios.get(
      `${NOCODB_URL}/api/v2/tables/${VEHICLES_TABLE_ID}/records`,
      {
        headers: {
          'xc-token': API_TOKEN
        },
        params: {
          limit: 1000
        }
      }
    );

    const records = response.data.list || response.data.records || [];
    console.log(`Found ${records.length} vehicle records to delete\n`);

    if (records.length === 0) {
      console.log('No vehicles to delete!');
      return;
    }

    // Collect all IDs to delete
    const recordsToDelete = records.map(row => ({ Id: row.Id }));

    console.log('Deleting all vehicles...\n');

    const deleteResponse = await axios.delete(
      `${NOCODB_URL}/api/v2/tables/${VEHICLES_TABLE_ID}/records`,
      {
        headers: {
          'xc-token': API_TOKEN,
          'Content-Type': 'application/json'
        },
        data: recordsToDelete
      }
    );

    console.log(`✅ Successfully deleted ${records.length} vehicle records\n`);
    console.log('You can now run: node generate-vehicles.js');

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

deleteAllVehicles();
