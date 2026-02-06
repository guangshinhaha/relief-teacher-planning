# Timetable Import Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Import aSc Timetables XML to auto-create teachers, periods, and timetable entries via a new "Import Timetable" tab in Settings.

**Architecture:** Client-side XML parsing with the browser's native DOMParser, structured JSON sent to a single API endpoint that processes everything in a Prisma transaction. Settings page gets tab navigation to switch between Periods and Import Timetable.

**Tech Stack:** Next.js App Router, Prisma, TypeScript, Tailwind CSS v4, browser DOMParser API

---

### Task 1: XML Parser Utility

**Files:**
- Create: `src/lib/parseAscXml.ts`

**Step 1: Create the XML parser module**

This module exports a `parseAscXml` function that takes an XML string and a `WeekType` ("ALL" | "ODD" | "EVEN"), and returns structured data.

```typescript
// src/lib/parseAscXml.ts

export type ParsedTeacher = { name: string };
export type ParsedPeriod = { number: number; startTime: string; endTime: string };
export type ParsedEntry = {
  teacherName: string;
  dayOfWeek: number;
  periodNumber: number;
  className: string;
  subject: string;
  weekType: "ALL" | "ODD" | "EVEN";
};
export type ParseResult = {
  teachers: ParsedTeacher[];
  periods: ParsedPeriod[];
  entries: ParsedEntry[];
};

export function parseAscXml(xmlString: string, weekType: "ALL" | "ODD" | "EVEN"): ParseResult {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, "text/xml");

  // Parse periods
  const periodEls = doc.querySelectorAll("period");
  const periods: ParsedPeriod[] = [];
  for (const el of periodEls) {
    const num = parseInt(el.getAttribute("period") || "0", 10);
    const startTime = el.getAttribute("starttime") || "";
    const endTime = el.getAttribute("endtime") || "";
    if (num > 0 && startTime && endTime) {
      periods.push({ number: num, startTime, endTime });
    }
  }

  // Parse teachers
  const teacherEls = doc.querySelectorAll("teacher");
  const teacherMap = new Map<string, string>(); // id -> name
  const teachers: ParsedTeacher[] = [];
  for (const el of teacherEls) {
    const id = el.getAttribute("id") || "";
    const firstname = (el.getAttribute("firstname") || "").trim();
    const lastname = (el.getAttribute("lastname") || "").trim();
    const short = (el.getAttribute("short") || "").trim();
    let name = "";
    if (firstname && lastname) {
      name = `${firstname} ${lastname}`;
    } else if (lastname) {
      name = lastname;
    } else if (firstname) {
      name = firstname;
    } else {
      name = short;
    }
    if (id && name) {
      teacherMap.set(id, name);
      teachers.push({ name });
    }
  }

  // Parse subjects (id -> short name)
  const subjectMap = new Map<string, string>();
  for (const el of doc.querySelectorAll("subject")) {
    const id = el.getAttribute("id") || "";
    const short = el.getAttribute("short") || el.getAttribute("name") || "";
    if (id && short) subjectMap.set(id, short);
  }

  // Parse classes (id -> short name)
  const classMap = new Map<string, string>();
  for (const el of doc.querySelectorAll("class")) {
    const id = el.getAttribute("id") || "";
    const short = el.getAttribute("short") || el.getAttribute("name") || "";
    if (id && short) classMap.set(id, short);
  }

  // Parse lessons (id -> { teacherIds, subjectId, classIds })
  type LessonInfo = { teacherIds: string[]; subjectId: string; classIds: string[] };
  const lessonMap = new Map<string, LessonInfo>();
  for (const el of doc.querySelectorAll("lesson")) {
    const id = el.getAttribute("id") || "";
    const teacherIds = (el.getAttribute("teacherids") || "").split(",").filter(Boolean);
    const subjectId = el.getAttribute("subjectid") || "";
    const classIds = (el.getAttribute("classids") || "").split(",").filter(Boolean);
    if (id && teacherIds.length > 0) {
      lessonMap.set(id, { teacherIds, subjectId, classIds });
    }
  }

  // Parse cards -> timetable entries
  const entries: ParsedEntry[] = [];
  for (const el of doc.querySelectorAll("card")) {
    const lessonId = el.getAttribute("lessonid") || "";
    const periodNum = parseInt(el.getAttribute("period") || "0", 10);
    const days = el.getAttribute("days") || "";

    const lesson = lessonMap.get(lessonId);
    if (!lesson || periodNum === 0) continue;

    // Decode day bitmask
    const dayOfWeek = days.indexOf("1") + 1; // "10000"->1, "01000"->2, etc.
    if (dayOfWeek < 1 || dayOfWeek > 5) continue;

    const subjectName = subjectMap.get(lesson.subjectId) || "Unknown";
    const classNames = lesson.classIds.map((cid) => classMap.get(cid) || "Unknown");
    const className = classNames.join(", ");

    for (const teacherId of lesson.teacherIds) {
      const teacherName = teacherMap.get(teacherId);
      if (!teacherName) continue;

      entries.push({
        teacherName,
        dayOfWeek,
        periodNumber: periodNum,
        className,
        subject: subjectName,
        weekType,
      });
    }
  }

  return { teachers, periods, entries };
}
```

**Step 2: Verify it builds**

Run: `cd "/Users/shin/Desktop/relief teacher planning" && npx tsc --noEmit`
Expected: No type errors

**Step 3: Commit**

```bash
git add src/lib/parseAscXml.ts
git commit -m "feat: add aSc Timetables XML parser utility"
```

---

### Task 2: Import API Route

**Files:**
- Create: `src/app/api/import-timetable/route.ts`

**Step 1: Create the API route**

```typescript
// src/app/api/import-timetable/route.ts
import { prisma } from "@/lib/prisma";
import { WeekType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

type ImportTeacher = { name: string };
type ImportPeriod = { number: number; startTime: string; endTime: string };
type ImportEntry = {
  teacherName: string;
  dayOfWeek: number;
  periodNumber: number;
  className: string;
  subject: string;
  weekType: string;
};

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { mode, teachers, periods, entries } = body as {
    mode: "replace" | "merge";
    teachers: ImportTeacher[];
    periods: ImportPeriod[];
    entries: ImportEntry[];
  };

  if (!mode || !teachers || !periods || !entries) {
    return NextResponse.json(
      { error: "mode, teachers, periods, and entries are required." },
      { status: 400 }
    );
  }

  if (mode !== "replace" && mode !== "merge") {
    return NextResponse.json(
      { error: "mode must be 'replace' or 'merge'." },
      { status: 400 }
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      if (mode === "replace") {
        // Delete in order that respects foreign keys (or rely on cascades)
        await tx.reliefAssignment.deleteMany();
        await tx.sickReport.deleteMany();
        await tx.timetableEntry.deleteMany();
        await tx.teacher.deleteMany();
        await tx.period.deleteMany();
      }

      // Create/upsert periods
      const periodRecords = new Map<number, string>(); // number -> id
      for (const p of periods) {
        if (mode === "replace") {
          const created = await tx.period.create({
            data: { number: p.number, startTime: p.startTime, endTime: p.endTime },
          });
          periodRecords.set(p.number, created.id);
        } else {
          const upserted = await tx.period.upsert({
            where: { number: p.number },
            update: { startTime: p.startTime, endTime: p.endTime },
            create: { number: p.number, startTime: p.startTime, endTime: p.endTime },
          });
          periodRecords.set(p.number, upserted.id);
        }
      }

      // Create/upsert teachers
      const teacherRecords = new Map<string, string>(); // name -> id
      const uniqueTeacherNames = [...new Set(teachers.map((t) => t.name))];
      for (const name of uniqueTeacherNames) {
        if (mode === "replace") {
          const created = await tx.teacher.create({ data: { name, type: "REGULAR" } });
          teacherRecords.set(name, created.id);
        } else {
          // Try to find existing teacher by name
          let teacher = await tx.teacher.findFirst({ where: { name } });
          if (!teacher) {
            teacher = await tx.teacher.create({ data: { name, type: "REGULAR" } });
          }
          teacherRecords.set(name, teacher.id);
        }
      }

      // In merge mode, delete existing timetable entries for imported teachers
      if (mode === "merge") {
        const teacherIds = [...teacherRecords.values()];
        if (teacherIds.length > 0) {
          await tx.timetableEntry.deleteMany({
            where: { teacherId: { in: teacherIds } },
          });
        }
      }

      // Create timetable entries
      let entryCount = 0;
      for (const entry of entries) {
        const teacherId = teacherRecords.get(entry.teacherName);
        const periodId = periodRecords.get(entry.periodNumber);
        if (!teacherId || !periodId) continue;

        await tx.timetableEntry.create({
          data: {
            teacherId,
            dayOfWeek: entry.dayOfWeek,
            periodId,
            className: entry.className,
            subject: entry.subject,
            weekType: entry.weekType as WeekType,
          },
        });
        entryCount++;
      }

      return {
        teachers: uniqueTeacherNames.length,
        periods: periods.length,
        entries: entryCount,
      };
    });

    return NextResponse.json({ success: true, created: result });
  } catch (error) {
    console.error("Import failed:", error);
    return NextResponse.json(
      { error: "Import failed. Please check your file and try again." },
      { status: 500 }
    );
  }
}
```

**Step 2: Verify it builds**

Run: `cd "/Users/shin/Desktop/relief teacher planning" && npx tsc --noEmit`
Expected: No type errors

**Step 3: Commit**

```bash
git add src/app/api/import-timetable/route.ts
git commit -m "feat: add import-timetable API route with replace/merge modes"
```

---

### Task 3: Add Tabs to Settings Page

**Files:**
- Modify: `src/app/dashboard/settings/page.tsx`
- Modify: `src/app/dashboard/settings/SettingsClient.tsx`

**Step 1: Add tab navigation to the settings page**

Modify `page.tsx` to pass periods to a wrapper that has tabs. Modify `SettingsClient.tsx` to add a `tab` state with two tabs: "Periods" and "Import Timetable". The existing period management content stays under the "Periods" tab. The "Import Timetable" tab renders an `ImportTimetableTab` component (created in Task 4).

In `SettingsClient.tsx`, wrap existing content in a tab structure:

```typescript
// Add to state:
const [activeTab, setActiveTab] = useState<"periods" | "import">("periods");

// Add tab bar before existing content:
<div className="mb-6 flex gap-1 rounded-lg border border-card-border bg-card p-1">
  <button
    onClick={() => setActiveTab("periods")}
    className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
      activeTab === "periods"
        ? "bg-accent text-white shadow-sm"
        : "text-muted hover:text-foreground"
    }`}
  >
    Periods
  </button>
  <button
    onClick={() => setActiveTab("import")}
    className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
      activeTab === "import"
        ? "bg-accent text-white shadow-sm"
        : "text-muted hover:text-foreground"
    }`}
  >
    Import Timetable
  </button>
</div>

// Conditionally render content:
{activeTab === "periods" && (
  // ... existing period management JSX ...
)}
{activeTab === "import" && (
  <ImportTimetableTab />
)}
```

Update `page.tsx` description text to be more general: "Configure school periods and import timetable data."

**Step 2: Verify it builds**

Run: `cd "/Users/shin/Desktop/relief teacher planning" && npx tsc --noEmit`
Expected: No type errors (ImportTimetableTab won't exist yet, so create a placeholder)

**Step 3: Commit**

```bash
git add src/app/dashboard/settings/SettingsClient.tsx src/app/dashboard/settings/page.tsx
git commit -m "feat: add tab navigation to settings page"
```

---

### Task 4: Import Timetable Tab UI Component

**Files:**
- Create: `src/app/dashboard/settings/ImportTimetableTab.tsx`

**Step 1: Create the import tab component**

This component handles:
- Week rotation toggle (switch)
- File upload zone(s) — one or two depending on rotation toggle
- Client-side XML parsing via `parseAscXml`
- Summary card showing parsed counts
- Import mode radio buttons (replace/merge) with warning text
- Import button that POSTs to `/api/import-timetable`
- Success/error feedback

```typescript
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
          <div className="grid grid-cols-2 gap-4">
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
          <div className="mt-4 grid grid-cols-3 gap-4">
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
```

**Step 2: Import the component in SettingsClient.tsx**

Add to the imports in `SettingsClient.tsx`:
```typescript
import ImportTimetableTab from "./ImportTimetableTab";
```

**Step 3: Verify it builds**

Run: `cd "/Users/shin/Desktop/relief teacher planning" && npx tsc --noEmit`
Expected: No type errors

**Step 4: Commit**

```bash
git add src/app/dashboard/settings/ImportTimetableTab.tsx src/app/dashboard/settings/SettingsClient.tsx
git commit -m "feat: add import timetable tab UI with XML upload and preview"
```

---

### Task 5: Manual Testing & Polish

**Step 1: Start dev server and test the flow**

Run: `cd "/Users/shin/Desktop/relief teacher planning" && npm run dev`

Test checklist:
- [ ] Navigate to Settings page, verify two tabs appear
- [ ] "Periods" tab shows existing period management
- [ ] "Import Timetable" tab shows the import UI
- [ ] Toggle week rotation on/off, verify upload zones change
- [ ] Upload a test XML file, verify summary appears
- [ ] Select replace mode, verify warning text
- [ ] Select merge mode, verify warning text
- [ ] Click import, verify it completes and shows success
- [ ] Check Teachers page — imported teachers should appear
- [ ] Check Timetable page — imported entries should appear

**Step 2: Fix any issues found**

**Step 3: Commit any fixes**

```bash
git add -A
git commit -m "fix: polish timetable import UI"
```
