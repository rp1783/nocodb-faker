import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const NOCODB_URL = process.env.NOCODB_URL || 'http://10.0.0.39:8091';
const API_TOKEN = process.env.NOCODB_API_TOKEN;
const CASES_TABLE_ID = process.env.CASES_TABLE_ID;
const CONTACTS_TABLE_ID = process.env.TABLE_ID;
const EMPLOYEES_TABLE_ID = process.env.EMPLOYEES_TABLE_ID;

async function createCaseColumns() {
  if (!API_TOKEN) {
    console.error('Error: NOCODB_API_TOKEN is required in .env file');
    process.exit(1);
  }

  if (!CASES_TABLE_ID) {
    console.error('Error: CASES_TABLE_ID is required in .env file');
    console.error('\nPlease:');
    console.error('1. Create a new table in NoCoDB called "Cases"');
    console.error('2. Copy the table ID from the URL');
    console.error('3. Add CASES_TABLE_ID=your_table_id to your .env file');
    process.exit(1);
  }

  console.log('Creating columns in Cases table...\n');

  // First, create the CaseNumber column
  try {
    const caseNumberColumn = {
      column_name: 'CaseNumber',
      title: 'CaseNumber',
      uidt: 'Number',
    };

    await axios.post(
      `${NOCODB_URL}/api/v2/meta/tables/${CASES_TABLE_ID}/columns`,
      caseNumberColumn,
      {
        headers: {
          'xc-token': API_TOKEN,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`✅ Created column: CaseNumber (Number)`);
  } catch (error) {
    if (error.response?.data?.msg?.includes('already exists') || error.response?.data?.error === 'ERR_DUPLICATE_IN_ALIAS') {
      console.log(`⚠️  Column "CaseNumber" already exists, skipping...`);
    } else {
      console.error(`❌ Error creating column "CaseNumber":`, error.response?.data || error.message);
    }
  }

  // Create link to Contact
  try {
    console.log('\nCreating relationship to Contacts table...');

    const contactLinkColumn = {
      uidt: 'LinkToAnotherRecord',
      title: 'Contact',
      column_name: 'Contact',
      parentId: CASES_TABLE_ID,
      childId: CONTACTS_TABLE_ID,
      type: 'mm', // many-to-many, could also use 'hm' for has-many or 'bt' for belongs-to
    };

    await axios.post(
      `${NOCODB_URL}/api/v2/meta/tables/${CASES_TABLE_ID}/columns`,
      contactLinkColumn,
      {
        headers: {
          'xc-token': API_TOKEN,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`✅ Created relationship: Contact -> Contacts table`);
  } catch (error) {
    if (error.response?.data?.msg?.includes('already exists') || error.response?.data?.error === 'ERR_DUPLICATE_IN_ALIAS') {
      console.log(`⚠️  Relationship "Contact" already exists, skipping...`);
    } else {
      console.error(`❌ Error creating Contact relationship:`, error.response?.data || error.message);
    }
  }

  // Create link to Employee
  try {
    console.log('\nCreating relationship to Employees table...');

    const employeeLinkColumn = {
      uidt: 'LinkToAnotherRecord',
      title: 'AssignedTo',
      column_name: 'AssignedTo',
      parentId: CASES_TABLE_ID,
      childId: EMPLOYEES_TABLE_ID,
      type: 'mm',
    };

    await axios.post(
      `${NOCODB_URL}/api/v2/meta/tables/${CASES_TABLE_ID}/columns`,
      employeeLinkColumn,
      {
        headers: {
          'xc-token': API_TOKEN,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`✅ Created relationship: AssignedTo -> Employees table`);
  } catch (error) {
    if (error.response?.data?.msg?.includes('already exists') || error.response?.data?.error === 'ERR_DUPLICATE_IN_ALIAS') {
      console.log(`⚠️  Relationship "AssignedTo" already exists, skipping...`);
    } else {
      console.error(`❌ Error creating AssignedTo relationship:`, error.response?.data || error.message);
    }
  }

  console.log('\n✅ Cases table setup complete!');
  console.log('\nTable structure:');
  console.log('  - CaseNumber: Unique case number (1-99999)');
  console.log('  - Contact: Link to Contacts table');
  console.log('  - AssignedTo: Link to Employees table');
  console.log('\nNext: Run node generate-cases.js to create sample cases');
}

createCaseColumns();
