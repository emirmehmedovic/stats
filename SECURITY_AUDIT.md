# Security audit (statistika app)

Date: 2025-02-14
Scope: repo review of server/API auth, data access, uploads, and raw SQL usage.

## High-risk findings

1) **API routes are largely unauthenticated**
- `src/middleware.ts` explicitly skips `/api`, so API routes rely on per-route checks.
- Many sensitive routes have no auth/role checks (e.g. flights, reports, uploads, documents), so any caller can read/modify data if the API is reachable.
- Examples:
  - `src/app/api/flights/route.ts` (create/list)
  - `src/app/api/flights/[id]/route.ts` (read/update/delete)
  - `src/app/api/airlines/route.ts` and `src/app/api/airlines/[id]/route.ts`
  - `src/app/api/reports/*/download/route.ts`
  - `src/app/api/employees/[id]/documents/route.ts`
  - `src/app/api/licenses/[id]/documents/route.ts`
  - `src/app/api/upload/employee-photo/route.ts`

**Impact:** Unauthorized data access/modification, report/download exfiltration, and file uploads.

2) **Uploads stored under `public/` without auth**
- File upload endpoints save to `public/uploads/...` and are unauthenticated.
- Example: `src/app/api/employees/[id]/documents/route.ts`, `src/app/api/licenses/[id]/documents/route.ts`, `src/app/api/upload/employee-photo/route.ts`, `src/app/api/airlines/[id]/logo/route.ts`.

**Impact:** Anyone can upload and then access files directly via public URL. This is a common data leakage and malware distribution vector.

3) **JWT secret has an insecure default**
- `JWT_SECRET` falls back to `'your-secret-key-change-in-production'` in `src/lib/auth.ts` and `src/lib/auth-utils.ts`.

**Impact:** If env is missing or misconfigured, tokens are trivially forgeable.

## Medium-risk findings

4) **Authorization relies on token-only role checks**
- `requireAdmin` in `src/app/api/users/route.ts` and `src/app/api/users/[id]/route.ts` trusts role in JWT only.
- If a user is deactivated or role changes, existing token remains valid until expiry.

**Impact:** Stale tokens can keep elevated access.

5) **Sensitive auth data is logged**
- `src/lib/auth-utils.ts` logs token preview and length on verification errors.
- `src/middleware.ts` logs cookie and token details.

**Impact:** Tokens/cookies may leak into logs (especially in production).

6) **CSRF protection not present for cookie-based auth**
- Auth uses an HTTP-only cookie (`auth-token`) but most state-changing routes do not enforce CSRF tokens.
- `sameSite: 'lax'` reduces risk but does not replace CSRF protection for all cases.

**Impact:** Potential CSRF on POST/PUT/DELETE if attacker can trigger requests from a browser with valid cookies.

7) **Report download endpoints are unauthenticated**
- `src/app/api/reports/*/download/route.ts` allow downloading by filename without any auth.

**Impact:** Data exfiltration of generated reports.

## Low-risk / observations

8) **SQL injection**
- Prisma query builder is safe by default.
- Raw SQL in analytics/reports uses `Prisma.sql` and parameter binding (`Prisma.join`), which is the recommended safe pattern.
- No `*Unsafe` raw methods found.

**Note:** Continue avoiding string concatenation in raw queries.

9) **"Encrypt API calls" expectation**
- In browser apps, API endpoints will always be visible in the Network tab.
- The real control is HTTPS/TLS + authentication + authorization + least-privilege responses.

## Recommendations (prioritized)

1) **Enforce authentication on all `/api` routes**
- Option A: Extend `src/middleware.ts` to include `/api` with an allowlist (e.g. `/api/auth/login`, `/api/auth/logout`, `/api/auth/session`, public report exports if any).
- Option B: Create a shared `requireAuth/requireAdmin` helper and apply to every API route.

2) **Protect file uploads and private files**
- Require auth (and likely admin/manager roles) for upload endpoints.
- Store uploaded files outside `public/` and serve via authenticated download endpoints.
- Add file type validation (MIME + extension), antivirus scanning (if possible), and per-user/role access control.

3) **Make JWT secret mandatory**
- Remove the default fallback and fail fast if `JWT_SECRET` is not set in production.
- Consider token rotation or `tokenVersion` stored in DB for revocation.

4) **Re-check role & active status from DB**
- For `requireAdmin` and sensitive routes, load the user from DB and verify `isActive` + `role`.
- This prevents stale tokens keeping elevated access.

5) **Add CSRF protection**
- For cookie-auth endpoints, implement CSRF tokens (double-submit or SameSite+custom header).
- At minimum, require a custom header (e.g. `X-CSRF-Token`) for state-changing requests.

6) **Remove sensitive logs**
- Strip token/cookie previews from logs in `src/middleware.ts` and `src/lib/auth-utils.ts` or gate them behind a dev-only flag.

7) **Rate-limit and audit other sensitive endpoints**
- Add rate limiting for upload, import, and heavy report endpoints.
- Log admin actions (user creation, deletions, bulk verification).

8) **Harden download endpoints**
- Add auth checks for `src/app/api/reports/*/download/route.ts`.
- Consider per-user access rules and short-lived signed URLs.

## Quick notes on SQL injection
- Login uses Prisma `findUnique` and bcrypt; not vulnerable to SQL injection.
- Raw queries are parameterized; keep it that way and avoid string concat.

## Proposed next steps (if you want code changes)
1) Add a shared auth guard (`requireAuth`, `requireAdmin`) and apply it to all API routes.
2) Move uploads to a private folder and add authenticated download routes.
3) Enforce `JWT_SECRET` and remove debug logs in production.
4) Add CSRF protection and rate limiting for state-changing APIs.
