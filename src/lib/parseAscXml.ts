// src/lib/parseAscXml.ts

export type ParsedTeacher = { name: string };
export type ParsedPeriod = { number: number; startTime: string; endTime: string };
export type ParsedEntry = {
  teacherName: string;
  dayOfWeek: number;
  periodNumber: number;
  className: string;
  subject: string;
  weekType: "ALL" | "ODD" | "EVEN";
};
export type ParseResult = {
  teachers: ParsedTeacher[];
  periods: ParsedPeriod[];
  entries: ParsedEntry[];
};

export function parseAscXml(xmlString: string, weekType: "ALL" | "ODD" | "EVEN"): ParseResult {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, "text/xml");

  const parseError = doc.querySelector("parsererror");
  if (parseError) {
    throw new Error(`XML parsing failed: ${parseError.textContent}`);
  }

  // Parse periods
  const periodEls = doc.querySelectorAll("period");
  const periods: ParsedPeriod[] = [];
  for (const el of periodEls) {
    const num = parseInt(el.getAttribute("period") || "0", 10);
    const startTime = el.getAttribute("starttime") || "";
    const endTime = el.getAttribute("endtime") || "";
    if (num > 0 && startTime && endTime) {
      periods.push({ number: num, startTime, endTime });
    }
  }

  // Parse teachers
  const teacherEls = doc.querySelectorAll("teacher");
  const teacherMap = new Map<string, string>(); // id -> name
  const teacherNames = new Set<string>();
  const teachers: ParsedTeacher[] = [];
  for (const el of teacherEls) {
    const id = el.getAttribute("id") || "";
    const firstname = (el.getAttribute("firstname") || "").trim();
    const lastname = (el.getAttribute("lastname") || "").trim();
    const short = (el.getAttribute("short") || "").trim();
    let name = "";
    if (firstname && lastname) {
      name = `${firstname} ${lastname}`;
    } else if (lastname) {
      name = lastname;
    } else if (firstname) {
      name = firstname;
    } else {
      name = short;
    }
    if (id && name) {
      teacherMap.set(id, name);
      if (!teacherNames.has(name)) {
        teacherNames.add(name);
        teachers.push({ name });
      }
    }
  }

  // Parse subjects (id -> short name)
  const subjectMap = new Map<string, string>();
  for (const el of doc.querySelectorAll("subject")) {
    const id = el.getAttribute("id") || "";
    const short = el.getAttribute("short") || el.getAttribute("name") || "";
    if (id && short) subjectMap.set(id, short);
  }

  // Parse classes (id -> short name)
  const classMap = new Map<string, string>();
  for (const el of doc.querySelectorAll("class")) {
    const id = el.getAttribute("id") || "";
    const short = el.getAttribute("short") || el.getAttribute("name") || "";
    if (id && short) classMap.set(id, short);
  }

  // Parse lessons (id -> { teacherIds, subjectId, classIds })
  type LessonInfo = { teacherIds: string[]; subjectId: string; classIds: string[] };
  const lessonMap = new Map<string, LessonInfo>();
  for (const el of doc.querySelectorAll("lesson")) {
    const id = el.getAttribute("id") || "";
    const teacherIds = (el.getAttribute("teacherids") || "").split(",").filter(Boolean);
    const subjectId = el.getAttribute("subjectid") || "";
    const classIds = (el.getAttribute("classids") || "").split(",").filter(Boolean);
    if (id && teacherIds.length > 0) {
      lessonMap.set(id, { teacherIds, subjectId, classIds });
    }
  }

  // Parse cards -> timetable entries
  const entries: ParsedEntry[] = [];
  for (const el of doc.querySelectorAll("card")) {
    const lessonId = el.getAttribute("lessonid") || "";
    const periodNum = parseInt(el.getAttribute("period") || "0", 10);
    const days = el.getAttribute("days") || "";

    const lesson = lessonMap.get(lessonId);
    if (!lesson || periodNum === 0) continue;

    // Decode day bitmask
    const dayOfWeek = days.indexOf("1") + 1; // "10000"->1, "01000"->2, etc.
    if (dayOfWeek < 1 || dayOfWeek > 5) continue;

    const subjectName = subjectMap.get(lesson.subjectId) || "Unknown";
    const classNames = lesson.classIds.map((cid) => classMap.get(cid) || "Unknown");
    const className = classNames.join(", ");

    for (const teacherId of lesson.teacherIds) {
      const teacherName = teacherMap.get(teacherId);
      if (!teacherName) continue;

      entries.push({
        teacherName,
        dayOfWeek,
        periodNumber: periodNum,
        className,
        subject: subjectName,
        weekType,
      });
    }
  }

  return { teachers, periods, entries };
}
