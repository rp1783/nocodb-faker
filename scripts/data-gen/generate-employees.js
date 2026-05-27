import { faker } from '@faker-js/faker';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Configuration
const NOCODB_URL = process.env.NOCODB_URL || 'http://10.0.0.39:8091';
const API_TOKEN = process.env.NOCODB_API_TOKEN;
const EMPLOYEES_TABLE_ID = process.env.EMPLOYEES_TABLE_ID;
const NUM_EMPLOYEES = parseInt(process.env.NUM_EMPLOYEES) || 20;

// Job titles to choose from
const JOB_TITLES = ['Customer Service', 'Supervisor', 'Manager'];

// Validate configuration
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

// Generate a single employee
function generateEmployee() {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();

  return {
    Name: `${firstName} ${lastName}`,
    JobTitle: faker.helpers.arrayElement(JOB_TITLES),
    Extension: faker.number.int({ min: 1000, max: 9999 })
  };
}

// Insert employees into NoCoDB
async function insertEmployees() {
  console.log(`Generating ${NUM_EMPLOYEES} fake employees...`);

  const employees = [];
  for (let i = 0; i < NUM_EMPLOYEES; i++) {
    employees.push(generateEmployee());
  }

  console.log(`\nSample employee:`);
  console.log(JSON.stringify(employees[0], null, 2));
  console.log(`\nInserting ${employees.length} employees into NoCoDB...`);

  try {
    let successCount = 0;
    let errorCount = 0;

    // Insert employees one by one
    for (let i = 0; i < employees.length; i++) {
      try {
        const response = await axios.post(
          `${NOCODB_URL}/api/v2/tables/${EMPLOYEES_TABLE_ID}/records`,
          employees[i],
          {
            headers: {
              'xc-token': API_TOKEN,
              'Content-Type': 'application/json'
            }
          }
        );

        successCount++;

        // Show progress every 5 records
        if ((i + 1) % 5 === 0) {
          console.log(`Progress: ${i + 1}/${employees.length} employees inserted`);
        }
      } catch (error) {
        errorCount++;
        console.error(`Error inserting employee ${i + 1}:`, error.response?.data || error.message);
      }
    }

    console.log(`\n✅ Successfully inserted ${successCount} employees`);
    if (errorCount > 0) {
      console.log(`❌ Failed to insert ${errorCount} employees`);
    }

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    console.error('\nPlease check:');
    console.error('1. Your NoCoDB URL is correct');
    console.error('2. Your API token is valid');
    console.error('3. Your employees table ID is correct');
    console.error('4. The column names match (Name, Title, Extension)');
    process.exit(1);
  }
}

// Run the script
insertEmployees();
