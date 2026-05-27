import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const NOCODB_URL = process.env.NOCODB_URL || 'http://10.0.0.39:8091';
const API_TOKEN = process.env.NOCODB_API_TOKEN;
const TABLE_ID = process.env.TABLE_ID;

// Define the columns to create
const columns = [
  {
    column_name: 'Name',
    title: 'Name',
    uidt: 'SingleLineText',
  },
  {
    column_name: 'Email',
    title: 'Email',
    uidt: 'Email',
  },
  {
    column_name: 'Phone',
    title: 'Phone',
    uidt: 'PhoneNumber',
  },
  {
    column_name: 'City',
    title: 'City',
    uidt: 'SingleLineText',
  },
  {
    column_name: 'State',
    title: 'State',
    uidt: 'SingleLineText',
  },
  {
    column_name: 'VIP',
    title: 'VIP',
    uidt: 'SingleSelect',
    dtxp: "'Yes','No'",
  }
];

async function createColumns() {
  console.log('Creating columns in NoCoDB table...\n');

  for (const column of columns) {
    try {
      const response = await axios.post(
        `${NOCODB_URL}/api/v2/meta/tables/${TABLE_ID}/columns`,
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
  console.log('\nYou can now run: npm start');
}

createColumns();
