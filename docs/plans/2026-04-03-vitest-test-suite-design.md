# Vitest Test Suite Design

**Date:** 2026-04-03  
**Branch:** claude/reliefcher-new-feature-IViMe  
**Goal:** Add a comprehensive Vitest test suite with real Postgres to validate the multi-tenancy, auth, and API layer introduced in this branch.

## Decisions

- **Framework:** Vitest
- **Coverage:** @vitest/coverage-v8
- **Database:** Real Postgres — separate `reliefcher_test` DB on the same Docker instance (port 5433)
- **Why separate DB:** Keeps dev/seed data intact across test runs

## Test Infrastructure

- `vitest.config.ts` — configure test environment, globals, setup file
- `src/__tests__/setup.ts` — global setup: create test DB if not exists, run `prisma migrate deploy` against it, inject `TEST_DATABASE_URL` env vars
- `src/__tests__/helpers.ts` — truncate all tables between tests, factory functions for creating test schools/users/sessions

## Test Structure

```
src/
  __tests__/
    setup.ts
    helpers.ts
    middleware.test.ts
    auth.test.ts
    api/
      teachers.test.ts
      periods.test.ts
      timetable.test.ts
      sick-reports.test.ts
      relief-assignments.test.ts
      dashboard.test.ts
      admin.test.ts
      onboarding.test.ts
      auth-routes.test.ts
```

## Coverage Areas

### Auth lib (`src/lib/auth.ts`)
- OTP code generation (6 digits, cryptographically random)
- Session token generation
- `createSession` — creates DB record, sets cookie
- `getSession` — returns null for missing/expired tokens, cleans up expired sessions
- `requireAuth` — throws on no session
- `requireSuperAdmin` — throws if not SUPERADMIN
- `requireSchool` — throws if no schoolId
- `getSchoolId` — returns session school, falls back to demo school for unauthenticated

### Middleware (`src/middleware.ts`)
- `/demo/*` — always accessible
- `/login` — redirects to `/dashboard` if session cookie present
- `/dashboard/*` — redirects to `/login` if no session cookie
- `/admin/*` — redirects to `/login` if no session cookie
- `/onboarding/*` — redirects to `/login` if no session cookie

### API Routes
Each tested by calling the handler directly with `new Request(...)` and a Prisma client pointing to the test DB.

| Route | Tests |
|-------|-------|
| `POST /api/auth/request-otp` | valid email creates OTP, unknown email returns success (no leak), invalidates previous OTP |
| `POST /api/auth/verify-otp` | valid code creates session + returns redirect, expired/used code rejected, wrong code rejected |
| `POST /api/auth/logout` | deletes session from DB and clears cookie |
| `GET/POST /api/teachers` | scoped to school, missing name rejected, unauthenticated falls back to demo school |
| `GET/POST /api/periods` | scoped to school |
| `GET/POST /api/timetable` | scoped to school |
| `POST /api/sick-reports` | teacher must belong to same school, numberOfDays validated |
| `POST /api/relief-assignments` | timetable entry must belong to school, double-booking rejected |
| `GET /api/dashboard` | date required, weekend short-circuits, data scoped to school |
| `GET/POST /api/admin/schools` | requires SUPERADMIN, slug validated, duplicate slug rejected |
| `GET/POST /api/admin/users` | requires SUPERADMIN, duplicate email rejected, role validated |
| `POST /api/onboarding/whitelist` | requires SCHOOL_ADMIN, creates TEACHER users for school |
| `POST /api/onboarding/complete` | requires SCHOOL_ADMIN, marks onboardingComplete |

### Multi-tenancy Isolation
- School A's session cannot read School B's teachers/timetable/sick-reports/assignments
- School A cannot create sick reports for School B's teachers

## Expected Bugs Found by Tests

- Missing `try/catch` on several API routes (teachers, periods, timetable, relief-assignments)
- `getSchoolId()` demo fallback accessible on routes that should require auth
- Inconsistent date construction: `T00:00:00` (local time) vs `T00:00:00.000Z` (UTC) across routes
- No rate limiting on `POST /api/auth/request-otp`

## Out of Scope

- E2E / browser tests (Playwright)
- Frontend component tests
- Rate limiting implementation (flag only)
