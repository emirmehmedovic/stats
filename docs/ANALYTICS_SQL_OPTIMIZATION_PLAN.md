# Analytics SQL Optimization Plan (VPS)

## Scope
Large analytics/report queries for 1–2 year ranges. DB and app run on the same VPS.

## High-impact endpoints & issues

### 1) `src/app/api/analytics/punctuality/route.ts`
- **Current:** `findMany` for full date range, then per-day grouping in memory.
- **Risk:** Very large payload (1–2 years), high memory, slow filtering loops.
- **Fix:**
  - Move daily trend aggregation to DB (`date_trunc('day', date)`), return per-day stats.
  - Keep detailed list optional and paginated (`?detailsPage&detailsLimit`).
  - Use `select` only needed fields (already good).

### 2) `src/app/api/analytics/load-factor/route.ts`
- **Current:** Full range `findMany`, in-memory averages and daily trend.
- **Risk:** Unbounded payload; heavy CPU for daily grouping.
- **Fix:**
  - DB-side aggregation for per-day average load factor.
  - For airline breakdown, use `groupBy` on `airlineId` with aggregated sums.
  - Provide optional details (paginated) separate from summary.

### 3) `src/app/api/analytics/routes/route.ts`
- **Current:** Full range `findMany`, in-memory route stats.
- **Risk:** Very slow for long ranges; loads many columns.
- **Fix:**
  - Use SQL `group by route` with sums/counts and joins for airlines.
  - Compute delays in SQL when possible; otherwise add a separate delay aggregation query.
  - Keep “top routes” only (limit) and optionally add `?page` for full list.

### 4) `src/app/api/comparison/trends/route.ts`
- **Current:** `findMany` with heavy `include` + per‑item `findUnique` (N+1).
- **Risk:** Loads lots of data and performs many extra queries.
- **Fix:**
  - Reduce `include` → `select` only needed fields.
  - Replace `findUnique` loops with batch fetches or `groupBy`.
  - Use DB-side daily aggregation for `dailyData`.

### 5) `src/app/api/reports/custom/route.ts`
- **Current:** Fetch all flights, then group and return first 100 details.
- **Risk:** Full dataset scan even if UI shows only summary + first 100.
- **Fix:**
  - Split into two queries: summary/grouping in DB, and details with pagination.
  - Avoid loading all rows into memory.

### 6) `src/app/api/reports/monthly/route.ts`
- **Current:** Full month fetch, in-memory grouping (ok for one month but still heavy if reused).
- **Fix:**
  - Switch to DB-side aggregation to standardize approach.
  - Keep `findMany` only if you need detail rows.

## Bitesize tasks (actionable)

### A) Add DB-side aggregations (raw SQL or Prisma)
1. **Punctuality daily trend**
   - SQL: `date_trunc('day', date)` grouped metrics (arrival/departure on-time counts).
2. **Load factor daily trend**
   - Group by day; aggregate passengers/seats; compute ratio.
3. **Routes analytics**
   - Group by `route` with counts and passenger sums; keep `LIMIT`.
4. **Custom report**
   - Summary/grouping query separate from details query (paged).
5. **Comparison trends**
   - Remove N+1 queries; batch fetch airline and operationType names.

### B) Pagination & response shaping
1. Add optional `detailsPage`/`detailsLimit` to analytics endpoints.
2. Ensure detail lists are capped (e.g., max 500 rows per request).
3. Separate `summary` from `details` to avoid heavy payloads.

### C) Index strategy (Prisma schema + migrations)
1. Confirm indexes:
   - `Flight.date` (already present)
   - `Flight.airlineId`, `Flight.route`, `Flight.operationTypeId` (already present)
2. Add composite indexes for frequent filters:
   - `(date, airlineId)`
   - `(date, route)`
   - `(date, operationTypeId)`
3. If route analytics uses `route` heavily, ensure `route` index is used (consider `text_pattern_ops` if using `LIKE`/`contains`).

### D) Caching / rollups
1. Add daily rollup table (optional) for analytics:
   - Fields: `date`, `airlineId`, `route`, `operationTypeId`, `arrPax`, `depPax`, `seats`, `movements`.
2. Scheduled job to materialize rollups nightly.
3. Use rollups for 1–2 year queries to reduce load by 100x.

### E) DB connection strategy (VPS)
1. Keep Prisma singleton (already done) and confirm Node runtime only.
2. Add `?connection_limit=` in `DATABASE_URL` (e.g., 20–40 depending on RAM).
3. Set PostgreSQL `max_connections` accordingly; prefer pgbouncer if needed.

## Suggested next steps
1. Pick 2 endpoints to optimize first (recommend `analytics/routes` and `comparison/trends`).
2. Implement DB-side aggregations with raw SQL for speed and clarity.
3. Add composite indexes in Prisma migrations.
4. Add pagination to detail responses.

