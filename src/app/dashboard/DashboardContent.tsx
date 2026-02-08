"use client";

import { useState, useEffect, useCallback } from "react";
import AssignReliefModal from "./AssignReliefModal";
import { generateReliefSummary } from "@/lib/generateReliefSummary";
import { getWeekType } from "@/lib/weekType";

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

type DashboardData = {
  date: string;
  isWeekend: boolean;
  weekType: "ODD" | "EVEN" | null;
  sickTeachers: SickTeacherCard[];
  totalUncovered: number;
  totalCovered: number;
};

type Props = {
  initialDate: string;
  hasWeekRotation: boolean;
};

export default function DashboardContent({ initialDate, hasWeekRotation }: Props) {
  const [date, setDate] = useState(initialDate);
  const [weekOverride, setWeekOverride] = useState<"ODD" | "EVEN" | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedFeedback, setCopiedFeedback] = useState(false);

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

  const dateObj = new Date(date + "T00:00:00");
  const jsDay = dateObj.getDay();
  const isWeekend = jsDay === 0 || jsDay === 6;
  const dayLabel = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][jsDay];
  const baseWeekType = getWeekType(dateObj);
  const effectiveWeekType = weekOverride ?? baseWeekType;

  const fetchDashboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/dashboard?date=${date}&weekType=${effectiveWeekType}`
      );
      if (!res.ok) throw new Error("Failed to fetch dashboard data");
      const json: DashboardData = await res.json();
      setData(json);
    } catch {
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [date, effectiveWeekType]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  function handleDateChange(newDate: string) {
    setDate(newDate);
    setWeekOverride(null);
    window.history.replaceState(null, "", `/dashboard?date=${newDate}`);
  }

  function navigateDay(offset: number) {
    const current = new Date(date + "T00:00:00");
    current.setDate(current.getDate() + offset);
    const yyyy = current.getFullYear();
    const mm = String(current.getMonth() + 1).padStart(2, "0");
    const dd = String(current.getDate()).padStart(2, "0");
    handleDateChange(`${yyyy}-${mm}-${dd}`);
  }

  function toggleWeekType() {
    setWeekOverride((prev) => {
      const current = prev ?? baseWeekType;
      return current === "ODD" ? "EVEN" : "ODD";
    });
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

  async function handleUnassign(assignmentId: string) {
    if (!data) return;

    // Snapshot for rollback
    const previousData = data;

    // Optimistic update: mark slot as uncovered
    setData({
      ...data,
      sickTeachers: data.sickTeachers.map((card) => ({
        ...card,
        periods: card.periods.map((slot) => {
          if (slot.assignmentId !== assignmentId) return slot;
          return {
            ...slot,
            isCovered: false,
            reliefTeacherName: null,
            assignmentId: null,
          };
        }),
      })),
      totalUncovered: data.totalUncovered + 1,
      totalCovered: data.totalCovered - 1,
    });

    try {
      const res = await fetch(`/api/relief-assignments/${assignmentId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to remove assignment");
      // Background refetch to sync availableTeachers lists
      fetchDashboard();
    } catch {
      // Revert on failure
      setData(previousData);
      alert("Failed to remove assignment.");
    }
  }

  async function handleAssignSuccess(assignedTeacher: { id: string; name: string }) {
    const slot = modalState.periodSlot;
    closeModal();

    if (!data || !slot) return;

    // Optimistic update: mark slot as covered
    setData({
      ...data,
      sickTeachers: data.sickTeachers.map((card) => ({
        ...card,
        periods: card.periods.map((p) => {
          if (p.timetableEntryId !== slot.timetableEntryId) return p;
          return {
            ...p,
            isCovered: true,
            reliefTeacherName: assignedTeacher.name,
            assignmentId: "optimistic-pending",
          };
        }),
      })),
      totalUncovered: data.totalUncovered - 1,
      totalCovered: data.totalCovered + 1,
    });

    // Background refetch to get real assignmentId and update availableTeachers
    fetchDashboard();
  }

  async function handleCopySummary() {
    if (!data || data.sickTeachers.length === 0) return;
    const summary = generateReliefSummary(data, formattedDate);
    await navigator.clipboard.writeText(summary);
    setCopiedFeedback(true);
    setTimeout(() => setCopiedFeedback(false), 2000);
  }

  // Format date for display
  const formattedDate = dateObj.toLocaleDateString("en-NZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Use fetched data or fallback values
  const sickTeachers = data?.sickTeachers ?? [];
  const totalUncovered = data?.totalUncovered ?? 0;
  const totalCovered = data?.totalCovered ?? 0;
  const totalSickTeachers = sickTeachers.length;

  return (
    <div>
      {/* Date navigation */}
      <div className="mb-4 flex flex-wrap items-center gap-2 md:mb-6 md:gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateDay(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-card-border bg-card text-muted transition-colors hover:bg-accent-light hover:text-accent"
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
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-card-border bg-card text-muted transition-colors hover:bg-accent-light hover:text-accent"
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
          className="h-10 rounded-lg border border-card-border bg-card px-4 text-sm font-medium text-muted transition-colors hover:bg-accent-light hover:text-accent"
        >
          Today
        </button>

        {!isWeekend && sickTeachers.length > 0 && (
          <button
            onClick={handleCopySummary}
            className="flex h-10 items-center gap-2 rounded-lg border border-card-border bg-card px-4 text-sm font-medium text-muted transition-colors hover:bg-accent-light hover:text-accent"
          >
            {copiedFeedback ? (
              <>
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
                    d="M4.5 12.75l6 6 9-13.5"
                  />
                </svg>
                <span className="text-success">Copied!</span>
              </>
            ) : (
              <>
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
                    d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"
                  />
                </svg>
                Copy Summary
              </>
            )}
          </button>
        )}

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted">{formattedDate}</span>

          {/* Week type badge — only shown if timetable uses odd/even rotation */}
          {!isWeekend && hasWeekRotation && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-light px-2.5 py-1 text-xs font-semibold text-accent">
              {effectiveWeekType === "ODD" ? "Odd Week" : "Even Week"}
              {weekOverride && (
                <span className="text-[10px] font-normal opacity-70">(manual)</span>
              )}
              <button
                onClick={toggleWeekType}
                className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full transition-colors hover:bg-accent/10"
                title="Toggle week type"
              >
                <svg
                  className="h-3 w-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
                  />
                </svg>
              </button>
            </span>
          )}

          {isLoading && (
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
          <div className="mb-4 grid grid-cols-3 gap-2 md:mb-6 md:gap-4">
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

          {/* Loading skeleton */}
          {isLoading && !data && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-card-border bg-card px-6 py-16 text-center shadow-sm">
              <p className="text-sm text-muted">Loading dashboard data...</p>
            </div>
          )}

          {/* Sick teacher cards */}
          {!isLoading && sickTeachers.length === 0 && (
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
                  <div className="flex items-center justify-between border-b border-card-border px-4 py-3 md:px-6 md:py-4">
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
                        className={`flex items-center gap-3 px-4 py-3 md:gap-4 md:px-6 md:py-4 ${
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
                          <div className="flex items-center gap-1.5 md:gap-2">
                            <div className="flex items-center gap-1.5 rounded-lg bg-success-light px-2 py-1.5 md:gap-2 md:px-3 md:py-2">
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
                              className="rounded-md px-2 py-1.5 text-xs font-medium text-danger transition-colors hover:bg-danger-light"
                              title="Remove assignment"
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => openAssignModal(card, slot)}
                            className="flex h-10 shrink-0 items-center gap-2 rounded-lg bg-accent px-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-accent-dark md:px-4"
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
                            <span className="hidden sm:inline">Assign</span>
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
          onSuccess={handleAssignSuccess}
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
