import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST } from "@/app/api/relief-assignments/route";
import {
  truncateAll,
  createSchool,
  createUser,
  createSession,
  createTeacher,
  createPeriod,
  createSickReport,
  createTimetableEntry,
  mockSession,
  mockNoSession,
} from "../helpers";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

beforeEach(truncateAll);

describe("POST /api/relief-assignments", () => {
  it("returns 404 for timetable entry from another school", async () => {
    const school1 = await createSchool({ slug: "school-one" });
    const school2 = await createSchool({ slug: "school-two" });
    const user = await createUser({ schoolId: school1.id });
    const token = await createSession(user.id);
    await mockSession(token);

    const sickTeacher = await createTeacher(school1.id, { name: "Sick Teacher" });
    const reliefTeacher = await createTeacher(school1.id, { name: "Relief Teacher" });
    const period = await createPeriod(school2.id, 1);
    const otherTeacher = await createTeacher(school2.id, { name: "Other" });
    const timetableEntry = await createTimetableEntry(otherTeacher.id, period.id, school2.id);
    const sickReport = await createSickReport(sickTeacher.id, school1.id);

    const req = new Request("http://localhost/api/relief-assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sickReportId: sickReport.id,
        timetableEntryId: timetableEntry.id,
        reliefTeacherId: reliefTeacher.id,
        date: "2026-04-07",
      }),
    });
    const res = await POST(req as never);
    expect(res.status).toBe(404);
  });

  it("returns 409 for double-booking (same teacher + same period + same date)", async () => {
    const school = await createSchool();
    const user = await createUser({ schoolId: school.id });
    const token = await createSession(user.id);
    await mockSession(token);

    const sickTeacher = await createTeacher(school.id, { name: "Sick Teacher" });
    const reliefTeacher = await createTeacher(school.id, { name: "Relief Teacher" });
    const period = await createPeriod(school.id, 1);
    const timetableEntry = await createTimetableEntry(sickTeacher.id, period.id, school.id);
    const sickReport = await createSickReport(sickTeacher.id, school.id);

    const date = "2026-04-07";

    // First assignment
    const req1 = new Request("http://localhost/api/relief-assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sickReportId: sickReport.id,
        timetableEntryId: timetableEntry.id,
        reliefTeacherId: reliefTeacher.id,
        date,
      }),
    });
    const res1 = await POST(req1 as never);
    expect(res1.status).toBe(201);

    // Second assignment - same period + same date + same relief teacher
    // We need another sick teacher and timetable entry but same period + relief teacher
    const anotherSickTeacher = await createTeacher(school.id, { name: "Another Sick" });
    const anotherEntry = await createTimetableEntry(anotherSickTeacher.id, period.id, school.id, {
      dayOfWeek: 2,
    });
    const anotherSickReport = await createSickReport(anotherSickTeacher.id, school.id);

    const req2 = new Request("http://localhost/api/relief-assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sickReportId: anotherSickReport.id,
        timetableEntryId: anotherEntry.id,
        reliefTeacherId: reliefTeacher.id,
        date,
      }),
    });
    const res2 = await POST(req2 as never);
    expect(res2.status).toBe(409);
  });

  it("returns 401 for unauthenticated request", async () => {
    await mockNoSession();
    const req = new Request("http://localhost/api/relief-assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sickReportId: "fake",
        timetableEntryId: "fake",
        reliefTeacherId: "fake",
        date: "2026-04-07",
      }),
    });
    const res = await POST(req as never);
    expect(res.status).toBe(401);
  });

  it("returns 201 for valid assignment", async () => {
    const school = await createSchool();
    const user = await createUser({ schoolId: school.id });
    const token = await createSession(user.id);
    await mockSession(token);

    const sickTeacher = await createTeacher(school.id, { name: "Sick Teacher" });
    const reliefTeacher = await createTeacher(school.id, { name: "Relief Teacher" });
    const period = await createPeriod(school.id, 1);
    const timetableEntry = await createTimetableEntry(sickTeacher.id, period.id, school.id);
    const sickReport = await createSickReport(sickTeacher.id, school.id);

    const req = new Request("http://localhost/api/relief-assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sickReportId: sickReport.id,
        timetableEntryId: timetableEntry.id,
        reliefTeacherId: reliefTeacher.id,
        date: "2026-04-07",
      }),
    });
    const res = await POST(req as never);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.reliefTeacherId).toBe(reliefTeacher.id);
    expect(body.schoolId).toBe(school.id);
  });
});
