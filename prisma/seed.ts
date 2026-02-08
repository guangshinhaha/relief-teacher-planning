import { PrismaClient, TeacherType, WeekType } from "@prisma/client";

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
    { name: "Tan Wei Ming", firstName: "Wei Ming", lastName: "Tan", short: "TWM", type: TeacherType.REGULAR },
    { name: "Lim Siew Hua", firstName: "Siew Hua", lastName: "Lim", short: "LSH", type: TeacherType.REGULAR },
    { name: "Ahmad bin Hassan", firstName: "Ahmad", lastName: "Hassan", short: "Ahmad", type: TeacherType.REGULAR },
    { name: "Priya Nair", firstName: "Priya", lastName: "Nair", short: "Priya", type: TeacherType.REGULAR },
    { name: "David Chen", firstName: "David", lastName: "Chen", short: "David", type: TeacherType.REGULAR },
    { name: "Sarah Wong", firstName: "Sarah", lastName: "Wong", short: "Sarah", type: TeacherType.REGULAR },
    { name: "Kumar Rajan", firstName: "Kumar", lastName: "Rajan", short: "KRaj", type: TeacherType.PERMANENT_RELIEF },
    { name: "Fatimah Ali", firstName: "Fatimah", lastName: "Ali", short: "FAli", type: TeacherType.PERMANENT_RELIEF },
  ];
  const teachers = [];
  for (const t of teachersData) {
    teachers.push(await prisma.teacher.create({ data: t }));
  }

  const [tan, lim, ahmad, priya, david, sarah] = teachers;

  // Create timetable entries (sample: Mon-Fri for a few teachers)
  // Some entries use ODD/EVEN to demonstrate week rotation
  const entries = [
    // Mr Tan - teaches Math (some classes rotate odd/even)
    { teacher: tan, day: 1, period: periods[0], className: "3A", subject: "Math", weekType: WeekType.ODD },
    { teacher: tan, day: 1, period: periods[0], className: "4C", subject: "Math", weekType: WeekType.EVEN },
    { teacher: tan, day: 1, period: periods[1], className: "3B", subject: "Math", weekType: WeekType.ODD },
    { teacher: tan, day: 1, period: periods[1], className: "4A", subject: "Math", weekType: WeekType.EVEN },
    { teacher: tan, day: 1, period: periods[2], className: "4A", subject: "Math", weekType: WeekType.ODD },
    { teacher: tan, day: 1, period: periods[2], className: "3B", subject: "Math", weekType: WeekType.EVEN },
    { teacher: tan, day: 2, period: periods[0], className: "3A", subject: "Math", weekType: WeekType.ODD },
    { teacher: tan, day: 2, period: periods[0], className: "3A", subject: "Math Remedial", weekType: WeekType.EVEN },
    { teacher: tan, day: 2, period: periods[3], className: "4B", subject: "Math", weekType: WeekType.ODD },
    { teacher: tan, day: 2, period: periods[3], className: "4B", subject: "Math", weekType: WeekType.EVEN },
    { teacher: tan, day: 3, period: periods[1], className: "3B", subject: "Math", weekType: WeekType.ODD },
    { teacher: tan, day: 3, period: periods[1], className: "3B", subject: "Math", weekType: WeekType.EVEN },
    { teacher: tan, day: 3, period: periods[4], className: "4A", subject: "Math", weekType: WeekType.ODD },
    { teacher: tan, day: 4, period: periods[0], className: "3A", subject: "Math", weekType: WeekType.ODD },
    { teacher: tan, day: 4, period: periods[0], className: "3A", subject: "Math", weekType: WeekType.EVEN },
    { teacher: tan, day: 4, period: periods[2], className: "3B", subject: "Math", weekType: WeekType.ODD },
    { teacher: tan, day: 4, period: periods[2], className: "3B", subject: "Math", weekType: WeekType.EVEN },
    { teacher: tan, day: 5, period: periods[1], className: "4B", subject: "Math", weekType: WeekType.ODD },
    { teacher: tan, day: 5, period: periods[1], className: "4B", subject: "Math", weekType: WeekType.EVEN },

    // Ms Lim - teaches English (consistent both weeks)
    { teacher: lim, day: 1, period: periods[2], className: "3A", subject: "English", weekType: WeekType.ODD },
    { teacher: lim, day: 1, period: periods[2], className: "3A", subject: "English", weekType: WeekType.EVEN },
    { teacher: lim, day: 1, period: periods[3], className: "3B", subject: "English", weekType: WeekType.ODD },
    { teacher: lim, day: 1, period: periods[3], className: "3B", subject: "English", weekType: WeekType.EVEN },
    { teacher: lim, day: 2, period: periods[1], className: "4A", subject: "English", weekType: WeekType.ODD },
    { teacher: lim, day: 2, period: periods[1], className: "4A", subject: "English", weekType: WeekType.EVEN },
    { teacher: lim, day: 2, period: periods[4], className: "3A", subject: "English", weekType: WeekType.ODD },
    { teacher: lim, day: 3, period: periods[0], className: "3B", subject: "English", weekType: WeekType.ODD },
    { teacher: lim, day: 3, period: periods[0], className: "3B", subject: "English", weekType: WeekType.EVEN },
    { teacher: lim, day: 4, period: periods[3], className: "4A", subject: "English", weekType: WeekType.ODD },
    { teacher: lim, day: 4, period: periods[3], className: "4A", subject: "English", weekType: WeekType.EVEN },
    { teacher: lim, day: 5, period: periods[0], className: "3A", subject: "English", weekType: WeekType.ODD },
    { teacher: lim, day: 5, period: periods[0], className: "3A", subject: "English", weekType: WeekType.EVEN },
    { teacher: lim, day: 5, period: periods[2], className: "4B", subject: "English", weekType: WeekType.ODD },
    { teacher: lim, day: 5, period: periods[2], className: "4B", subject: "English", weekType: WeekType.EVEN },

    // Mr Ahmad - teaches Science
    { teacher: ahmad, day: 1, period: periods[4], className: "3A", subject: "Science", weekType: WeekType.ODD },
    { teacher: ahmad, day: 1, period: periods[4], className: "3A", subject: "Science", weekType: WeekType.EVEN },
    { teacher: ahmad, day: 1, period: periods[5], className: "4A", subject: "Science", weekType: WeekType.ODD },
    { teacher: ahmad, day: 2, period: periods[2], className: "3B", subject: "Science", weekType: WeekType.ODD },
    { teacher: ahmad, day: 2, period: periods[2], className: "3B", subject: "Science", weekType: WeekType.EVEN },
    { teacher: ahmad, day: 3, period: periods[3], className: "4B", subject: "Science", weekType: WeekType.ODD },
    { teacher: ahmad, day: 3, period: periods[3], className: "4B", subject: "Science Lab", weekType: WeekType.EVEN },
    { teacher: ahmad, day: 4, period: periods[1], className: "3A", subject: "Science", weekType: WeekType.ODD },
    { teacher: ahmad, day: 4, period: periods[1], className: "3A", subject: "Science", weekType: WeekType.EVEN },
    { teacher: ahmad, day: 5, period: periods[4], className: "4A", subject: "Science", weekType: WeekType.ODD },
    { teacher: ahmad, day: 5, period: periods[4], className: "4A", subject: "Science", weekType: WeekType.EVEN },

    // Ms Priya - teaches History
    { teacher: priya, day: 1, period: periods[0], className: "4A", subject: "History", weekType: WeekType.ODD },
    { teacher: priya, day: 1, period: periods[0], className: "4A", subject: "History", weekType: WeekType.EVEN },
    { teacher: priya, day: 2, period: periods[3], className: "3A", subject: "History", weekType: WeekType.ODD },
    { teacher: priya, day: 3, period: periods[2], className: "3B", subject: "History", weekType: WeekType.ODD },
    { teacher: priya, day: 3, period: periods[2], className: "3B", subject: "History", weekType: WeekType.EVEN },
    { teacher: priya, day: 4, period: periods[4], className: "4B", subject: "History", weekType: WeekType.ODD },
    { teacher: priya, day: 4, period: periods[4], className: "4B", subject: "History", weekType: WeekType.EVEN },
    { teacher: priya, day: 5, period: periods[0], className: "4A", subject: "History", weekType: WeekType.ODD },
    { teacher: priya, day: 5, period: periods[0], className: "4A", subject: "History", weekType: WeekType.EVEN },

    // Mr David - teaches Geography
    { teacher: david, day: 1, period: periods[3], className: "4B", subject: "Geography", weekType: WeekType.ODD },
    { teacher: david, day: 1, period: periods[3], className: "4B", subject: "Geography", weekType: WeekType.EVEN },
    { teacher: david, day: 2, period: periods[0], className: "3B", subject: "Geography", weekType: WeekType.ODD },
    { teacher: david, day: 2, period: periods[0], className: "3B", subject: "Geography", weekType: WeekType.EVEN },
    { teacher: david, day: 3, period: periods[5], className: "3A", subject: "Geography", weekType: WeekType.ODD },
    { teacher: david, day: 4, period: periods[3], className: "4A", subject: "Geography", weekType: WeekType.ODD },
    { teacher: david, day: 4, period: periods[3], className: "4A", subject: "Geography", weekType: WeekType.EVEN },
    { teacher: david, day: 5, period: periods[2], className: "3B", subject: "Geography", weekType: WeekType.ODD },
    { teacher: david, day: 5, period: periods[2], className: "3B", subject: "Geography", weekType: WeekType.EVEN },

    // Ms Sarah - teaches Chinese
    { teacher: sarah, day: 1, period: periods[1], className: "3A", subject: "Chinese", weekType: WeekType.ODD },
    { teacher: sarah, day: 1, period: periods[1], className: "3A", subject: "Chinese", weekType: WeekType.EVEN },
    { teacher: sarah, day: 2, period: periods[2], className: "4B", subject: "Chinese", weekType: WeekType.ODD },
    { teacher: sarah, day: 2, period: periods[2], className: "4B", subject: "Chinese", weekType: WeekType.EVEN },
    { teacher: sarah, day: 3, period: periods[0], className: "3A", subject: "Chinese", weekType: WeekType.ODD },
    { teacher: sarah, day: 3, period: periods[0], className: "3A", subject: "Chinese", weekType: WeekType.EVEN },
    { teacher: sarah, day: 4, period: periods[5], className: "3B", subject: "Chinese", weekType: WeekType.ODD },
    { teacher: sarah, day: 4, period: periods[5], className: "3B", subject: "Chinese", weekType: WeekType.EVEN },
    { teacher: sarah, day: 5, period: periods[3], className: "4A", subject: "Chinese", weekType: WeekType.ODD },
    { teacher: sarah, day: 5, period: periods[3], className: "4A", subject: "Chinese", weekType: WeekType.EVEN },
  ];

  for (const e of entries) {
    await prisma.timetableEntry.create({
      data: {
        teacherId: e.teacher.id,
        dayOfWeek: e.day,
        periodId: e.period.id,
        className: e.className,
        subject: e.subject,
        weekType: e.weekType,
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
