import { faker } from '@faker-js/faker';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const NOCODB_URL = process.env.NOCODB_URL || 'http://10.0.0.39:8091';
const API_TOKEN = process.env.NOCODB_API_TOKEN;
const MEMBERS_TABLE_ID = process.env.MEMBERS_TABLE_ID;
const NUM_MEMBERS = parseInt(process.env.NUM_MEMBERS) || 50;

if (!API_TOKEN) {
  console.error('Error: NOCODB_API_TOKEN is required in .env file');
  process.exit(1);
}

if (!MEMBERS_TABLE_ID) {
  console.error('Error: MEMBERS_TABLE_ID is required in .env file');
  console.error('\nRun scripts/schema/create-members-table.js first, then add the printed table ID to your .env file as MEMBERS_TABLE_ID.');
  process.exit(1);
}

function generateMemberId(usedIds) {
  let memberId;
  do {
    memberId = `HX${faker.string.numeric(9)}`;
  } while (usedIds.has(memberId));
  usedIds.add(memberId);
  return memberId;
}

function generateMember(usedIds) {
  return {
    MemberID: generateMemberId(usedIds),
    FirstName: faker.person.firstName(),
    LastName: faker.person.lastName()
  };
}

async function insertMembers() {
  console.log(`Generating ${NUM_MEMBERS} fake members...`);

  const usedIds = new Set();
  const members = [];
  for (let i = 0; i < NUM_MEMBERS; i++) {
    members.push(generateMember(usedIds));
  }

  console.log(`\nSample member:`);
  console.log(JSON.stringify(members[0], null, 2));
  console.log(`\nInserting ${members.length} members into NoCoDB...`);

  try {
    await axios.post(
      `${NOCODB_URL}/api/v2/tables/${MEMBERS_TABLE_ID}/records`,
      members,
      {
        headers: {
          'xc-token': API_TOKEN,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`\n✅ Successfully inserted ${members.length} members`);
  } catch (error) {
    console.error('Error inserting members:', error.response?.data || error.message);
    process.exit(1);
  }
}

insertMembers();
