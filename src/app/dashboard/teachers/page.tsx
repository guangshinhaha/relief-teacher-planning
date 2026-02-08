import { prisma } from "@/lib/prisma";
import TeachersClient from "./TeachersClient";

export default async function TeachersPage() {
  const teachers = await prisma.teacher.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { timetableEntries: true },
      },
    },
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
          Teachers
        </h1>
        <p className="mt-1 text-sm text-muted">
          Manage regular and permanent relief teaching staff.
        </p>
      </div>

      <TeachersClient
        initialTeachers={teachers.map((t) => ({
          id: t.id,
          name: t.name,
          type: t.type,
          timetableCount: t._count.timetableEntries,
        }))}
      />
    </div>
  );
}
