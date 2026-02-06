// src/app/dashboard/settings/ImportTimetableTab.tsx
"use client";

import { useState } from "react";
import { parseAscXml, ParseResult } from "@/lib/parseAscXml";

type ImportMode = "replace" | "merge";

function mergeParseResults(odd: ParseResult, even: ParseResult): {
  teachers: ParseResult["teachers"];
  periods: ParseResult["periods"];
  entries: ParseResult["entries"];
  oddEntryCount: number;
  evenEntryCount: number;
} {
  // Deduplicate teachers by name
  const teacherNames = new Set<string>();
  const teachers: ParseResult["teachers"] = [];
  for (const t of [...odd.teachers, ...even.teachers]) {
    if (!teacherNames.has(t.name)) {
      teacherNames.add(t.name);
      teachers.push(t);
    }
  }

  // Deduplicate periods by number
  const periodNums = new Set<number>();
  const periods: ParseResult["periods"] = [];
  for (const p of [...odd.periods, ...even.periods]) {
    if (!periodNums.has(p.number)) {
      periodNums.add(p.number);
      periods.push(p);
    }
  }

  return {
    teachers,
    periods,
    entries: [...odd.entries, ...even.entries],
    oddEntryCount: odd.entries.length,
    evenEntryCount: even.entries.length,
  };
}

export default function ImportTimetableTab() {
  const [useRotation, setUseRotation] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<{
    teachers: ParseResult["teachers"];
    periods: ParseResult["periods"];
    entries: ParseResult["entries"];
    oddEntryCount?: number;
    evenEntryCount?: number;
  } | null>(null);
  const [importMode, setImportMode] = useState<ImportMode | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Track files for rotation mode
  const [oddFile, setOddFile] = useState<File | null>(null);
  const [evenFile, setEvenFile] = useState<File | null>(null);

  function resetState() {
    setParsedData(null);
    setParseError(null);
    setImportMode(null);
    setImportResult(null);
    setOddFile(null);
    setEvenFile(null);
  }

  async function readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    });
  }

  async function handleSingleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setParseError(null);
    setImportResult(null);

    try {
      const text = await readFileAsText(file);
      const result = parseAscXml(text, "ALL");
      setParsedData(result);
    } catch {
      setParseError("Failed to parse XML file. Please check the file format.");
      setParsedData(null);
    }
  }

  async function handleRotationFile(
    e: React.ChangeEvent<HTMLInputElement>,
    week: "odd" | "even"
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    setParseError(null);
    setImportResult(null);

    const newOdd = week === "odd" ? file : oddFile;
    const newEven = week === "even" ? file : evenFile;

    if (week === "odd") setOddFile(file);
    if (week === "even") setEvenFile(file);

    // Only parse when both files are uploaded
    if (newOdd && newEven) {
      try {
        const [oddText, evenText] = await Promise.all([
          readFileAsText(newOdd),
          readFileAsText(newEven),
        ]);
        const oddResult = parseAscXml(oddText, "ODD");
        const evenResult = parseAscXml(evenText, "EVEN");
        const merged = mergeParseResults(oddResult, evenResult);
        setParsedData(merged);
      } catch {
        setParseError("Failed to parse XML files. Please check the file format.");
        setParsedData(null);
      }
    }
  }

  async function handleImport() {
    if (!parsedData || !importMode) return;

    setIsImporting(true);
    setImportResult(null);

    try {
      const res = await fetch("/api/import-timetable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: importMode,
          teachers: parsedData.teachers,
          periods: parsedData.periods,
          entries: parsedData.entries,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setImportResult({ success: false, message: data.error || "Import failed." });
        return;
      }

      setImportResult({
        success: true,
        message: `Successfully imported ${data.created.teachers} teachers, ${data.created.periods} periods, and ${data.created.entries} timetable entries.`,
      });
    } catch {
      setImportResult({ success: false, message: "Import failed. Please try again." });
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Week rotation toggle */}
      <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">
              Week Rotation
            </h2>
            <p className="text-sm text-muted">
              Does this school use odd/even week rotation?
            </p>
          </div>
          <button
            onClick={() => { setUseRotation(!useRotation); resetState(); }}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
              useRotation ? "bg-accent" : "bg-stone-300"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${
                useRotation ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* File upload area */}
      <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
        <h2 className="font-display text-lg font-semibold text-foreground">
          Upload Timetable
        </h2>
        <p className="mb-4 text-sm text-muted">
          Upload your aSc Timetables XML export file{useRotation ? "s" : ""}.
        </p>

        {!useRotation ? (
          /* Single file upload */
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-card-border px-6 py-10 transition-colors hover:border-accent hover:bg-accent-light/20">
            <svg className="mb-3 h-8 w-8 text-muted" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <span className="text-sm font-medium text-foreground">Upload Timetable XML</span>
            <span className="mt-1 text-xs text-muted">Click to select .xml file</span>
            <input type="file" accept=".xml" className="hidden" onChange={handleSingleFile} />
          </label>
        ) : (
          /* Side-by-side upload for odd/even */
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-card-border px-6 py-10 transition-colors hover:border-accent hover:bg-accent-light/20">
              <svg className="mb-3 h-8 w-8 text-muted" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <span className="text-sm font-medium text-foreground">Odd Week XML</span>
              <span className="mt-1 text-xs text-muted">{oddFile ? oddFile.name : "Click to select"}</span>
              <input type="file" accept=".xml" className="hidden" onChange={(e) => handleRotationFile(e, "odd")} />
            </label>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-card-border px-6 py-10 transition-colors hover:border-accent hover:bg-accent-light/20">
              <svg className="mb-3 h-8 w-8 text-muted" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <span className="text-sm font-medium text-foreground">Even Week XML</span>
              <span className="mt-1 text-xs text-muted">{evenFile ? evenFile.name : "Click to select"}</span>
              <input type="file" accept=".xml" className="hidden" onChange={(e) => handleRotationFile(e, "even")} />
            </label>
          </div>
        )}

        {parseError && (
          <p className="mt-3 text-sm text-danger">{parseError}</p>
        )}
      </div>

      {/* Summary card */}
      {parsedData && (
        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Import Summary
          </h2>
          <div className="mt-4 grid grid-cols-3 gap-2 md:gap-4">
            <div className="rounded-lg bg-accent-light/50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">Teachers</p>
              <p className="mt-1 font-display text-2xl font-bold text-foreground">{parsedData.teachers.length}</p>
            </div>
            <div className="rounded-lg bg-accent-light/50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">Periods</p>
              <p className="mt-1 font-display text-2xl font-bold text-foreground">{parsedData.periods.length}</p>
            </div>
            <div className="rounded-lg bg-accent-light/50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">Timetable Entries</p>
              <p className="mt-1 font-display text-2xl font-bold text-foreground">{parsedData.entries.length}</p>
              {parsedData.oddEntryCount !== undefined && (
                <p className="mt-1 text-xs text-muted">
                  Odd: {parsedData.oddEntryCount} / Even: {parsedData.evenEntryCount}
                </p>
              )}
            </div>
          </div>

          {/* Import mode selector */}
          <div className="mt-6 space-y-3">
            <p className="text-sm font-medium text-foreground">Import Mode</p>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-card-border p-4 transition-colors hover:bg-accent-light/20">
              <input
                type="radio"
                name="importMode"
                value="replace"
                checked={importMode === "replace"}
                onChange={() => setImportMode("replace")}
                className="mt-0.5 accent-accent"
              />
              <div>
                <span className="text-sm font-medium text-foreground">Replace all existing data</span>
                <p className="mt-0.5 text-xs text-danger">
                  This will delete all existing teachers, periods, timetable entries, sick reports, and relief assignments.
                </p>
              </div>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-card-border p-4 transition-colors hover:bg-accent-light/20">
              <input
                type="radio"
                name="importMode"
                value="merge"
                checked={importMode === "merge"}
                onChange={() => setImportMode("merge")}
                className="mt-0.5 accent-accent"
              />
              <div>
                <span className="text-sm font-medium text-foreground">Merge with existing data</span>
                <p className="mt-0.5 text-xs text-muted">
                  Existing teachers matched by name will have their timetable replaced. New teachers and periods will be added.
                </p>
              </div>
            </label>
          </div>

          {/* Import button */}
          <div className="mt-6">
            <button
              onClick={handleImport}
              disabled={!importMode || isImporting}
              className="h-10 rounded-lg bg-accent px-6 text-sm font-medium text-white shadow-sm transition-colors hover:bg-accent-dark focus:outline-none focus:ring-2 focus:ring-accent/20 focus:ring-offset-2 disabled:opacity-50"
            >
              {isImporting ? "Importing..." : "Import Timetable"}
            </button>
          </div>

          {/* Result message */}
          {importResult && (
            <div className={`mt-4 rounded-lg p-4 text-sm ${
              importResult.success
                ? "bg-green-50 text-green-800"
                : "bg-red-50 text-danger"
            }`}>
              {importResult.message}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
