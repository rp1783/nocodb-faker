import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const NOCODB_URL = process.env.NOCODB_URL || 'http://10.0.0.39:8091';
const API_TOKEN = process.env.NOCODB_API_TOKEN;
const TABLE_ID = process.env.TABLE_ID;

async function fixVIPColumn() {
  try {
    console.log('Fetching table schema to find VIP column ID...\n');

    // First, get the table info to find the VIP column ID
    const tableResponse = await axios.get(
      `${NOCODB_URL}/api/v2/meta/tables/${TABLE_ID}`,
      {
        headers: {
          'xc-token': API_TOKEN
        }
      }
    );

    const vipColumn = tableResponse.data.columns.find(col => col.title === 'VIP');

    if (!vipColumn) {
      console.error('VIP column not found!');
      return;
    }

    console.log(`Found VIP column with ID: ${vipColumn.id}`);
    console.log('Updating VIP column with Yes/No options...\n');

    // Update the column with the options
    const updateResponse = await axios.patch(
      `${NOCODB_URL}/api/v2/meta/columns/${vipColumn.id}`,
      {
        ...vipColumn,
        colOptions: {
          options: [
            { title: 'Yes', order: 1, color: 'green' },
            { title: 'No', order: 2, color: 'red' }
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

    console.log('✅ VIP column updated successfully with Yes/No options!\n');
    console.log('You can now run: npm start');

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

fixVIPColumn();
