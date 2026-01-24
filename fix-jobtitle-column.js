import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const NOCODB_URL = process.env.NOCODB_URL || 'http://10.0.0.39:8091';
const API_TOKEN = process.env.NOCODB_API_TOKEN;
const EMPLOYEES_TABLE_ID = process.env.EMPLOYEES_TABLE_ID;

async function fixJobTitleColumn() {
  try {
    console.log('Fetching table schema to find JobTitle column ID...\n');

    // First, get the table info to find the JobTitle column ID
    const tableResponse = await axios.get(
      `${NOCODB_URL}/api/v2/meta/tables/${EMPLOYEES_TABLE_ID}`,
      {
        headers: {
          'xc-token': API_TOKEN
        }
      }
    );

    const jobTitleColumn = tableResponse.data.columns.find(col => col.title === 'JobTitle');

    if (!jobTitleColumn) {
      console.error('JobTitle column not found!');
      return;
    }

    console.log(`Found JobTitle column with ID: ${jobTitleColumn.id}`);
    console.log('Updating JobTitle column with options...\n');

    // Update the column with the options
    const updateResponse = await axios.patch(
      `${NOCODB_URL}/api/v2/meta/columns/${jobTitleColumn.id}`,
      {
        ...jobTitleColumn,
        colOptions: {
          options: [
            { title: 'Customer Service', order: 1, color: 'blue' },
            { title: 'Supervisor', order: 2, color: 'orange' },
            { title: 'Manager', order: 3, color: 'purple' }
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

    console.log('✅ JobTitle column updated successfully with options!\n');
    console.log('You can now run: node generate-employees.js');

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

fixJobTitleColumn();
