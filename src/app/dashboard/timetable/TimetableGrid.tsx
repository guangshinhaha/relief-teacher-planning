"use client";

import { useState, useTransition } from "react";
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
  entries,
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
  const [editingCell, setEditingCell] = useState<{
    periodId: string;
    dayOfWeek: number;
  } | null>(null);
  const [formClassName, setFormClassName] = useState("");
  const [formSubject, setFormSubject] = useState("");
  const [isMutating, setIsMutating] = useState(false);

  // Period management state
  const [showPeriodForm, setShowPeriodForm] = useState(false);
  const [newPeriodNumber, setNewPeriodNumber] = useState("");
  const [newPeriodStart, setNewPeriodStart] = useState("");
  const [newPeriodEnd, setNewPeriodEnd] = useState("");

  // Build a lookup: entries by "periodId-dayOfWeek"
  const entryMap = new Map<string, TimetableEntry>();
  for (const entry of entries) {
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
      await fetch("/api/timetable", {
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
      closeEditor();
      router.refresh();
    } finally {
      setIsMutating(false);
    }
  }

  async function handleDelete(id: string) {
    setIsMutating(true);
    try {
      await fetch(`/api/timetable/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setIsMutating(false);
    }
  }

  async function handleAddPeriod() {
    const num = parseInt(newPeriodNumber, 10);
    if (!num || !newPeriodStart.trim() || !newPeriodEnd.trim()) return;
    setIsMutating(true);
    try {
      await fetch("/api/periods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          number: num,
          startTime: newPeriodStart.trim(),
          endTime: newPeriodEnd.trim(),
        }),
      });
      setNewPeriodNumber("");
      setNewPeriodStart("");
      setNewPeriodEnd("");
      setShowPeriodForm(false);
      router.refresh();
    } finally {
      setIsMutating(false);
    }
  }

  async function handleDeletePeriod(periodId: string) {
    if (!confirm("Delete this period? All timetable entries for this period will also be removed.")) return;
    setIsMutating(true);
    try {
      await fetch(`/api/periods/${periodId}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setIsMutating(false);
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
          <p className="mt-1 mb-4 text-xs text-muted">
            Add your first period to get started.
          </p>
          {/* Inline add period form for empty state */}
          {!showPeriodForm ? (
            <button
              onClick={() => setShowPeriodForm(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-dark"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add Period
            </button>
          ) : (
            <div className="flex items-end gap-2">
              <div>
                <label className="mb-1 block text-left text-xs font-medium text-muted">Period #</label>
                <input
                  type="number"
                  min="1"
                  value={newPeriodNumber}
                  onChange={(e) => setNewPeriodNumber(e.target.value)}
                  placeholder="1"
                  className="h-9 w-16 rounded-lg border border-card-border bg-background px-2 text-center text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-left text-xs font-medium text-muted">Start</label>
                <input
                  type="text"
                  value={newPeriodStart}
                  onChange={(e) => setNewPeriodStart(e.target.value)}
                  placeholder="08:30"
                  className="h-9 w-20 rounded-lg border border-card-border bg-background px-2 text-center text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-left text-xs font-medium text-muted">End</label>
                <input
                  type="text"
                  value={newPeriodEnd}
                  onChange={(e) => setNewPeriodEnd(e.target.value)}
                  placeholder="09:15"
                  className="h-9 w-20 rounded-lg border border-card-border bg-background px-2 text-center text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </div>
              <button
                onClick={handleAddPeriod}
                disabled={isMutating || !newPeriodNumber || !newPeriodStart.trim() || !newPeriodEnd.trim()}
                className="h-9 rounded-lg bg-accent px-3 text-sm font-medium text-white transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50"
              >
                Add
              </button>
              <button
                onClick={() => setShowPeriodForm(false)}
                className="h-9 rounded-lg border border-card-border bg-background px-3 text-sm font-medium text-muted transition-colors hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          )}
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
                    <div className="group flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-light font-display text-xs font-bold text-accent">
                        {period.number}
                      </span>
                      <div className="text-xs text-muted">
                        {period.startTime}
                        <br />
                        {period.endTime}
                      </div>
                      <button
                        onClick={() => handleDeletePeriod(period.id)}
                        className="ml-auto hidden rounded p-1 text-danger opacity-0 transition-all hover:bg-danger-light group-hover:block group-hover:opacity-100"
                        title="Delete period"
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
                            d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                          />
                        </svg>
                      </button>
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

              {/* Add Period row */}
              <tr>
                <td
                  colSpan={6}
                  className="border-t border-card-border px-4 py-2"
                >
                  {!showPeriodForm ? (
                    <button
                      onClick={() => {
                        setNewPeriodNumber(
                          String((periods[periods.length - 1]?.number ?? 0) + 1)
                        );
                        setShowPeriodForm(true);
                      }}
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-card-border py-2 text-xs font-medium text-muted transition-colors hover:border-accent hover:text-accent"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      Add Period
                    </button>
                  ) : (
                    <div className="flex items-end gap-2 py-1">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-muted">Period #</label>
                        <input
                          type="number"
                          min="1"
                          value={newPeriodNumber}
                          onChange={(e) => setNewPeriodNumber(e.target.value)}
                          placeholder="1"
                          className="h-9 w-16 rounded-lg border border-card-border bg-background px-2 text-center text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-muted">Start Time</label>
                        <input
                          type="text"
                          value={newPeriodStart}
                          onChange={(e) => setNewPeriodStart(e.target.value)}
                          placeholder="08:30"
                          className="h-9 w-20 rounded-lg border border-card-border bg-background px-2 text-center text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-muted">End Time</label>
                        <input
                          type="text"
                          value={newPeriodEnd}
                          onChange={(e) => setNewPeriodEnd(e.target.value)}
                          placeholder="09:15"
                          className="h-9 w-20 rounded-lg border border-card-border bg-background px-2 text-center text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                        />
                      </div>
                      <button
                        onClick={handleAddPeriod}
                        disabled={isMutating || !newPeriodNumber || !newPeriodStart.trim() || !newPeriodEnd.trim()}
                        className="h-9 rounded-lg bg-accent px-3 text-sm font-medium text-white transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isMutating ? "Adding..." : "Add"}
                      </button>
                      <button
                        onClick={() => {
                          setShowPeriodForm(false);
                          setNewPeriodNumber("");
                          setNewPeriodStart("");
                          setNewPeriodEnd("");
                        }}
                        className="h-9 rounded-lg border border-card-border bg-background px-3 text-sm font-medium text-muted transition-colors hover:text-foreground"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </td>
              </tr>
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
