import { prisma } from "@/lib/prisma";
import { getSchoolId } from "@/lib/auth";
import { getWeekType } from "@/lib/weekType";
import TimetableGrid from "./TimetableGrid";

export default async function TimetablePage({
  searchParams,
}: {
  searchParams: Promise<{ teacherId?: string; weekType?: string }>;
}) {
  const { teacherId, weekType } = await searchParams;
  const schoolId = await getSchoolId();

  // Determine the selected week type, defaulting based on current ISO week
  const selectedWeekType: "ODD" | "EVEN" =
    weekType === "ODD" || weekType === "EVEN"
      ? weekType
      : getWeekType(new Date());

  const [teachers, periods, rotationEntry] = await Promise.all([
    prisma.teacher.findMany({
      where: { schoolId },
      orderBy: { name: "asc" },
    }),
    prisma.period.findMany({
      where: { schoolId },
      orderBy: { number: "asc" },
    }),
    prisma.timetableEntry.findFirst({
      where: { schoolId, weekType: { in: ["ODD", "EVEN"] } },
      select: { id: true },
    }),
  ]);

  const hasWeekRotation = !!rotationEntry;

  // Use provided teacherId or fall back to the first teacher
  const selectedTeacherId = teacherId ?? teachers[0]?.id ?? null;

  // Fetch timetable entries for selected teacher, filtered by weekType
  const entries = selectedTeacherId
    ? await prisma.timetableEntry.findMany({
        where: {
          schoolId,
          teacherId: selectedTeacherId,
          weekType: { in: [selectedWeekType, "ALL"] },
        },
        include: { period: true },
      })
    : [];

  const selectedTeacher = teachers.find((t) => t.id === selectedTeacherId);

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
          Timetable
        </h1>
        <p className="mt-1 text-sm text-muted">
          {selectedTeacher
            ? `Viewing timetable for ${selectedTeacher.name}`
            : "Manage weekly class schedules for each teacher."}
        </p>
      </div>

      <TimetableGrid
        teachers={teachers}
        periods={periods}
        entries={entries}
        selectedTeacherId={selectedTeacherId}
        weekType={selectedWeekType}
        hasWeekRotation={hasWeekRotation}
      />
    </div>
  );
}
