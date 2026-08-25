# Members Table Design

**Date:** 2026-08-24
**Scope:** Add a new "Members" table (insurance-style member records) with fake data generation and an API wrapper endpoint, following the existing table pattern (Contacts, Employees, Vehicles, Cases).

## Goal

A new `Members` table in NoCoDB holding 50 fake records with an insurance-style Member ID, first name, and last name — queryable through the API wrapper the same way as every other table.

## Data Model

| Column | Type | Notes |
|--------|------|-------|
| `Id` | ID (pk) | Auto, standard NoCoDB primary key |
| `MemberID` | SingleLineText | Format `HX` + 9 random digits, e.g. `HX123456789`. Unique per record. |
| `FirstName` | SingleLineText | |
| `LastName` | SingleLineText | |

`MemberID` uses a fixed two-letter prefix (`HX`) shared by all records, matching how a single real insurance plan issues IDs, followed by 9 digits.

## Components

### `scripts/schema/create-members-table.js`

Creates the table directly via NoCoDB's meta API, mirroring `create-zipcodes-table.js` (the existing precedent for creating a brand-new table, as opposed to `create-employee-columns.js`-style scripts that add columns to a table already created by hand in the NoCoDB UI):

```
POST /api/v2/meta/bases/{BASE_ID}/tables
{
  table_name: 'members',
  title: 'Members',
  columns: [Id, MemberID, FirstName, LastName]
}
```

`BASE_ID` is the same hardcoded `pqdvpqhfx2l3dw1` ("Getting Started") used by `create-zipcodes-table.js` — confirmed via `GET /api/v2/meta/bases` that it's still the only base on this instance.

Prints the new table ID on success so it can be copied into `.env` as `MEMBERS_TABLE_ID`.

### `scripts/data-gen/generate-members.js`

Reads `MEMBERS_TABLE_ID` and `NUM_MEMBERS` (default 50) from `.env`.

- `generateMemberId()` — `"HX"` + `faker.string.numeric(9)`, retried against an in-run `Set` until unique
- `generateMember()` — `{ MemberID, FirstName: faker.person.firstName(), LastName: faker.person.lastName() }`
- Builds `NUM_MEMBERS` records, inserts them in a single batch `POST /api/v2/tables/{MEMBERS_TABLE_ID}/records` with the full array (NoCoDB accepts an array body for bulk insert — same mechanism `create-zipcodes-table.js` uses per-batch, but 50 records fits in one call)
- Logs a sample record and a success/error summary, consistent with the other `generate-*.js` scripts

### `api-wrapper.js`

- New const: `MEMBERS_TABLE_ID = process.env.MEMBERS_TABLE_ID`
- New route `GET /api/members`, identical structure to the existing `/api/employees` handler: `buildWhereClause(req.query)` for filtering, `limit`/`offset`/`sort` query params, response shaped `{ success, count, data }`. No relations, so no extra logic beyond the standard boilerplate.
- Add `members` to the `endpoints` object and one example (`'Member by ID': '/api/members?MemberID=HX123456789'`) in the `GET /` documentation route.

### Config

- `.env.example` — add `MEMBERS_TABLE_ID=your_members_table_id_here` and `NUM_MEMBERS=50`
- `docker-compose.yml` — add `MEMBERS_TABLE_ID` and `NUM_MEMBERS` to the `nocodb-api` service's `environment:` block. **Also fixing a pre-existing gap found during this work:** `ZIPCODES_TABLE_ID` and `STATUS_TABLE_ID` are read by `api-wrapper.js` and set in `.env` on the Oracle VM, but were never added to this `environment:` list — meaning `/api/zipcodes` and `/api/status` are currently running with `undefined` table IDs in production. Adding both alongside `MEMBERS_TABLE_ID`.

### Docs

- `README.md` — add a "Members (50 records)" entry under **Tables & Data**, and the two setup commands under **Usage**
- `docs/API_GUIDE.md` — add the `/api/members` endpoint and example queries, matching the existing format for other tables

## Out of Scope

- No relations/links to other tables (Members is standalone, like Employees/Vehicles)
- No automated test suite (none exists in this repo currently)
- Not wiring table creation/data-gen into CI — like every other table, these are one-time scripts run manually once against the live instance, not part of the deploy workflow

## Rollout

1. Run `create-members-table.js` and `generate-members.js` once against the production NoCoDB instance (via SSH, `NOCODB_URL` pointed at `http://localhost:8091` on the VM since the container-internal URL in `.env` isn't reachable from the host shell)
2. Add `MEMBERS_TABLE_ID` to the VM's `.env`
3. Push the code changes to `main` — existing CI/CD redeploys the `nocodb-api` container with the new route and the corrected `docker-compose.yml` env forwarding
