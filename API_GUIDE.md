# API Guide - NoCoDB Wrapper API

Complete guide to using the NoCoDB REST API wrapper for querying contacts, vehicles, employees, and cases.

## 🔗 Base URL

```
https://api.6569.io
```

## 🔐 Authentication

All API endpoints (except `/health` and `/`) require authentication using an API key.

**Header Required:**
```
X-API-Key: your_api_key_here
```

**Example:**
```bash
curl -H "X-API-Key: your_api_key_here" "https://api.6569.io/api/contacts"
```

## 📋 Available Endpoints

| Endpoint | Description | Returns |
|----------|-------------|---------|
| `GET /health` | Health check | Server status (no auth required) |
| `GET /` | API documentation | List of endpoints and examples (no auth required) |
| `GET /api/contacts` | Customer contacts | Contact records with account numbers |
| `GET /api/vehicles` | Vehicle inventory | Vehicle records with details |
| `GET /api/employees` | Employee directory | Employee records with job titles |
| `GET /api/cases` | Case management | Cases with linked contacts and employees |

## 🔍 Query Operators

All endpoints support the following query operators:

| Operator | Format | Description | Example |
|----------|--------|-------------|---------|
| **Exact Match** | `field=value` | Exact equality | `?VIP=Yes` |
| **Greater Than** | `field_gt=value` | Greater than | `?Year_gt=2020` |
| **Less Than** | `field_lt=value` | Less than | `?Mileage_lt=50000` |
| **Greater or Equal** | `field_gte=value` | Greater than or equal | `?AccountNumber_gte=23600` |
| **Less or Equal** | `field_lte=value` | Less than or equal | `?Year_lte=2025` |
| **Contains** | `field_like=value` | Partial match | `?Name_like=John` |

### Pagination

| Parameter | Description | Default |
|-----------|-------------|---------|
| `limit` | Maximum records to return | 100 |
| `offset` | Number of records to skip | 0 |

### Sorting

| Parameter | Format | Description |
|-----------|--------|-------------|
| `sort` | `field` | Sort ascending | `?sort=Name` |
| `sort` | `-field` | Sort descending | `?sort=-Year` |

## 📞 Contacts API

### Endpoint
```
GET /api/contacts
```

### Fields
- `Id` - Unique identifier
- `Name` - Contact name
- `Email` - Email address
- `Phone` - Phone number
- `City` - City
- `State` - State
- `VIP` - VIP status (Yes/No)
- `AccountNumber` - Customer account number

### Examples

**Get all contacts:**
```bash
curl -H "X-API-Key: your_api_key" "https://api.6569.io/api/contacts"
```

**Get VIP contacts only:**
```bash
curl -H "X-API-Key: your_api_key" "https://api.6569.io/api/contacts?VIP=Yes"
```

**Find contact by account number:**
```bash
curl -H "X-API-Key: your_api_key" "https://api.6569.io/api/contacts?AccountNumber=23594"
```

**Search by name:**
```bash
curl -H "X-API-Key: your_api_key" "https://api.6569.io/api/contacts?Name_like=Smith"
```

**Contacts in California:**
```bash
curl -H "X-API-Key: your_api_key" "https://api.6569.io/api/contacts?State=California"
```

**Account numbers >= 23600:**
```bash
curl -H "X-API-Key: your_api_key" "https://api.6569.io/api/contacts?AccountNumber_gte=23600"
```

**VIP contacts in California:**
```bash
curl -H "X-API-Key: your_api_key" "https://api.6569.io/api/contacts?VIP=Yes&State=California"
```

**Paginated results (10 per page):**
```bash
curl -H "X-API-Key: your_api_key" "https://api.6569.io/api/contacts?limit=10&offset=0"
```

**Sort by name:**
```bash
curl -H "X-API-Key: your_api_key" "https://api.6569.io/api/contacts?sort=Name"
```

## 🚗 Vehicles API

### Endpoint
```
GET /api/vehicles
```

### Fields
- `Id` - Unique identifier
- `Make` - Vehicle manufacturer
- `Model` - Vehicle model
- `Year` - Model year
- `Color` - Vehicle color
- `Mileage` - Odometer reading
- `Transmission` - Transmission type (Automatic, Manual, CVT, Semi-Automatic)

### Examples

**Get all vehicles:**
```bash
curl -H "X-API-Key: your_api_key" "https://api.6569.io/api/vehicles"
```

**All BMW vehicles:**
```bash
curl -H "X-API-Key: your_api_key" "https://api.6569.io/api/vehicles?Make=BMW"
```

**BMW X5 models:**
```bash
curl -H "X-API-Key: your_api_key" "https://api.6569.io/api/vehicles?Make=BMW&Model=X5"
```

**Vehicles from 2020 or newer:**
```bash
curl -H "X-API-Key: your_api_key" "https://api.6569.io/api/vehicles?Year_gte=2020"
```

**Low mileage vehicles (< 50,000):**
```bash
curl -H "X-API-Key: your_api_key" "https://api.6569.io/api/vehicles?Mileage_lt=50000"
```

**Automatic transmission only:**
```bash
curl -H "X-API-Key: your_api_key" "https://api.6569.io/api/vehicles?Transmission=Automatic"
```

**Red vehicles:**
```bash
curl -H "X-API-Key: your_api_key" "https://api.6569.io/api/vehicles?Color=red"
```

**Recent low-mileage automatics:**
```bash
curl -H "X-API-Key: your_api_key" "https://api.6569.io/api/vehicles?Year_gte=2020&Mileage_lt=30000&Transmission=Automatic"
```

**Sort by year (newest first):**
```bash
curl -H "X-API-Key: your_api_key" "https://api.6569.io/api/vehicles?sort=-Year"
```

**Sort by mileage (lowest first):**
```bash
curl -H "X-API-Key: your_api_key" "https://api.6569.io/api/vehicles?sort=Mileage"
```

## 👥 Employees API

### Endpoint
```
GET /api/employees
```

### Fields
- `Id` - Unique identifier
- `Name` - Employee name
- `JobTitle` - Job title (Customer Service, Supervisor, Manager)
- `Extension` - Phone extension (4-digit)

### Examples

**Get all employees:**
```bash
curl -H "X-API-Key: your_api_key" "https://api.6569.io/api/employees"
```

**Managers only:**
```bash
curl -H "X-API-Key: your_api_key" "https://api.6569.io/api/employees?JobTitle=Manager"
```

**Customer Service reps:**
```bash
curl -H "X-API-Key: your_api_key" "https://api.6569.io/api/employees?JobTitle=Customer%20Service"
```

**Extensions >= 5000:**
```bash
curl -H "X-API-Key: your_api_key" "https://api.6569.io/api/employees?Extension_gte=5000"
```

**Search by name:**
```bash
curl -H "X-API-Key: your_api_key" "https://api.6569.io/api/employees?Name_like=Smith"
```

**Sort by name:**
```bash
curl -H "X-API-Key: your_api_key" "https://api.6569.io/api/employees?sort=Name"
```

## 📋 Cases API

### Endpoint
```
GET /api/cases
```

### Fields
- `Id` - Unique identifier
- `CaseNumber` - 5-digit case number
- `Contact` - Linked contact information
  - `Id` - Contact ID
  - `Name` - Contact name
- `AssignedTo` - Assigned employee information
  - `Id` - Employee ID
  - `Name` - Employee name
- Full contact details available in `nc_839k___nc_m2m_cases_customer-contacs` array
- Full employee details available in `nc_839k___nc_m2m_cases_employees` array

### Examples

**Get all cases:**
```bash
curl -H "X-API-Key: your_api_key" "https://api.6569.io/api/cases"
```

**Find specific case by case number:**
```bash
curl -H "X-API-Key: your_api_key" "https://api.6569.io/api/cases?CaseNumber=82906"
```

**Cases with case number >= 80000:**
```bash
curl -H "X-API-Key: your_api_key" "https://api.6569.io/api/cases?CaseNumber_gte=80000"
```

**Sort by case number:**
```bash
curl -H "X-API-Key: your_api_key" "https://api.6569.io/api/cases?sort=-CaseNumber"
```

**Paginated cases:**
```bash
curl -H "X-API-Key: your_api_key" "https://api.6569.io/api/cases?limit=10&offset=0"
```

## 📊 Response Format

All successful responses follow this format:

```json
{
  "success": true,
  "count": 2,
  "data": [
    { /* record 1 */ },
    { /* record 2 */ }
  ]
}
```

### Example Response - Contact

```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "Id": 101,
      "Name": "Ludwig Moen",
      "Email": "Ludwig.Moen41@gmail.com",
      "Phone": "1-396-531-3329 x03716",
      "City": "West Hartford",
      "State": "Washington",
      "VIP": "No",
      "AccountNumber": 23594
    }
  ]
}
```

### Example Response - Case

```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "Id": 4,
      "CaseNumber": 82906,
      "Contact": [
        {
          "Id": 149,
          "Name": "Leonie Gerlach"
        }
      ],
      "AssignedTo": [
        {
          "Id": 14,
          "Name": "Clementina Haley"
        }
      ],
      "nc_839k___nc_m2m_cases_customer-contacs": [
        {
          "customer-contacts": {
            "Id": 149,
            "Name": "Leonie Gerlach",
            "Email": "Leonie_Gerlach@yahoo.com",
            "Phone": "1-899-965-9937 x309",
            "City": "Astridville",
            "State": "Utah",
            "VIP": "No",
            "AccountNumber": 23642
          }
        }
      ],
      "nc_839k___nc_m2m_cases_employees": [
        {
          "employees": {
            "Id": 14,
            "Name": "Clementina Haley",
            "Extension": 9348,
            "JobTitle": "Manager"
          }
        }
      ]
    }
  ]
}
```

## ❌ Error Responses

### 401 Unauthorized - Missing API Key
```json
{
  "success": false,
  "error": "API key required. Please provide X-API-Key header."
}
```

### 403 Forbidden - Invalid API Key
```json
{
  "success": false,
  "error": "Invalid API key."
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Error message details"
}
```

## 💻 Code Examples

### JavaScript (Fetch)

```javascript
const API_KEY = 'your_api_key_here';
const BASE_URL = 'https://api.6569.io';

async function getContacts(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const url = `${BASE_URL}/api/contacts?${queryString}`;

  const response = await fetch(url, {
    headers: {
      'X-API-Key': API_KEY
    }
  });

  return await response.json();
}

// Usage
const vipContacts = await getContacts({ VIP: 'Yes' });
const contact = await getContacts({ AccountNumber: 23594 });
```

### Python (requests)

```python
import requests

API_KEY = 'your_api_key_here'
BASE_URL = 'https://api.6569.io'

def get_contacts(params=None):
    headers = {'X-API-Key': API_KEY}
    response = requests.get(
        f'{BASE_URL}/api/contacts',
        headers=headers,
        params=params
    )
    return response.json()

# Usage
vip_contacts = get_contacts({'VIP': 'Yes'})
contact = get_contacts({'AccountNumber': 23594})
```

### PHP

```php
<?php
$apiKey = 'your_api_key_here';
$baseUrl = 'https://api.6569.io';

function getContacts($params = []) {
    global $apiKey, $baseUrl;

    $queryString = http_build_query($params);
    $url = "$baseUrl/api/contacts?$queryString";

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "X-API-Key: $apiKey"
    ]);

    $response = curl_exec($ch);
    curl_close($ch);

    return json_decode($response, true);
}

// Usage
$vipContacts = getContacts(['VIP' => 'Yes']);
$contact = getContacts(['AccountNumber' => 23594]);
?>
```

### cURL (Command Line)

```bash
# Set your API key
API_KEY="your_api_key_here"

# Get VIP contacts
curl -H "X-API-Key: $API_KEY" \
  "https://api.6569.io/api/contacts?VIP=Yes"

# Find contact by account number
curl -H "X-API-Key: $API_KEY" \
  "https://api.6569.io/api/contacts?AccountNumber=23594"

# Get recent vehicles
curl -H "X-API-Key: $API_KEY" \
  "https://api.6569.io/api/vehicles?Year_gte=2020&sort=-Year"

# Get specific case
curl -H "X-API-Key: $API_KEY" \
  "https://api.6569.io/api/cases?CaseNumber=82906"
```

## 🔗 Combining Queries

You can combine multiple query parameters:

```bash
# VIP contacts in California with account >= 23600
curl -H "X-API-Key: your_api_key" \
  "https://api.6569.io/api/contacts?VIP=Yes&State=California&AccountNumber_gte=23600"

# Recent BMW vehicles with low mileage, automatic transmission
curl -H "X-API-Key: your_api_key" \
  "https://api.6569.io/api/vehicles?Make=BMW&Year_gte=2020&Mileage_lt=30000&Transmission=Automatic"

# Managers with extensions >= 9000
curl -H "X-API-Key: your_api_key" \
  "https://api.6569.io/api/employees?JobTitle=Manager&Extension_gte=9000"
```

## 📈 Best Practices

1. **Always use HTTPS** - The API enforces HTTPS
2. **Include API key in headers** - Never put API keys in URLs
3. **Use pagination** - For large datasets, use `limit` and `offset`
4. **Cache responses** - Cache data when appropriate to reduce API calls
5. **Handle errors gracefully** - Check `success` field in responses
6. **URL encode parameters** - Encode special characters in query parameters
7. **Use specific queries** - Be as specific as possible to reduce response size

## 🆘 Support

For issues or questions:
- Check response `error` field for details
- Verify API key is correct
- Ensure query parameters are properly formatted
- Check `/health` endpoint to verify API is running

## 📝 Rate Limiting

Currently, there are no rate limits enforced. However, please use the API responsibly to ensure good performance for all users.

---

**Last Updated:** February 2026
**API Version:** 1.0
**Base URL:** https://api.6569.io

🤖 Generated with Claude Code
