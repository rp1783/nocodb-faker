import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const NOCODB_URL = process.env.NOCODB_URL || 'http://10.0.0.39:8091';
const API_TOKEN = process.env.NOCODB_API_TOKEN;
const TABLE_ID = process.env.TABLE_ID;

async function deleteEmptyRows() {
  try {
    console.log('Fetching all records from the table...\n');

    // Fetch all records
    const response = await axios.get(
      `${NOCODB_URL}/api/v2/tables/${TABLE_ID}/records`,
      {
        headers: {
          'xc-token': API_TOKEN
        },
        params: {
          limit: 1000 // Adjust if you have more than 1000 rows
        }
      }
    );

    const records = response.data.list || response.data.records || [];
    console.log(`Found ${records.length} total records\n`);

    // Find empty rows (rows where Name, Email, Phone, City, and State are all empty/null)
    const emptyRows = records.filter(record => {
      return !record.Name && !record.Email && !record.Phone && !record.City && !record.State;
    });

    console.log(`Found ${emptyRows.length} empty rows to delete\n`);

    if (emptyRows.length === 0) {
      console.log('No empty rows to delete!');
      return;
    }

    // Get the primary key field name
    const firstRecord = records[0];
    const pkField = Object.keys(firstRecord).find(key =>
      key === 'Id' || key === 'id' || key.toLowerCase().includes('ncrecordid')
    ) || 'Id';

    console.log(`Using primary key field: ${pkField}\n`);

    // Collect all IDs to delete as objects with the primary key
    const recordsToDelete = emptyRows.map(row => ({ [pkField]: row[pkField] }));

    console.log(`First 5 IDs to delete: ${emptyRows.slice(0, 5).map(r => r[pkField]).join(', ')}...\n`);

    let deletedCount = 0;
    let errorCount = 0;

    // Try batch delete with all records at once
    try {
      const response = await axios.delete(
        `${NOCODB_URL}/api/v2/tables/${TABLE_ID}/records`,
        {
          headers: {
            'xc-token': API_TOKEN,
            'Content-Type': 'application/json'
          },
          data: recordsToDelete
        }
      );
      deletedCount = emptyRows.length;
      console.log(`✅ Batch delete successful!`);
    } catch (error) {
      console.log('Batch delete failed, trying smaller batches...\n');
      console.error('Batch error:', error.response?.data || error.message);

      // Try deleting in batches of 10
      const batchSize = 10;
      for (let i = 0; i < recordsToDelete.length; i += batchSize) {
        const batch = recordsToDelete.slice(i, i + batchSize);
        try {
          await axios.delete(
            `${NOCODB_URL}/api/v2/tables/${TABLE_ID}/records`,
            {
              headers: {
                'xc-token': API_TOKEN,
                'Content-Type': 'application/json'
              },
              data: batch
            }
          );
          deletedCount += batch.length;
          console.log(`Progress: Deleted ${deletedCount}/${emptyRows.length} empty rows`);
        } catch (error) {
          errorCount += batch.length;
          console.error(`Batch ${i}-${i + batchSize} failed:`, error.response?.data || error.message);
        }
      }
    }

    console.log(`\n✅ Successfully deleted ${deletedCount} empty rows`);
    if (errorCount > 0) {
      console.log(`❌ Failed to delete ${errorCount} rows`);
    }

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

deleteEmptyRows();
