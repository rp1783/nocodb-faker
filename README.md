# NoCoDB Fake Data Generator & API Wrapper

A comprehensive toolkit for generating realistic fake data and providing a clean REST API wrapper for NoCoDB. This project includes faker.js scripts to populate multiple relational tables and an Express-based API server that translates simple query parameters into NoCoDB's query format.

## 🚀 Features

- **Fake Data Generation** using faker.js for realistic test data
- **Relational Database Support** with linked tables
- **Clean REST API** with standard query parameters (no complex NoCoDB syntax)
- **4 Pre-configured Tables**: Contacts, Employees, Vehicles, Cases
- **Automatic Column Creation** with proper data types and relationships
- **API Wrapper** that simplifies NoCoDB's query interface

## 📋 Tables & Data

### 1. Contacts (100 records)
- Name
- Email
- Phone
- City
- State
- VIP (Yes/No)

### 2. Employees (20 records)
- Name
- JobTitle (Customer Service, Supervisor, Manager)
- Extension (4-digit)

### 3. Vehicles (50 records)
- Make (15+ manufacturers)
- Model (realistic make/model combinations)
- Year (2000-2025)
- Color
- Mileage (1,000-150,000)
- Transmission (Automatic, Manual, CVT, Semi-Automatic)

### 4. Cases (30 records)
- CaseNumber (5-digit unique number)
- Contact (linked to Contacts table)
- AssignedTo (linked to Employees table)

## 🛠️ Installation

1. **Clone the repository:**
```bash
git clone https://github.com/YOUR_USERNAME/nocodb-faker.git
cd nocodb-faker
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment:**
```bash
cp .env.example .env
```

4. **Edit `.env` file with your NoCoDB details:**
```env
NOCODB_URL=http://10.0.0.39:8091
NOCODB_API_TOKEN=your_api_token_here

# Table IDs (get these from NoCoDB URLs)
TABLE_ID=your_contacts_table_id
EMPLOYEES_TABLE_ID=your_employees_table_id
VEHICLES_TABLE_ID=your_vehicles_table_id
CASES_TABLE_ID=your_cases_table_id

# Generation settings
NUM_CONTACTS=100
NUM_EMPLOYEES=20
NUM_VEHICLES=50
NUM_CASES=30

# API Wrapper
API_PORT=3000
```

## 📊 Usage

### Creating Tables & Generating Data

**Contacts Table:**
```bash
node create-columns.js          # Create columns
node generate-contacts.js       # Generate 100 contacts
```

**Employees Table:**
```bash
node create-employee-columns.js  # Create columns
node generate-employees.js       # Generate 20 employees
```

**Vehicles Table:**
```bash
node create-vehicle-columns.js   # Create columns
node fix-transmission-column.js  # Configure transmission options
node generate-vehicles.js        # Generate 50 vehicles
```

**Cases Table (Relational):**
```bash
node create-case-columns.js      # Create columns with relationships
node generate-cases.js           # Generate 30 cases
node fix-display-values-v2.js    # Fix display values to show names
```

### Utility Scripts

```bash
node delete-empty-rows.js        # Clean up empty rows
node delete-all-vehicles.js      # Remove all vehicles
node add-year-column.js          # Add Year column to vehicles
node debug-display-value.js      # Check display value settings
```

## 🌐 API Wrapper

### Starting the API Server

```bash
npm run api
```

Server runs at `http://localhost:3000`

### API Endpoints

**Base Endpoints:**
- `GET /api/vehicles` - Vehicle inventory
- `GET /api/contacts` - Contact information
- `GET /api/employees` - Employee data
- `GET /api/cases` - Cases with relationships
- `GET /health` - Health check
- `GET /` - API documentation

### Query Examples

**Vehicles:**
```bash
# All BMWs
curl "http://localhost:3000/api/vehicles?Make=BMW"

# BMW X5 models
curl "http://localhost:3000/api/vehicles?Make=BMW&Model=X5"

# Vehicles from 2020 or newer
curl "http://localhost:3000/api/vehicles?Year_gte=2020"

# Low mileage (under 50,000)
curl "http://localhost:3000/api/vehicles?Mileage_lt=50000"

# Automatic transmission
curl "http://localhost:3000/api/vehicles?Transmission=Automatic"
```

**Contacts:**
```bash
# VIP contacts only
curl "http://localhost:3000/api/contacts?VIP=Yes"

# California contacts
curl "http://localhost:3000/api/contacts?State=California"

# Search by name
curl "http://localhost:3000/api/contacts?Name_like=John"
```

**Employees:**
```bash
# Managers only
curl "http://localhost:3000/api/employees?JobTitle=Manager"

# Extensions 5000+
curl "http://localhost:3000/api/employees?Extension_gte=5000"
```

**Cases:**
```bash
# All cases (includes linked contact and employee data)
curl "http://localhost:3000/api/cases"

# Specific case number
curl "http://localhost:3000/api/cases?CaseNumber=52236"
```

### Query Operators

| Operator | Parameter Format | Example |
|----------|-----------------|---------|
| Exact match | `field=value` | `Make=BMW` |
| Greater than | `field_gt=value` | `Year_gt=2020` |
| Less than | `field_lt=value` | `Mileage_lt=50000` |
| Greater or equal | `field_gte=value` | `Year_gte=2020` |
| Less or equal | `field_lte=value` | `Mileage_lte=100000` |
| Contains | `field_like=value` | `Name_like=John` |

### Pagination & Sorting

```bash
# Pagination
curl "http://localhost:3000/api/vehicles?limit=10&offset=0"

# Sort ascending
curl "http://localhost:3000/api/vehicles?sort=Year"

# Sort descending (use - prefix)
curl "http://localhost:3000/api/vehicles?sort=-Year"
```

## 🐳 Docker Deployment (Unraid)

### Option 1: Docker Compose

Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  nocodb-api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NOCODB_URL=http://nocodb:8091
      - NOCODB_API_TOKEN=${NOCODB_API_TOKEN}
      - TABLE_ID=${TABLE_ID}
      - EMPLOYEES_TABLE_ID=${EMPLOYEES_TABLE_ID}
      - VEHICLES_TABLE_ID=${VEHICLES_TABLE_ID}
      - CASES_TABLE_ID=${CASES_TABLE_ID}
    restart: unless-stopped
```

### Option 2: Dockerfile

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "api"]
```

## 🔒 Reverse Proxy Setup

### Nginx Proxy Manager

```nginx
server {
    listen 80;
    server_name nocodb-api.yourdomain.com;

    location / {
        proxy_pass http://10.0.0.39:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Traefik

```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.nocodb-api.rule=Host(`nocodb-api.yourdomain.com`)"
  - "traefik.http.services.nocodb-api.loadbalancer.server.port=3000"
```

## 📝 Response Format

All API responses follow this format:

```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "Id": 18,
      "Make": "BMW",
      "Model": "X3",
      "Year": 2025,
      "Color": "olive",
      "Mileage": 87414,
      "Transmission": "Automatic"
    }
  ]
}
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use this project however you'd like!

## 🙏 Acknowledgments

- [NoCoDB](https://github.com/nocodb/nocodb) - The amazing open-source Airtable alternative
- [Faker.js](https://github.com/faker-js/faker) - For generating realistic fake data
- [Express](https://expressjs.com/) - Fast, unopinionated web framework

## 📧 Contact

Questions or issues? Please open an issue on GitHub.

---

🤖 **Built with assistance from Claude Code**
