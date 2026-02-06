"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import AssignReliefModal from "./AssignReliefModal";
import { unassignRelief } from "./actions";

type Period = {
  id: string;
  number: number;
  startTime: string;
  endTime: string;
};

type AvailableTeacher = {
  id: string;
  name: string;
  type: string;
};

type PeriodSlot = {
  timetableEntryId: string;
  periodId: string;
  periodNumber: number;
  periodStartTime: string;
  periodEndTime: string;
  className: string;
  subject: string;
  isCovered: boolean;
  reliefTeacherName: string | null;
  assignmentId: string | null;
  availableTeachers: AvailableTeacher[];
};

type SickTeacherCard = {
  teacherId: string;
  teacherName: string;
  sickReportId: string;
  periods: PeriodSlot[];
};

type Props = {
  date: string;
  dayLabel: string;
  isWeekend: boolean;
  sickTeachers: SickTeacherCard[];
  totalUncovered: number;
  totalCovered: number;
  totalSickTeachers: number;
};

const DAY_NAMES: Record<number, string> = {
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
};

export default function DashboardContent({
  date,
  dayLabel,
  isWeekend,
  sickTeachers,
  totalUncovered,
  totalCovered,
  totalSickTeachers,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isUnassigning, startUnassign] = useTransition();

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    periodSlot: PeriodSlot | null;
    sickTeacherName: string;
    sickReportId: string;
  }>({
    isOpen: false,
    periodSlot: null,
    sickTeacherName: "",
    sickReportId: "",
  });

  function handleDateChange(newDate: string) {
    startTransition(() => {
      router.push(`/dashboard?date=${newDate}`);
    });
  }

  function navigateDay(offset: number) {
    const current = new Date(date + "T00:00:00");
    current.setDate(current.getDate() + offset);
    const yyyy = current.getFullYear();
    const mm = String(current.getMonth() + 1).padStart(2, "0");
    const dd = String(current.getDate()).padStart(2, "0");
    handleDateChange(`${yyyy}-${mm}-${dd}`);
  }

  function openAssignModal(card: SickTeacherCard, slot: PeriodSlot) {
    setModalState({
      isOpen: true,
      periodSlot: slot,
      sickTeacherName: card.teacherName,
      sickReportId: card.sickReportId,
    });
  }

  function closeModal() {
    setModalState({
      isOpen: false,
      periodSlot: null,
      sickTeacherName: "",
      sickReportId: "",
    });
  }

  function handleUnassign(assignmentId: string) {
    startUnassign(async () => {
      try {
        await unassignRelief(assignmentId);
      } catch {
        alert("Failed to remove assignment.");
      }
    });
  }

  // Format date for display
  const dateObj = new Date(date + "T00:00:00");
  const formattedDate = dateObj.toLocaleDateString("en-NZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div>
      {/* Date navigation */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateDay(-1)}
            disabled={isPending}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-card-border bg-card text-muted transition-colors hover:bg-accent-light hover:text-accent disabled:opacity-50"
            title="Previous day"
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
                d="M15.75 19.5L8.25 12l7.5-7.5"
              />
            </svg>
          </button>

          <input
            type="date"
            value={date}
            onChange={(e) => handleDateChange(e.target.value)}
            className="h-10 rounded-lg border border-card-border bg-card px-3 text-sm font-medium text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />

          <button
            onClick={() => navigateDay(1)}
            disabled={isPending}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-card-border bg-card text-muted transition-colors hover:bg-accent-light hover:text-accent disabled:opacity-50"
            title="Next day"
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
                d="M8.25 4.5l7.5 7.5-7.5 7.5"
              />
            </svg>
          </button>
        </div>

        <button
          onClick={() => {
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, "0");
            const dd = String(today.getDate()).padStart(2, "0");
            handleDateChange(`${yyyy}-${mm}-${dd}`);
          }}
          disabled={isPending}
          className="h-10 rounded-lg border border-card-border bg-card px-4 text-sm font-medium text-muted transition-colors hover:bg-accent-light hover:text-accent disabled:opacity-50"
        >
          Today
        </button>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted">{formattedDate}</span>
          {isPending && (
            <span className="text-xs text-muted">Loading...</span>
          )}
        </div>
      </div>

      {/* Weekend notice */}
      {isWeekend && (
        <div className="mb-6 rounded-xl border border-card-border bg-warning-light px-6 py-5 text-center">
          <svg
            className="mx-auto mb-2 h-8 w-8 text-warning"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
          <p className="font-display text-lg font-semibold text-foreground">
            Weekend Selected
          </p>
          <p className="mt-1 text-sm text-muted">
            No classes are scheduled on weekends. Select a weekday to view relief coverage.
          </p>
        </div>
      )}

      {!isWeekend && (
        <>
          {/* Summary stats */}
          <div className="mb-6 grid grid-cols-3 gap-4">
            <div className="rounded-xl border border-card-border bg-card p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">
                Sick Teachers
              </p>
              <p className="mt-1 font-display text-2xl font-bold text-foreground">
                {totalSickTeachers}
              </p>
            </div>
            <div className="rounded-xl border border-card-border bg-danger-light p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-danger">
                Uncovered
              </p>
              <p className="mt-1 font-display text-2xl font-bold text-danger">
                {totalUncovered}
              </p>
            </div>
            <div className="rounded-xl border border-card-border bg-success-light p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-success">
                Covered
              </p>
              <p className="mt-1 font-display text-2xl font-bold text-success">
                {totalCovered}
              </p>
            </div>
          </div>

          {/* Sick teacher cards */}
          {sickTeachers.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-card-border bg-card px-6 py-16 text-center shadow-sm">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-success-light">
                <svg
                  className="h-6 w-6 text-success"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-foreground">
                All clear for {dayLabel}
              </p>
              <p className="mt-1 text-xs text-muted">
                No sick reports for this date. All classes are running as scheduled.
              </p>
            </div>
          )}

          <div className="space-y-5">
            {sickTeachers.map((card) => {
              const uncoveredCount = card.periods.filter(
                (p) => !p.isCovered
              ).length;
              const coveredCount = card.periods.filter(
                (p) => p.isCovered
              ).length;

              return (
                <div
                  key={card.sickReportId}
                  className="overflow-hidden rounded-xl border border-card-border bg-card shadow-sm"
                >
                  {/* Card header */}
                  <div className="flex items-center justify-between border-b border-card-border px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-danger-light font-display text-sm font-bold text-danger">
                        {card.teacherName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </div>
                      <div>
                        <h3 className="font-display text-base font-semibold text-foreground">
                          {card.teacherName}
                        </h3>
                        <p className="text-xs text-muted">
                          {card.periods.length} period{card.periods.length !== 1 ? "s" : ""} to cover
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {uncoveredCount > 0 && (
                        <span className="inline-flex items-center rounded-full bg-danger-light px-2.5 py-1 text-xs font-semibold text-danger">
                          {uncoveredCount} uncovered
                        </span>
                      )}
                      {coveredCount > 0 && (
                        <span className="inline-flex items-center rounded-full bg-success-light px-2.5 py-1 text-xs font-semibold text-success">
                          {coveredCount} covered
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Period rows */}
                  <div className="divide-y divide-card-border">
                    {card.periods.map((slot) => (
                      <div
                        key={slot.timetableEntryId}
                        className={`flex items-center gap-4 px-6 py-4 ${
                          slot.isCovered
                            ? "bg-success-light/30"
                            : "bg-danger-light/30"
                        }`}
                      >
                        {/* Period badge */}
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-display text-sm font-bold ${
                            slot.isCovered
                              ? "bg-success-light text-success"
                              : "bg-danger-light text-danger"
                          }`}
                        >
                          P{slot.periodNumber}
                        </div>

                        {/* Period info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-foreground">
                              {slot.className}
                            </p>
                            <span className="text-sm text-muted">&middot;</span>
                            <p className="text-sm text-muted">{slot.subject}</p>
                          </div>
                          <p className="text-xs text-muted">
                            {slot.periodStartTime} &ndash; {slot.periodEndTime}
                          </p>
                        </div>

                        {/* Status / action */}
                        {slot.isCovered ? (
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 rounded-lg bg-success-light px-3 py-2">
                              <svg
                                className="h-4 w-4 text-success"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              <span className="text-sm font-medium text-success">
                                {slot.reliefTeacherName}
                              </span>
                            </div>
                            <button
                              onClick={() =>
                                slot.assignmentId &&
                                handleUnassign(slot.assignmentId)
                              }
                              disabled={isUnassigning}
                              className="rounded-md px-2 py-1.5 text-xs font-medium text-danger transition-colors hover:bg-danger-light disabled:opacity-50"
                              title="Remove assignment"
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => openAssignModal(card, slot)}
                            className="flex h-10 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-accent-dark"
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
                                d="M12 4.5v15m7.5-7.5h-15"
                              />
                            </svg>
                            Assign
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Assign modal */}
      {modalState.periodSlot && (
        <AssignReliefModal
          isOpen={modalState.isOpen}
          onClose={closeModal}
          periodNumber={modalState.periodSlot.periodNumber}
          periodStartTime={modalState.periodSlot.periodStartTime}
          periodEndTime={modalState.periodSlot.periodEndTime}
          className={modalState.periodSlot.className}
          subject={modalState.periodSlot.subject}
          sickTeacherName={modalState.sickTeacherName}
          sickReportId={modalState.sickReportId}
          timetableEntryId={modalState.periodSlot.timetableEntryId}
          date={date}
          availableTeachers={modalState.periodSlot.availableTeachers}
        />
      )}
    </div>
  );
}
