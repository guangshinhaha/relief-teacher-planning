import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST as postWhitelist } from "@/app/api/onboarding/whitelist/route";
import { POST as postComplete } from "@/app/api/onboarding/complete/route";
import {
  truncateAll,
  testPrisma,
  createSchool,
  createUser,
  createSession,
  mockSession,
  mockNoSession,
} from "../helpers";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

beforeEach(truncateAll);

describe("POST /api/onboarding/whitelist", () => {
  it("creates TEACHER users for the correct school", async () => {
    const school = await createSchool();
    const admin = await createUser({ role: "SCHOOL_ADMIN", schoolId: school.id });
    const token = await createSession(admin.id);
    await mockSession(token);

    const req = new Request("http://localhost/api/onboarding/whitelist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emails: ["teacher1@test.com", "teacher2@test.com"] }),
    });
    const res = await postWhitelist(req as never);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.created).toBe(2);
    expect(body.skipped).toBe(0);

    const users = await testPrisma.user.findMany({
      where: { email: { in: ["teacher1@test.com", "teacher2@test.com"] } },
    });
    expect(users.length).toBe(2);
    users.forEach((u) => {
      expect(u.role).toBe("TEACHER");
      expect(u.schoolId).toBe(school.id);
    });
  });

  it("skips already-existing emails (reports created/skipped counts)", async () => {
    const school = await createSchool();
    const admin = await createUser({ role: "SCHOOL_ADMIN", schoolId: school.id });
    const token = await createSession(admin.id);
    await mockSession(token);

    // Pre-create one user
    await createUser({ email: "existing@test.com" });

    const req = new Request("http://localhost/api/onboarding/whitelist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emails: ["existing@test.com", "new@test.com"] }),
    });
    const res = await postWhitelist(req as never);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.created).toBe(1);
    expect(body.skipped).toBe(1);
  });

  it("returns 403 for non-school-admin (SUPERADMIN trying to whitelist)", async () => {
    const user = await createUser({ role: "SUPERADMIN" });
    const token = await createSession(user.id);
    await mockSession(token);

    const req = new Request("http://localhost/api/onboarding/whitelist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emails: ["teacher@test.com"] }),
    });
    const res = await postWhitelist(req as never);
    expect(res.status).toBe(403);
  });
});

describe("POST /api/onboarding/complete", () => {
  it("marks school admin's onboardingComplete as true", async () => {
    const school = await createSchool();
    const admin = await createUser({
      role: "SCHOOL_ADMIN",
      schoolId: school.id,
      onboardingComplete: false,
    });
    const token = await createSession(admin.id);
    await mockSession(token);

    const res = await postComplete();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);

    const updated = await testPrisma.user.findUnique({ where: { id: admin.id } });
    expect(updated!.onboardingComplete).toBe(true);
  });

  it("returns 403 for non-school-admin", async () => {
    const user = await createUser({ role: "SUPERADMIN" });
    const token = await createSession(user.id);
    await mockSession(token);

    const res = await postComplete();
    expect(res.status).toBe(403);
  });
});
