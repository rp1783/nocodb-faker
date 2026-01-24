import { faker } from '@faker-js/faker';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Configuration
const NOCODB_URL = process.env.NOCODB_URL || 'http://10.0.0.39:8091';
const API_TOKEN = process.env.NOCODB_API_TOKEN;
const CASES_TABLE_ID = process.env.CASES_TABLE_ID;
const CONTACTS_TABLE_ID = process.env.TABLE_ID;
const EMPLOYEES_TABLE_ID = process.env.EMPLOYEES_TABLE_ID;
const NUM_CASES = parseInt(process.env.NUM_CASES) || 30;

// Validate configuration
if (!API_TOKEN) {
  console.error('Error: NOCODB_API_TOKEN is required in .env file');
  process.exit(1);
}

if (!CASES_TABLE_ID) {
  console.error('Error: CASES_TABLE_ID is required in .env file');
  process.exit(1);
}

// Fetch all contacts
async function fetchContacts() {
  const response = await axios.get(
    `${NOCODB_URL}/api/v2/tables/${CONTACTS_TABLE_ID}/records`,
    {
      headers: { 'xc-token': API_TOKEN },
      params: { limit: 1000 }
    }
  );
  return response.data.list || [];
}

// Fetch all employees
async function fetchEmployees() {
  const response = await axios.get(
    `${NOCODB_URL}/api/v2/tables/${EMPLOYEES_TABLE_ID}/records`,
    {
      headers: { 'xc-token': API_TOKEN },
      params: { limit: 1000 }
    }
  );
  return response.data.list || [];
}

// Generate a single case
function generateCase(contacts, employees) {
  // Pick a random contact and employee
  const contact = faker.helpers.arrayElement(contacts);
  const employee = faker.helpers.arrayElement(employees);

  return {
    CaseNumber: faker.number.int({ min: 10000, max: 99999 }),
    Contact: [contact.Id], // Array of linked record IDs
    AssignedTo: [employee.Id], // Array of linked record IDs
  };
}

// Insert cases into NoCoDB
async function insertCases() {
  console.log('Fetching contacts and employees...\n');

  const contacts = await fetchContacts();
  const employees = await fetchEmployees();

  console.log(`Found ${contacts.length} contacts`);
  console.log(`Found ${employees.length} employees\n`);

  if (contacts.length === 0 || employees.length === 0) {
    console.error('Error: Need both contacts and employees to create cases!');
    process.exit(1);
  }

  console.log(`Generating ${NUM_CASES} cases...`);

  const cases = [];
  for (let i = 0; i < NUM_CASES; i++) {
    cases.push(generateCase(contacts, employees));
  }

  console.log(`\nSample case:`);
  const sampleContact = contacts.find(c => c.Id === cases[0].Contact[0]);
  const sampleEmployee = employees.find(e => e.Id === cases[0].AssignedTo[0]);
  console.log(`  Case Number: ${cases[0].CaseNumber}`);
  console.log(`  Contact: ${sampleContact?.Name || 'Unknown'}`);
  console.log(`  Assigned To: ${sampleEmployee?.Name || 'Unknown'}`);

  console.log(`\nInserting ${cases.length} cases into NoCoDB...`);

  try {
    let successCount = 0;
    let errorCount = 0;

    // Insert cases one by one
    for (let i = 0; i < cases.length; i++) {
      try {
        const response = await axios.post(
          `${NOCODB_URL}/api/v2/tables/${CASES_TABLE_ID}/records`,
          cases[i],
          {
            headers: {
              'xc-token': API_TOKEN,
              'Content-Type': 'application/json'
            }
          }
        );

        successCount++;

        // Show progress every 10 records
        if ((i + 1) % 10 === 0) {
          console.log(`Progress: ${i + 1}/${cases.length} cases inserted`);
        }
      } catch (error) {
        errorCount++;
        console.error(`Error inserting case ${i + 1}:`, error.response?.data || error.message);
      }
    }

    console.log(`\n✅ Successfully inserted ${successCount} cases`);
    if (errorCount > 0) {
      console.log(`❌ Failed to insert ${errorCount} cases`);
    }

    console.log('\n💡 Tip: View your cases in NoCoDB to see the linked contacts and employees!');

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    console.error('\nPlease check:');
    console.error('1. Your NoCoDB URL is correct');
    console.error('2. Your API token is valid');
    console.error('3. Your cases table ID is correct');
    console.error('4. The relationships are properly set up');
    process.exit(1);
  }
}

// Run the script
insertCases();
