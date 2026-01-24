import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const NOCODB_URL = process.env.NOCODB_URL || 'http://10.0.0.39:8091';
const API_TOKEN = process.env.NOCODB_API_TOKEN;
const CONTACTS_TABLE_ID = process.env.TABLE_ID;
const EMPLOYEES_TABLE_ID = process.env.EMPLOYEES_TABLE_ID;

async function setDisplayValue(tableId, tableName) {
  try {
    console.log(`\nFetching ${tableName} table schema...`);

    // Get the table info
    const tableResponse = await axios.get(
      `${NOCODB_URL}/api/v2/meta/tables/${tableId}`,
      {
        headers: {
          'xc-token': API_TOKEN
        }
      }
    );

    const nameColumn = tableResponse.data.columns.find(col => col.title === 'Name');

    if (!nameColumn) {
      console.error(`Name column not found in ${tableName} table!`);
      return;
    }

    console.log(`Found Name column with ID: ${nameColumn.id}`);
    console.log(`Setting Name as the display value for ${tableName}...`);

    // Update the Name column to be the display value (primary value)
    await axios.patch(
      `${NOCODB_URL}/api/v2/meta/columns/${nameColumn.id}`,
      {
        ...nameColumn,
        pv: true  // Set as primary value (display value)
      },
      {
        headers: {
          'xc-token': API_TOKEN,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`✅ Successfully set Name as display value for ${tableName}`);

  } catch (error) {
    console.error(`Error updating ${tableName}:`, error.response?.data || error.message);
  }
}

async function fixAllDisplayValues() {
  console.log('Updating display values for linked tables...\n');

  await setDisplayValue(CONTACTS_TABLE_ID, 'Contacts');
  await setDisplayValue(EMPLOYEES_TABLE_ID, 'Employees');

  console.log('\n✅ All display values updated!');
  console.log('\nRefresh your NoCoDB page to see contact and employee names in the Cases table.');
}

fixAllDisplayValues();
