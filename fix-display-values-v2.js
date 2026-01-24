import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const NOCODB_URL = process.env.NOCODB_URL || 'http://10.0.0.39:8091';
const API_TOKEN = process.env.NOCODB_API_TOKEN;
const CONTACTS_TABLE_ID = process.env.TABLE_ID;
const EMPLOYEES_TABLE_ID = process.env.EMPLOYEES_TABLE_ID;

async function setDisplayValue(tableId, tableName) {
  try {
    console.log(`\n=== ${tableName} Table ===`);

    // Get the table info
    const tableResponse = await axios.get(
      `${NOCODB_URL}/api/v2/meta/tables/${tableId}`,
      {
        headers: {
          'xc-token': API_TOKEN
        }
      }
    );

    const titleColumn = tableResponse.data.columns.find(col => col.title === 'Title');
    const nameColumn = tableResponse.data.columns.find(col => col.title === 'Name');

    if (!nameColumn) {
      console.error(`Name column not found!`);
      return;
    }

    // First, unset Title as primary value
    if (titleColumn && titleColumn.pv) {
      console.log(`Unsetting Title as display value...`);
      await axios.patch(
        `${NOCODB_URL}/api/v2/meta/columns/${titleColumn.id}`,
        {
          ...titleColumn,
          pv: false
        },
        {
          headers: {
            'xc-token': API_TOKEN,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log(`✅ Unset Title`);
    }

    // Then, set Name as primary value
    console.log(`Setting Name as display value...`);
    await axios.patch(
      `${NOCODB_URL}/api/v2/meta/columns/${nameColumn.id}`,
      {
        ...nameColumn,
        pv: true
      },
      {
        headers: {
          'xc-token': API_TOKEN,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`✅ Set Name as display value for ${tableName}`);

  } catch (error) {
    console.error(`Error:`, error.response?.data || error.message);
  }
}

async function fixAllDisplayValues() {
  console.log('Fixing display values for linked tables...\n');

  await setDisplayValue(CONTACTS_TABLE_ID, 'Contacts');
  await setDisplayValue(EMPLOYEES_TABLE_ID, 'Employees');

  console.log('\n✅ All display values fixed!');
  console.log('\nNow refresh your NoCoDB browser page to see the names.');
}

fixAllDisplayValues();
