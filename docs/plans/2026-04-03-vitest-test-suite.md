# Vitest Test Suite Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Set up Vitest with a real Postgres test database and write comprehensive tests for auth, middleware, and all API routes in the multi-tenancy branch, fixing bugs as tests reveal them.

**Architecture:** Tests call Next.js route handlers directly as functions (no HTTP server needed). A global setup creates a `reliefcher_test` Postgres database, runs migrations, and injects test env vars. Each test file truncates relevant tables in `beforeEach` and seeds minimum data via helper factories.

**Tech Stack:** Vitest, @vitest/coverage-v8, Prisma (test DB), Node.js crypto, Next.js route handlers

---

### Task 1: Install dependencies and configure Vitest

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `src/__tests__/setup.ts`

**Step 1: Install packages**

```bash
npm install -D vitest @vitest/coverage-v8
```

Expected: packages added to devDependencies

**Step 2: Add test script to package.json**

In `package.json` scripts, add:
```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"
```

**Step 3: Create vitest.config.ts**

```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["src/__tests__/setup.ts"],
    testTimeout: 30000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

**Step 4: Create src/__tests__/setup.ts**

```typescript
import { execSync } from "child_process";

const TEST_DB_URL = "postgresql://postgres:postgres@localhost:5433/reliefcher_test";

export default async function setup() {
  // Create test DB if not exists
  try {
    execSync(
      `PGPASSWORD=postgres psql -h localhost -p 5433 -U postgres -c "CREATE DATABASE reliefcher_test;" 2>/dev/null || true`,
      { stdio: "pipe" }
    );
  } catch {
    // DB may already exist, that's fine
  }

  // Set env vars for all tests
  process.env.DATABASE_URL = TEST_DB_URL;
  process.env.DIRECT_URL = TEST_DB_URL;
  process.env.NODE_ENV = "test";

  // Run migrations
  execSync("npx prisma migrate deploy", {
    env: { ...process.env, DATABASE_URL: TEST_DB_URL, DIRECT_URL: TEST_DB_URL },
    stdio: "inherit",
  });
}
```

Update `vitest.config.ts` to use `globalSetup` for the DB creation:
```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    globalSetup: ["src/__tests__/setup.ts"],
    testTimeout: 30000,
  },
  ...
});
```

**Step 5: Verify config loads**

```bash
npm test -- --reporter=verbose 2>&1 | head -20
```

Expected: Vitest starts (may show "no test files found" — that's fine)

**Step 6: Commit**

```bash
git add vitest.config.ts src/__tests__/setup.ts package.json package-lock.json
git commit -m "chore: add vitest with real postgres test setup"
```

---

### Task 2: Create test helpers and factories

**Files:**
- Create: `src/__tests__/helpers.ts`

**Step 1: Write helpers.ts**

```typescript
import { PrismaClient, UserRole, TeacherType } from "@prisma/client";
import { generateSessionToken } from "@/lib/auth";

const TEST_DB_URL = "postgresql://postgres:postgres@localhost:5433/reliefcher_test";

export const testPrisma = new PrismaClient({
  datasources: { db: { url: TEST_DB_URL } },
});

/** Truncate all tables in dependency order */
export async function truncateAll() {
  await testPrisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "ReliefAssignment",
      "SickReport",
      "TimetableEntry",
      "Period",
      "Teacher",
      "Session",
      "OtpCode",
      "User",
      "School"
    RESTART IDENTITY CASCADE;
  `);
}

export async function createSchool(overrides: { name?: string; slug?: string } = {}) {
  return testPrisma.school.create({
    data: {
      name: overrides.name ?? "Test School",
      slug: overrides.slug ?? `school-${Date.now()}`,
    },
  });
}

export async function createUser(overrides: {
  email?: string;
  role?: UserRole;
  schoolId?: string | null;
  onboardingComplete?: boolean;
} = {}) {
  return testPrisma.user.create({
    data: {
      email: overrides.email ?? `user-${Date.now()}@test.com`,
      role: overrides.role ?? UserRole.SCHOOL_ADMIN,
      schoolId: overrides.schoolId ?? null,
      onboardingComplete: overrides.onboardingComplete ?? false,
    },
  });
}

export async function createSession(userId: string) {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await testPrisma.session.create({ data: { userId, token, expiresAt } });
  return token;
}

/** Returns a Request with session cookie set */
export function authedRequest(token: string, init: RequestInit = {}): Request {
  return new Request("http://localhost/api/test", {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Cookie: `reliefcher_session=${token}`,
      ...(init.headers ?? {}),
    },
  });
}

export async function createTeacher(schoolId: string, overrides: { name?: string; type?: TeacherType } = {}) {
  return testPrisma.teacher.create({
    data: {
      name: overrides.name ?? `Teacher ${Date.now()}`,
      type: overrides.type ?? TeacherType.REGULAR,
      schoolId,
    },
  });
}

export async function createPeriod(schoolId: string, number: number) {
  return testPrisma.period.create({
    data: {
      number,
      startTime: `0${6 + number}:00`,
      endTime: `0${7 + number}:00`,
      schoolId,
    },
  });
}
```

**Step 2: Verify it compiles**

```bash
npx tsc --noEmit
```

Expected: no errors

**Step 3: Commit**

```bash
git add src/__tests__/helpers.ts
git commit -m "test: add test helpers and factory functions"
```

---

### Task 3: Middleware tests

**Files:**
- Create: `src/__tests__/middleware.test.ts`

**Step 1: Write failing tests**

```typescript
import { describe, it, expect } from "vitest";
import { middleware } from "@/middleware";
import { NextRequest } from "next/server";

function makeRequest(path: string, cookies: Record<string, string> = {}): NextRequest {
  const url = `http://localhost${path}`;
  const req = new NextRequest(url);
  if (Object.keys(cookies).length > 0) {
    const cookieHeader = Object.entries(cookies)
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");
    req.headers.set("cookie", cookieHeader);
  }
  return req;
}

describe("middleware", () => {
  it("allows /demo/* without session", () => {
    const res = middleware(makeRequest("/demo/dashboard"));
    expect(res.status).not.toBe(307);
  });

  it("redirects /dashboard to /login without session", () => {
    const res = middleware(makeRequest("/dashboard"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login");
  });

  it("allows /dashboard with session cookie", () => {
    const res = middleware(makeRequest("/dashboard", { reliefcher_session: "abc123" }));
    expect(res.status).not.toBe(307);
  });

  it("redirects /admin to /login without session", () => {
    const res = middleware(makeRequest("/admin"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login");
  });

  it("redirects /onboarding to /login without session", () => {
    const res = middleware(makeRequest("/onboarding"));
    expect(res.status).toBe(307);
  });

  it("redirects /login to /dashboard when session exists", () => {
    const res = middleware(makeRequest("/login", { reliefcher_session: "abc123" }));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/dashboard");
  });
});
```

**Step 2: Run to verify they fail**

```bash
npm test src/__tests__/middleware.test.ts
```

Expected: FAIL (import errors or assertion failures)

**Step 3: Run after confirming middleware imports correctly**

```bash
npm test src/__tests__/middleware.test.ts -- --reporter=verbose
```

Expected: All PASS (middleware logic is straightforward)

**Step 4: Commit**

```bash
git add src/__tests__/middleware.test.ts
git commit -m "test: add middleware route protection tests"
```

---

### Task 4: Auth lib tests

**Files:**
- Create: `src/__tests__/auth.test.ts`

**Step 1: Write failing tests**

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { truncateAll, testPrisma, createSchool, createUser, createSession } from "./helpers";
import { generateOtpCode, generateSessionToken } from "@/lib/auth";

// Mock next/headers cookies — not available in test env
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue(undefined),
    set: vi.fn(),
    delete: vi.fn(),
  }),
}));

describe("generateOtpCode", () => {
  it("returns a 6-digit string", () => {
    const code = generateOtpCode();
    expect(code).toMatch(/^\d{6}$/);
  });

  it("generates different codes each time", () => {
    const codes = new Set(Array.from({ length: 100 }, generateOtpCode));
    expect(codes.size).toBeGreaterThan(90);
  });
});

describe("generateSessionToken", () => {
  it("returns a 64-char hex string", () => {
    const token = generateSessionToken();
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it("generates unique tokens", () => {
    const tokens = new Set(Array.from({ length: 50 }, generateSessionToken));
    expect(tokens.size).toBe(50);
  });
});

describe("getSession", () => {
  beforeEach(truncateAll);

  it("returns null for missing token", async () => {
    const { getSession } = await import("@/lib/auth");
    const session = await getSession();
    expect(session).toBeNull();
  });

  it("returns null and cleans up expired session", async () => {
    const school = await createSchool();
    const user = await createUser({ schoolId: school.id });
    const token = generateSessionToken();
    await testPrisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() - 1000), // already expired
      },
    });

    const { cookies } = await import("next/headers");
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: token }),
      set: vi.fn(),
      delete: vi.fn(),
    } as never);

    const { getSession } = await import("@/lib/auth");
    const session = await getSession();
    expect(session).toBeNull();

    const remaining = await testPrisma.session.findUnique({ where: { token } });
    expect(remaining).toBeNull();
  });
});
```

**Step 2: Run to see failures**

```bash
npm test src/__tests__/auth.test.ts -- --reporter=verbose
```

Expected: OTP and token tests PASS, getSession tests need cookie mock tuning

**Step 3: Fix any mock issues and re-run**

```bash
npm test src/__tests__/auth.test.ts -- --reporter=verbose
```

Expected: All PASS

**Step 4: Commit**

```bash
git add src/__tests__/auth.test.ts
git commit -m "test: add auth lib unit tests"
```

---

### Task 5: OTP auth route tests

**Files:**
- Create: `src/__tests__/api/auth-routes.test.ts`

**Step 1: Write failing tests**

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { truncateAll, testPrisma, createSchool, createUser, createSession, authedRequest } from "../helpers";
import { POST as requestOtp } from "@/app/api/auth/request-otp/route";
import { POST as verifyOtp } from "@/app/api/auth/verify-otp/route";
import { POST as logout } from "@/app/api/auth/logout/route";

describe("POST /api/auth/request-otp", () => {
  beforeEach(truncateAll);

  it("returns success for unknown email (no leak)", async () => {
    const req = new Request("http://localhost/api/auth/request-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "nobody@nowhere.com" }),
    });
    const res = await requestOtp(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it("creates OTP for known user", async () => {
    const school = await createSchool();
    await createUser({ email: "known@test.com", schoolId: school.id });

    const req = new Request("http://localhost/api/auth/request-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "known@test.com" }),
    });
    await requestOtp(req);

    const otp = await testPrisma.otpCode.findFirst({
      where: { email: "known@test.com", used: false },
    });
    expect(otp).not.toBeNull();
    expect(otp!.code).toMatch(/^\d{6}$/);
  });

  it("invalidates previous OTP when new one is requested", async () => {
    const school = await createSchool();
    await createUser({ email: "user@test.com", schoolId: school.id });

    const makeReq = () => new Request("http://localhost/api/auth/request-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "user@test.com" }),
    });

    await requestOtp(makeReq());
    await requestOtp(makeReq());

    const active = await testPrisma.otpCode.count({
      where: { email: "user@test.com", used: false },
    });
    expect(active).toBe(1);
  });

  it("returns 400 for missing email", async () => {
    const req = new Request("http://localhost/api/auth/request-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const res = await requestOtp(req);
    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/verify-otp", () => {
  beforeEach(truncateAll);

  it("returns 401 for wrong code", async () => {
    const school = await createSchool();
    await createUser({ email: "user@test.com", schoolId: school.id });
    await testPrisma.otpCode.create({
      data: {
        email: "user@test.com",
        code: "123456",
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    const req = new Request("http://localhost/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "user@test.com", code: "000000" }),
    });
    const res = await verifyOtp(req);
    expect(res.status).toBe(401);
  });

  it("returns 401 for expired code", async () => {
    const school = await createSchool();
    await createUser({ email: "user@test.com", schoolId: school.id });
    await testPrisma.otpCode.create({
      data: {
        email: "user@test.com",
        code: "123456",
        expiresAt: new Date(Date.now() - 1000), // expired
      },
    });

    const req = new Request("http://localhost/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "user@test.com", code: "123456" }),
    });
    const res = await verifyOtp(req);
    expect(res.status).toBe(401);
  });

  it("redirects SUPERADMIN to /admin", async () => {
    await createUser({ email: "admin@test.com", role: "SUPERADMIN", onboardingComplete: true });
    await testPrisma.otpCode.create({
      data: {
        email: "admin@test.com",
        code: "654321",
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    const req = new Request("http://localhost/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@test.com", code: "654321" }),
    });
    const res = await verifyOtp(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.redirect).toBe("/admin");
  });

  it("redirects incomplete SCHOOL_ADMIN to /onboarding", async () => {
    const school = await createSchool();
    await createUser({ email: "newadmin@test.com", role: "SCHOOL_ADMIN", schoolId: school.id, onboardingComplete: false });
    await testPrisma.otpCode.create({
      data: {
        email: "newadmin@test.com",
        code: "111111",
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    const req = new Request("http://localhost/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "newadmin@test.com", code: "111111" }),
    });
    const res = await verifyOtp(req);
    const body = await res.json();
    expect(body.redirect).toBe("/onboarding");
  });
});
```

**Step 2: Run to see failures**

```bash
npm test src/__tests__/api/auth-routes.test.ts -- --reporter=verbose
```

Expected: Some FAIL due to `cookies()` not being available in test env in `createSession`

**Step 3: Fix — mock `next/headers` in vitest.config.ts or test file**

Add to top of test file:
```typescript
import { vi } from "vitest";
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue(undefined),
    set: vi.fn(),
    delete: vi.fn(),
  }),
}));
```

**Step 4: Re-run**

```bash
npm test src/__tests__/api/auth-routes.test.ts -- --reporter=verbose
```

Expected: All PASS

**Step 5: Commit**

```bash
git add src/__tests__/api/auth-routes.test.ts
git commit -m "test: add OTP auth route tests"
```

---

### Task 6: Teachers API tests

**Files:**
- Create: `src/__tests__/api/teachers.test.ts`

**Step 1: Write failing tests**

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { truncateAll, createSchool, createUser, createSession, authedRequest } from "../helpers";
import { GET, POST } from "@/app/api/teachers/route";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

async function mockSession(token: string) {
  const { cookies } = await import("next/headers");
  vi.mocked(cookies).mockResolvedValue({
    get: vi.fn().mockReturnValue({ value: token }),
    set: vi.fn(),
    delete: vi.fn(),
  } as never);
}

describe("GET /api/teachers", () => {
  beforeEach(truncateAll);

  it("returns teachers for authenticated school", async () => {
    const school = await createSchool();
    const user = await createUser({ schoolId: school.id });
    const token = await createSession(user.id);
    await mockSession(token);

    const res = await GET();
    expect(res.status).toBe(200);
    const teachers = await res.json();
    expect(Array.isArray(teachers)).toBe(true);
  });

  it("does not return teachers from another school", async () => {
    const school1 = await createSchool({ slug: "school-1" });
    const school2 = await createSchool({ slug: "school-2" });
    const user = await createUser({ schoolId: school1.id });
    const token = await createSession(user.id);
    await mockSession(token);

    // Create teacher in school2
    await import("../helpers").then(h => h.createTeacher(school2.id, { name: "Other School Teacher" }));

    const res = await GET();
    const teachers = await res.json();
    expect(teachers.every((t: { schoolId: string }) => t.schoolId === school1.id)).toBe(true);
  });
});

describe("POST /api/teachers", () => {
  beforeEach(truncateAll);

  it("creates teacher in correct school", async () => {
    const school = await createSchool();
    const user = await createUser({ schoolId: school.id });
    const token = await createSession(user.id);
    await mockSession(token);

    const req = new Request("http://localhost/api/teachers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "New Teacher", type: "REGULAR" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const teacher = await res.json();
    expect(teacher.schoolId).toBe(school.id);
    expect(teacher.name).toBe("New Teacher");
  });

  it("returns 400 for missing name", async () => {
    const school = await createSchool();
    const user = await createUser({ schoolId: school.id });
    const token = await createSession(user.id);
    await mockSession(token);

    const req = new Request("http://localhost/api/teachers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "REGULAR" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
```

**Step 2: Run**

```bash
npm test src/__tests__/api/teachers.test.ts -- --reporter=verbose
```

Expected: FAIL — `GET` has no try/catch, will throw if prisma errors; also `getSchoolId` fallback issue

**Step 3: Fix missing try/catch in `src/app/api/teachers/route.ts`**

Wrap both handlers:
```typescript
export async function GET() {
  try {
    const schoolId = await getSchoolId();
    const teachers = await prisma.teacher.findMany({ where: { schoolId }, orderBy: { name: "asc" } });
    return NextResponse.json(teachers);
  } catch {
    return NextResponse.json({ error: "Failed to fetch teachers." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const schoolId = await getSchoolId();
    const body = await request.json();
    const { name, type } = body;
    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }
    const teacher = await prisma.teacher.create({
      data: { name: name.trim(), type: type || "REGULAR", schoolId },
    });
    return NextResponse.json(teacher, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create teacher." }, { status: 500 });
  }
}
```

**Step 4: Re-run**

```bash
npm test src/__tests__/api/teachers.test.ts -- --reporter=verbose
```

Expected: All PASS

**Step 5: Commit**

```bash
git add src/__tests__/api/teachers.test.ts src/app/api/teachers/route.ts
git commit -m "test: add teachers API tests; fix: add try/catch to teachers route"
```

---

### Task 7: Sick reports and relief assignments tests

**Files:**
- Create: `src/__tests__/api/sick-reports.test.ts`
- Create: `src/__tests__/api/relief-assignments.test.ts`

**Step 1: Write sick-reports tests**

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { truncateAll, testPrisma, createSchool, createUser, createSession, createTeacher } from "../helpers";
import { POST } from "@/app/api/sick-reports/route";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

async function mockSession(token: string) {
  const { cookies } = await import("next/headers");
  vi.mocked(cookies).mockResolvedValue({
    get: vi.fn().mockReturnValue({ value: token }),
    set: vi.fn(),
    delete: vi.fn(),
  } as never);
}

describe("POST /api/sick-reports", () => {
  beforeEach(truncateAll);

  it("creates sick report for teacher in same school", async () => {
    const school = await createSchool();
    const user = await createUser({ schoolId: school.id });
    const teacher = await createTeacher(school.id);
    const token = await createSession(user.id);
    await mockSession(token);

    const req = new Request("http://localhost/api/sick-reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teacherId: teacher.id, startDate: "2026-04-07", numberOfDays: 3 }),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it("rejects teacher from another school", async () => {
    const school1 = await createSchool({ slug: "s1" });
    const school2 = await createSchool({ slug: "s2" });
    const user = await createUser({ schoolId: school1.id });
    const otherTeacher = await createTeacher(school2.id);
    const token = await createSession(user.id);
    await mockSession(token);

    const req = new Request("http://localhost/api/sick-reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teacherId: otherTeacher.id, startDate: "2026-04-07", numberOfDays: 1 }),
    });
    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it("rejects numberOfDays > 14", async () => {
    const school = await createSchool();
    const user = await createUser({ schoolId: school.id });
    const teacher = await createTeacher(school.id);
    const token = await createSession(user.id);
    await mockSession(token);

    const req = new Request("http://localhost/api/sick-reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teacherId: teacher.id, startDate: "2026-04-07", numberOfDays: 15 }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
```

**Step 2: Run sick-reports tests**

```bash
npm test src/__tests__/api/sick-reports.test.ts -- --reporter=verbose
```

Expected: All PASS (this route already has good validation)

**Step 3: Write relief-assignments tests**

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { truncateAll, testPrisma, createSchool, createUser, createSession, createTeacher, createPeriod } from "../helpers";
import { POST } from "@/app/api/relief-assignments/route";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

async function mockSession(token: string) {
  const { cookies } = await import("next/headers");
  vi.mocked(cookies).mockResolvedValue({
    get: vi.fn().mockReturnValue({ value: token }),
    set: vi.fn(),
    delete: vi.fn(),
  } as never);
}

describe("POST /api/relief-assignments", () => {
  beforeEach(truncateAll);

  it("rejects timetable entry from another school", async () => {
    const school1 = await createSchool({ slug: "s1" });
    const school2 = await createSchool({ slug: "s2" });
    const user = await createUser({ schoolId: school1.id });
    const token = await createSession(user.id);
    await mockSession(token);

    const teacher2 = await createTeacher(school2.id);
    const period2 = await createPeriod(school2.id, 1);
    const sickTeacher2 = await createTeacher(school2.id, { name: "Sick Teacher" });
    const sickReport = await testPrisma.sickReport.create({
      data: {
        teacherId: sickTeacher2.id,
        startDate: new Date("2026-04-07"),
        endDate: new Date("2026-04-07"),
        schoolId: school2.id,
      },
    });
    const entry = await testPrisma.timetableEntry.create({
      data: {
        teacherId: sickTeacher2.id,
        dayOfWeek: 1,
        periodId: period2.id,
        className: "1A",
        subject: "Math",
        schoolId: school2.id,
      },
    });

    const req = new Request("http://localhost/api/relief-assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sickReportId: sickReport.id,
        timetableEntryId: entry.id,
        reliefTeacherId: teacher2.id,
        date: "2026-04-07",
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it("rejects double-booking same teacher same period", async () => {
    const school = await createSchool();
    const user = await createUser({ schoolId: school.id });
    const token = await createSession(user.id);
    await mockSession(token);

    const sickTeacher = await createTeacher(school.id, { name: "Sick" });
    const reliefTeacher = await createTeacher(school.id, { name: "Relief" });
    const period = await createPeriod(school.id, 1);

    const sickReport = await testPrisma.sickReport.create({
      data: {
        teacherId: sickTeacher.id,
        startDate: new Date("2026-04-07T00:00:00.000Z"),
        endDate: new Date("2026-04-07T00:00:00.000Z"),
        schoolId: school.id,
      },
    });
    const entry = await testPrisma.timetableEntry.create({
      data: {
        teacherId: sickTeacher.id,
        dayOfWeek: 1,
        periodId: period.id,
        className: "1A",
        subject: "Math",
        schoolId: school.id,
      },
    });

    const makeReq = () => new Request("http://localhost/api/relief-assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sickReportId: sickReport.id,
        timetableEntryId: entry.id,
        reliefTeacherId: reliefTeacher.id,
        date: "2026-04-07",
      }),
    });

    const res1 = await POST(makeReq());
    expect(res1.status).toBe(201);

    const res2 = await POST(makeReq());
    expect(res2.status).toBe(409);
  });
});
```

**Step 4: Run relief-assignments tests**

```bash
npm test src/__tests__/api/relief-assignments.test.ts -- --reporter=verbose
```

Expected: May reveal date timezone bug — `T00:00:00` vs `T00:00:00.000Z` mismatch between route and DB query

**Step 5: Fix date construction in `src/app/api/relief-assignments/route.ts` if test fails**

Change:
```typescript
const date = new Date(dateStr + "T00:00:00.000Z");
```
Verify this matches how sick-reports stores dates too (both should use UTC midnight).

**Step 6: Commit**

```bash
git add src/__tests__/api/sick-reports.test.ts src/__tests__/api/relief-assignments.test.ts src/app/api/relief-assignments/route.ts
git commit -m "test: add sick-reports and relief-assignments tests; fix: date timezone consistency"
```

---

### Task 8: Admin API tests

**Files:**
- Create: `src/__tests__/api/admin.test.ts`

**Step 1: Write failing tests**

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { truncateAll, createSchool, createUser, createSession } from "../helpers";
import { GET as getSchools, POST as postSchool } from "@/app/api/admin/schools/route";
import { GET as getUsers, POST as postUser } from "@/app/api/admin/users/route";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

async function mockSession(token: string) {
  const { cookies } = await import("next/headers");
  vi.mocked(cookies).mockResolvedValue({
    get: vi.fn().mockReturnValue({ value: token }),
    set: vi.fn(),
    delete: vi.fn(),
  } as never);
}

describe("GET /api/admin/schools — superadmin only", () => {
  beforeEach(truncateAll);

  it("returns 500/throws for non-superadmin", async () => {
    const school = await createSchool();
    const user = await createUser({ role: "SCHOOL_ADMIN", schoolId: school.id });
    const token = await createSession(user.id);
    await mockSession(token);

    const res = await getSchools();
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it("returns schools for superadmin", async () => {
    const user = await createUser({ role: "SUPERADMIN" });
    const token = await createSession(user.id);
    await mockSession(token);

    const res = await getSchools();
    expect(res.status).toBe(200);
  });
});

describe("POST /api/admin/schools", () => {
  beforeEach(truncateAll);

  it("creates school with valid slug", async () => {
    const user = await createUser({ role: "SUPERADMIN" });
    const token = await createSession(user.id);
    await mockSession(token);

    const req = new Request("http://localhost/api/admin/schools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "New School", slug: "new-school" }),
    });
    const res = await postSchool(req);
    expect(res.status).toBe(201);
  });

  it("rejects invalid slug format", async () => {
    const user = await createUser({ role: "SUPERADMIN" });
    const token = await createSession(user.id);
    await mockSession(token);

    const req = new Request("http://localhost/api/admin/schools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Bad School", slug: "Bad School!" }),
    });
    const res = await postSchool(req);
    expect(res.status).toBe(400);
  });

  it("rejects duplicate slug", async () => {
    await createSchool({ slug: "taken" });
    const user = await createUser({ role: "SUPERADMIN" });
    const token = await createSession(user.id);
    await mockSession(token);

    const req = new Request("http://localhost/api/admin/schools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Another School", slug: "taken" }),
    });
    const res = await postSchool(req);
    expect(res.status).toBe(409);
  });
});

describe("POST /api/admin/users", () => {
  beforeEach(truncateAll);

  it("rejects duplicate email", async () => {
    const school = await createSchool();
    await createUser({ email: "existing@test.com", schoolId: school.id });
    const admin = await createUser({ role: "SUPERADMIN", email: "admin@test.com" });
    const token = await createSession(admin.id);
    await mockSession(token);

    const req = new Request("http://localhost/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "existing@test.com", role: "TEACHER", schoolId: school.id }),
    });
    const res = await postUser(req);
    expect(res.status).toBe(409);
  });

  it("rejects SUPERADMIN role creation", async () => {
    const admin = await createUser({ role: "SUPERADMIN" });
    const token = await createSession(admin.id);
    await mockSession(token);

    const req = new Request("http://localhost/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "hacker@test.com", role: "SUPERADMIN" }),
    });
    const res = await postUser(req);
    expect(res.status).toBe(400);
  });
});
```

**Step 2: Run**

```bash
npm test src/__tests__/api/admin.test.ts -- --reporter=verbose
```

Expected: Some failures — `requireSuperAdmin` throws instead of returning 4xx response

**Step 3: Fix admin routes to catch auth errors and return proper status codes**

In `src/app/api/admin/schools/route.ts` and `src/app/api/admin/users/route.ts`, wrap with try/catch:
```typescript
export async function GET() {
  try {
    await requireSuperAdmin();
    // ...existing logic
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Forbidden";
    if (msg.includes("Unauthorized") || msg.includes("Forbidden")) {
      return NextResponse.json({ error: msg }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

Apply same pattern to all methods in both admin route files.

**Step 4: Re-run**

```bash
npm test src/__tests__/api/admin.test.ts -- --reporter=verbose
```

Expected: All PASS

**Step 5: Commit**

```bash
git add src/__tests__/api/admin.test.ts src/app/api/admin/schools/route.ts src/app/api/admin/users/route.ts
git commit -m "test: add admin API tests; fix: return 403 instead of throwing in admin routes"
```

---

### Task 9: Onboarding API tests

**Files:**
- Create: `src/__tests__/api/onboarding.test.ts`

**Step 1: Write failing tests**

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { truncateAll, testPrisma, createSchool, createUser, createSession } from "../helpers";
import { POST as whitelist } from "@/app/api/onboarding/whitelist/route";
import { POST as complete } from "@/app/api/onboarding/complete/route";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

async function mockSession(token: string) {
  const { cookies } = await import("next/headers");
  vi.mocked(cookies).mockResolvedValue({
    get: vi.fn().mockReturnValue({ value: token }),
    set: vi.fn(),
    delete: vi.fn(),
  } as never);
}

describe("POST /api/onboarding/whitelist", () => {
  beforeEach(truncateAll);

  it("creates teacher users for the school admin's school", async () => {
    const school = await createSchool();
    const admin = await createUser({ role: "SCHOOL_ADMIN", schoolId: school.id });
    const token = await createSession(admin.id);
    await mockSession(token);

    const req = new Request("http://localhost/api/onboarding/whitelist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emails: ["teacher1@test.com", "teacher2@test.com"] }),
    });
    const res = await whitelist(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.created).toBe(2);

    const users = await testPrisma.user.findMany({
      where: { email: { in: ["teacher1@test.com", "teacher2@test.com"] } },
    });
    expect(users.every(u => u.schoolId === school.id)).toBe(true);
    expect(users.every(u => u.role === "TEACHER")).toBe(true);
  });

  it("skips existing emails", async () => {
    const school = await createSchool();
    const admin = await createUser({ role: "SCHOOL_ADMIN", schoolId: school.id });
    await createUser({ email: "existing@test.com", schoolId: school.id });
    const token = await createSession(admin.id);
    await mockSession(token);

    const req = new Request("http://localhost/api/onboarding/whitelist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emails: ["existing@test.com", "new@test.com"] }),
    });
    const res = await whitelist(req);
    const body = await res.json();
    expect(body.created).toBe(1);
    expect(body.skipped).toBe(1);
  });

  it("rejects non-school-admin", async () => {
    const user = await createUser({ role: "SUPERADMIN" });
    const token = await createSession(user.id);
    await mockSession(token);

    const req = new Request("http://localhost/api/onboarding/whitelist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emails: ["teacher@test.com"] }),
    });
    const res = await whitelist(req);
    expect(res.status).toBe(403);
  });
});

describe("POST /api/onboarding/complete", () => {
  beforeEach(truncateAll);

  it("marks school admin as onboarding complete", async () => {
    const school = await createSchool();
    const admin = await createUser({ role: "SCHOOL_ADMIN", schoolId: school.id, onboardingComplete: false });
    const token = await createSession(admin.id);
    await mockSession(token);

    const res = await complete();
    expect(res.status).toBe(200);

    const updated = await testPrisma.user.findUnique({ where: { id: admin.id } });
    expect(updated!.onboardingComplete).toBe(true);
  });
});
```

**Step 2: Run**

```bash
npm test src/__tests__/api/onboarding.test.ts -- --reporter=verbose
```

Expected: All PASS

**Step 3: Commit**

```bash
git add src/__tests__/api/onboarding.test.ts
git commit -m "test: add onboarding API tests"
```

---

### Task 10: Dashboard API tests

**Files:**
- Create: `src/__tests__/api/dashboard.test.ts`

**Step 1: Write failing tests**

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { truncateAll, testPrisma, createSchool, createUser, createSession, createTeacher, createPeriod } from "../helpers";
import { GET } from "@/app/api/dashboard/route";
import { NextRequest } from "next/server";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

async function mockSession(token: string) {
  const { cookies } = await import("next/headers");
  vi.mocked(cookies).mockResolvedValue({
    get: vi.fn().mockReturnValue({ value: token }),
    set: vi.fn(),
    delete: vi.fn(),
  } as never);
}

describe("GET /api/dashboard", () => {
  beforeEach(truncateAll);

  it("returns 400 without date param", async () => {
    const school = await createSchool();
    const user = await createUser({ schoolId: school.id });
    const token = await createSession(user.id);
    await mockSession(token);

    const req = new NextRequest("http://localhost/api/dashboard");
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it("returns isWeekend true for Saturday", async () => {
    const school = await createSchool();
    const user = await createUser({ schoolId: school.id });
    const token = await createSession(user.id);
    await mockSession(token);

    const req = new NextRequest("http://localhost/api/dashboard?date=2026-04-04"); // Saturday
    const res = await GET(req);
    const body = await res.json();
    expect(body.isWeekend).toBe(true);
    expect(body.sickTeachers).toHaveLength(0);
  });

  it("returns empty sickTeachers when no sick reports", async () => {
    const school = await createSchool();
    const user = await createUser({ schoolId: school.id });
    const token = await createSession(user.id);
    await mockSession(token);

    const req = new NextRequest("http://localhost/api/dashboard?date=2026-04-07"); // Monday
    const res = await GET(req);
    const body = await res.json();
    expect(body.isWeekend).toBe(false);
    expect(body.sickTeachers).toHaveLength(0);
  });

  it("does not include data from another school", async () => {
    const school1 = await createSchool({ slug: "s1" });
    const school2 = await createSchool({ slug: "s2" });
    const user = await createUser({ schoolId: school1.id });
    const token = await createSession(user.id);
    await mockSession(token);

    // Create sick teacher in school2
    const teacher2 = await createTeacher(school2.id);
    await testPrisma.sickReport.create({
      data: {
        teacherId: teacher2.id,
        schoolId: school2.id,
        startDate: new Date("2026-04-07T00:00:00.000Z"),
        endDate: new Date("2026-04-07T00:00:00.000Z"),
      },
    });

    const req = new NextRequest("http://localhost/api/dashboard?date=2026-04-07");
    const res = await GET(req);
    const body = await res.json();
    expect(body.sickTeachers).toHaveLength(0); // school1 sees nothing
  });
});
```

**Step 2: Run**

```bash
npm test src/__tests__/api/dashboard.test.ts -- --reporter=verbose
```

Expected: Most PASS; multi-tenancy isolation test confirms schoolId scoping works

**Step 3: Commit**

```bash
git add src/__tests__/api/dashboard.test.ts
git commit -m "test: add dashboard API tests including multi-tenancy isolation"
```

---

### Task 11: Run full suite and coverage report

**Step 1: Run all tests**

```bash
npm test -- --reporter=verbose
```

Expected: All tests PASS

**Step 2: Generate coverage report**

```bash
npm run test:coverage
```

Expected: Coverage report in terminal; aim for >80% on `src/lib/auth.ts` and `src/app/api/**`

**Step 3: Fix any remaining failures**

Address any remaining failures found — likely edge cases in date handling or missing try/catch blocks on `periods`, `timetable`, or `teachers/[id]` routes.

**Step 4: Final commit**

```bash
git add -A
git commit -m "test: complete vitest suite — all tests passing"
```
