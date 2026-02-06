type PeriodSlot = {
  periodStartTime: string;
  periodEndTime: string;
  className: string;
  subject: string;
  isCovered: boolean;
  reliefTeacherName: string | null;
};

type SickTeacherCard = {
  teacherName: string;
  periods: PeriodSlot[];
};

type DashboardData = {
  sickTeachers: SickTeacherCard[];
};

export function generateReliefSummary(
  data: DashboardData,
  formattedDate: string
): string {
  const { sickTeachers } = data;
  if (sickTeachers.length === 0) return "";

  const lines: string[] = [];

  // Header
  lines.push(`RELIEF SUMMARY — ${formattedDate}`);
  lines.push("");

  // Absent section
  lines.push("ABSENT:");
  for (const teacher of sickTeachers) {
    lines.push(`• ${teacher.teacherName}`);
  }
  lines.push("");

  // Build a map: reliefTeacherName → assignments[]
  const reliefMap = new Map<
    string,
    { time: string; className: string; subject: string; sickTeacher: string; startTime: string }[]
  >();

  const uncovered: {
    time: string;
    className: string;
    subject: string;
    sickTeacher: string;
    startTime: string;
  }[] = [];

  for (const teacher of sickTeachers) {
    for (const slot of teacher.periods) {
      const time = `${slot.periodStartTime}–${slot.periodEndTime}`;
      const entry = {
        time,
        className: slot.className,
        subject: slot.subject,
        sickTeacher: teacher.teacherName,
        startTime: slot.periodStartTime,
      };

      if (slot.isCovered && slot.reliefTeacherName) {
        const existing = reliefMap.get(slot.reliefTeacherName) ?? [];
        existing.push(entry);
        reliefMap.set(slot.reliefTeacherName, existing);
      } else {
        uncovered.push(entry);
      }
    }
  }

  // Relief assignments section
  if (reliefMap.size > 0) {
    lines.push("RELIEF ASSIGNMENTS:");
    lines.push("");

    // Sort relief teachers alphabetically
    const sortedTeachers = [...reliefMap.entries()].sort((a, b) =>
      a[0].localeCompare(b[0])
    );

    for (const [teacherName, assignments] of sortedTeachers) {
      lines.push(teacherName.toUpperCase());
      // Sort assignments by start time
      assignments.sort((a, b) => a.startTime.localeCompare(b.startTime));
      for (const a of assignments) {
        lines.push(
          `• ${a.time} → ${a.className} ${a.subject} (replacing ${a.sickTeacher})`
        );
      }
      lines.push("");
    }
  }

  // Uncovered section (only if there are gaps)
  if (uncovered.length > 0) {
    lines.push("UNCOVERED:");
    uncovered.sort((a, b) => a.startTime.localeCompare(b.startTime));
    for (const u of uncovered) {
      lines.push(
        `• ${u.time} → ${u.className} ${u.subject} (${u.sickTeacher}) — no relief assigned`
      );
    }
    lines.push("");
  }

  return lines.join("\n").trimEnd();
}
