import { faker } from '@faker-js/faker';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Configuration
const NOCODB_URL = process.env.NOCODB_URL || 'http://10.0.0.39:8091';
const API_TOKEN = process.env.NOCODB_API_TOKEN;
const VEHICLES_TABLE_ID = process.env.VEHICLES_TABLE_ID;
const NUM_VEHICLES = parseInt(process.env.NUM_VEHICLES) || 50;

// Transmission types to choose from
const TRANSMISSION_TYPES = ['Automatic', 'Manual', 'CVT', 'Semi-Automatic'];

// Real vehicle make/model combinations
const VEHICLE_DATA = [
  { make: 'Honda', models: ['Accord', 'Civic', 'CR-V', 'Pilot', 'Odyssey'] },
  { make: 'Toyota', models: ['Camry', 'Corolla', 'RAV4', 'Highlander', 'Tacoma', 'Tundra'] },
  { make: 'Ford', models: ['F-150', 'Mustang', 'Explorer', 'Escape', 'Edge'] },
  { make: 'Chevrolet', models: ['Silverado', 'Malibu', 'Equinox', 'Tahoe', 'Camaro'] },
  { make: 'Nissan', models: ['Altima', 'Sentra', 'Rogue', 'Pathfinder', 'Frontier'] },
  { make: 'Jeep', models: ['Wrangler', 'Grand Cherokee', 'Cherokee', 'Compass', 'Gladiator'] },
  { make: 'BMW', models: ['3 Series', '5 Series', 'X3', 'X5', 'X7'] },
  { make: 'Mercedes-Benz', models: ['C-Class', 'E-Class', 'GLE', 'GLC', 'S-Class'] },
  { make: 'Audi', models: ['A4', 'A6', 'Q5', 'Q7', 'Q3'] },
  { make: 'Subaru', models: ['Outback', 'Forester', 'Crosstrek', 'Impreza', 'Ascent'] },
  { make: 'Mazda', models: ['CX-5', 'CX-9', 'Mazda3', 'Mazda6', 'MX-5 Miata'] },
  { make: 'Hyundai', models: ['Elantra', 'Sonata', 'Tucson', 'Santa Fe', 'Palisade'] },
  { make: 'Kia', models: ['Forte', 'Optima', 'Sorento', 'Sportage', 'Telluride'] },
  { make: 'Volkswagen', models: ['Jetta', 'Passat', 'Tiguan', 'Atlas', 'Golf'] },
  { make: 'Ram', models: ['1500', '2500', '3500', 'ProMaster'] },
];

// Validate configuration
if (!API_TOKEN) {
  console.error('Error: NOCODB_API_TOKEN is required in .env file');
  process.exit(1);
}

if (!VEHICLES_TABLE_ID) {
  console.error('Error: VEHICLES_TABLE_ID is required in .env file');
  console.error('\nPlease:');
  console.error('1. Make sure your vehicle-inventory table is created in NoCoDB');
  console.error('2. Copy the table ID from the URL');
  console.error('3. Add VEHICLES_TABLE_ID=your_table_id to your .env file');
  process.exit(1);
}

// Generate a single vehicle
function generateVehicle() {
  // Pick a random make
  const vehicleData = faker.helpers.arrayElement(VEHICLE_DATA);
  // Pick a random model from that make
  const model = faker.helpers.arrayElement(vehicleData.models);

  return {
    Make: vehicleData.make,
    Model: model,
    Year: faker.number.int({ min: 2000, max: 2025 }),
    Color: faker.vehicle.color(),
    Mileage: faker.number.int({ min: 1000, max: 150000 }),
    Transmission: faker.helpers.arrayElement(TRANSMISSION_TYPES)
  };
}

// Insert vehicles into NoCoDB
async function insertVehicles() {
  console.log(`Generating ${NUM_VEHICLES} fake vehicles...`);

  const vehicles = [];
  for (let i = 0; i < NUM_VEHICLES; i++) {
    vehicles.push(generateVehicle());
  }

  console.log(`\nSample vehicle:`);
  console.log(JSON.stringify(vehicles[0], null, 2));
  console.log(`\nInserting ${vehicles.length} vehicles into NoCoDB...`);

  try {
    let successCount = 0;
    let errorCount = 0;

    // Insert vehicles one by one
    for (let i = 0; i < vehicles.length; i++) {
      try {
        const response = await axios.post(
          `${NOCODB_URL}/api/v2/tables/${VEHICLES_TABLE_ID}/records`,
          vehicles[i],
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
          console.log(`Progress: ${i + 1}/${vehicles.length} vehicles inserted`);
        }
      } catch (error) {
        errorCount++;
        console.error(`Error inserting vehicle ${i + 1}:`, error.response?.data || error.message);
      }
    }

    console.log(`\n✅ Successfully inserted ${successCount} vehicles`);
    if (errorCount > 0) {
      console.log(`❌ Failed to insert ${errorCount} vehicles`);
    }

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    console.error('\nPlease check:');
    console.error('1. Your NoCoDB URL is correct');
    console.error('2. Your API token is valid');
    console.error('3. Your vehicles table ID is correct');
    console.error('4. The column names match (Make, Model, Year, Color, Mileage, Transmission)');
    process.exit(1);
  }
}

// Run the script
insertVehicles();
