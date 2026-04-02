import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET, POST } from "@/app/api/teachers/route";
import {
  truncateAll,
  createSchool,
  createUser,
  createSession,
  createTeacher,
  mockSession,
  mockNoSession,
} from "../helpers";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

beforeEach(truncateAll);

describe("GET /api/teachers", () => {
  it("returns teachers scoped to authenticated school only", async () => {
    const school = await createSchool();
    const user = await createUser({ schoolId: school.id });
    const token = await createSession(user.id);
    await mockSession(token);

    const teacher1 = await createTeacher(school.id, { name: "Alice" });
    const teacher2 = await createTeacher(school.id, { name: "Bob" });

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.length).toBe(2);
    const names = body.map((t: { name: string }) => t.name);
    expect(names).toContain("Alice");
    expect(names).toContain("Bob");
  });

  it("does NOT return teachers from another school (multi-tenancy)", async () => {
    const school1 = await createSchool({ slug: "school-one" });
    const school2 = await createSchool({ slug: "school-two" });
    const user1 = await createUser({ schoolId: school1.id });
    const token1 = await createSession(user1.id);
    await mockSession(token1);

    await createTeacher(school1.id, { name: "School1 Teacher" });
    await createTeacher(school2.id, { name: "School2 Teacher" });

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.length).toBe(1);
    expect(body[0].name).toBe("School1 Teacher");
    expect(body.map((t: { name: string }) => t.name)).not.toContain("School2 Teacher");
  });
});

describe("GET /api/teachers (unauthenticated)", () => {
  it("returns 401 for unauthenticated request", async () => {
    await mockNoSession();
    const res = await GET();
    expect(res.status).toBe(401);
  });
});

describe("POST /api/teachers", () => {
  it("returns 401 for unauthenticated request", async () => {
    await mockNoSession();
    const req = new Request("http://localhost/api/teachers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Unauthorized Teacher" }),
    });
    const res = await POST(req as never);
    expect(res.status).toBe(401);
  });

  it("creates teacher in correct school", async () => {
    const school = await createSchool();
    const user = await createUser({ schoolId: school.id });
    const token = await createSession(user.id);
    await mockSession(token);

    const req = new Request("http://localhost/api/teachers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "New Teacher" }),
    });
    const res = await POST(req as never);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.name).toBe("New Teacher");
    expect(body.schoolId).toBe(school.id);
  });

  it("returns 400 for missing name", async () => {
    const school = await createSchool();
    const user = await createUser({ schoolId: school.id });
    const token = await createSession(user.id);
    await mockSession(token);

    const req = new Request("http://localhost/api/teachers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
  });

  it("returns 201 with correct schoolId", async () => {
    const school = await createSchool();
    const user = await createUser({ schoolId: school.id });
    const token = await createSession(user.id);
    await mockSession(token);

    const req = new Request("http://localhost/api/teachers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Jane Doe", type: "PERMANENT_RELIEF" }),
    });
    const res = await POST(req as never);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.schoolId).toBe(school.id);
    expect(body.type).toBe("PERMANENT_RELIEF");
  });
});
