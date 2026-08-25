# Members Table Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Execution note:** Task 1 generates a live, non-deterministic value (a real NoCoDB table ID from the production instance) that Tasks 2 and 3 depend on via the local, gitignored `.env` file. Do **not** run these tasks in isolated git worktrees — the local `.env` must persist on the same filesystem across Tasks 1–3, or each task will lose the table ID the previous one produced. If using subagent-driven-development, dispatch without worktree isolation, or run inline via executing-plans.

**Goal:** Add a `Members` table (insurance-style `MemberID` + `FirstName` + `LastName`, 50 fake records) to the live NoCoDB instance, exposed at `GET /api/members` with the same query/filter/pagination behavior as every other endpoint in `api-wrapper.js`.

**Architecture:** Follow the repo's existing per-table pattern exactly: a one-time schema script creates the table via NoCoDB's meta API, a one-time data-gen script bulk-inserts fake records via faker.js, and a new Express route in `api-wrapper.js` exposes it. Table creation and data generation are run manually against production (as every other table in this repo was), not part of the CI/CD deploy pipeline.

**Tech Stack:** Node.js (ES modules), `@faker-js/faker`, `axios`, `express`, NoCoDB v2 API.

## Global Constraints

- `MemberID` format: fixed prefix `HX` + 9 random digits (`faker.string.numeric(9)`), e.g. `HX123456789` — unique within the 50 generated records.
- Table: `table_name: 'members'`, `title: 'Members'`, columns `Id` (auto PK), `MemberID`, `FirstName`, `LastName` (all `SingleLineText` except `Id`).
- NoCoDB base ID: `pqdvpqhfx2l3dw1` (the "Getting Started" base — confirmed via `GET /api/v2/meta/bases` as the only base on this instance).
- 50 records by default (`NUM_MEMBERS` env var), inserted via a single batch `POST` (array body), not one-by-one.
- New route `GET /api/members` must match the existing boilerplate exactly: `buildWhereClause(req.query)` filtering, `limit`/`offset`/`sort` query params, response shape `{ success, count, data }`.
- `docker-compose.yml` must forward `MEMBERS_TABLE_ID` and `NUM_MEMBERS` into the `nocodb-api` container's environment — and, fixing a pre-existing gap found during design, also forward `ZIPCODES_TABLE_ID` and `STATUS_TABLE_ID` (currently read by `api-wrapper.js` but never forwarded, so `/api/zipcodes` and `/api/status` silently run with `undefined` table IDs in production).
- No test framework exists in this repo (confirmed: no test files, no test runner in `package.json`). "Testing" in this plan means running the real scripts against the live production NoCoDB instance and verifying with `curl`, consistent with how every other table in this repo was built and verified.
- Production host: SSH alias `oci` (`ubuntu@161.153.8.91`), repo at `~/nocodb-faker` on the VM. The VM host has no local Node.js install — schema/data-gen scripts run from the local dev machine through an SSH tunnel to the VM's NoCoDB port (8091), never on the VM itself.
- Public API base URL (documented in `docs/API_GUIDE.md`): `https://api.6569.io`.

---

### Task 1: Create the Members table on the live NoCoDB instance

**Files:**
- Create: `scripts/schema/create-members-table.js`
- Create (local only, gitignored, not committed): `.env`

**Interfaces:**
- Consumes: nothing from prior tasks (first task).
- Produces: a live `MEMBERS_TABLE_ID` value (printed to console on success) that Task 2 and Task 3 read from the local `.env` file. **After running this task, the concrete ID must be appended to local `.env` as `MEMBERS_TABLE_ID=<id>` before starting Task 2.**

- [ ] **Step 1: Install dependencies locally**

```bash
cd ~/Developer/nocodb-faker
npm install
```

Expected: installs `@faker-js/faker`, `axios`, `csv-parser`, `dotenv`, `express` into `node_modules/` with no errors.

- [ ] **Step 2: Open an SSH tunnel to the production NoCoDB instance**

The VM's NoCoDB container only exposes port 8091 on the VM itself (not necessarily reachable from your dev machine directly), so tunnel through the `oci` SSH alias already configured in `~/.ssh/config`:

```bash
ssh -f -N -L 18091:localhost:8091 oci
```

Verify the tunnel works:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:18091/api/v1/health
```

Expected: `200`

- [ ] **Step 3: Create local `.env` with production credentials**

Pull the real `NOCODB_API_TOKEN` from the VM rather than hardcoding it, and point `NOCODB_URL` at the tunnel:

```bash
NOCODB_API_TOKEN=$(ssh oci "grep '^NOCODB_API_TOKEN=' ~/nocodb-faker/.env | cut -d= -f2")
cat > .env <<EOF
NOCODB_URL=http://localhost:18091
NOCODB_API_TOKEN=${NOCODB_API_TOKEN}
EOF
```

Expected: `.env` created in the repo root with two lines. Confirm it's ignored: `git check-ignore .env` should print `.env`.

- [ ] **Step 4: Write the schema creation script**

Create `scripts/schema/create-members-table.js`:

```js
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
```

- [ ] **Step 5: Run the script against production**

```bash
node scripts/schema/create-members-table.js
```

Expected: prints `✅ Members table created successfully!` and a `Table ID: <some id>` line. Copy that ID.

- [ ] **Step 6: Verify the table exists with the correct columns**

```bash
curl -s "http://localhost:18091/api/v2/meta/bases/pqdvpqhfx2l3dw1/tables" \
  -H "xc-token: $(grep '^NOCODB_API_TOKEN=' .env | cut -d= -f2)" \
  | node -e "
const data = JSON.parse(require('fs').readFileSync(0, 'utf8'));
const members = data.list.find(t => t.title === 'Members');
console.log('Members table found:', !!members);
console.log('Table ID:', members?.id);
"
```

Expected: `Members table found: true` and a table ID matching what Step 5 printed.

- [ ] **Step 7: Record the table ID for later tasks**

```bash
echo "MEMBERS_TABLE_ID=<paste the ID from Step 5>" >> .env
```

- [ ] **Step 8: Commit the script**

```bash
git add scripts/schema/create-members-table.js
git commit -m "feat: add schema script to create Members table"
```

---

### Task 2: Generate 50 fake member records

**Files:**
- Create: `scripts/data-gen/generate-members.js`

**Interfaces:**
- Consumes: `MEMBERS_TABLE_ID` from local `.env` (produced by Task 1, Step 7). `NOCODB_URL` / `NOCODB_API_TOKEN` from local `.env` (Task 1, Step 3).
- Produces: 50 live records in the production `Members` table, each shaped `{ MemberID, FirstName, LastName }`. Task 3's manual verification and Task 6's production check both rely on this data existing.

- [ ] **Step 1: Write the data generation script**

Create `scripts/data-gen/generate-members.js`:

```js
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
```

- [ ] **Step 2: Run the script against production**

```bash
node scripts/data-gen/generate-members.js
```

Expected: prints a sample member JSON object, then `✅ Successfully inserted 50 members`.

- [ ] **Step 3: Verify record count, ID format, and uniqueness**

```bash
curl -s "http://localhost:18091/api/v2/tables/$(grep '^MEMBERS_TABLE_ID=' .env | cut -d= -f2)/records?limit=100" \
  -H "xc-token: $(grep '^NOCODB_API_TOKEN=' .env | cut -d= -f2)" \
  | node -e "
const data = JSON.parse(require('fs').readFileSync(0, 'utf8'));
const list = data.list;
console.log('count:', list.length);
const badFormat = list.filter(r => !/^HX\d{9}\$/.test(r.MemberID));
console.log('invalid MemberID format count:', badFormat.length);
const ids = new Set(list.map(r => r.MemberID));
console.log('unique MemberID count:', ids.size);
console.log('sample record:', JSON.stringify(list[0]));
"
```

Expected: `count: 50`, `invalid MemberID format count: 0`, `unique MemberID count: 50`.

- [ ] **Step 4: Commit the script**

```bash
git add scripts/data-gen/generate-members.js
git commit -m "feat: add data generation script for 50 fake members"
```

---

### Task 3: Add the `/api/members` endpoint

**Files:**
- Modify: `api-wrapper.js:16` (add table ID constant), `api-wrapper.js:290` (insert new route after the ZipCodes route, before the Status route comment), `api-wrapper.js:401` (add to `endpoints` object), `api-wrapper.js:420` (add an example to `examples` object)

**Interfaces:**
- Consumes: `MEMBERS_TABLE_ID` from local `.env` (Task 1, Step 7); the live 50 records from Task 2; the existing `buildWhereClause(params)` helper already defined in `api-wrapper.js`.
- Produces: `GET /api/members` route, consumed by Task 5 (docs must reference real working examples) and Task 6 (production verification).

- [ ] **Step 1: Add the `MEMBERS_TABLE_ID` constant**

In `api-wrapper.js`, find this line (currently line 16):

```js
const ZIPCODES_TABLE_ID = process.env.ZIPCODES_TABLE_ID;
```

Add immediately after it:

```js
const ZIPCODES_TABLE_ID = process.env.ZIPCODES_TABLE_ID;
const MEMBERS_TABLE_ID = process.env.MEMBERS_TABLE_ID;
```

- [ ] **Step 2: Add the `/api/members` route**

Find the end of the ZipCodes route block (currently ends at line 290 with `});`, immediately followed by the `// Status endpoints (Present/Away)` comment on line 292). Insert this new block between them:

```js
// Members endpoints
app.get('/api/members', async (req, res) => {
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
      `${NOCODB_URL}/api/v2/tables/${MEMBERS_TABLE_ID}/records`,
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
```

- [ ] **Step 3: Add `members` to the documentation route's `endpoints` object**

Find (currently around line 396-404):

```js
    endpoints: {
      vehicles: 'GET /api/vehicles',
      contacts: 'GET /api/contacts',
      employees: 'GET /api/employees',
      cases: 'GET /api/cases',
      zipcodes: 'GET /api/zipcodes',
      status: 'GET /api/status',
      updateStatus: 'PUT /api/status'
    },
```

Add `members: 'GET /api/members',` after the `employees` line.

- [ ] **Step 4: Add a `members` example to the documentation route's `examples` object**

Find (currently around line 405-421), the `examples: { ... }` object, and add this entry after `'Managers only': '/api/employees?JobTitle=Manager',`:

```js
      'Member by ID': '/api/members?MemberID=HX123456789',
```

- [ ] **Step 5: Start the wrapper locally against the tunneled production NoCoDB and verify**

Use a port that won't collide with anything already running locally, and reuse the tunnel and `.env` from Task 1/2:

```bash
API_PORT=3001 node api-wrapper.js
```

Run this in the background (e.g. via your tool's background-execution option) and wait for it to print `✅ API Wrapper running on http://localhost:3001` before continuing.

- [ ] **Step 6: Curl the new endpoint**

```bash
WRAPPER_KEY=$(grep '^NOCODB_WRAPPER_API_KEY=' <(ssh oci "cat ~/nocodb-faker/.env"))
WRAPPER_KEY=${WRAPPER_KEY#NOCODB_WRAPPER_API_KEY=}
curl -s -H "X-API-Key: $WRAPPER_KEY" "http://localhost:3001/api/members" | node -e "
const data = JSON.parse(require('fs').readFileSync(0, 'utf8'));
console.log('success:', data.success);
console.log('count:', data.count);
console.log('first record:', JSON.stringify(data.data[0]));
"
```

Expected: `success: true`, `count: 50`, and a first record shaped `{ Id, MemberID, FirstName, LastName, ... }` with `MemberID` matching `HX` + 9 digits.

- [ ] **Step 7: Verify filtering works**

```bash
curl -s -H "X-API-Key: $WRAPPER_KEY" "http://localhost:3001/api/members?LastName_like=a&limit=5" | node -e "
const data = JSON.parse(require('fs').readFileSync(0, 'utf8'));
console.log('success:', data.success);
console.log('count:', data.count);
console.log('all match filter:', data.data.every(r => r.LastName.toLowerCase().includes('a')));
"
```

Expected: `success: true`, `count` between 0 and 5, `all match filter: true`.

- [ ] **Step 8: Stop the local wrapper process**

Stop the background process started in Step 5.

- [ ] **Step 9: Commit**

```bash
git add api-wrapper.js
git commit -m "feat: add GET /api/members endpoint"
```

---

### Task 4: Wire config — `.env.example` and `docker-compose.yml`

**Files:**
- Modify: `.env.example`
- Modify: `docker-compose.yml`

**Interfaces:**
- Consumes: nothing (static config files).
- Produces: `MEMBERS_TABLE_ID` / `NUM_MEMBERS` documented for future setup; `docker-compose.yml` forwards `MEMBERS_TABLE_ID`, `NUM_MEMBERS`, `ZIPCODES_TABLE_ID`, `STATUS_TABLE_ID` into the deployed container — required for Task 6's production verification to succeed (without this, `/api/members` would return data for an `undefined` table ID once deployed).

- [ ] **Step 1: Update `.env.example`**

Find:

```
# ZipCodes Table
ZIPCODES_TABLE_ID=your_zipcodes_table_id_here

# Status Table
STATUS_TABLE_ID=your_status_table_id_here
```

Add after it:

```
# Members Table
MEMBERS_TABLE_ID=your_members_table_id_here
NUM_MEMBERS=50
```

- [ ] **Step 2: Update `docker-compose.yml`**

Find the `environment:` block in the `nocodb-api` service:

```yaml
    environment:
      - NOCODB_URL=${NOCODB_URL}
      - NOCODB_API_TOKEN=${NOCODB_API_TOKEN}
      - TABLE_ID=${TABLE_ID}
      - EMPLOYEES_TABLE_ID=${EMPLOYEES_TABLE_ID}
      - VEHICLES_TABLE_ID=${VEHICLES_TABLE_ID}
      - CASES_TABLE_ID=${CASES_TABLE_ID}
      - NUM_CONTACTS=${NUM_CONTACTS:-100}
      - NUM_EMPLOYEES=${NUM_EMPLOYEES:-20}
      - NUM_VEHICLES=${NUM_VEHICLES:-50}
      - NUM_CASES=${NUM_CASES:-30}
      - API_PORT=${API_PORT:-3000}
      - NOCODB_WRAPPER_API_KEY=${NOCODB_WRAPPER_API_KEY}
```

Replace with:

```yaml
    environment:
      - NOCODB_URL=${NOCODB_URL}
      - NOCODB_API_TOKEN=${NOCODB_API_TOKEN}
      - TABLE_ID=${TABLE_ID}
      - EMPLOYEES_TABLE_ID=${EMPLOYEES_TABLE_ID}
      - VEHICLES_TABLE_ID=${VEHICLES_TABLE_ID}
      - CASES_TABLE_ID=${CASES_TABLE_ID}
      - ZIPCODES_TABLE_ID=${ZIPCODES_TABLE_ID}
      - STATUS_TABLE_ID=${STATUS_TABLE_ID}
      - MEMBERS_TABLE_ID=${MEMBERS_TABLE_ID}
      - NUM_CONTACTS=${NUM_CONTACTS:-100}
      - NUM_EMPLOYEES=${NUM_EMPLOYEES:-20}
      - NUM_VEHICLES=${NUM_VEHICLES:-50}
      - NUM_CASES=${NUM_CASES:-30}
      - NUM_MEMBERS=${NUM_MEMBERS:-50}
      - API_PORT=${API_PORT:-3000}
      - NOCODB_WRAPPER_API_KEY=${NOCODB_WRAPPER_API_KEY}
```

- [ ] **Step 3: Validate YAML syntax**

```bash
docker compose -f docker-compose.yml config > /dev/null && echo "VALID"
```

Expected: `VALID` (warnings about unset environment variables are fine since no local `.env` docker-compose vars are set outside the container context; only a non-zero exit / YAML error indicates a real problem).

- [ ] **Step 4: Commit**

```bash
git add .env.example docker-compose.yml
git commit -m "fix: forward MEMBERS_TABLE_ID and fix missing ZIPCODES_TABLE_ID/STATUS_TABLE_ID in docker-compose"
```

---

### Task 5: Update documentation

**Files:**
- Modify: `README.md`
- Modify: `docs/API_GUIDE.md`

**Interfaces:**
- Consumes: the working `/api/members` endpoint from Task 3 (docs examples must be real, run-and-verify commands, not illustrative placeholders).
- Produces: nothing consumed by later tasks — this is documentation only.

- [ ] **Step 1: Add Members to README's "Tables & Data" section**

Find the end of the "### 4. Cases (30 records)" block in `README.md` and add after it:

```markdown
### 5. Members (50 records)
- MemberID (insurance-style ID, format `HX` + 9 digits, e.g. `HX123456789`)
- FirstName
- LastName
```

- [ ] **Step 2: Add Members table ID vars to the README's sample `.env`**

Find the sample `.env` block in the "Configure environment" section (contains `CASES_TABLE_ID=your_cases_table_id`). Add after the `NUM_CASES=30` line:

```
MEMBERS_TABLE_ID=your_members_table_id
NUM_MEMBERS=50
```

- [ ] **Step 3: Add setup commands to README's "Usage" section**

Find the end of the "**Cases Table (Relational):**" code block in the "Creating Tables & Generating Data" section and add after it:

```markdown
**Members Table:**
```bash
node scripts/schema/create-members-table.js    # Create table + columns
node scripts/data-gen/generate-members.js      # Generate 50 members
```
```

- [ ] **Step 4: Add the endpoint to README's "Base Endpoints" list**

Find:

```markdown
- `GET /api/cases` - Cases with relationships
```

Add after it:

```markdown
- `GET /api/members` - Insurance-style member records
```

- [ ] **Step 5: Add Members query examples to README**

Find the end of the "**Employees:**" query examples block and add after it:

```markdown
**Members:**
```bash
# Find member by ID
curl -H "X-API-Key: your_api_key_here" "http://localhost:3000/api/members?MemberID=HX123456789"

# Search by last name
curl -H "X-API-Key: your_api_key_here" "http://localhost:3000/api/members?LastName_like=Smith"
```
```

- [ ] **Step 6: Add Members row to API_GUIDE.md's "Available Endpoints" table**

In `docs/API_GUIDE.md`, find:

```markdown
| `GET /api/cases` | Case management | Cases with linked contacts and employees |
```

Add after it:

```markdown
| `GET /api/members` | Insurance-style member records | Member records with MemberID |
```

- [ ] **Step 7: Add a full "Members API" section to API_GUIDE.md**

Find the end of the "## 👥 Employees API" section (ends right before "## 📋 Cases API") and insert:

```markdown
## 🪪 Members API

### Endpoint
```
GET /api/members
```

### Fields
- `Id` - Unique identifier
- `MemberID` - Insurance-style member ID (`HX` + 9 digits, e.g. `HX123456789`)
- `FirstName` - Member first name
- `LastName` - Member last name

### Examples

**Get all members:**
```bash
curl -H "X-API-Key: your_api_key" "https://api.6569.io/api/members"
```

**Find member by ID:**
```bash
curl -H "X-API-Key: your_api_key" "https://api.6569.io/api/members?MemberID=HX123456789"
```

**Search by last name:**
```bash
curl -H "X-API-Key: your_api_key" "https://api.6569.io/api/members?LastName_like=Smith"
```

**Paginated results (10 per page):**
```bash
curl -H "X-API-Key: your_api_key" "https://api.6569.io/api/members?limit=10&offset=0"
```
```

- [ ] **Step 8: Verify the documented examples actually work**

Restart the local wrapper from Task 3 (`API_PORT=3001 node api-wrapper.js`, same `.env`/tunnel) and run the exact commands documented in Step 5 and Step 7 above (swapping `https://api.6569.io` / `http://localhost:3000` for `http://localhost:3001`), confirming each returns `"success": true` with sensible data. Stop the wrapper afterward.

- [ ] **Step 9: Commit**

```bash
git add README.md docs/API_GUIDE.md
git commit -m "docs: document Members table and /api/members endpoint"
```

---

### Task 6: Deploy to production and verify

**Files:** none (deployment + verification only)

**Interfaces:**
- Consumes: the live `MEMBERS_TABLE_ID` from Task 1; all committed code from Tasks 1-5.
- Produces: a working `GET /api/members` on the live production deployment.

- [ ] **Step 1: Add `MEMBERS_TABLE_ID` and `NUM_MEMBERS` to the production `.env`**

```bash
ssh oci "grep -q '^MEMBERS_TABLE_ID=' ~/nocodb-faker/.env || echo 'MEMBERS_TABLE_ID=<paste the ID from Task 1, Step 5>' >> ~/nocodb-faker/.env"
ssh oci "grep -q '^NUM_MEMBERS=' ~/nocodb-faker/.env || echo 'NUM_MEMBERS=50' >> ~/nocodb-faker/.env"
```

Note: `ZIPCODES_TABLE_ID` is already present in the production `.env`, so no action needed there. `STATUS_TABLE_ID` is intentionally left unset — no Status table has actually been created on this instance yet, so `/api/status` will continue to return its existing "not found" response rather than crash, same as before this change.

- [ ] **Step 2: Clean up local test artifacts**

Stop any background `node api-wrapper.js` process still running from Task 3/5, and close the SSH tunnel from Task 1:

```bash
pkill -f "ssh -f -N -L 18091:localhost:8091 oci"
```

- [ ] **Step 3: Push to `main`**

⚠️ This triggers the existing GitHub Actions workflow, which SSHes into the production VM and rebuilds/restarts the live `nocodb-api` container. Confirm with the user before running this step.

```bash
git push origin main
```

- [ ] **Step 4: Watch the deploy**

```bash
gh run watch --repo rp1783/nocodb-faker
```

Expected: run completes with conclusion `success`.

- [ ] **Step 5: Verify on the live instance**

```bash
ssh oci "curl -s -H \"X-API-Key: \$(grep '^NOCODB_WRAPPER_API_KEY=' ~/nocodb-faker/.env | cut -d= -f2)\" http://localhost:3000/api/members" | node -e "
const data = JSON.parse(require('fs').readFileSync(0, 'utf8'));
console.log('success:', data.success);
console.log('count:', data.count);
console.log('sample:', JSON.stringify(data.data[0]));
"
```

Expected: `success: true`, `count: 50`, a sample record with a valid `MemberID`.

- [ ] **Step 6: Verify the public HTTPS endpoint**

```bash
curl -s -H "X-API-Key: $WRAPPER_KEY" "https://api.6569.io/api/members?limit=1"
```

Expected: same `{ success: true, count: ..., data: [...] }` shape reachable from the public internet.
