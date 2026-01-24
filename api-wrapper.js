import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.API_PORT || 3000;

const NOCODB_URL = process.env.NOCODB_URL || 'http://10.0.0.39:8091';
const API_TOKEN = process.env.NOCODB_API_TOKEN;
const VEHICLES_TABLE_ID = process.env.VEHICLES_TABLE_ID;
const CONTACTS_TABLE_ID = process.env.TABLE_ID;
const EMPLOYEES_TABLE_ID = process.env.EMPLOYEES_TABLE_ID;
const CASES_TABLE_ID = process.env.CASES_TABLE_ID;
const API_KEY = process.env.NOCODB_WRAPPER_API_KEY;

// Middleware
app.use(express.json());

// API Key authentication middleware
function authenticateAPIKey(req, res, next) {
  // Skip auth for health and documentation endpoints
  if (req.path === '/health' || req.path === '/') {
    return next();
  }

  const providedKey = req.headers['x-api-key'];

  if (!providedKey) {
    return res.status(401).json({
      success: false,
      error: 'API key required. Please provide X-API-Key header.'
    });
  }

  if (providedKey !== API_KEY) {
    return res.status(403).json({
      success: false,
      error: 'Invalid API key.'
    });
  }

  next();
}

// Apply authentication to all routes
app.use(authenticateAPIKey);

// Helper function to build NoCoDB where clause
function buildWhereClause(params) {
  const conditions = [];

  for (const [key, value] of Object.entries(params)) {
    if (key === 'limit' || key === 'offset' || key === 'sort') continue;

    // Handle different comparison operators
    if (key.endsWith('_gt')) {
      const field = key.replace('_gt', '');
      conditions.push(`(${field},gt,${value})`);
    } else if (key.endsWith('_lt')) {
      const field = key.replace('_lt', '');
      conditions.push(`(${field},lt,${value})`);
    } else if (key.endsWith('_gte')) {
      const field = key.replace('_gte', '');
      conditions.push(`(${field},gte,${value})`);
    } else if (key.endsWith('_lte')) {
      const field = key.replace('_lte', '');
      conditions.push(`(${field},lte,${value})`);
    } else if (key.endsWith('_like')) {
      const field = key.replace('_like', '');
      conditions.push(`(${field},like,${value})`);
    } else {
      // Default to equals
      conditions.push(`(${key},eq,${value})`);
    }
  }

  return conditions.length > 0 ? conditions.join('~and') : null;
}

// Vehicle endpoints
app.get('/api/vehicles', async (req, res) => {
  try {
    const whereClause = buildWhereClause(req.query);
    const params = {
      limit: req.query.limit || 100,
      offset: req.query.offset || 0,
    };

    if (whereClause) {
      params.where = whereClause;
    }

    if (req.query.sort) {
      params.sort = req.query.sort;
    }

    const response = await axios.get(
      `${NOCODB_URL}/api/v2/tables/${VEHICLES_TABLE_ID}/records`,
      {
        headers: { 'xc-token': API_TOKEN },
        params
      }
    );

    res.json({
      success: true,
      count: response.data.list?.length || 0,
      data: response.data.list || []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message
    });
  }
});

// Contacts endpoints
app.get('/api/contacts', async (req, res) => {
  try {
    const whereClause = buildWhereClause(req.query);
    const params = {
      limit: req.query.limit || 100,
      offset: req.query.offset || 0,
    };

    if (whereClause) {
      params.where = whereClause;
    }

    if (req.query.sort) {
      params.sort = req.query.sort;
    }

    const response = await axios.get(
      `${NOCODB_URL}/api/v2/tables/${CONTACTS_TABLE_ID}/records`,
      {
        headers: { 'xc-token': API_TOKEN },
        params
      }
    );

    res.json({
      success: true,
      count: response.data.list?.length || 0,
      data: response.data.list || []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message
    });
  }
});

// Employees endpoints
app.get('/api/employees', async (req, res) => {
  try {
    const whereClause = buildWhereClause(req.query);
    const params = {
      limit: req.query.limit || 100,
      offset: req.query.offset || 0,
    };

    if (whereClause) {
      params.where = whereClause;
    }

    if (req.query.sort) {
      params.sort = req.query.sort;
    }

    const response = await axios.get(
      `${NOCODB_URL}/api/v2/tables/${EMPLOYEES_TABLE_ID}/records`,
      {
        headers: { 'xc-token': API_TOKEN },
        params
      }
    );

    res.json({
      success: true,
      count: response.data.list?.length || 0,
      data: response.data.list || []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message
    });
  }
});

// Cases endpoints
app.get('/api/cases', async (req, res) => {
  try {
    const whereClause = buildWhereClause(req.query);
    const params = {
      limit: req.query.limit || 100,
      offset: req.query.offset || 0,
    };

    if (whereClause) {
      params.where = whereClause;
    }

    if (req.query.sort) {
      params.sort = req.query.sort;
    }

    const response = await axios.get(
      `${NOCODB_URL}/api/v2/tables/${CASES_TABLE_ID}/records`,
      {
        headers: { 'xc-token': API_TOKEN },
        params
      }
    );

    res.json({
      success: true,
      count: response.data.list?.length || 0,
      data: response.data.list || []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Documentation endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'NoCoDB API Wrapper',
    endpoints: {
      vehicles: 'GET /api/vehicles',
      contacts: 'GET /api/contacts',
      employees: 'GET /api/employees',
      cases: 'GET /api/cases'
    },
    examples: {
      'All BMWs': '/api/vehicles?Make=BMW',
      'BMW X5 models': '/api/vehicles?Make=BMW&Model=X5',
      'Vehicles from 2020+': '/api/vehicles?Year_gte=2020',
      'Low mileage (<50k)': '/api/vehicles?Mileage_lt=50000',
      'Automatic transmission': '/api/vehicles?Transmission=Automatic',
      'VIP contacts': '/api/contacts?VIP=Yes',
      'Managers only': '/api/employees?JobTitle=Manager',
      'Search by name': '/api/contacts?Name_like=John',
      'All cases': '/api/cases',
      'Case by number': '/api/cases?CaseNumber=52236',
      'Sort by year': '/api/vehicles?sort=-Year',
      'Pagination': '/api/vehicles?limit=10&offset=0'
    },
    operators: {
      'exact match': 'field=value',
      'greater than': 'field_gt=value',
      'less than': 'field_lt=value',
      'greater or equal': 'field_gte=value',
      'less or equal': 'field_lte=value',
      'contains': 'field_like=value'
    }
  });
});

app.listen(PORT, () => {
  console.log(`\n✅ API Wrapper running on http://localhost:${PORT}`);
  console.log(`\nExample queries:`);
  console.log(`  http://localhost:${PORT}/api/vehicles?Make=BMW`);
  console.log(`  http://localhost:${PORT}/api/vehicles?Year_gte=2020`);
  console.log(`  http://localhost:${PORT}/api/contacts?VIP=Yes`);
  console.log(`  http://localhost:${PORT}/api/employees?JobTitle=Manager`);
  console.log(`  http://localhost:${PORT}/api/cases?CaseNumber=52236`);
  console.log(`\nVisit http://localhost:${PORT}/ for full documentation\n`);
});
