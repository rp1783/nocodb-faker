import axios from 'axios';
import csv from 'csv-parser';
import https from 'https';
import dotenv from 'dotenv';

dotenv.config();

const NOCODB_URL = process.env.NOCODB_URL || 'http://localhost:8080';
const API_TOKEN = process.env.NOCODB_API_TOKEN;
const BASE_ID = 'pqdvpqhfx2l3dw1'; // Getting Started base

async function createZipCodesTable() {
  console.log('Creating ZipCodes table...');

  const tableResponse = await axios.post(
    `${NOCODB_URL}/api/v2/meta/bases/${BASE_ID}/tables`,
    {
      table_name: 'zipcodes',
      title: 'ZipCodes',
      columns: [
        {
          column_name: 'id',
          title: 'Id',
          uidt: 'ID',
          pk: true
        },
        {
          column_name: 'zip',
          title: 'Zip',
          uidt: 'SingleLineText'
        },
        {
          column_name: 'lat',
          title: 'Latitude',
          uidt: 'Decimal',
          dt: 'decimal',
          dtxp: '10,6'
        },
        {
          column_name: 'lng',
          title: 'Longitude',
          uidt: 'Decimal',
          dt: 'decimal',
          dtxp: '10,6'
        },
        {
          column_name: 'city',
          title: 'City',
          uidt: 'SingleLineText'
        },
        {
          column_name: 'state_id',
          title: 'StateId',
          uidt: 'SingleLineText'
        },
        {
          column_name: 'state_name',
          title: 'StateName',
          uidt: 'SingleLineText'
        },
        {
          column_name: 'zcta',
          title: 'ZCTA',
          uidt: 'SingleLineText'
        },
        {
          column_name: 'parent_zcta',
          title: 'ParentZCTA',
          uidt: 'SingleLineText'
        },
        {
          column_name: 'population',
          title: 'Population',
          uidt: 'Number',
          dt: 'integer'
        },
        {
          column_name: 'density',
          title: 'Density',
          uidt: 'Decimal',
          dt: 'decimal',
          dtxp: '10,2'
        },
        {
          column_name: 'county_fips',
          title: 'CountyFIPS',
          uidt: 'SingleLineText'
        },
        {
          column_name: 'county_name',
          title: 'CountyName',
          uidt: 'SingleLineText'
        },
        {
          column_name: 'all_county_weights',
          title: 'AllCountyWeights',
          uidt: 'LongText'
        },
        {
          column_name: 'imprecise',
          title: 'Imprecise',
          uidt: 'Checkbox'
        },
        {
          column_name: 'military',
          title: 'Military',
          uidt: 'Checkbox'
        },
        {
          column_name: 'timezone',
          title: 'Timezone',
          uidt: 'SingleLineText'
        }
      ]
    },
    {
      headers: {
        'xc-token': API_TOKEN
      }
    }
  );

  console.log('ZipCodes table created successfully!');
  console.log('Table ID:', tableResponse.data.id);
  return tableResponse.data.id;
}

async function downloadAndParseCSV() {
  return new Promise((resolve, reject) => {
    const records = [];
    const csvUrl = 'https://raw.githubusercontent.com/akinniyi/US-Zip-Codes-With-City-State/master/uszips.csv';

    console.log('Downloading CSV from GitHub...');

    https.get(csvUrl, (response) => {
      response
        .pipe(csv())
        .on('data', (row) => {
          records.push({
            zip: row.zip,
            lat: parseFloat(row.lat) || null,
            lng: parseFloat(row.lng) || null,
            city: row.city,
            state_id: row.state_id,
            state_name: row.state_name,
            zcta: row.zcta,
            parent_zcta: row.parent_zcta,
            population: parseInt(row.population) || null,
            density: parseFloat(row.density) || null,
            county_fips: row.county_fips,
            county_name: row.county_name,
            all_county_weights: row.all_county_weights,
            imprecise: row.imprecise === 'True' || row.imprecise === '1',
            military: row.military === 'True' || row.military === '1',
            timezone: row.timezone
          });
        })
        .on('end', () => {
          console.log(`CSV parsed successfully! Total records: ${records.length}`);
          resolve(records);
        })
        .on('error', (error) => {
          reject(error);
        });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

async function importRecords(tableId, records) {
  console.log(`Importing ${records.length} zip code records...`);

  // Import in batches of 100 to avoid overwhelming the API
  const batchSize = 100;
  let imported = 0;

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);

    try {
      await axios.post(
        `${NOCODB_URL}/api/v2/tables/${tableId}/records`,
        batch,
        {
          headers: {
            'xc-token': API_TOKEN
          }
        }
      );

      imported += batch.length;
      console.log(`Imported ${imported}/${records.length} records (${Math.round(imported/records.length*100)}%)`);
    } catch (error) {
      console.error(`Error importing batch ${i}-${i+batchSize}:`, error.response?.data || error.message);
    }
  }

  console.log('Import completed!');
}

async function main() {
  try {
    // Step 1: Create the table
    const tableId = await createZipCodesTable();

    // Step 2: Download and parse the CSV
    const records = await downloadAndParseCSV();

    // Step 3: Import all records
    await importRecords(tableId, records);

    console.log('\n✅ ZipCodes table created and populated successfully!');
    console.log(`📊 Total records imported: ${records.length}`);
    console.log(`🔑 Table ID: ${tableId}`);
    console.log('\nYou can now query zip codes through the API!');

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    process.exit(1);
  }
}

main();
