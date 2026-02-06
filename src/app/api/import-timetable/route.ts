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

      // Bulk create in batches
      const BATCH_SIZE = 500;
      for (let i = 0; i < entryData.length; i += BATCH_SIZE) {
        await tx.timetableEntry.createMany({
          data: entryData.slice(i, i + BATCH_SIZE),
        });
      }

      return {
        teachers: uniqueTeacherNames.length,
        periods: periods.length,
        entries: entryData.length,
      };
    }, { timeout: 30000 });

    return NextResponse.json({ success: true, created: result });
  } catch (error) {
    console.error("Import failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Import failed: ${message}` },
      { status: 500 }
    );
  }
}
