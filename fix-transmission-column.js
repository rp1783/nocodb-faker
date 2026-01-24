import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const NOCODB_URL = process.env.NOCODB_URL || 'http://10.0.0.39:8091';
const API_TOKEN = process.env.NOCODB_API_TOKEN;
const VEHICLES_TABLE_ID = process.env.VEHICLES_TABLE_ID;

async function fixTransmissionColumn() {
  try {
    console.log('Fetching table schema to find Transmission column ID...\n');

    // First, get the table info to find the Transmission column ID
    const tableResponse = await axios.get(
      `${NOCODB_URL}/api/v2/meta/tables/${VEHICLES_TABLE_ID}`,
      {
        headers: {
          'xc-token': API_TOKEN
        }
      }
    );

    const transmissionColumn = tableResponse.data.columns.find(col => col.title === 'Transmission');

    if (!transmissionColumn) {
      console.error('Transmission column not found!');
      return;
    }

    console.log(`Found Transmission column with ID: ${transmissionColumn.id}`);
    console.log('Updating Transmission column with options...\n');

    // Update the column with the options
    const updateResponse = await axios.patch(
      `${NOCODB_URL}/api/v2/meta/columns/${transmissionColumn.id}`,
      {
        ...transmissionColumn,
        colOptions: {
          options: [
            { title: 'Automatic', order: 1, color: 'blue' },
            { title: 'Manual', order: 2, color: 'green' },
            { title: 'CVT', order: 3, color: 'purple' },
            { title: 'Semi-Automatic', order: 4, color: 'orange' }
          ]
        }
      },
      {
        headers: {
          'xc-token': API_TOKEN,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Transmission column updated successfully with options!\n');
    console.log('You can now run: node generate-vehicles.js');

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

fixTransmissionColumn();
