# Mobile Responsive Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make all pages of the StandIn app fully mobile responsive with bottom tab navigation, card layouts for tables, and day-by-day timetable view.

**Architecture:** CSS-first approach using Tailwind responsive breakpoints (`md:` at 768px). Desktop layout stays unchanged; mobile layout uses `md:hidden` / `hidden md:flex` toggling. Two new components (BottomTabBar, MobileHeader) for mobile navigation. No new dependencies.

**Tech Stack:** Next.js (App Router), Tailwind CSS v4, React client components

---

### Task 1: Dashboard Layout — Responsive Padding & Structure

**Files:**
- Modify: `src/app/dashboard/layout.tsx`

**Step 1: Update the layout wrapper for responsive padding and mobile bottom-bar clearance**

Replace the entire file content:

```tsx
import DashboardSidebar from "./DashboardSidebar";
import MobileHeader from "./MobileHeader";
import BottomTabBar from "./BottomTabBar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-[100dvh] overflow-hidden bg-background">
      {/* Desktop sidebar — hidden on mobile */}
      <div className="hidden md:flex">
        <DashboardSidebar />
      </div>

      {/* Main content */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header — hidden on desktop */}
        <MobileHeader />

        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl px-4 py-4 md:px-8 md:py-8">
            {children}
          </div>
        </div>

        {/* Bottom tab bar — mobile only */}
        <BottomTabBar />
      </main>
    </div>
  );
}
```

**Step 2: Verify the dev server compiles (will have import errors until Task 2)**

Run: `cd "/Users/shin/Desktop/relief teacher planning" && npm run build 2>&1 | head -20`
Expected: Import errors for MobileHeader and BottomTabBar (not yet created)

---

### Task 2: Create MobileHeader Component

**Files:**
- Create: `src/app/dashboard/MobileHeader.tsx`

**Step 1: Create the mobile header component**

```tsx
"use client";

import { usePathname } from "next/navigation";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/teachers": "Teachers",
  "/dashboard/timetable": "Timetable",
  "/dashboard/settings": "Settings",
};

export default function MobileHeader() {
  const pathname = usePathname();

  const title = pageTitles[pathname] ?? "Dashboard";

  return (
    <header className="flex items-center gap-3 border-b border-card-border bg-card px-4 py-3 md:hidden">
      <img
        src="/stand-in-logo.svg"
        alt="StandIn"
        className="h-8 w-auto"
      />
      <span className="font-display text-lg font-bold tracking-tight text-foreground">
        {title}
      </span>
    </header>
  );
}
```

---

### Task 3: Create BottomTabBar Component

**Files:**
- Create: `src/app/dashboard/BottomTabBar.tsx`

**Step 1: Create the bottom tab bar component**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
  },
  {
    label: "Teachers",
    href: "/dashboard/teachers",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
  },
  {
    label: "Timetable",
    href: "/dashboard/timetable",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    ),
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export default function BottomTabBar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <nav className="flex border-t border-card-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden">
      {tabs.map((tab) => {
        const active = isActive(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-1 flex-col items-center gap-1 py-2 text-xs font-medium transition-colors ${
              active ? "text-accent" : "text-muted"
            }`}
          >
            <span className={active ? "text-accent" : "text-muted"}>
              {tab.icon}
            </span>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
```

**Step 2: Verify dev server compiles with no errors**

Run: `cd "/Users/shin/Desktop/relief teacher planning" && npm run build 2>&1 | tail -5`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/app/dashboard/layout.tsx src/app/dashboard/MobileHeader.tsx src/app/dashboard/BottomTabBar.tsx
git commit -m "feat: add mobile navigation with bottom tab bar and header"
```

---

### Task 4: DashboardContent — Responsive Spacing & Layout

**Files:**
- Modify: `src/app/dashboard/DashboardContent.tsx`

**Step 1: Make the date navigation responsive**

Change line 188:
```
<div className="mb-6 flex flex-wrap items-center gap-4">
```
to:
```
<div className="mb-4 flex flex-wrap items-center gap-2 md:mb-6 md:gap-4">
```

**Step 2: Make the stats grid responsive**

Change line 363:
```
<div className="mb-6 grid grid-cols-3 gap-4">
```
to:
```
<div className="mb-4 grid grid-cols-3 gap-2 md:mb-6 md:gap-4">
```

**Step 3: Make sick teacher card headers responsive**

Change line 439:
```
<div className="flex items-center justify-between border-b border-card-border px-6 py-4">
```
to:
```
<div className="flex items-center justify-between border-b border-card-border px-4 py-3 md:px-6 md:py-4">
```

**Step 4: Make period rows responsive**

Change line 477:
```
className={`flex items-center gap-4 px-6 py-4 ${
```
to:
```
className={`flex items-center gap-3 px-4 py-3 md:gap-4 md:px-6 md:py-4 ${
```

**Step 5: Make relief assignment button responsive — hide text on small screens**

Change lines 542-560 (the Assign button):
```tsx
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
```

**Step 6: Make covered status row responsive**

Change lines 510-540 (the covered relief display). Replace:
```tsx
<div className="flex items-center gap-2">
  <div className="flex items-center gap-2 rounded-lg bg-success-light px-3 py-2">
```
with:
```tsx
<div className="flex items-center gap-1.5 md:gap-2">
  <div className="flex items-center gap-1.5 rounded-lg bg-success-light px-2 py-1.5 md:gap-2 md:px-3 md:py-2">
```

**Step 7: Commit**

```bash
git add src/app/dashboard/DashboardContent.tsx
git commit -m "feat: responsive spacing for dashboard content"
```

---

### Task 5: AssignReliefModal — Mobile Margins

**Files:**
- Modify: `src/app/dashboard/AssignReliefModal.tsx`

**Step 1: Add mobile margins to the modal wrapper**

Change line 85:
```
<div className="fixed inset-0 z-50 flex items-center justify-center">
```
to:
```
<div className="fixed inset-0 z-50 flex items-center justify-center px-4">
```

**Step 2: Make modal action buttons stack on small screens**

Change line 187:
```
<div className="mt-5 flex items-center justify-end gap-3">
```
to:
```
<div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
```

Make Cancel button full-width on mobile. Change line 191:
```
className="h-10 rounded-lg border border-card-border bg-background px-4 text-sm font-medium text-muted transition-colors hover:text-foreground"
```
to:
```
className="h-10 w-full rounded-lg border border-card-border bg-background px-4 text-sm font-medium text-muted transition-colors hover:text-foreground sm:w-auto"
```

Make Assign button full-width on mobile. Change line 199:
```
className="h-10 rounded-lg bg-accent px-5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50"
```
to:
```
className="h-10 w-full rounded-lg bg-accent px-5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
```

**Step 3: Commit**

```bash
git add src/app/dashboard/AssignReliefModal.tsx
git commit -m "feat: responsive assign relief modal with mobile margins"
```

---

### Task 6: TeachersClient — Responsive Form & Card Layout

**Files:**
- Modify: `src/app/dashboard/teachers/TeachersClient.tsx`

**Step 1: Make add teacher form responsive**

Change line 87:
```
<form onSubmit={handleAdd} className="flex flex-wrap items-end gap-4">
```
to:
```
<form onSubmit={handleAdd} className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-end">
```

Change line 101 (name input):
```
className="h-10 w-64 rounded-lg border border-card-border bg-background px-3 text-sm text-foreground placeholder:text-muted/50 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
```
to:
```
className="h-10 w-full rounded-lg border border-card-border bg-background px-3 text-sm text-foreground placeholder:text-muted/50 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 md:w-64"
```

Change line 115 (type select):
```
className="h-10 w-48 rounded-lg border border-card-border bg-background px-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
```
to:
```
className="h-10 w-full rounded-lg border border-card-border bg-background px-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 md:w-48"
```

Change line 124 (submit button):
```
className="h-10 rounded-lg bg-accent px-5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-accent-dark focus:outline-none focus:ring-2 focus:ring-accent/20 focus:ring-offset-2 disabled:opacity-50"
```
to:
```
className="h-10 w-full rounded-lg bg-accent px-5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-accent-dark focus:outline-none focus:ring-2 focus:ring-accent/20 focus:ring-offset-2 disabled:opacity-50 md:w-auto"
```

**Step 2: Make stats grid responsive**

Change line 132:
```
<div className="mb-6 grid grid-cols-3 gap-4">
```
to:
```
<div className="mb-6 grid grid-cols-3 gap-2 md:gap-4">
```

**Step 3: Add mobile card layout for teacher list**

After the desktop table header div (line 169), wrap the entire table section to be desktop-only, and add a mobile card section. Replace the `{teachers.length > 0 && (` block (lines 167-225) with:

```tsx
{teachers.length > 0 && (
  <>
    {/* Desktop table — hidden on mobile */}
    <div className="hidden divide-y divide-card-border md:block">
      <div className="grid grid-cols-[1fr_160px_120px_80px] items-center gap-4 px-6 py-3">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">
          Name
        </span>
        <span className="text-xs font-medium uppercase tracking-wide text-muted">
          Type
        </span>
        <span className="text-xs font-medium uppercase tracking-wide text-muted">
          Timetable
        </span>
        <span className="text-xs font-medium uppercase tracking-wide text-muted">
          Action
        </span>
      </div>

      {teachers.map((teacher) => (
        <div
          key={teacher.id}
          className="grid grid-cols-[1fr_160px_120px_80px] items-center gap-4 px-6 py-4 transition-colors hover:bg-accent-light/30"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-light font-display text-sm font-bold text-accent">
              {teacher.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </div>
            <span className="text-sm font-medium text-foreground">
              {teacher.name}
            </span>
          </div>
          <div>
            {teacher.type === "REGULAR" ? (
              <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                Regular
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-accent-light px-2.5 py-0.5 text-xs font-medium text-accent-dark">
                Permanent Relief
              </span>
            )}
          </div>
          <span className="text-sm text-muted">
            {teacher.timetableCount} entries
          </span>
          <button
            onClick={() => handleDelete(teacher.id)}
            className="rounded-md px-2.5 py-1.5 text-xs font-medium text-danger transition-colors hover:bg-danger-light"
          >
            Delete
          </button>
        </div>
      ))}
    </div>

    {/* Mobile cards — hidden on desktop */}
    <div className="divide-y divide-card-border md:hidden">
      {teachers.map((teacher) => (
        <div key={teacher.id} className="flex items-center gap-3 px-4 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-light font-display text-sm font-bold text-accent">
            {teacher.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">
              {teacher.name}
            </p>
            <div className="mt-0.5 flex items-center gap-2">
              {teacher.type === "REGULAR" ? (
                <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                  Regular
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-accent-light px-2 py-0.5 text-xs font-medium text-accent-dark">
                  Relief
                </span>
              )}
              <span className="text-xs text-muted">
                {teacher.timetableCount} entries
              </span>
            </div>
          </div>
          <button
            onClick={() => handleDelete(teacher.id)}
            className="shrink-0 rounded-md p-2 text-danger transition-colors hover:bg-danger-light"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  </>
)}
```

**Step 4: Commit**

```bash
git add src/app/dashboard/teachers/TeachersClient.tsx
git commit -m "feat: responsive teacher form and mobile card layout"
```

---

### Task 7: SettingsClient — Responsive Form & Period Cards

**Files:**
- Modify: `src/app/dashboard/settings/SettingsClient.tsx`

**Step 1: Make add period form responsive**

Change line 109:
```
<form onSubmit={handleAdd} className="flex flex-wrap items-end gap-4">
```
to:
```
<form onSubmit={handleAdd} className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-end">
```

Change line 124 (period number input):
```
className="h-10 w-28 rounded-lg border border-card-border bg-background px-3 text-sm text-foreground placeholder:text-muted/50 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
```
to:
```
className="h-10 w-full rounded-lg border border-card-border bg-background px-3 text-sm text-foreground placeholder:text-muted/50 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 md:w-28"
```

Change line 139 (start time input):
```
className="h-10 w-36 rounded-lg border border-card-border bg-background px-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
```
to:
```
className="h-10 w-full rounded-lg border border-card-border bg-background px-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 md:w-36"
```

Change line 154 (end time input) — same pattern:
```
className="h-10 w-36 rounded-lg border border-card-border bg-background px-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
```
to:
```
className="h-10 w-full rounded-lg border border-card-border bg-background px-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 md:w-36"
```

Change line 160 (submit button):
```
className="h-10 rounded-lg bg-accent px-5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-accent-dark focus:outline-none focus:ring-2 focus:ring-accent/20 focus:ring-offset-2 disabled:opacity-50"
```
to:
```
className="h-10 w-full rounded-lg bg-accent px-5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-accent-dark focus:outline-none focus:ring-2 focus:ring-accent/20 focus:ring-offset-2 disabled:opacity-50 md:w-auto"
```

**Step 2: Add mobile card layout for periods**

Replace lines 180-222 (the periods table section, inside `{periods.length > 0 && (`) with:

```tsx
{periods.length > 0 && (
  <>
    {/* Desktop table — hidden on mobile */}
    <div className="hidden divide-y divide-card-border md:block">
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

    {/* Mobile cards — hidden on desktop */}
    <div className="divide-y divide-card-border md:hidden">
      {periods.map((period) => (
        <div key={period.id} className="flex items-center gap-3 px-4 py-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-light font-display text-sm font-bold text-accent">
            {period.number}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">
              Period {period.number}
            </p>
            <p className="text-xs text-muted">
              {period.startTime} – {period.endTime}
            </p>
          </div>
          <button
            onClick={() => handleDelete(period.id)}
            className="shrink-0 rounded-md p-2 text-danger transition-colors hover:bg-danger-light"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  </>
)}
```

**Step 3: Commit**

```bash
git add src/app/dashboard/settings/SettingsClient.tsx
git commit -m "feat: responsive settings form and period card layout"
```

---

### Task 8: ImportTimetableTab — Responsive Upload Area

**Files:**
- Modify: `src/app/dashboard/settings/ImportTimetableTab.tsx`

**Step 1: Make rotation upload grid responsive**

Change line 220:
```
<div className="grid grid-cols-2 gap-4">
```
to:
```
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
```

**Step 2: Make import summary stats responsive**

Change line 251:
```
<div className="mt-4 grid grid-cols-3 gap-4">
```
to:
```
<div className="mt-4 grid grid-cols-3 gap-2 md:gap-4">
```

**Step 3: Commit**

```bash
git add src/app/dashboard/settings/ImportTimetableTab.tsx
git commit -m "feat: responsive import timetable layout"
```

---

### Task 9: TimetableGrid — Mobile Day-by-Day View

**Files:**
- Modify: `src/app/dashboard/timetable/TimetableGrid.tsx`

This is the largest change. We need to add a `selectedDay` state and render a mobile day-tab view alongside the existing desktop table.

**Step 1: Add selectedDay state**

After line 56 (`const [showEditConfirm, setShowEditConfirm] = useState(false);`), add:

```tsx
// Mobile: selected day for day-by-day view (0=Mon .. 4=Fri)
const [selectedDay, setSelectedDay] = useState(() => {
  const today = new Date().getDay(); // 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat
  if (today >= 1 && today <= 5) return today; // Mon-Fri
  return 1; // Default to Monday on weekends
});
```

**Step 2: Make teacher selector and controls responsive**

Change line 239 (select element):
```
className="h-10 w-72 rounded-lg border border-card-border bg-background px-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
```
to:
```
className="h-10 w-full rounded-lg border border-card-border bg-background px-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 md:w-72"
```

Also do the same for the identical select at line 183 (in the "no periods" state):
```
className="h-10 w-72 rounded-lg border border-card-border bg-background px-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
```
to:
```
className="h-10 w-full rounded-lg border border-card-border bg-background px-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 md:w-72"
```

Change the controls wrapper at line 232:
```
<div className="flex flex-wrap items-center gap-4">
```
to:
```
<div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center md:gap-4">
```

Change the teacher selector label+select into a full-width row on mobile. Wrap lines 233-249 (label + select) in a div:
```tsx
<div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
  <label className="text-sm font-medium text-foreground">
    Select Teacher:
  </label>
  <select ...>
    ...
  </select>
</div>
```

**Step 3: Make edit confirmation modal responsive**

Change line 318:
```
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
```
to:
```
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
```

**Step 4: Add mobile day-by-day view**

After the edit confirmation modal block (after line 360 `})`), and before the timetable grid comment `{/* Timetable grid */}`, add the mobile day view:

```tsx
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
```

**Step 5: Wrap the existing desktop table in `hidden md:block`**

Change line 363:
```
<div className="overflow-hidden rounded-xl border border-card-border bg-card shadow-sm">
```
to:
```
<div className="hidden overflow-hidden rounded-xl border border-card-border bg-card shadow-sm md:block">
```

**Step 6: Wrap the edit-mode legend in `hidden md:flex`**

Change line 529:
```
<div className="mt-4 flex items-center gap-6 text-xs text-muted">
```
to:
```
<div className="mt-4 hidden items-center gap-6 text-xs text-muted md:flex">
```

**Step 7: Commit**

```bash
git add src/app/dashboard/timetable/TimetableGrid.tsx
git commit -m "feat: mobile day-by-day timetable view"
```

---

### Task 10: Landing Page — Responsive Spacing

**Files:**
- Modify: `src/app/page.tsx`

**Step 1: Reduce hero vertical padding on mobile**

Change line 41:
```
<div className="mx-auto max-w-5xl px-6 pb-20 pt-20 text-center sm:pt-28">
```
to:
```
<div className="mx-auto max-w-5xl px-6 pb-12 pt-12 text-center sm:pb-20 sm:pt-28">
```

**Step 2: Reduce section paddings on mobile**

Change line 90:
```
<div className="mx-auto max-w-5xl px-6 py-20">
```
to:
```
<div className="mx-auto max-w-5xl px-6 py-10 md:py-20">
```

Change line 166:
```
<div className="mx-auto max-w-5xl px-6 py-20">
```
to:
```
<div className="mx-auto max-w-5xl px-6 py-10 md:py-20">
```

Change line 243:
```
<div className="mx-auto max-w-5xl px-6 py-20">
```
to:
```
<div className="mx-auto max-w-5xl px-6 py-10 md:py-20">
```

Change line 325:
```
<div className="mx-auto max-w-5xl px-6 py-20 text-center">
```
to:
```
<div className="mx-auto max-w-5xl px-6 py-10 text-center md:py-20">
```

**Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: responsive landing page spacing"
```

---

### Task 11: Build Verification & Final Test

**Step 1: Run the build to verify no TypeScript or compilation errors**

Run: `cd "/Users/shin/Desktop/relief teacher planning" && npm run build`
Expected: Build succeeds with no errors

**Step 2: Fix any build errors found**

If build errors occur, fix them and re-run.

**Step 3: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: resolve build errors from mobile responsive changes"
```
