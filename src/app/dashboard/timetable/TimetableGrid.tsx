"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";

type Period = {
  id: string;
  number: number;
  startTime: string;
  endTime: string;
};

type TimetableEntry = {
  id: string;
  teacherId: string;
  dayOfWeek: number;
  periodId: string;
  className: string;
  subject: string;
  weekType: string;
};

type Teacher = {
  id: string;
  name: string;
  type: string;
};

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri"];

export default function TimetableGrid({
  teachers,
  periods,
  entries: initialEntries,
  selectedTeacherId,
  weekType,
}: {
  teachers: Teacher[];
  periods: Period[];
  entries: TimetableEntry[];
  selectedTeacherId: string | null;
  weekType: "ODD" | "EVEN";
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [localEntries, setLocalEntries] = useState(initialEntries);
  const [editingCell, setEditingCell] = useState<{
    periodId: string;
    dayOfWeek: number;
  } | null>(null);
  const [formClassName, setFormClassName] = useState("");
  const [formSubject, setFormSubject] = useState("");
  const [isMutating, setIsMutating] = useState(false);

  // Sync local state when server props change (teacher/week switch)
  useEffect(() => {
    setLocalEntries(initialEntries);
  }, [initialEntries]);

  // Build a lookup: entries by "periodId-dayOfWeek"
  const entryMap = new Map<string, TimetableEntry>();
  for (const entry of localEntries) {
    entryMap.set(`${entry.periodId}-${entry.dayOfWeek}`, entry);
  }

  function handleTeacherChange(teacherId: string) {
    startTransition(() => {
      router.push(
        `/dashboard/timetable?teacherId=${teacherId}&weekType=${weekType}`
      );
    });
  }

  function handleWeekTypeChange(newWeekType: "ODD" | "EVEN") {
    startTransition(() => {
      const params = new URLSearchParams();
      if (selectedTeacherId) params.set("teacherId", selectedTeacherId);
      params.set("weekType", newWeekType);
      router.push(`/dashboard/timetable?${params.toString()}`);
    });
  }

  function openEditor(periodId: string, dayOfWeek: number) {
    const existing = entryMap.get(`${periodId}-${dayOfWeek}`);
    setFormClassName(existing?.className ?? "");
    setFormSubject(existing?.subject ?? "");
    setEditingCell({ periodId, dayOfWeek });
  }

  function closeEditor() {
    setEditingCell(null);
    setFormClassName("");
    setFormSubject("");
  }

  async function handleSave() {
    if (!editingCell || !selectedTeacherId) return;
    setIsMutating(true);
    try {
      const res = await fetch("/api/timetable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId: selectedTeacherId,
          dayOfWeek: editingCell.dayOfWeek,
          periodId: editingCell.periodId,
          className: formClassName,
          subject: formSubject,
          weekType,
        }),
      });
      if (res.ok) {
        const saved = await res.json();
        setLocalEntries((prev) => {
          const key = `${saved.periodId}-${saved.dayOfWeek}`;
          const without = prev.filter(
            (e) => `${e.periodId}-${e.dayOfWeek}` !== key
          );
          return [...without, saved];
        });
      }
      closeEditor();
    } finally {
      setIsMutating(false);
    }
  }

  async function handleDelete(id: string) {
    const prev = localEntries;
    setLocalEntries((e) => e.filter((x) => x.id !== id));
    try {
      const res = await fetch(`/api/timetable/${id}`, { method: "DELETE" });
      if (!res.ok) setLocalEntries(prev);
    } catch {
      setLocalEntries(prev);
    }
  }

  if (teachers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-card-border bg-card px-6 py-16 text-center shadow-sm">
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
          No teachers available
        </p>
        <p className="mt-1 text-xs text-muted">
          Add teachers first from the Teachers page.
        </p>
      </div>
    );
  }

  if (periods.length === 0) {
    return (
      <div className="space-y-4">
        {/* Teacher selector (still shown so user can switch) */}
        <div className="rounded-xl border border-card-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-foreground">
              Select Teacher:
            </label>
            <select
              value={selectedTeacherId ?? ""}
              onChange={(e) => handleTeacherChange(e.target.value)}
              className="h-10 w-72 rounded-lg border border-card-border bg-background px-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name}{" "}
                  {teacher.type === "PERMANENT_RELIEF"
                    ? "(Relief)"
                    : "(Regular)"}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center rounded-xl border border-card-border bg-card px-6 py-16 text-center shadow-sm">
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
                d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-sm font-medium text-foreground">
            No periods configured
          </p>
          <p className="mt-1 text-xs text-muted">
            Configure periods in the{" "}
            <a href="/dashboard/settings" className="font-medium text-accent hover:underline">
              Settings
            </a>{" "}
            page first.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Teacher selector + Week type toggle */}
      <div className="mb-6 rounded-xl border border-card-border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <label className="text-sm font-medium text-foreground">
            Select Teacher:
          </label>
          <select
            value={selectedTeacherId ?? ""}
            onChange={(e) => handleTeacherChange(e.target.value)}
            className="h-10 w-72 rounded-lg border border-card-border bg-background px-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          >
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.name}{" "}
                {teacher.type === "PERMANENT_RELIEF"
                  ? "(Relief)"
                  : "(Regular)"}
              </option>
            ))}
          </select>

          {/* Week type segmented control */}
          <div className="ml-auto flex items-center gap-1 rounded-lg border border-card-border p-1">
            <button
              onClick={() => handleWeekTypeChange("ODD")}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                weekType === "ODD"
                  ? "bg-accent text-white"
                  : "bg-background text-muted hover:text-foreground"
              }`}
            >
              Odd Week
            </button>
            <button
              onClick={() => handleWeekTypeChange("EVEN")}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                weekType === "EVEN"
                  ? "bg-accent text-white"
                  : "bg-background text-muted hover:text-foreground"
              }`}
            >
              Even Week
            </button>
          </div>

          {isPending && (
            <span className="text-xs text-muted">Loading...</span>
          )}
        </div>
      </div>

      {/* Timetable grid */}
      <div className="overflow-hidden rounded-xl border border-card-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="w-[140px] border-b border-r border-card-border bg-background px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted">
                  Period
                </th>
                {DAY_NAMES.map((day, idx) => (
                  <th
                    key={idx}
                    className="border-b border-r border-card-border bg-background px-4 py-3 text-center text-xs font-medium uppercase tracking-wide text-muted last:border-r-0"
                  >
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {periods.map((period) => (
                <tr key={period.id}>
                  {/* Period label with delete button */}
                  <td className="border-b border-r border-card-border px-4 py-3 last:border-b-0">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-light font-display text-xs font-bold text-accent">
                        {period.number}
                      </span>
                      <div className="text-xs text-muted">
                        {period.startTime}
                        <br />
                        {period.endTime}
                      </div>
                    </div>
                  </td>

                  {/* Day cells */}
                  {[1, 2, 3, 4, 5].map((dayOfWeek) => {
                    const entry = entryMap.get(
                      `${period.id}-${dayOfWeek}`
                    );
                    const isEditing =
                      editingCell?.periodId === period.id &&
                      editingCell?.dayOfWeek === dayOfWeek;

                    return (
                      <td
                        key={dayOfWeek}
                        className="relative border-b border-r border-card-border last:border-r-0 last:border-b-0"
                      >
                        {isEditing ? (
                          /* Inline edit form */
                          <div className="p-2">
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={formClassName}
                                onChange={(e) =>
                                  setFormClassName(e.target.value)
                                }
                                placeholder="Class (e.g. 3A)"
                                autoFocus
                                className="h-8 w-full rounded border border-card-border bg-background px-2 text-xs text-foreground placeholder:text-muted/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20"
                              />
                              <input
                                type="text"
                                value={formSubject}
                                onChange={(e) =>
                                  setFormSubject(e.target.value)
                                }
                                placeholder="Subject (e.g. Math)"
                                className="h-8 w-full rounded border border-card-border bg-background px-2 text-xs text-foreground placeholder:text-muted/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20"
                              />
                              <div className="flex gap-1">
                                <button
                                  onClick={handleSave}
                                  disabled={
                                    isMutating ||
                                    !formClassName.trim() ||
                                    !formSubject.trim()
                                  }
                                  className="flex-1 rounded bg-accent px-2 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {isMutating ? "Saving..." : "Save"}
                                </button>
                                <button
                                  onClick={closeEditor}
                                  className="flex-1 rounded border border-card-border bg-background px-2 py-1.5 text-xs font-medium text-muted transition-colors hover:text-foreground"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : entry ? (
                          /* Filled cell */
                          <div
                            className="group cursor-pointer p-3 transition-colors hover:bg-accent-light/30"
                            onClick={() =>
                              openEditor(period.id, dayOfWeek)
                            }
                          >
                            <p className="text-sm font-semibold text-foreground">
                              {entry.className}
                            </p>
                            <p className="text-xs text-muted">
                              {entry.subject}
                            </p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(entry.id);
                              }}
                              className="absolute right-1.5 top-1.5 hidden rounded p-1 text-danger opacity-0 transition-all hover:bg-danger-light group-hover:block group-hover:opacity-100"
                              title="Delete entry"
                            >
                              <svg
                                className="h-3.5 w-3.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          /* Empty cell */
                          <div
                            className="flex min-h-[64px] cursor-pointer items-center justify-center p-3 text-muted/30 transition-colors hover:bg-accent-light/20 hover:text-accent"
                            onClick={() =>
                              openEditor(period.id, dayOfWeek)
                            }
                          >
                            <svg
                              className="h-5 w-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={1.5}
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 4.5v15m7.5-7.5h-15"
                              />
                            </svg>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}

            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-6 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded border border-card-border bg-card"></span>
          Click empty cell to add
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded bg-accent-light"></span>
          Click filled cell to edit
        </span>
        <span className="flex items-center gap-1.5">
          <svg
            className="h-3 w-3 text-danger"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          Hover to reveal delete
        </span>
      </div>
    </div>
  );
}
