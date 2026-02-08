import { prisma } from "@/lib/prisma";
import { WeekType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

type ImportTeacher = { name: string; firstName?: string; lastName?: string; short?: string };
type ImportPeriod = { number: number; startTime: string; endTime: string };
type ImportEntry = {
  teacherName: string;
  dayOfWeek: number;
  periodNumber: number;
  className: string;
  subject: string;
  weekType: string;
};

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { mode, teachers, periods, entries } = body as {
    mode: "replace" | "merge";
    teachers: ImportTeacher[];
    periods: ImportPeriod[];
    entries: ImportEntry[];
  };

  if (!mode || !teachers || !periods || !entries) {
    return NextResponse.json(
      { error: "mode, teachers, periods, and entries are required." },
      { status: 400 }
    );
  }

  if (mode !== "replace" && mode !== "merge") {
    return NextResponse.json(
      { error: "mode must be 'replace' or 'merge'." },
      { status: 400 }
    );
  }

  try {
    // Replace mode: delete everything first (outside main transaction to reduce duration)
    if (mode === "replace") {
      await prisma.reliefAssignment.deleteMany();
      await prisma.sickReport.deleteMany();
      await prisma.timetableEntry.deleteMany();
      await prisma.teacher.deleteMany();
      await prisma.period.deleteMany();
    }

    // Bulk create periods
    if (mode === "replace") {
      await prisma.period.createMany({
        data: periods.map((p) => ({
          number: p.number,
          startTime: p.startTime,
          endTime: p.endTime,
        })),
      });
    } else {
      // Upsert periods one by one (only 10 or so — fast enough)
      for (const p of periods) {
        await prisma.period.upsert({
          where: { number: p.number },
          update: { startTime: p.startTime, endTime: p.endTime },
          create: { number: p.number, startTime: p.startTime, endTime: p.endTime },
        });
      }
    }

    // Fetch all periods to build number -> id map
    const allPeriods = await prisma.period.findMany();
    const periodRecords = new Map<number, string>();
    for (const p of allPeriods) periodRecords.set(p.number, p.id);

    // Deduplicate teachers by name, keeping first occurrence
    const uniqueTeacherMap = new Map<string, ImportTeacher>();
    for (const t of teachers) {
      if (!uniqueTeacherMap.has(t.name)) {
        uniqueTeacherMap.set(t.name, t);
      }
    }
    const uniqueTeachers = [...uniqueTeacherMap.values()];
    const uniqueTeacherNames = uniqueTeachers.map((t) => t.name);

    if (mode === "replace") {
      await prisma.teacher.createMany({
        data: uniqueTeachers.map((t) => ({
          name: t.name,
          firstName: t.firstName || null,
          lastName: t.lastName || null,
          short: t.short || null,
          type: "REGULAR" as const,
        })),
      });
    } else {
      // Find existing teachers, create only new ones
      const existing = await prisma.teacher.findMany({
        where: { name: { in: uniqueTeacherNames } },
      });
      const existingNames = new Set(existing.map((t) => t.name));
      const newTeachers = uniqueTeachers.filter((t) => !existingNames.has(t.name));
      if (newTeachers.length > 0) {
        await prisma.teacher.createMany({
          data: newTeachers.map((t) => ({
            name: t.name,
            firstName: t.firstName || null,
            lastName: t.lastName || null,
            short: t.short || null,
            type: "REGULAR" as const,
          })),
        });
      }
    }

    // Fetch all teachers to build name -> id map
    const allTeachers = await prisma.teacher.findMany();
    const teacherRecords = new Map<string, string>();
    for (const t of allTeachers) teacherRecords.set(t.name, t.id);

    // In merge mode, delete existing timetable entries for imported teachers
    if (mode === "merge") {
      const importedTeacherIds = uniqueTeacherNames
        .map((n) => teacherRecords.get(n))
        .filter((id): id is string => !!id);
      if (importedTeacherIds.length > 0) {
        await prisma.timetableEntry.deleteMany({
          where: { teacherId: { in: importedTeacherIds } },
        });
      }
    }

    // Build timetable entry data, deduplicating by unique constraint
    const seen = new Set<string>();
    const entryData: {
      teacherId: string;
      dayOfWeek: number;
      periodId: string;
      className: string;
      subject: string;
      weekType: WeekType;
    }[] = [];

    for (const entry of entries) {
      const teacherId = teacherRecords.get(entry.teacherName);
      const periodId = periodRecords.get(entry.periodNumber);
      if (!teacherId || !periodId) continue;

      const key = `${teacherId}-${entry.dayOfWeek}-${periodId}-${entry.weekType}`;
      if (seen.has(key)) continue;
      seen.add(key);

      entryData.push({
        teacherId,
        dayOfWeek: entry.dayOfWeek,
        periodId,
        className: entry.className,
        subject: entry.subject,
        weekType: entry.weekType as WeekType,
      });
    }

    // Bulk create entries in batches
    const BATCH_SIZE = 500;
    for (let i = 0; i < entryData.length; i += BATCH_SIZE) {
      await prisma.timetableEntry.createMany({
        data: entryData.slice(i, i + BATCH_SIZE),
      });
    }

    return NextResponse.json({
      success: true,
      created: {
        teachers: uniqueTeacherNames.length,
        periods: periods.length,
        entries: entryData.length,
      },
    });
  } catch (error) {
    console.error("Import failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Import failed: ${message}` },
      { status: 500 }
    );
  }
}
