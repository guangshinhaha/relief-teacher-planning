"use client";

import { useState } from "react";

type Teacher = {
  id: string;
  name: string;
  type: string;
  timetableCount: number;
};

export default function TeachersClient({
  initialTeachers,
}: {
  initialTeachers: Teacher[];
}) {
  const [teachers, setTeachers] = useState(initialTeachers);
  const [isAdding, setIsAdding] = useState(false);

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsAdding(true);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = (formData.get("name") as string)?.trim();
    const type = formData.get("type") as string;

    try {
      const res = await fetch("/api/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, type }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to add teacher.");
        return;
      }

      const created = await res.json();
      setTeachers((prev) =>
        [...prev, { ...created, timetableCount: 0 }].sort((a, b) =>
          a.name.localeCompare(b.name)
        )
      );
      form.reset();
    } catch {
      alert("Failed to add teacher.");
    } finally {
      setIsAdding(false);
    }
  }

  async function handleDelete(id: string) {
    const prev = teachers;
    setTeachers((t) => t.filter((x) => x.id !== id));

    try {
      const res = await fetch(`/api/teachers/${id}`, { method: "DELETE" });
      if (!res.ok) {
        setTeachers(prev);
        alert("Failed to delete teacher.");
      }
    } catch {
      setTeachers(prev);
      alert("Failed to delete teacher.");
    }
  }

  const regularCount = teachers.filter((t) => t.type === "REGULAR").length;
  const reliefCount = teachers.filter(
    (t) => t.type === "PERMANENT_RELIEF"
  ).length;

  return (
    <>
      {/* Add teacher form */}
      <div className="mb-8 rounded-xl border border-card-border bg-card p-6 shadow-sm">
        <h2 className="font-display text-lg font-semibold text-foreground">
          Add New Teacher
        </h2>
        <p className="mb-4 text-sm text-muted">
          Register a new teacher in the system.
        </p>
        <form onSubmit={handleAdd} className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-end">
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
              className="h-10 w-full rounded-lg border border-card-border bg-background px-3 text-sm text-foreground placeholder:text-muted/50 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 md:w-64"
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
              className="h-10 w-full rounded-lg border border-card-border bg-background px-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 md:w-48"
            >
              <option value="REGULAR">Regular</option>
              <option value="PERMANENT_RELIEF">Permanent Relief</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={isAdding}
            className="h-10 w-full rounded-lg bg-accent px-5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-accent-dark focus:outline-none focus:ring-2 focus:ring-accent/20 focus:ring-offset-2 disabled:opacity-50 md:w-auto"
          >
            {isAdding ? "Adding..." : "Add Teacher"}
          </button>
        </form>
      </div>

      {/* Stats row */}
      <div className="mb-6 grid grid-cols-3 gap-2 md:gap-4">
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
            {regularCount}
          </p>
        </div>
        <div className="rounded-xl border border-card-border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Permanent Relief
          </p>
          <p className="mt-1 font-display text-2xl font-bold text-accent">
            {reliefCount}
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
          <>
            {/* Desktop table — hidden on mobile */}
            <div className="hidden divide-y divide-card-border md:block">
              <div className="grid grid-cols-[1fr_160px_120px_80px] items-center gap-4 px-6 py-3">
                <span className="text-xs font-medium uppercase tracking-wide text-muted">Name</span>
                <span className="text-xs font-medium uppercase tracking-wide text-muted">Type</span>
                <span className="text-xs font-medium uppercase tracking-wide text-muted">Timetable</span>
                <span className="text-xs font-medium uppercase tracking-wide text-muted">Action</span>
              </div>
              {teachers.map((teacher) => (
                <div key={teacher.id} className="grid grid-cols-[1fr_160px_120px_80px] items-center gap-4 px-6 py-4 transition-colors hover:bg-accent-light/30">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-light font-display text-sm font-bold text-accent">
                      {teacher.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                    </div>
                    <span className="text-sm font-medium text-foreground">{teacher.name}</span>
                  </div>
                  <div>
                    {teacher.type === "REGULAR" ? (
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">Regular</span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-accent-light px-2.5 py-0.5 text-xs font-medium text-accent-dark">Permanent Relief</span>
                    )}
                  </div>
                  <span className="text-sm text-muted">{teacher.timetableCount} entries</span>
                  <button onClick={() => handleDelete(teacher.id)} className="rounded-md px-2.5 py-1.5 text-xs font-medium text-danger transition-colors hover:bg-danger-light">Delete</button>
                </div>
              ))}
            </div>

            {/* Mobile cards — hidden on desktop */}
            <div className="divide-y divide-card-border md:hidden">
              {teachers.map((teacher) => (
                <div key={teacher.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-light font-display text-sm font-bold text-accent">
                    {teacher.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{teacher.name}</p>
                    <div className="mt-0.5 flex items-center gap-2">
                      {teacher.type === "REGULAR" ? (
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">Regular</span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-accent-light px-2 py-0.5 text-xs font-medium text-accent-dark">Relief</span>
                      )}
                      <span className="text-xs text-muted">{teacher.timetableCount} entries</span>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(teacher.id)} className="shrink-0 rounded-md p-2 text-danger transition-colors hover:bg-danger-light">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </>
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
    </>
  );
}
