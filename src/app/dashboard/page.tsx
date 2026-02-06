import { prisma } from "@/lib/prisma";
import DashboardContent from "./DashboardContent";

const DAY_LABELS: Record<number, string> = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date: dateParam } = await searchParams;

  // Determine the selected date (default to today)
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const dateStr = dateParam || todayStr;

  // Parse as local date to get correct day of week
  const selectedDate = new Date(dateStr + "T00:00:00");
  const jsDay = selectedDate.getDay(); // 0=Sunday ... 6=Saturday
  const isWeekend = jsDay === 0 || jsDay === 6;
  // Convert JS day (0=Sun) to timetable day (1=Mon ... 5=Fri)
  const timetableDayOfWeek = jsDay === 0 ? 7 : jsDay; // 7 for Sunday won't match any entry
  const dayLabel = DAY_LABELS[jsDay] || "Unknown";

  // For DB queries, use UTC midnight
  const dateUTC = new Date(dateStr + "T00:00:00.000Z");

  if (isWeekend) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Relief Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted">
            Manage daily relief teacher assignments.
          </p>
        </div>
        <DashboardContent
          date={dateStr}
          dayLabel={dayLabel}
          isWeekend={true}
          sickTeachers={[]}
          totalUncovered={0}
          totalCovered={0}
          totalSickTeachers={0}
        />
      </div>
    );
  }

  // Fetch all sick reports that overlap the selected date
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
          timetableEntry: {
            include: { period: true },
          },
        },
      },
    },
  });

  // Get all timetable entries for the sick teachers on this day of week
  const sickTeacherIds = sickReports.map((sr) => sr.teacherId);

  const sickTeacherEntries = sickTeacherIds.length > 0
    ? await prisma.timetableEntry.findMany({
        where: {
          teacherId: { in: sickTeacherIds },
          dayOfWeek: timetableDayOfWeek,
        },
        include: { period: true },
        orderBy: { period: { number: "asc" } },
      })
    : [];

  // Get ALL teachers for availability calculations
  const allTeachers = await prisma.teacher.findMany({
    orderBy: { name: "asc" },
  });

  // Get all timetable entries for this day of week (to know who's busy)
  const allEntriesForDay = await prisma.timetableEntry.findMany({
    where: { dayOfWeek: timetableDayOfWeek },
    select: { teacherId: true, periodId: true },
  });

  // Get all existing relief assignments for this date (to know who's already covering)
  const existingAssignments = await prisma.reliefAssignment.findMany({
    where: { date: dateUTC },
    include: {
      timetableEntry: {
        select: { periodId: true },
      },
    },
  });

  // Build lookup: teacherId -> Set of periodIds they teach on this day
  const teacherBusyPeriods = new Map<string, Set<string>>();
  for (const entry of allEntriesForDay) {
    if (!teacherBusyPeriods.has(entry.teacherId)) {
      teacherBusyPeriods.set(entry.teacherId, new Set());
    }
    teacherBusyPeriods.get(entry.teacherId)!.add(entry.periodId);
  }

  // Build lookup: reliefTeacherId -> Set of periodIds they're covering on this date
  const teacherCoveringPeriods = new Map<string, Set<string>>();
  for (const assignment of existingAssignments) {
    const tid = assignment.reliefTeacherId;
    if (!teacherCoveringPeriods.has(tid)) {
      teacherCoveringPeriods.set(tid, new Set());
    }
    teacherCoveringPeriods.get(tid)!.add(assignment.timetableEntry.periodId);
  }

  // Also build a set of sick teacher IDs (they cannot cover for others)
  const sickTeacherIdSet = new Set(sickTeacherIds);

  // Build assignment lookup: timetableEntryId -> ReliefAssignment
  const assignmentByEntry = new Map<
    string,
    {
      id: string;
      reliefTeacherName: string;
    }
  >();
  for (const sr of sickReports) {
    for (const ra of sr.reliefAssignments) {
      assignmentByEntry.set(ra.timetableEntryId, {
        id: ra.id,
        reliefTeacherName: ra.reliefTeacher.name,
      });
    }
  }

  // Helper: find available teachers for a specific periodId
  function getAvailableTeachers(periodId: string, sickTeacherId: string) {
    return allTeachers.filter((teacher) => {
      // 1. Not the sick teacher
      if (teacher.id === sickTeacherId) return false;

      // 2. Not currently sick themselves
      if (sickTeacherIdSet.has(teacher.id)) return false;

      // 3. Not teaching during this period
      const busyPeriods = teacherBusyPeriods.get(teacher.id);
      if (busyPeriods && busyPeriods.has(periodId)) return false;

      // 4. Not already covering another class during this period
      const coveringPeriods = teacherCoveringPeriods.get(teacher.id);
      if (coveringPeriods && coveringPeriods.has(periodId)) return false;

      return true;
    });
  }

  // Build the card data for each sick teacher
  const sickTeacherCards = sickReports.map((sr) => {
    // Get timetable entries for this sick teacher on this day
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
  });

  // Filter out sick teachers who have no timetable entries for this day
  const activeSickTeachers = sickTeacherCards.filter(
    (card) => card.periods.length > 0
  );

  // Compute totals
  const totalUncovered = activeSickTeachers.reduce(
    (sum, card) => sum + card.periods.filter((p) => !p.isCovered).length,
    0
  );
  const totalCovered = activeSickTeachers.reduce(
    (sum, card) => sum + card.periods.filter((p) => p.isCovered).length,
    0
  );

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
          Relief Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted">
          Manage daily relief teacher assignments.
        </p>
      </div>

      <DashboardContent
        date={dateStr}
        dayLabel={dayLabel}
        isWeekend={false}
        sickTeachers={activeSickTeachers}
        totalUncovered={totalUncovered}
        totalCovered={totalCovered}
        totalSickTeachers={activeSickTeachers.length}
      />
    </div>
  );
}
