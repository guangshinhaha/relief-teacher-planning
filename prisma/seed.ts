import { PrismaClient, TeacherType } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL } },
});

async function main() {
  // Clear existing data
  await prisma.reliefAssignment.deleteMany();
  await prisma.sickReport.deleteMany();
  await prisma.timetableEntry.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.period.deleteMany();

  // Create periods (typical school day)
  const periodsData = [
    { number: 1, startTime: "07:30", endTime: "08:20" },
    { number: 2, startTime: "08:20", endTime: "09:10" },
    { number: 3, startTime: "09:30", endTime: "10:20" },
    { number: 4, startTime: "10:20", endTime: "11:10" },
    { number: 5, startTime: "11:30", endTime: "12:20" },
    { number: 6, startTime: "12:20", endTime: "13:10" },
    { number: 7, startTime: "14:00", endTime: "14:50" },
  ];
  const periods = [];
  for (const p of periodsData) {
    periods.push(await prisma.period.create({ data: p }));
  }

  // Create teachers
  const teachersData = [
    { name: "Mr Tan Wei Ming", type: TeacherType.REGULAR },
    { name: "Ms Lim Siew Hua", type: TeacherType.REGULAR },
    { name: "Mr Ahmad bin Hassan", type: TeacherType.REGULAR },
    { name: "Ms Priya Nair", type: TeacherType.REGULAR },
    { name: "Mr David Chen", type: TeacherType.REGULAR },
    { name: "Ms Sarah Wong", type: TeacherType.REGULAR },
    { name: "Mr Kumar Rajan", type: TeacherType.PERMANENT_RELIEF },
    { name: "Ms Fatimah bte Ali", type: TeacherType.PERMANENT_RELIEF },
  ];
  const teachers = [];
  for (const t of teachersData) {
    teachers.push(await prisma.teacher.create({ data: t }));
  }

  const [tan, lim, ahmad, priya, david, sarah] = teachers;

  // Create timetable entries (sample: Mon-Fri for a few teachers)
  const entries = [
    // Mr Tan - teaches Math
    { teacher: tan, day: 1, period: periods[0], className: "3A", subject: "Math" },
    { teacher: tan, day: 1, period: periods[1], className: "3B", subject: "Math" },
    { teacher: tan, day: 1, period: periods[2], className: "4A", subject: "Math" },
    { teacher: tan, day: 2, period: periods[0], className: "3A", subject: "Math" },
    { teacher: tan, day: 2, period: periods[3], className: "4B", subject: "Math" },
    { teacher: tan, day: 3, period: periods[1], className: "3B", subject: "Math" },
    { teacher: tan, day: 3, period: periods[4], className: "4A", subject: "Math" },
    { teacher: tan, day: 4, period: periods[0], className: "3A", subject: "Math" },
    { teacher: tan, day: 4, period: periods[2], className: "3B", subject: "Math" },
    { teacher: tan, day: 5, period: periods[1], className: "4B", subject: "Math" },

    // Ms Lim - teaches English
    { teacher: lim, day: 1, period: periods[2], className: "3A", subject: "English" },
    { teacher: lim, day: 1, period: periods[3], className: "3B", subject: "English" },
    { teacher: lim, day: 2, period: periods[1], className: "4A", subject: "English" },
    { teacher: lim, day: 2, period: periods[4], className: "3A", subject: "English" },
    { teacher: lim, day: 3, period: periods[0], className: "3B", subject: "English" },
    { teacher: lim, day: 4, period: periods[3], className: "4A", subject: "English" },
    { teacher: lim, day: 5, period: periods[0], className: "3A", subject: "English" },
    { teacher: lim, day: 5, period: periods[2], className: "4B", subject: "English" },

    // Mr Ahmad - teaches Science
    { teacher: ahmad, day: 1, period: periods[4], className: "3A", subject: "Science" },
    { teacher: ahmad, day: 1, period: periods[5], className: "4A", subject: "Science" },
    { teacher: ahmad, day: 2, period: periods[2], className: "3B", subject: "Science" },
    { teacher: ahmad, day: 3, period: periods[3], className: "4B", subject: "Science" },
    { teacher: ahmad, day: 4, period: periods[1], className: "3A", subject: "Science" },
    { teacher: ahmad, day: 5, period: periods[4], className: "4A", subject: "Science" },

    // Ms Priya - teaches History
    { teacher: priya, day: 1, period: periods[0], className: "4A", subject: "History" },
    { teacher: priya, day: 2, period: periods[3], className: "3A", subject: "History" },
    { teacher: priya, day: 3, period: periods[2], className: "3B", subject: "History" },
    { teacher: priya, day: 4, period: periods[4], className: "4B", subject: "History" },
    { teacher: priya, day: 5, period: periods[0], className: "4A", subject: "History" },

    // Mr David - teaches Geography
    { teacher: david, day: 1, period: periods[3], className: "4B", subject: "Geography" },
    { teacher: david, day: 2, period: periods[0], className: "3B", subject: "Geography" },
    { teacher: david, day: 3, period: periods[5], className: "3A", subject: "Geography" },
    { teacher: david, day: 4, period: periods[3], className: "4A", subject: "Geography" },
    { teacher: david, day: 5, period: periods[2], className: "3B", subject: "Geography" },

    // Ms Sarah - teaches Chinese
    { teacher: sarah, day: 1, period: periods[1], className: "3A", subject: "Chinese" },
    { teacher: sarah, day: 2, period: periods[2], className: "4B", subject: "Chinese" },
    { teacher: sarah, day: 3, period: periods[0], className: "3A", subject: "Chinese" },
    { teacher: sarah, day: 4, period: periods[5], className: "3B", subject: "Chinese" },
    { teacher: sarah, day: 5, period: periods[3], className: "4A", subject: "Chinese" },
  ];

  for (const e of entries) {
    await prisma.timetableEntry.create({
      data: {
        teacherId: e.teacher.id,
        dayOfWeek: e.day,
        periodId: e.period.id,
        className: e.className,
        subject: e.subject,
      },
    });
  }

  console.log("Seed complete:");
  console.log(`  ${periods.length} periods`);
  console.log(`  ${teachers.length} teachers`);
  console.log(`  ${entries.length} timetable entries`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
