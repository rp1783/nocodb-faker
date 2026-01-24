import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const NOCODB_URL = process.env.NOCODB_URL || 'http://10.0.0.39:8091';
const API_TOKEN = process.env.NOCODB_API_TOKEN;
const VEHICLES_TABLE_ID = process.env.VEHICLES_TABLE_ID;

// Define the columns to create
const columns = [
  {
    column_name: 'Make',
    title: 'Make',
    uidt: 'SingleLineText',
  },
  {
    column_name: 'Model',
    title: 'Model',
    uidt: 'SingleLineText',
  },
  {
    column_name: 'Color',
    title: 'Color',
    uidt: 'SingleLineText',
  },
  {
    column_name: 'Mileage',
    title: 'Mileage',
    uidt: 'Number',
  },
  {
    column_name: 'Transmission',
    title: 'Transmission',
    uidt: 'SingleSelect',
    dtxp: "'Automatic','Manual','CVT','Semi-Automatic'",
  }
];

async function createColumns() {
  if (!API_TOKEN) {
    console.error('Error: NOCODB_API_TOKEN is required in .env file');
    process.exit(1);
  }

  if (!VEHICLES_TABLE_ID) {
    console.error('Error: VEHICLES_TABLE_ID is required in .env file');
    console.error('\nPlease:');
    console.error('1. Make sure your vehicle-inventory table is created in NoCoDB');
    console.error('2. Copy the table ID from the URL');
    console.error('3. Add VEHICLES_TABLE_ID=your_table_id to your .env file');
    process.exit(1);
  }

  console.log('Creating columns in vehicle-inventory table...\n');

  for (const column of columns) {
    try {
      const response = await axios.post(
        `${NOCODB_URL}/api/v2/meta/tables/${VEHICLES_TABLE_ID}/columns`,
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
      if (error.response?.data?.msg?.includes('already exists') || error.response?.data?.error === 'ERR_DUPLICATE_IN_ALIAS') {
        console.log(`⚠️  Column "${column.title}" already exists, skipping...`);
      } else {
        console.error(`❌ Error creating column "${column.title}":`, error.response?.data || error.message);
      }
    }
  }

  console.log('\n✅ Column creation complete!');
  console.log('\nNext step: Run node fix-transmission-column.js to configure the Transmission options');
}

createColumns();
