import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET } from "@/app/api/dashboard/route";
import { NextRequest } from "next/server";
import {
  truncateAll,
  createSchool,
  createUser,
  createSession,
  createTeacher,
  createPeriod,
  createSickReport,
  createTimetableEntry,
} from "../helpers";

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

beforeEach(truncateAll);

// 2026-04-07 is a Tuesday (jsDay = 2)
const TEST_DATE = "2026-04-07";
const TEST_DAY_OF_WEEK = 2; // Tuesday

describe("GET /api/dashboard", () => {
  it("returns 400 without date param", async () => {
    const school = await createSchool();
    const user = await createUser({ schoolId: school.id });
    const token = await createSession(user.id);
    await mockSession(token);

    const req = new NextRequest("http://localhost/api/dashboard");
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it("returns isWeekend: true for a Saturday (2026-04-04)", async () => {
    const school = await createSchool();
    const user = await createUser({ schoolId: school.id });
    const token = await createSession(user.id);
    await mockSession(token);

    const req = new NextRequest("http://localhost/api/dashboard?date=2026-04-04");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.isWeekend).toBe(true);
  });

  it("returns empty sickTeachers when no sick reports", async () => {
    const school = await createSchool();
    const user = await createUser({ schoolId: school.id });
    const token = await createSession(user.id);
    await mockSession(token);

    const req = new NextRequest(`http://localhost/api/dashboard?date=${TEST_DATE}`);
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.sickTeachers).toEqual([]);
    expect(body.isWeekend).toBe(false);
  });

  it("does NOT include sick teachers from another school (multi-tenancy)", async () => {
    const school1 = await createSchool({ slug: "school-one" });
    const school2 = await createSchool({ slug: "school-two" });

    const user1 = await createUser({ schoolId: school1.id });
    const token1 = await createSession(user1.id);
    await mockSession(token1);

    // Teacher in school1 with timetable entry on Tuesday (matches TEST_DATE)
    const teacher1 = await createTeacher(school1.id, { name: "School1 Teacher" });
    const period1 = await createPeriod(school1.id, 1);
    await createTimetableEntry(teacher1.id, period1.id, school1.id, {
      dayOfWeek: TEST_DAY_OF_WEEK,
    });
    await createSickReport(teacher1.id, school1.id, {
      startDate: new Date("2026-04-07T00:00:00.000Z"),
      endDate: new Date("2026-04-07T00:00:00.000Z"),
    });

    // Teacher in school2 with timetable entry on Tuesday (matches TEST_DATE)
    const teacher2 = await createTeacher(school2.id, { name: "School2 Teacher" });
    const period2 = await createPeriod(school2.id, 1);
    await createTimetableEntry(teacher2.id, period2.id, school2.id, {
      dayOfWeek: TEST_DAY_OF_WEEK,
    });
    await createSickReport(teacher2.id, school2.id, {
      startDate: new Date("2026-04-07T00:00:00.000Z"),
      endDate: new Date("2026-04-07T00:00:00.000Z"),
    });

    const req = new NextRequest(`http://localhost/api/dashboard?date=${TEST_DATE}`);
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();

    // Only school1's sick teacher should appear
    const teacherNames = body.sickTeachers.map((t: { teacherName: string }) => t.teacherName);
    expect(teacherNames).toContain("School1 Teacher");
    expect(teacherNames).not.toContain("School2 Teacher");
  });
});
