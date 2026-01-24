import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const NOCODB_URL = process.env.NOCODB_URL || 'http://10.0.0.39:8091';
const API_TOKEN = process.env.NOCODB_API_TOKEN;
const CONTACTS_TABLE_ID = process.env.TABLE_ID;
const EMPLOYEES_TABLE_ID = process.env.EMPLOYEES_TABLE_ID;

async function debugTable(tableId, tableName) {
  try {
    console.log(`\n=== ${tableName} Table ===`);

    const tableResponse = await axios.get(
      `${NOCODB_URL}/api/v2/meta/tables/${tableId}`,
      {
        headers: {
          'xc-token': API_TOKEN
        }
      }
    );

    console.log(`\nColumns:`);
    tableResponse.data.columns.forEach(col => {
      if (col.title === 'Name' || col.title === 'Title') {
        console.log(`  - ${col.title}: pv=${col.pv}, system=${col.system}`);
      }
    });

  } catch (error) {
    console.error(`Error:`, error.response?.data || error.message);
  }
}

async function debug() {
  await debugTable(CONTACTS_TABLE_ID, 'Contacts');
  await debugTable(EMPLOYEES_TABLE_ID, 'Employees');
}

debug();
