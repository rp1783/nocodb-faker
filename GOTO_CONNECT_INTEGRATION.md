# GoTo Connect Integration Guide
## Using NoCoDB API with GoTo Connect Dial Plans

This guide explains how to integrate your NoCoDB API with GoTo Connect's HTTP Request node to create dynamic, data-driven call routing experiences.

## Table of Contents
- [Overview](#overview)
- [HTTP Request Node Basics](#http-request-node-basics)
- [API Authentication](#api-authentication)
- [Use Cases](#use-cases)
- [Example Dial Plans](#example-dial-plans)
- [Variable Reference](#variable-reference)
- [Troubleshooting](#troubleshooting)

---

## Overview

GoTo Connect's **HTTP Request** node allows your dial plan to:
- Trigger actions on remote systems
- Retrieve data from external APIs (like your NoCoDB database)
- Store retrieved data in variables for use later in the dial plan
- Make routing decisions based on real-time data

**Your API Base URL:** `https://api.6569.io` 

**Available Endpoints:**
- `/api/contacts` - Customer contact information
- `/api/cases` - Support case data
- `/api/employees` - Employee directory
- `/api/vehicles` - Vehicle inventory
- `/api/zipcodes` - US zip code data
- `/api/status` - Present/Away status

---

## HTTP Request Node Basics

### What It Does
The HTTP Request node in GoTo Connect:
1. **Sends an HTTP GET/POST request** to your API endpoint
2. **Receives JSON response** from your API
3. **Stores the response** in dial plan variables
4. **Continues** to the next node in your dial plan

### Configuration
When adding an HTTP Request node to your dial plan:

1. **URL**: Enter your full API endpoint URL with query parameters
2. **Method**: Usually GET for retrieving data
3. **Headers**: Add your API authentication
4. **Response Variables**: Map JSON fields to dial plan variables

---

## API Authentication

All API requests require an `X-API-Key` header.

**Your API Key:** `8f36298ff009ca297341b688a60d23e9b226526badef8352796c4af6efd4093a`

### Setting Up Headers in GoTo Connect

In the HTTP Request node configuration:
```
Header Name: X-API-Key
Header Value: 8f36298ff009ca297341b688a60d23e9b226526badef8352796c4af6efd4093a
```

---

## Use Cases

### Use Case 1: Customer Lookup by Phone Number

**Scenario:** When a customer calls, automatically look up their information and route based on VIP status or account balance.

**API Endpoint:**
```
https://api.6569.io/api/contacts?PhoneNumber={{caller_id}}
```

**Response Example:**
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "Id": 42,
      "Name": "John Smith",
      "Email": "john.smith@example.com",
      "PhoneNumber": "+15551234567",
      "AccountNumber": "ACC-12345",
      "VIP": "Yes",
      "Balance": 450.50,
      "Company": "Acme Corp"
    }
  ]
}
```

**Variables to Store:**
- `customer_name` → `data[0].Name`
- `customer_vip` → `data[0].VIP`
- `customer_balance` → `data[0].Balance`
- `account_number` → `data[0].AccountNumber`

**Dial Plan Flow:**
1. **HTTP Request** → Look up caller by phone number
2. **Conditional Routing** → If `customer_vip == "Yes"`, route to VIP queue
3. **Text-to-Speech** → "Hello {{customer_name}}, please hold while we connect you to our VIP team"

---

### Use Case 2: Account Balance Check

**Scenario:** Let customers check their account balance via phone using DTMF input.

**Dial Plan Flow:**

1. **Text-to-Speech** → "Please enter your account number followed by pound"
2. **Capture Digits (DTMF)** → Store in variable `account_input`
3. **HTTP Request** → Query API:
   ```
   https://api.6569.io/api/contacts?AccountNumber={{account_input}}
   ```
4. **Store Response:**
   - `account_balance` → `data[0].Balance`
   - `account_name` → `data[0].Name`
5. **Conditional Routing:**
   - If `account_balance > 0`: "Your current balance is ${{account_balance}}"
   - If `account_balance == 0`: "Your account is paid in full"
   - If no results: "Account not found, transferring to customer service"

---

### Use Case 3: Case Status Lookup

**Scenario:** Customers can check on their support case status by entering their case number.

**API Endpoint:**
```
https://api.6569.io/api/cases?CaseNumber={{case_number_input}}
```

**Response Example:**
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "Id": 15,
      "CaseNumber": "82906",
      "Status": "In Progress",
      "Priority": "High",
      "AssignedEmployee": "Jane Doe",
      "Subject": "System not working"
    }
  ]
}
```

**Dial Plan Flow:**
1. **Text-to-Speech** → "To check your case status, enter your case number"
2. **Capture Digits** → Store in `case_number_input`
3. **HTTP Request** → Query cases endpoint
4. **Text-to-Speech** → "Case {{case_number_input}} is currently {{case_status}}, assigned to {{assigned_employee}}"

---

### Use Case 4: Geographic Routing by Area Code

**Scenario:** Route calls to regional offices based on the caller's area code.

**API Endpoint:**
```
https://api.6569.io/api/zipcodes?Zip={{caller_zip}}
```

Or if you only have area code from caller ID:
```
https://api.6569.io/api/zipcodes?StateId=CA&limit=1
```

**Dial Plan Flow:**
1. **Extract area code** from `{{caller_id}}` (first 3 digits after country code)
2. **HTTP Request** → Look up state/region from zip code database
3. **Conditional Routing:**
   - If `StateId == "CA"` → Route to California office
   - If `StateId == "NY"` → Route to New York office
   - If `StateId == "TX"` → Route to Texas office
   - Else → Route to main office

---

### Use Case 5: Employee Directory

**Scenario:** Caller dials in and enters an employee extension or name to be connected.

**API Endpoint:**
```
https://api.6569.io/api/employees?Extension={{dialed_digits}}
```

Or search by name:
```
https://api.6569.io/api/employees?FullName_like={{search_term}}
```

**Response Example:**
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "Id": 5,
      "FullName": "Jane Doe",
      "Email": "jane.doe@company.com",
      "Extension": "1234",
      "Department": "Sales",
      "JobTitle": "Sales Manager"
    }
  ]
}
```

**Dial Plan Flow:**
1. **Capture Digits** → Store employee extension in `extension_input`
2. **HTTP Request** → Look up employee by extension
3. **Conditional Routing:**
   - If found: **Text-to-Speech** → "Connecting you to {{employee_name}} in {{department}}"
   - If not found: "Extension not found, routing to operator"

---

### Use Case 6: VIP Detection with Personalized Greeting

**Scenario:** Automatically detect VIP customers and provide white-glove service.

**API Endpoint:**
```
https://api.6569.io/api/contacts?PhoneNumber={{caller_id}}
```

**Dial Plan Flow:**
1. **HTTP Request** → Look up caller information
2. **Conditional Routing:**
   ```
   IF customer_vip == "Yes":
     → Text-to-Speech: "Welcome back {{customer_name}}, connecting you to our VIP support team"
     → Route to VIP Queue (priority)

   ELSE:
     → Text-to-Speech: "Thank you for calling. Please hold for the next available agent"
     → Route to General Queue
   ```

---

### Use Case 7: Outstanding Balance Alert

**Scenario:** Alert customers with outstanding balances when they call.

**API Endpoint:**
```
https://api.6569.io/api/contacts?PhoneNumber={{caller_id}}
```

**Dial Plan Flow:**
1. **HTTP Request** → Get customer balance
2. **Conditional Routing:**
   ```
   IF customer_balance >= 500:
     → Text-to-Speech: "We see you have an outstanding balance of ${{customer_balance}}.
                         Press 1 to make a payment, or press 2 to speak with billing"
     → Capture Digits → Route accordingly

   ELSE:
     → Continue to normal menu
   ```

---

## Example Dial Plans

### Example 1: Smart Customer Service Router

```
┌─────────────────┐
│   Call Arrives  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ HTTP Request                        │
│ URL: /api/contacts?                 │
│      PhoneNumber={{caller_id}}      │
│                                     │
│ Store Response:                     │
│ - customer_name                     │
│ - customer_vip                      │
│ - customer_balance                  │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ Conditional Routing                 │
│                                     │
│ Rule 1: customer_vip == "Yes"       │
│   → Route to VIP Queue              │
│                                     │
│ Rule 2: customer_balance > 500      │
│   → Route to Billing Team           │
│                                     │
│ Rule 3: No match found              │
│   → Route to New Customer Queue     │
│                                     │
│ Default: Route to General Queue     │
└─────────────────────────────────────┘
```

---

### Example 2: Self-Service Case Status

```
┌─────────────────┐
│   Call Arrives  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ Text-to-Speech                      │
│ "Welcome. To check a case status,   │
│  press 1. For other options,        │
│  press 2."                          │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ Capture Digits (DTMF)               │
│ Store in: menu_choice               │
│ Number of digits: 1                 │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ Conditional Routing                 │
│                                     │
│ IF menu_choice == "1"               │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ Text-to-Speech                      │
│ "Please enter your 5-digit case     │
│  number followed by pound"          │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ Capture Digits (DTMF)               │
│ Store in: case_number               │
│ Number of digits: 5                 │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ HTTP Request                        │
│ URL: /api/cases?                    │
│      CaseNumber={{case_number}}     │
│                                     │
│ Store Response:                     │
│ - case_status                       │
│ - case_assigned                     │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ Conditional Routing                 │
│                                     │
│ IF case_status exists:              │
│   → Text-to-Speech:                 │
│      "Your case is {{case_status}}, │
│       assigned to {{case_assigned}}"│
│                                     │
│ ELSE:                               │
│   → Text-to-Speech:                 │
│      "Case not found. Transferring  │
│       to customer service"          │
│   → Route to Agent                  │
└─────────────────────────────────────┘
```

---

## Variable Reference

### Common GoTo Connect Variables

**Note:** Variable names may differ based on your GoTo Connect configuration. Verify these in your admin panel.

| Variable | Description | Example Value |
|----------|-------------|---------------|
| `{{caller_id}}` | Caller's phone number | `+15551234567` |
| `{{caller_name}}` | Caller ID name | `JOHN SMITH` |
| `{{dialed_number}}` | Number that was called | `+18005551234` |
| `{{dialed_extension}}` | Extension dialed | `1234` |
| `{{call_id}}` | Unique call identifier | `abc123xyz` |
| `{{timestamp}}` | Call timestamp | `2025-03-02T15:30:00Z` |

### API Query Operators

Use these operators in your API URLs to filter results:

| Operator | Usage | Example |
|----------|-------|---------|
| Exact Match | `field=value` | `VIP=Yes` |
| Greater Than | `field_gt=value` | `Balance_gt=100` |
| Less Than | `field_lt=value` | `Balance_lt=500` |
| Greater or Equal | `field_gte=value` | `Balance_gte=0` |
| Less or Equal | `field_lte=value` | `Balance_lte=1000` |
| Contains (Like) | `field_like=value` | `Name_like=Smith` |

**Example URLs:**
```
# Find VIP customers
/api/contacts?VIP=Yes

# Find contacts with balance over $100
/api/contacts?Balance_gt=100

# Search for customers by name
/api/contacts?Name_like=Smith

# High priority cases
/api/cases?Priority=High

# Employees in Sales department
/api/employees?Department=Sales

# California zip codes
/api/zipcodes?StateId=CA&limit=50
```

---

## Response Handling

### Success Response Format

All API endpoints return this format:
```json
{
  "success": true,
  "count": 1,
  "data": [
    { ...record data... }
  ]
}
```

### Accessing Response Data

In your dial plan variables:

| JSON Path | Variable Mapping | Description |
|-----------|------------------|-------------|
| `success` | `api_success` | `true` if request succeeded |
| `count` | `api_count` | Number of records returned |
| `data[0].Name` | `customer_name` | First record's Name field |
| `data[0].Balance` | `customer_balance` | First record's Balance |
| `data[0].VIP` | `customer_vip` | First record's VIP status |

### Handling No Results

Always add a conditional check for when no records are found:

```
IF api_count == 0:
  → Text-to-Speech: "No record found"
  → Route to agent

ELSE:
  → Use the data
```

---

## Advanced Techniques

### 1. Chaining Multiple API Calls

You can make multiple HTTP requests in sequence:

```
Step 1: Look up customer by phone
  → GET /api/contacts?PhoneNumber={{caller_id}}
  → Store: account_number

Step 2: Look up open cases for that customer
  → GET /api/cases?AccountNumber={{account_number}}
  → Store: case_count

Step 3: Route based on data
  → IF case_count > 0: Route to support team familiar with their case
```

### 2. Dynamic Greeting Based on Time + Data

```
1. HTTP Request → Get customer info
2. Conditional Routing based on time of day + VIP status:

   IF hour >= 9 AND hour < 17 AND customer_vip == "Yes":
     → "Good day {{customer_name}}, connecting you to your dedicated account manager"

   ELIF hour >= 17 OR hour < 9:
     → "Hello {{customer_name}}, our office is currently closed, but as a VIP customer
         you have access to our after-hours support line. Connecting you now."

   ELSE:
     → Standard greeting
```

### 3. Multi-Factor Routing

Combine multiple data points for intelligent routing:

```
HTTP Request → Get customer data

Conditional Routing:

  Priority 1: VIP == "Yes" AND Balance > 1000
    → Route to Premium VIP Queue

  Priority 2: VIP == "Yes"
    → Route to VIP Queue

  Priority 3: Balance > 500 (outstanding)
    → Route to Collections

  Priority 4: Has open cases
    → Route to Support Team

  Default:
    → General Queue
```

---

## Troubleshooting

### Issue: "No data returned" or variables are empty

**Possible Causes:**
1. API endpoint URL is incorrect
2. Query parameter doesn't match any records
3. Authentication header is missing or incorrect
4. Variable mapping is incorrect

**Solutions:**
- Test the URL directly in a browser with `?` at the end: `https://api.6569.io/api/contacts?PhoneNumber=+15551234567`
- Verify your X-API-Key header is set correctly
- Check that GoTo Connect variable names match (e.g., `{{caller_id}}` vs `{{caller_number}}`)
- Use browser dev tools or Postman to test API responses

### Issue: HTTP Request times out

**Possible Causes:**
1. API server is down
2. Network connectivity issues
3. Firewall blocking the request

**Solutions:**
- Verify API is accessible: `curl https://api.6569.io/health`
- Check that Oracle Cloud instance is running
- Ensure port 3000 is open in your firewall

### Issue: Variables not being stored

**Possible Causes:**
1. JSON path is incorrect
2. Response format doesn't match expected structure
3. Field name is case-sensitive

**Solutions:**
- Verify the exact JSON response structure
- Field names are case-sensitive: `data[0].Name` not `data[0].name`
- Use `success` and `count` fields to verify data was returned

### Issue: Conditional routing not working

**Possible Causes:**
1. Variable comparison is case-sensitive
2. Data type mismatch (string vs number)
3. Variable is undefined

**Solutions:**
- VIP status is `"Yes"` not `"yes"` (case-sensitive)
- Balance comparisons: use numeric operators (`>`, `<`) not string comparison
- Always have a default/fallback route

---

## Testing Your Integration

### Step 1: Test API Directly

Use curl or your browser to verify the API works:

```bash
# Test with API key
curl -H "X-API-Key: 8f36298ff009ca297341b688a60d23e9b226526badef8352796c4af6efd4093a" \
  "https://api.6569.io/api/contacts?PhoneNumber=+15551234567"
```

### Step 2: Create Simple Test Dial Plan

Start with a basic test:
1. **HTTP Request** → `/api/contacts?limit=1`
2. **Text-to-Speech** → "Retrieved {{api_count}} records"
3. **Text-to-Speech** → "Customer name is {{customer_name}}"

If this works, you know:
- API is accessible from GoTo Connect
- Authentication is working
- Variable storage is working
- Text-to-speech can read variables

### Step 3: Add Conditional Logic

Once basic retrieval works, add routing:
1. **HTTP Request** → Get customer data
2. **Conditional Routing** → Based on VIP status
3. **Text-to-Speech** → Confirm which branch was taken

### Step 4: Test Edge Cases

- What happens when no records are found?
- What if the caller ID format doesn't match your database?
- What if the API is temporarily unavailable?

Always add fallback routes for error conditions.

---

## Security Considerations

### API Key Protection
- **Never** share your API key in public documentation
- Consider using environment variables or GoTo Connect's credential storage
- Rotate your API key periodically

### Data Privacy
- Only retrieve and announce non-sensitive information via text-to-speech
- Don't read full credit card numbers, SSNs, or passwords over the phone
- Consider compliance requirements (PCI DSS, HIPAA, etc.)

### Rate Limiting
- Your API currently has no rate limits, but consider adding them
- GoTo Connect may cache some HTTP request results
- For high-volume call centers, monitor API performance

---

## Next Steps

### Recommended Enhancements

1. **Add Error Handling**
   - Create a fallback route when API is unavailable
   - Log failed API calls for monitoring

2. **Implement Caching**
   - Cache frequently requested data to reduce API load
   - Use GoTo Connect's built-in caching if available

3. **Add More Endpoints**
   - Create custom API endpoints for specific dial plan needs
   - Combine multiple database queries into single endpoints

4. **Monitor and Optimize**
   - Track which API calls are slowest
   - Monitor API usage and call patterns
   - Optimize database queries for common lookups

5. **Expand Use Cases**
   - Implement callback scheduling
   - Add SMS notifications using retrieved data
   - Create custom reports from call + API data

---

## Support Resources

- **API Documentation**: See `API_GUIDE.md` in this repository
- **NoCoDB Instance**: http://161.153.8.91:8091
- **API Base URL**: https://api.6569.io
- **API Health Check**: https://api.6569.io/health
- **GoTo Connect Support**: https://support.goto.com/connect

---

## Appendix: Complete API Reference

### Contacts Endpoint
```
GET /api/contacts

Query Parameters:
- PhoneNumber (exact match)
- Name (exact or _like)
- Email (exact or _like)
- AccountNumber (exact)
- VIP (Yes/No)
- Balance (with _gt, _lt, _gte, _lte)
- Company (exact or _like)

Response Fields:
- Id, Name, Email, PhoneNumber
- AccountNumber, VIP, Balance, Company
- Address, City, State, ZipCode
- CreatedAt, UpdatedAt
```

### Cases Endpoint
```
GET /api/cases

Query Parameters:
- CaseNumber (exact)
- Status (exact)
- Priority (exact)
- Subject (exact or _like)

Response Fields:
- Id, CaseNumber, Status, Priority
- Subject, Description
- AssignedEmployee
- CreatedAt, UpdatedAt
```

### Employees Endpoint
```
GET /api/employees

Query Parameters:
- FullName (exact or _like)
- Email (exact)
- Extension (exact)
- Department (exact)
- JobTitle (exact)

Response Fields:
- Id, FullName, Email
- Extension, Department, JobTitle
- CreatedAt, UpdatedAt
```

### ZipCodes Endpoint
```
GET /api/zipcodes

Query Parameters:
- Zip (exact)
- City (exact or _like)
- StateId (exact, e.g., "CA")
- StateName (exact or _like)
- Population (with _gt, _lt, _gte, _lte)

Response Fields:
- Id, Zip, City
- StateId, StateName
- Latitude, Longitude
- Population, Density
- CountyName, Timezone
```

### Status Endpoint
```
GET /api/status

No parameters required.

Response:
{
  "success": true,
  "data": {
    "status": 1,
    "statusText": "Present",
    "lastUpdated": "2025-03-02T10:30:00Z"
  }
}

PUT /api/status
Toggles status between 0 (Away) and 1 (Present)
```

---

**Last Updated:** March 2, 2025
**Version:** 1.0
