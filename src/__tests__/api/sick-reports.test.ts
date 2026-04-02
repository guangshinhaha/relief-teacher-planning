import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST } from "@/app/api/sick-reports/route";
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

describe("POST /api/sick-reports", () => {
  it("creates sick report for teacher in same school", async () => {
    const school = await createSchool();
    const user = await createUser({ schoolId: school.id });
    const token = await createSession(user.id);
    await mockSession(token);

    const teacher = await createTeacher(school.id, { name: "Alice" });

    const req = new Request("http://localhost/api/sick-reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teacherId: teacher.id,
        startDate: "2026-04-07",
        numberOfDays: 2,
      }),
    });
    const res = await POST(req as never);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.teacherId).toBe(teacher.id);
    expect(body.schoolId).toBe(school.id);
  });

  it("returns 404 for teacher from another school", async () => {
    const school1 = await createSchool({ slug: "school-one" });
    const school2 = await createSchool({ slug: "school-two" });
    const user = await createUser({ schoolId: school1.id });
    const token = await createSession(user.id);
    await mockSession(token);

    const otherTeacher = await createTeacher(school2.id, { name: "Bob" });

    const req = new Request("http://localhost/api/sick-reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teacherId: otherTeacher.id,
        startDate: "2026-04-07",
        numberOfDays: 1,
      }),
    });
    const res = await POST(req as never);
    expect(res.status).toBe(404);
  });

  it("returns 400 for numberOfDays > 14", async () => {
    const school = await createSchool();
    const user = await createUser({ schoolId: school.id });
    const token = await createSession(user.id);
    await mockSession(token);

    const teacher = await createTeacher(school.id, { name: "Carol" });

    const req = new Request("http://localhost/api/sick-reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teacherId: teacher.id,
        startDate: "2026-04-07",
        numberOfDays: 15,
      }),
    });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
  });

  it("returns 400 for missing fields", async () => {
    const school = await createSchool();
    const user = await createUser({ schoolId: school.id });
    const token = await createSession(user.id);
    await mockSession(token);

    const req = new Request("http://localhost/api/sick-reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startDate: "2026-04-07" }),
    });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
  });

  it("returns 401 for unauthenticated request", async () => {
    await mockNoSession();
    const req = new Request("http://localhost/api/sick-reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teacherId: "fake", startDate: "2026-04-07", numberOfDays: 1 }),
    });
    const res = await POST(req as never);
    expect(res.status).toBe(401);
  });
});
