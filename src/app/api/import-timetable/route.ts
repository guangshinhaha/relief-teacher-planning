import { prisma } from "@/lib/prisma";
import { WeekType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

type ImportTeacher = { name: string };
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
    const result = await prisma.$transaction(async (tx) => {
      if (mode === "replace") {
        // Delete in order that respects foreign keys (or rely on cascades)
        await tx.reliefAssignment.deleteMany();
        await tx.sickReport.deleteMany();
        await tx.timetableEntry.deleteMany();
        await tx.teacher.deleteMany();
        await tx.period.deleteMany();
      }

      // Create/upsert periods
      const periodRecords = new Map<number, string>(); // number -> id
      for (const p of periods) {
        if (mode === "replace") {
          const created = await tx.period.create({
            data: { number: p.number, startTime: p.startTime, endTime: p.endTime },
          });
          periodRecords.set(p.number, created.id);
        } else {
          const upserted = await tx.period.upsert({
            where: { number: p.number },
            update: { startTime: p.startTime, endTime: p.endTime },
            create: { number: p.number, startTime: p.startTime, endTime: p.endTime },
          });
          periodRecords.set(p.number, upserted.id);
        }
      }

      // Create/upsert teachers
      const teacherRecords = new Map<string, string>(); // name -> id
      const uniqueTeacherNames = [...new Set(teachers.map((t) => t.name))];
      for (const name of uniqueTeacherNames) {
        if (mode === "replace") {
          const created = await tx.teacher.create({ data: { name, type: "REGULAR" } });
          teacherRecords.set(name, created.id);
        } else {
          // Try to find existing teacher by name
          let teacher = await tx.teacher.findFirst({ where: { name } });
          if (!teacher) {
            teacher = await tx.teacher.create({ data: { name, type: "REGULAR" } });
          }
          teacherRecords.set(name, teacher.id);
        }
      }

      // In merge mode, delete existing timetable entries for imported teachers
      if (mode === "merge") {
        const teacherIds = [...teacherRecords.values()];
        if (teacherIds.length > 0) {
          await tx.timetableEntry.deleteMany({
            where: { teacherId: { in: teacherIds } },
          });
        }
      }

      // Create timetable entries
      let entryCount = 0;
      for (const entry of entries) {
        const teacherId = teacherRecords.get(entry.teacherName);
        const periodId = periodRecords.get(entry.periodNumber);
        if (!teacherId || !periodId) continue;

        await tx.timetableEntry.create({
          data: {
            teacherId,
            dayOfWeek: entry.dayOfWeek,
            periodId,
            className: entry.className,
            subject: entry.subject,
            weekType: entry.weekType as WeekType,
          },
        });
        entryCount++;
      }

      return {
        teachers: uniqueTeacherNames.length,
        periods: periods.length,
        entries: entryCount,
      };
    });

    return NextResponse.json({ success: true, created: result });
  } catch (error) {
    console.error("Import failed:", error);
    return NextResponse.json(
      { error: "Import failed. Please check your file and try again." },
      { status: 500 }
    );
  }
}
