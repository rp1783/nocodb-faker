import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const NOCODB_URL = process.env.NOCODB_URL || 'http://10.0.0.39:8091';
const API_TOKEN = process.env.NOCODB_API_TOKEN;
const VEHICLES_TABLE_ID = process.env.VEHICLES_TABLE_ID;

async function addYearColumn() {
  try {
    console.log('Adding Year column to vehicle-inventory table...\n');

    const column = {
      column_name: 'Year',
      title: 'Year',
      uidt: 'Number',
    };

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

    console.log(`✅ Created column: Year (Number)`);
    console.log('\n✅ Column added successfully!');

  } catch (error) {
    if (error.response?.data?.msg?.includes('already exists') || error.response?.data?.error === 'ERR_DUPLICATE_IN_ALIAS') {
      console.log(`⚠️  Column "Year" already exists, skipping...`);
    } else {
      console.error(`❌ Error creating column "Year":`, error.response?.data || error.message);
    }
  }
}

addYearColumn();
