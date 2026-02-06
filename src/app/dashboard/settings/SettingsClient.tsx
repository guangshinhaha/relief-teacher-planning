"use client";

import { useState } from "react";

type Period = {
  id: string;
  number: number;
  startTime: string;
  endTime: string;
};

export default function SettingsClient({
  initialPeriods,
}: {
  initialPeriods: Period[];
}) {
  const [periods, setPeriods] = useState(initialPeriods);
  const [isAdding, setIsAdding] = useState(false);

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsAdding(true);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const number = parseInt(formData.get("number") as string, 10);
    const startTime = formData.get("startTime") as string;
    const endTime = formData.get("endTime") as string;

    try {
      const res = await fetch("/api/periods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number, startTime, endTime }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to add period.");
        return;
      }

      const created = await res.json();
      setPeriods((prev) =>
        [...prev, created].sort((a, b) => a.number - b.number)
      );
      form.reset();
    } catch {
      alert("Failed to add period.");
    } finally {
      setIsAdding(false);
    }
  }

  async function handleDelete(id: string) {
    const prev = periods;
    setPeriods((p) => p.filter((x) => x.id !== id));

    try {
      const res = await fetch(`/api/periods/${id}`, { method: "DELETE" });
      if (!res.ok) {
        setPeriods(prev);
        alert("Failed to delete period.");
      }
    } catch {
      setPeriods(prev);
      alert("Failed to delete period.");
    }
  }

  return (
    <>
      {/* Add period form */}
      <div className="mb-8 rounded-xl border border-card-border bg-card p-6 shadow-sm">
        <h2 className="font-display text-lg font-semibold text-foreground">
          Add New Period
        </h2>
        <p className="mb-4 text-sm text-muted">
          Define a new period with its time range.
        </p>
        <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="number"
              className="text-xs font-medium uppercase tracking-wide text-muted"
            >
              Period Number
            </label>
            <input
              type="number"
              id="number"
              name="number"
              min={1}
              required
              placeholder="e.g. 1"
              className="h-10 w-28 rounded-lg border border-card-border bg-background px-3 text-sm text-foreground placeholder:text-muted/50 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="startTime"
              className="text-xs font-medium uppercase tracking-wide text-muted"
            >
              Start Time
            </label>
            <input
              type="time"
              id="startTime"
              name="startTime"
              required
              className="h-10 w-36 rounded-lg border border-card-border bg-background px-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="endTime"
              className="text-xs font-medium uppercase tracking-wide text-muted"
            >
              End Time
            </label>
            <input
              type="time"
              id="endTime"
              name="endTime"
              required
              className="h-10 w-36 rounded-lg border border-card-border bg-background px-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <button
            type="submit"
            disabled={isAdding}
            className="h-10 rounded-lg bg-accent px-5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-accent-dark focus:outline-none focus:ring-2 focus:ring-accent/20 focus:ring-offset-2 disabled:opacity-50"
          >
            {isAdding ? "Adding..." : "Add Period"}
          </button>
        </form>
      </div>

      {/* Periods list */}
      <div className="rounded-xl border border-card-border bg-card shadow-sm">
        <div className="border-b border-card-border px-6 py-4">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Current Periods
          </h2>
          <p className="text-sm text-muted">
            {periods.length === 0
              ? "No periods configured yet."
              : `${periods.length} period${periods.length !== 1 ? "s" : ""} configured.`}
          </p>
        </div>

        {periods.length > 0 && (
          <div className="divide-y divide-card-border">
            {/* Table header */}
            <div className="grid grid-cols-[80px_1fr_1fr_80px] items-center gap-4 px-6 py-3">
              <span className="text-xs font-medium uppercase tracking-wide text-muted">
                Period
              </span>
              <span className="text-xs font-medium uppercase tracking-wide text-muted">
                Start Time
              </span>
              <span className="text-xs font-medium uppercase tracking-wide text-muted">
                End Time
              </span>
              <span className="text-xs font-medium uppercase tracking-wide text-muted">
                Action
              </span>
            </div>

            {/* Table rows */}
            {periods.map((period) => (
              <div
                key={period.id}
                className="grid grid-cols-[80px_1fr_1fr_80px] items-center gap-4 px-6 py-4 transition-colors hover:bg-accent-light/30"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-light font-display text-sm font-bold text-accent">
                  {period.number}
                </div>
                <span className="text-sm font-medium text-foreground">
                  {period.startTime}
                </span>
                <span className="text-sm font-medium text-foreground">
                  {period.endTime}
                </span>
                <button
                  onClick={() => handleDelete(period.id)}
                  className="rounded-md px-2.5 py-1.5 text-xs font-medium text-danger transition-colors hover:bg-danger-light"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}

        {periods.length === 0 && (
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
                  d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-foreground">
              No periods yet
            </p>
            <p className="mt-1 text-xs text-muted">
              Add your first period using the form above.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
