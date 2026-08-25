import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const NOCODB_URL = process.env.NOCODB_URL || 'http://10.0.0.39:8091';
const API_TOKEN = process.env.NOCODB_API_TOKEN;
const BASE_ID = 'pqdvpqhfx2l3dw1'; // Getting Started base

async function createMembersTable() {
  if (!API_TOKEN) {
    console.error('Error: NOCODB_API_TOKEN is required in .env file');
    process.exit(1);
  }

  console.log('Creating Members table...');

  const response = await axios.post(
    `${NOCODB_URL}/api/v2/meta/bases/${BASE_ID}/tables`,
    {
      table_name: 'members',
      title: 'Members',
      columns: [
        {
          column_name: 'id',
          title: 'Id',
          uidt: 'ID',
          pk: true
        },
        {
          column_name: 'MemberID',
          title: 'MemberID',
          uidt: 'SingleLineText'
        },
        {
          column_name: 'FirstName',
          title: 'FirstName',
          uidt: 'SingleLineText'
        },
        {
          column_name: 'LastName',
          title: 'LastName',
          uidt: 'SingleLineText'
        }
      ]
    },
    {
      headers: { 'xc-token': API_TOKEN }
    }
  );

  console.log('✅ Members table created successfully!');
  console.log('Table ID:', response.data.id);
  console.log('\nAdd this to your .env file:');
  console.log(`MEMBERS_TABLE_ID=${response.data.id}`);

  return response.data.id;
}

createMembersTable().catch((error) => {
  console.error('Error:', error.response?.data || error.message);
  process.exit(1);
});
