"use client";

import { useRef, useState } from "react";

type AvailableTeacher = {
  id: string;
  name: string;
  type: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (assignedTeacher: { id: string; name: string }) => void;
  periodNumber: number;
  periodStartTime: string;
  periodEndTime: string;
  className: string;
  subject: string;
  sickTeacherName: string;
  sickReportId: string;
  timetableEntryId: string;
  date: string;
  availableTeachers: AvailableTeacher[];
};

export default function AssignReliefModal({
  isOpen,
  onClose,
  onSuccess,
  periodNumber,
  periodStartTime,
  periodEndTime,
  className,
  subject,
  sickTeacherName,
  sickReportId,
  timetableEntryId,
  date,
  availableTeachers,
}: Props) {
  const [isPending, setIsPending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const reliefTeacherId = formData.get("reliefTeacherId") as string;

    if (!reliefTeacherId) return;

    setIsPending(true);
    try {
      const res = await fetch("/api/relief-assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sickReportId,
          timetableEntryId,
          reliefTeacherId,
          date,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "Failed to assign relief teacher.");
      }

      const teacher = availableTeachers.find(t => t.id === reliefTeacherId)!;
      onSuccess({ id: teacher.id, name: teacher.name });
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Failed to assign relief teacher. They may already be assigned elsewhere."
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl border border-card-border bg-card p-0 shadow-xl">
        {/* Header */}
        <div className="border-b border-card-border px-6 py-5">
          <h2 className="font-display text-lg font-bold text-foreground">
            Assign Relief Teacher
          </h2>
          <p className="mt-1 text-sm text-muted">
            Cover for {sickTeacherName}
          </p>
        </div>

        {/* Period details */}
        <div className="border-b border-card-border bg-accent-light/40 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent font-display text-sm font-bold text-white">
              P{periodNumber}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {className} &mdash; {subject}
              </p>
              <p className="text-xs text-muted">
                {periodStartTime} &ndash; {periodEndTime}
              </p>
            </div>
          </div>
        </div>

        {/* Teacher selection */}
        <form ref={formRef} onSubmit={handleSubmit} className="px-6 py-5">
          <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-muted">
            Select Available Teacher
          </label>

          {availableTeachers.length > 0 ? (
            <div className="max-h-56 space-y-1.5 overflow-y-auto">
              {availableTeachers.map((teacher) => (
                <label
                  key={teacher.id}
                  className="group flex cursor-pointer items-center gap-3 rounded-lg border border-card-border px-4 py-3 transition-all hover:border-accent hover:bg-accent-light/30 has-[:checked]:border-accent has-[:checked]:bg-accent-light"
                >
                  <input
                    type="radio"
                    name="reliefTeacherId"
                    value={teacher.id}
                    required
                    className="h-4 w-4 accent-accent"
                  />
                  <div className="flex flex-1 items-center gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-light font-display text-xs font-bold text-accent">
                      {teacher.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {teacher.name}
                      </p>
                      {teacher.type === "PERMANENT_RELIEF" && (
                        <p className="text-xs text-accent">Permanent Relief</p>
                      )}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-card-border px-4 py-8 text-center">
              <svg
                className="mx-auto mb-2 h-8 w-8 text-muted/40"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                />
              </svg>
              <p className="text-sm font-medium text-foreground">
                No teachers available
              </p>
              <p className="mt-1 text-xs text-muted">
                All teachers are busy during this period.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              className="h-10 w-full rounded-lg border border-card-border bg-background px-4 text-sm font-medium text-muted transition-colors hover:text-foreground sm:w-auto"
            >
              Cancel
            </button>
            {availableTeachers.length > 0 && (
              <button
                type="submit"
                disabled={isPending}
                className="h-10 w-full rounded-lg bg-accent px-5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                {isPending ? "Assigning..." : "Assign Teacher"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
