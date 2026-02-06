import { prisma } from "@/lib/prisma";
import { getWeekType } from "@/lib/weekType";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const dateStr = searchParams.get("date");
  const weekOverride = searchParams.get("weekType") as "ODD" | "EVEN" | null;

  if (!dateStr) {
    return NextResponse.json(
      { error: "date parameter is required (YYYY-MM-DD)." },
      { status: 400 }
    );
  }

  const selectedDate = new Date(dateStr + "T00:00:00");
  const jsDay = selectedDate.getDay();
  const isWeekend = jsDay === 0 || jsDay === 6;

  if (isWeekend) {
    return NextResponse.json({
      date: dateStr,
      isWeekend: true,
      weekType: null,
      sickTeachers: [],
      totalUncovered: 0,
      totalCovered: 0,
    });
  }

  const timetableDayOfWeek = jsDay; // 1=Mon ... 5=Fri
  const currentWeekType = weekOverride || getWeekType(selectedDate);
  const dateUTC = new Date(dateStr + "T00:00:00.000Z");

  // Fetch sick reports overlapping this date
  const sickReports = await prisma.sickReport.findMany({
    where: {
      startDate: { lte: dateUTC },
      endDate: { gte: dateUTC },
    },
    include: {
      teacher: true,
      reliefAssignments: {
        where: { date: dateUTC },
        include: {
          reliefTeacher: true,
          timetableEntry: { include: { period: true } },
        },
      },
    },
  });

  const sickTeacherIds = sickReports.map((sr) => sr.teacherId);

  // Timetable entries for sick teachers on this day + matching week type (or ALL)
  const sickTeacherEntries =
    sickTeacherIds.length > 0
      ? await prisma.timetableEntry.findMany({
          where: {
            teacherId: { in: sickTeacherIds },
            dayOfWeek: timetableDayOfWeek,
            weekType: { in: [currentWeekType, "ALL"] },
          },
          include: { period: true },
          orderBy: { period: { number: "asc" } },
        })
      : [];

  // All teachers for availability
  const allTeachers = await prisma.teacher.findMany({
    orderBy: { name: "asc" },
  });

  // All entries for this day + week type (who's busy)
  const allEntriesForDay = await prisma.timetableEntry.findMany({
    where: {
      dayOfWeek: timetableDayOfWeek,
      weekType: { in: [currentWeekType, "ALL"] },
    },
    select: { teacherId: true, periodId: true },
  });

  // Existing relief assignments for this date
  const existingAssignments = await prisma.reliefAssignment.findMany({
    where: { date: dateUTC },
    include: {
      timetableEntry: { select: { periodId: true } },
    },
  });

  // Build lookups
  const teacherBusyPeriods = new Map<string, Set<string>>();
  for (const entry of allEntriesForDay) {
    if (!teacherBusyPeriods.has(entry.teacherId)) {
      teacherBusyPeriods.set(entry.teacherId, new Set());
    }
    teacherBusyPeriods.get(entry.teacherId)!.add(entry.periodId);
  }

  const teacherCoveringPeriods = new Map<string, Set<string>>();
  for (const assignment of existingAssignments) {
    const tid = assignment.reliefTeacherId;
    if (!teacherCoveringPeriods.has(tid)) {
      teacherCoveringPeriods.set(tid, new Set());
    }
    teacherCoveringPeriods.get(tid)!.add(assignment.timetableEntry.periodId);
  }

  const sickTeacherIdSet = new Set(sickTeacherIds);

  const assignmentByEntry = new Map<
    string,
    { id: string; reliefTeacherName: string }
  >();
  for (const sr of sickReports) {
    for (const ra of sr.reliefAssignments) {
      assignmentByEntry.set(ra.timetableEntryId, {
        id: ra.id,
        reliefTeacherName: ra.reliefTeacher.name,
      });
    }
  }

  function getAvailableTeachers(periodId: string, sickTeacherId: string) {
    return allTeachers.filter((teacher) => {
      if (teacher.id === sickTeacherId) return false;
      if (sickTeacherIdSet.has(teacher.id)) return false;
      const busy = teacherBusyPeriods.get(teacher.id);
      if (busy && busy.has(periodId)) return false;
      const covering = teacherCoveringPeriods.get(teacher.id);
      if (covering && covering.has(periodId)) return false;
      return true;
    });
  }

  const sickTeacherCards = sickReports
    .map((sr) => {
      const entries = sickTeacherEntries.filter(
        (e) => e.teacherId === sr.teacherId
      );

      const periods = entries.map((entry) => {
        const assignment = assignmentByEntry.get(entry.id);
        const available = getAvailableTeachers(entry.periodId, sr.teacherId);

        return {
          timetableEntryId: entry.id,
          periodId: entry.periodId,
          periodNumber: entry.period.number,
          periodStartTime: entry.period.startTime,
          periodEndTime: entry.period.endTime,
          className: entry.className,
          subject: entry.subject,
          isCovered: !!assignment,
          reliefTeacherName: assignment?.reliefTeacherName ?? null,
          assignmentId: assignment?.id ?? null,
          availableTeachers: available.map((t) => ({
            id: t.id,
            name: t.name,
            type: t.type,
          })),
        };
      });

      return {
        teacherId: sr.teacherId,
        teacherName: sr.teacher.name,
        sickReportId: sr.id,
        periods,
      };
    })
    .filter((card) => card.periods.length > 0);

  const totalUncovered = sickTeacherCards.reduce(
    (sum, card) => sum + card.periods.filter((p) => !p.isCovered).length,
    0
  );
  const totalCovered = sickTeacherCards.reduce(
    (sum, card) => sum + card.periods.filter((p) => p.isCovered).length,
    0
  );

  return NextResponse.json({
    date: dateStr,
    isWeekend: false,
    weekType: currentWeekType,
    sickTeachers: sickTeacherCards,
    totalUncovered,
    totalCovered,
  });
}
