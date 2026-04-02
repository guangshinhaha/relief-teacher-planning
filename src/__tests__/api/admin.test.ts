import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET as getSchools, POST as postSchools } from "@/app/api/admin/schools/route";
import { POST as postUsers } from "@/app/api/admin/users/route";
import {
  truncateAll,
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

describe("GET /api/admin/schools", () => {
  it("returns 403 for non-superadmin", async () => {
    const school = await createSchool();
    const user = await createUser({ schoolId: school.id, role: "SCHOOL_ADMIN" });
    const token = await createSession(user.id);
    await mockSession(token);

    const res = await getSchools();
    expect(res.status).toBe(403);
  });

  it("returns 200 for superadmin", async () => {
    const user = await createUser({ role: "SUPERADMIN" });
    const token = await createSession(user.id);
    await mockSession(token);

    const res = await getSchools();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });
});

describe("POST /api/admin/schools", () => {
  it("creates school with valid slug", async () => {
    const user = await createUser({ role: "SUPERADMIN" });
    const token = await createSession(user.id);
    await mockSession(token);

    const req = new Request("http://localhost/api/admin/schools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "New School", slug: "new-school" }),
    });
    const res = await postSchools(req as never);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.slug).toBe("new-school");
  });

  it("returns 400 for invalid slug format (uppercase)", async () => {
    const user = await createUser({ role: "SUPERADMIN" });
    const token = await createSession(user.id);
    await mockSession(token);

    const req = new Request("http://localhost/api/admin/schools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Bad School", slug: "BadSchool" }),
    });
    const res = await postSchools(req as never);
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid slug format (special chars)", async () => {
    const user = await createUser({ role: "SUPERADMIN" });
    const token = await createSession(user.id);
    await mockSession(token);

    const req = new Request("http://localhost/api/admin/schools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Bad School", slug: "bad_school!" }),
    });
    const res = await postSchools(req as never);
    expect(res.status).toBe(400);
  });

  it("returns 409 for duplicate slug", async () => {
    const user = await createUser({ role: "SUPERADMIN" });
    const token = await createSession(user.id);
    await mockSession(token);

    await createSchool({ slug: "existing-school" });

    const req = new Request("http://localhost/api/admin/schools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Duplicate", slug: "existing-school" }),
    });
    const res = await postSchools(req as never);
    expect(res.status).toBe(409);
  });
});

describe("POST /api/admin/users", () => {
  it("returns 409 for duplicate email", async () => {
    const superAdmin = await createUser({ role: "SUPERADMIN", email: "super@test.com" });
    const token = await createSession(superAdmin.id);
    await mockSession(token);

    await createUser({ email: "existing@test.com" });

    const req = new Request("http://localhost/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "existing@test.com", role: "SCHOOL_ADMIN" }),
    });
    const res = await postUsers(req as never);
    expect(res.status).toBe(409);
  });

  it("returns 400 for SUPERADMIN role (not allowed)", async () => {
    const superAdmin = await createUser({ role: "SUPERADMIN", email: "super2@test.com" });
    const token = await createSession(superAdmin.id);
    await mockSession(token);

    const req = new Request("http://localhost/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "newsuper@test.com", role: "SUPERADMIN" }),
    });
    const res = await postUsers(req as never);
    expect(res.status).toBe(400);
  });

  it("creates user successfully for SCHOOL_ADMIN role", async () => {
    const superAdmin = await createUser({ role: "SUPERADMIN", email: "super3@test.com" });
    const token = await createSession(superAdmin.id);
    await mockSession(token);

    const req = new Request("http://localhost/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "newadmin@test.com", role: "SCHOOL_ADMIN" }),
    });
    const res = await postUsers(req as never);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.email).toBe("newadmin@test.com");
    expect(body.role).toBe("SCHOOL_ADMIN");
  });
});
