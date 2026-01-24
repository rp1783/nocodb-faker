import { faker } from '@faker-js/faker';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Configuration
const NOCODB_URL = process.env.NOCODB_URL || 'http://10.0.0.39:8091';
const API_TOKEN = process.env.NOCODB_API_TOKEN;
const TABLE_ID = process.env.TABLE_ID;
const NUM_CONTACTS = parseInt(process.env.NUM_CONTACTS) || 100;

// Validate configuration
if (!API_TOKEN) {
  console.error('Error: NOCODB_API_TOKEN is required in .env file');
  process.exit(1);
}

if (!TABLE_ID) {
  console.error('Error: TABLE_ID is required in .env file');
  process.exit(1);
}

// Generate a single contact
function generateContact() {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();

  return {
    Name: `${firstName} ${lastName}`,
    Email: faker.internet.email({ firstName, lastName }),
    Phone: faker.phone.number(),
    City: faker.location.city(),
    State: faker.location.state(),
    VIP: faker.datatype.boolean() ? 'Yes' : 'No'
  };
}

// Insert contacts into NoCoDB
async function insertContacts() {
  console.log(`Generating ${NUM_CONTACTS} fake contacts...`);

  const contacts = [];
  for (let i = 0; i < NUM_CONTACTS; i++) {
    contacts.push(generateContact());
  }

  console.log(`\nSample contact:`);
  console.log(JSON.stringify(contacts[0], null, 2));
  console.log(`\nInserting ${contacts.length} contacts into NoCoDB...`);

  try {
    let successCount = 0;
    let errorCount = 0;

    // Insert contacts one by one (you can batch them if NoCoDB supports it)
    for (let i = 0; i < contacts.length; i++) {
      try {
        const response = await axios.post(
          `${NOCODB_URL}/api/v2/tables/${TABLE_ID}/records`,
          contacts[i],
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
          console.log(`Progress: ${i + 1}/${contacts.length} contacts inserted`);
        }
      } catch (error) {
        errorCount++;
        console.error(`Error inserting contact ${i + 1}:`, error.response?.data || error.message);
      }
    }

    console.log(`\n✅ Successfully inserted ${successCount} contacts`);
    if (errorCount > 0) {
      console.log(`❌ Failed to insert ${errorCount} contacts`);
    }

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    console.error('\nPlease check:');
    console.error('1. Your NoCoDB URL is correct');
    console.error('2. Your API token is valid');
    console.error('3. Your table ID is correct');
    console.error('4. The column names match (Name, Email, Phone, City, State, VIP)');
    process.exit(1);
  }
}

// Run the script
insertContacts();
