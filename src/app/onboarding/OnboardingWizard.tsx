"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { parseAscXml } from "@/lib/parseAscXml";

type Step = 1 | 2 | 3;

export default function OnboardingWizard({ schoolName }: { schoolName: string }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1: Timetable import
  const [weekType, setWeekType] = useState<"ALL" | "ODD" | "EVEN">("ALL");
  const [importSuccess, setImportSuccess] = useState(false);
  const [importStats, setImportStats] = useState<{
    teachers: number;
    periods: number;
    entries: number;
  } | null>(null);

  // Step 2: Whitelist emails
  const [emails, setEmails] = useState("");
  const [whitelistSuccess, setWhitelistSuccess] = useState(false);
  const [whitelistCount, setWhitelistCount] = useState(0);

  async function handleImportTimetable(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setLoading(true);

    try {
      const text = await file.text();
      const parsed = parseAscXml(text, weekType);

      const res = await fetch("/api/import-timetable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "replace",
          teachers: parsed.teachers,
          periods: parsed.periods,
          entries: parsed.entries,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Import failed");
      }

      const data = await res.json();
      setImportStats(data.created);
      setImportSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleWhitelist() {
    setError("");
    setLoading(true);

    try {
      const emailList = emails
        .split(/[\n,;]+/)
        .map((e) => e.trim().toLowerCase())
        .filter((e) => e && e.includes("@"));

      if (emailList.length === 0) {
        // Skip if no emails
        setStep(3);
        return;
      }

      const res = await fetch("/api/onboarding/whitelist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: emailList }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add users");
      }

      const data = await res.json();
      setWhitelistCount(data.created);
      setWhitelistSuccess(true);
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleComplete() {
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/onboarding/complete", { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to complete onboarding");
      }
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-lg">
      {/* Step indicator */}
      <div className="mb-8 flex items-center justify-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                s === step
                  ? "bg-accent text-white"
                  : s < step
                  ? "bg-success text-white"
                  : "bg-card border border-card-border text-muted"
              }`}
            >
              {s < step ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              ) : (
                s
              )}
            </div>
            {s < 3 && (
              <div className={`h-0.5 w-12 ${s < step ? "bg-success" : "bg-card-border"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="rounded-2xl border border-card-border bg-card p-6 shadow-sm">
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold text-foreground">
              Upload Timetable
            </h2>
            <p className="text-sm text-muted">
              Import your school timetable from aSc Timetables (XML format). This creates
              all teachers, periods, and class schedules automatically.
            </p>

            {!importSuccess ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Week type</label>
                  <select
                    value={weekType}
                    onChange={(e) => setWeekType(e.target.value as "ALL" | "ODD" | "EVEN")}
                    className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="ALL">Same every week (no rotation)</option>
                    <option value="ODD">Odd week</option>
                    <option value="EVEN">Even week</option>
                  </select>
                </div>
                <label className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-card-border p-8 transition-colors hover:border-accent/50 hover:bg-accent-light/30">
                  <svg className="h-10 w-10 text-muted" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  <span className="text-sm font-medium text-muted">
                    {loading ? "Importing..." : "Click to upload .xml file"}
                  </span>
                  <input
                    type="file"
                    accept=".xml"
                    onChange={handleImportTimetable}
                    disabled={loading}
                    className="hidden"
                  />
                </label>
              </div>
            ) : (
              <div className="rounded-lg bg-success-light p-4">
                <p className="font-medium text-success">Timetable imported successfully!</p>
                {importStats && (
                  <p className="mt-1 text-sm text-success/80">
                    {importStats.teachers} teachers, {importStats.periods} periods, {importStats.entries} timetable entries
                  </p>
                )}
              </div>
            )}

            {error && <p className="text-sm text-danger">{error}</p>}

            <div className="flex justify-between pt-2">
              <button
                onClick={() => {
                  setStep(2);
                  setError("");
                }}
                className="text-sm text-muted hover:text-foreground"
              >
                Skip for now
              </button>
              <button
                onClick={() => {
                  setStep(2);
                  setError("");
                }}
                disabled={!importSuccess}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold text-foreground">
              Invite Colleagues
            </h2>
            <p className="text-sm text-muted">
              Enter email addresses of teachers and staff who should have access to {schoolName}&apos;s ReliefCher.
              They&apos;ll be able to log in and report sick leave.
            </p>

            <div>
              <label className="block text-xs font-medium text-muted mb-1">
                Email addresses (one per line, or comma-separated)
              </label>
              <textarea
                rows={6}
                value={emails}
                onChange={(e) => setEmails(e.target.value)}
                placeholder={"teacher1@school.edu\nteacher2@school.edu\nteacher3@school.edu"}
                className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent font-mono"
              />
            </div>

            {whitelistSuccess && (
              <div className="rounded-lg bg-success-light p-3">
                <p className="text-sm font-medium text-success">
                  {whitelistCount} users added!
                </p>
              </div>
            )}

            {error && <p className="text-sm text-danger">{error}</p>}

            <div className="flex justify-between pt-2">
              <button
                onClick={() => {
                  setStep(1);
                  setError("");
                }}
                className="text-sm text-muted hover:text-foreground"
              >
                Back
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setStep(3);
                    setError("");
                  }}
                  className="text-sm text-muted hover:text-foreground"
                >
                  Skip
                </button>
                <button
                  onClick={handleWhitelist}
                  disabled={loading || !emails.trim()}
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark disabled:opacity-50"
                >
                  {loading ? "Adding..." : "Add & Continue"}
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-light">
              <svg className="h-8 w-8 text-success" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="font-display text-lg font-semibold text-foreground">
              You&apos;re all set!
            </h2>
            <p className="text-sm text-muted">
              {schoolName} is ready to use ReliefCher. Teachers can report sick
              and you can manage relief assignments from the dashboard.
            </p>

            {error && <p className="text-sm text-danger">{error}</p>}

            <button
              onClick={handleComplete}
              disabled={loading}
              className="w-full rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-50"
            >
              {loading ? "Finishing..." : "Go to Dashboard"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
