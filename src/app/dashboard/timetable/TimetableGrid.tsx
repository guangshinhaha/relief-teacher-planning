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
  hasWeekRotation,
}: {
  teachers: Teacher[];
  periods: Period[];
  entries: TimetableEntry[];
  selectedTeacherId: string | null;
  weekType: "ODD" | "EVEN";
  hasWeekRotation: boolean;
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
  const [isEditMode, setIsEditMode] = useState(false);
  const [showEditConfirm, setShowEditConfirm] = useState(false);

  // Mobile: selected day for day-by-day view (0=Mon .. 4=Fri)
  const [selectedDay, setSelectedDay] = useState(() => {
    const today = new Date().getDay(); // 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat
    if (today >= 1 && today <= 5) return today; // Mon-Fri
    return 1; // Default to Monday on weekends
  });

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
              className="h-10 w-full md:w-72 rounded-lg border border-card-border bg-background px-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
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
        <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center md:gap-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
            <label className="text-sm font-medium text-foreground">
              Select Teacher:
            </label>
            <select
              value={selectedTeacherId ?? ""}
              onChange={(e) => handleTeacherChange(e.target.value)}
              className="h-10 w-full md:w-72 rounded-lg border border-card-border bg-background px-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
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

          {/* Week type segmented control — only shown if rotation entries exist */}
          {hasWeekRotation && (
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
          )}

          {/* Edit mode toggle */}
          {isEditMode ? (
            <button
              onClick={() => {
                setIsEditMode(false);
                closeEditor();
              }}
              className="ml-auto flex items-center gap-2 rounded-lg border border-card-border bg-background px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground"
            >
              Done Editing
            </button>
          ) : (
            <button
              onClick={() => setShowEditConfirm(true)}
              className={`flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-dark ${hasWeekRotation ? "" : "ml-auto"}`}
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                />
              </svg>
              Edit Timetable
            </button>
          )}

          {isPending && (
            <span className="text-xs text-muted">Loading...</span>
          )}
        </div>
      </div>

      {/* Edit confirmation modal */}
      {showEditConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-xl border border-card-border bg-card p-6 shadow-lg">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-warning-light">
              <svg
                className="h-6 w-6 text-warning"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
            </div>
            <h3 className="font-display text-lg font-semibold text-foreground">
              Edit Timetable?
            </h3>
            <p className="mt-2 text-sm text-muted">
              This will allow you to add, edit, and delete timetable entries manually. Be careful if you&apos;ve imported a timetable — changes cannot be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowEditConfirm(false)}
                className="flex-1 rounded-lg border border-card-border bg-background px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowEditConfirm(false);
                  setIsEditMode(true);
                }}
                className="flex-1 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-dark"
              >
                Enable Editing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile day-by-day view — hidden on desktop */}
      <div className="md:hidden">
        {/* Day tabs */}
        <div className="mb-4 flex gap-1 rounded-lg border border-card-border bg-card p-1">
          {DAY_NAMES.map((day, idx) => {
            const dayOfWeek = idx + 1;
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(dayOfWeek)}
                className={`flex-1 rounded-md px-2 py-2 text-sm font-medium transition-colors ${
                  selectedDay === dayOfWeek
                    ? "bg-accent text-white shadow-sm"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>

        {/* Period cards for selected day */}
        <div className="space-y-2">
          {periods.map((period) => {
            const entry = entryMap.get(`${period.id}-${selectedDay}`);
            const isEditing =
              editingCell?.periodId === period.id &&
              editingCell?.dayOfWeek === selectedDay;

            return (
              <div
                key={period.id}
                className="rounded-xl border border-card-border bg-card shadow-sm"
              >
                {isEditMode && isEditing ? (
                  <div className="p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-light font-display text-xs font-bold text-accent">
                        {period.number}
                      </span>
                      <span className="text-xs text-muted">
                        {period.startTime} – {period.endTime}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={formClassName}
                        onChange={(e) => setFormClassName(e.target.value)}
                        placeholder="Class (e.g. 3A)"
                        autoFocus
                        className="h-10 w-full rounded-lg border border-card-border bg-background px-3 text-sm text-foreground placeholder:text-muted/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20"
                      />
                      <input
                        type="text"
                        value={formSubject}
                        onChange={(e) => setFormSubject(e.target.value)}
                        placeholder="Subject (e.g. Math)"
                        className="h-10 w-full rounded-lg border border-card-border bg-background px-3 text-sm text-foreground placeholder:text-muted/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleSave}
                          disabled={isMutating || !formClassName.trim() || !formSubject.trim()}
                          className="flex-1 rounded-lg bg-accent px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-dark disabled:opacity-50"
                        >
                          {isMutating ? "Saving..." : "Save"}
                        </button>
                        <button
                          onClick={closeEditor}
                          className="flex-1 rounded-lg border border-card-border bg-background px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:text-foreground"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`flex items-center gap-3 p-4 ${isEditMode ? "cursor-pointer transition-colors hover:bg-accent-light/30" : ""}`}
                    onClick={isEditMode ? () => openEditor(period.id, selectedDay) : undefined}
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-light font-display text-xs font-bold text-accent">
                      {period.number}
                    </span>
                    <div className="min-w-0 flex-1">
                      {entry ? (
                        <>
                          <p className="text-sm font-semibold text-foreground">
                            {entry.className}
                          </p>
                          <p className="text-xs text-muted">{entry.subject}</p>
                        </>
                      ) : (
                        <p className="text-sm text-muted/50">
                          {isEditMode ? "Tap to add" : "Free period"}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-muted">
                      {period.startTime} – {period.endTime}
                    </span>
                    {isEditMode && entry && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(entry.id);
                        }}
                        className="shrink-0 rounded-md p-1.5 text-danger transition-colors hover:bg-danger-light"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Timetable grid */}
      <div className="hidden overflow-hidden rounded-xl border border-card-border bg-card shadow-sm md:block">
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
                        className="relative border-b border-r border-card-border last:border-r-0"
                      >
                        {isEditMode && isEditing ? (
                          /* Inline edit form (edit mode only) */
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
                            className={`p-3 ${isEditMode ? "group cursor-pointer transition-colors hover:bg-accent-light/30" : ""}`}
                            onClick={isEditMode ? () => openEditor(period.id, dayOfWeek) : undefined}
                          >
                            <p className="text-sm font-semibold text-foreground">
                              {entry.className}
                            </p>
                            <p className="text-xs text-muted">
                              {entry.subject}
                            </p>
                            {isEditMode && (
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
                            )}
                          </div>
                        ) : (
                          /* Empty cell */
                          <div
                            className={`flex min-h-[64px] items-center justify-center p-3 ${isEditMode ? "cursor-pointer text-muted/30 transition-colors hover:bg-accent-light/20 hover:text-accent" : ""}`}
                            onClick={isEditMode ? () => openEditor(period.id, dayOfWeek) : undefined}
                          >
                            {isEditMode && (
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
                            )}
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

      {/* Legend (edit mode only) */}
      {isEditMode && (
        <div className="mt-4 hidden items-center gap-6 text-xs text-muted md:flex">
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
      )}
    </div>
  );
}
