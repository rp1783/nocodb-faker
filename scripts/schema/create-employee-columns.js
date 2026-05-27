import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const NOCODB_URL = process.env.NOCODB_URL || 'http://10.0.0.39:8091';
const API_TOKEN = process.env.NOCODB_API_TOKEN;
const EMPLOYEES_TABLE_ID = process.env.EMPLOYEES_TABLE_ID;

// Define the columns to create
const columns = [
  {
    column_name: 'Name',
    title: 'Name',
    uidt: 'SingleLineText',
  },
  {
    column_name: 'JobTitle',
    title: 'JobTitle',
    uidt: 'SingleSelect',
    dtxp: "'Customer Service','Supervisor','Manager'",
  },
  {
    column_name: 'Extension',
    title: 'Extension',
    uidt: 'Number',
  }
];

async function createColumns() {
  if (!API_TOKEN) {
    console.error('Error: NOCODB_API_TOKEN is required in .env file');
    process.exit(1);
  }

  if (!EMPLOYEES_TABLE_ID) {
    console.error('Error: EMPLOYEES_TABLE_ID is required in .env file');
    console.error('\nPlease:');
    console.error('1. Create a new table in NoCoDB called "Employees"');
    console.error('2. Copy the table ID from the URL');
    console.error('3. Add EMPLOYEES_TABLE_ID=your_table_id to your .env file');
    process.exit(1);
  }

  console.log('Creating columns in Employees table...\n');

  for (const column of columns) {
    try {
      const response = await axios.post(
        `${NOCODB_URL}/api/v2/meta/tables/${EMPLOYEES_TABLE_ID}/columns`,
        column,
        {
          headers: {
            'xc-token': API_TOKEN,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`✅ Created column: ${column.title} (${column.uidt})`);
    } catch (error) {
      if (error.response?.data?.msg?.includes('already exists')) {
        console.log(`⚠️  Column "${column.title}" already exists, skipping...`);
      } else {
        console.error(`❌ Error creating column "${column.title}":`, error.response?.data || error.message);
      }
    }
  }

  console.log('\n✅ Column creation complete!');
  console.log('\nYou can now run: node generate-employees.js');
}

createColumns();
