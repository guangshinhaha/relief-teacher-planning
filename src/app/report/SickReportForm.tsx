"use client";

import { useActionState } from "react";
import { submitSickReport, type SickReportState } from "./actions";

type Teacher = {
  id: string;
  name: string;
};

export default function SickReportForm({
  teachers,
}: {
  teachers: Teacher[];
}) {
  const [state, formAction, isPending] = useActionState<
    SickReportState,
    FormData
  >(submitSickReport, null);

  const today = new Date().toISOString().split("T")[0];

  if (state?.success) {
    return (
      <div className="rounded-2xl border border-success/20 bg-success-light p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
          <svg
            className="h-8 w-8 text-success"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 12.75l6 6 9-13.5"
            />
          </svg>
        </div>
        <h2 className="font-display text-2xl font-semibold text-success mb-2">
          Report Submitted
        </h2>
        <p className="text-foreground/70 text-lg leading-relaxed mb-8">
          Your sick leave has been reported.<br />
          Take care and get well soon!
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 rounded-xl bg-success px-6 py-3 text-base font-semibold text-white shadow-sm transition-all hover:shadow-md hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-success/50 focus:ring-offset-2 cursor-pointer"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182"
            />
          </svg>
          Submit Another
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div
          role="alert"
          className="rounded-xl border border-danger/20 bg-danger-light px-4 py-3 text-danger text-sm font-medium"
        >
          {state.error}
        </div>
      )}

      {/* Teacher Select */}
      <div className="space-y-2">
        <label
          htmlFor="teacherId"
          className="block text-sm font-semibold text-foreground"
        >
          Your Name
        </label>
        <div className="relative">
          <select
            id="teacherId"
            name="teacherId"
            required
            defaultValue=""
            className="block w-full appearance-none rounded-xl border border-card-border bg-card px-4 py-3.5 pr-10 text-base text-foreground shadow-sm transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 invalid:text-muted"
          >
            <option value="" disabled>
              Select your name...
            </option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.name}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <svg
              className="h-5 w-5 text-muted"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Start Date */}
      <div className="space-y-2">
        <label
          htmlFor="startDate"
          className="block text-sm font-semibold text-foreground"
        >
          Start Date
        </label>
        <input
          type="date"
          id="startDate"
          name="startDate"
          required
          defaultValue={today}
          className="block w-full rounded-xl border border-card-border bg-card px-4 py-3.5 text-base text-foreground shadow-sm transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
      </div>

      {/* Number of Days */}
      <div className="space-y-2">
        <label
          htmlFor="numberOfDays"
          className="block text-sm font-semibold text-foreground"
        >
          Number of Days
        </label>
        <input
          type="number"
          id="numberOfDays"
          name="numberOfDays"
          required
          defaultValue={1}
          min={1}
          max={14}
          className="block w-full rounded-xl border border-card-border bg-card px-4 py-3.5 text-base text-foreground shadow-sm transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
        <p className="text-sm text-muted">
          How many days will you be away? (1 to 14)
        </p>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-accent px-6 py-4 text-lg font-semibold text-white shadow-sm transition-all hover:bg-accent-dark hover:shadow-md focus:outline-none focus:ring-2 focus:ring-accent/50 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
      >
        {isPending ? (
          <span className="inline-flex items-center gap-2">
            <svg
              className="h-5 w-5 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Submitting...
          </span>
        ) : (
          "Submit Report"
        )}
      </button>
    </form>
  );
}
