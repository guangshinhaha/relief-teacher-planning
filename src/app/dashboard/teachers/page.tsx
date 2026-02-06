import { prisma } from "@/lib/prisma";
import { addTeacher, deleteTeacher } from "./actions";

export const dynamic = "force-dynamic";

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
      {/* Page header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
          Teachers
        </h1>
        <p className="mt-1 text-sm text-muted">
          Manage regular and permanent relief teaching staff.
        </p>
      </div>

      {/* Add teacher form */}
      <div className="mb-8 rounded-xl border border-card-border bg-card p-6 shadow-sm">
        <h2 className="font-display text-lg font-semibold text-foreground">
          Add New Teacher
        </h2>
        <p className="mb-4 text-sm text-muted">
          Register a new teacher in the system.
        </p>
        <form action={addTeacher} className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="name"
              className="text-xs font-medium uppercase tracking-wide text-muted"
            >
              Full Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              placeholder="e.g. Sarah Johnson"
              className="h-10 w-64 rounded-lg border border-card-border bg-background px-3 text-sm text-foreground placeholder:text-muted/50 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="type"
              className="text-xs font-medium uppercase tracking-wide text-muted"
            >
              Type
            </label>
            <select
              id="type"
              name="type"
              required
              className="h-10 w-48 rounded-lg border border-card-border bg-background px-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              <option value="REGULAR">Regular</option>
              <option value="PERMANENT_RELIEF">Permanent Relief</option>
            </select>
          </div>
          <button
            type="submit"
            className="h-10 rounded-lg bg-accent px-5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-accent-dark focus:outline-none focus:ring-2 focus:ring-accent/20 focus:ring-offset-2"
          >
            Add Teacher
          </button>
        </form>
      </div>

      {/* Stats row */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-card-border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Total Teachers
          </p>
          <p className="mt-1 font-display text-2xl font-bold text-foreground">
            {teachers.length}
          </p>
        </div>
        <div className="rounded-xl border border-card-border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Regular
          </p>
          <p className="mt-1 font-display text-2xl font-bold text-foreground">
            {teachers.filter((t) => t.type === "REGULAR").length}
          </p>
        </div>
        <div className="rounded-xl border border-card-border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Permanent Relief
          </p>
          <p className="mt-1 font-display text-2xl font-bold text-accent">
            {teachers.filter((t) => t.type === "PERMANENT_RELIEF").length}
          </p>
        </div>
      </div>

      {/* Teachers list */}
      <div className="rounded-xl border border-card-border bg-card shadow-sm">
        <div className="border-b border-card-border px-6 py-4">
          <h2 className="font-display text-lg font-semibold text-foreground">
            All Teachers
          </h2>
        </div>

        {teachers.length > 0 && (
          <div className="divide-y divide-card-border">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_160px_120px_80px] items-center gap-4 px-6 py-3">
              <span className="text-xs font-medium uppercase tracking-wide text-muted">
                Name
              </span>
              <span className="text-xs font-medium uppercase tracking-wide text-muted">
                Type
              </span>
              <span className="text-xs font-medium uppercase tracking-wide text-muted">
                Timetable
              </span>
              <span className="text-xs font-medium uppercase tracking-wide text-muted">
                Action
              </span>
            </div>

            {/* Teacher rows */}
            {teachers.map((teacher) => (
              <div
                key={teacher.id}
                className="grid grid-cols-[1fr_160px_120px_80px] items-center gap-4 px-6 py-4 transition-colors hover:bg-accent-light/30"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-light font-display text-sm font-bold text-accent">
                    {teacher.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {teacher.name}
                  </span>
                </div>
                <div>
                  {teacher.type === "REGULAR" ? (
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                      Regular
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-accent-light px-2.5 py-0.5 text-xs font-medium text-accent-dark">
                      Permanent Relief
                    </span>
                  )}
                </div>
                <span className="text-sm text-muted">
                  {teacher._count.timetableEntries} entries
                </span>
                <form
                  action={async () => {
                    "use server";
                    await deleteTeacher(teacher.id);
                  }}
                >
                  <button
                    type="submit"
                    className="rounded-md px-2.5 py-1.5 text-xs font-medium text-danger transition-colors hover:bg-danger-light"
                  >
                    Delete
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}

        {teachers.length === 0 && (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent-light">
              <svg
                className="h-6 w-6 text-accent"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-foreground">
              No teachers yet
            </p>
            <p className="mt-1 text-xs text-muted">
              Add your first teacher using the form above.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
