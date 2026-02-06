# Mobile Responsive Design

## Overview

Make all pages of the relief teacher planning app mobile responsive. Currently the app has no responsive breakpoints — fixed-width sidebar, hardcoded input widths, table grids that overflow, and excessive padding on small screens.

**Breakpoint:** `md` (768px). Below = mobile layout, above = current desktop layout.

## 1. Navigation — Bottom Tab Bar

### Mobile (below md)
- Sidebar hidden (`hidden md:flex`)
- **Top header bar** with app logo and current page title
- **Bottom tab bar** fixed to bottom with 4 items: Dashboard, Teachers, Timetable, Settings
- Each tab: icon + small label, active tab uses orange accent (`text-orange-600`)
- Safe area inset padding for iPhone home indicator
- Main content gets `pb-20` to clear the tab bar

### Desktop (unchanged)
- Left sidebar with `w-64`, logo, nav links as-is

### Files
- New: `src/app/dashboard/BottomTabBar.tsx`
- New: `src/app/dashboard/MobileHeader.tsx`
- Edit: `src/app/dashboard/layout.tsx` — add responsive wrappers
- Edit: `src/app/dashboard/DashboardSidebar.tsx` — add `hidden md:flex`

## 2. Dashboard Content — Sick Reports & Relief

### Spacing
- `px-8 py-8` → `px-4 md:px-8 py-4 md:py-8` in layout wrapper

### Date navigation
- `gap-4` → `gap-2 md:gap-4`
- Date input full-width below prev/next buttons on mobile

### Sick report cards
- Already card-based, mostly fine
- "Copy Relief Summary" button: `w-full md:w-auto`

### Assign Relief Modal
- Add `mx-4` margin on mobile wrapper
- Buttons: `flex-col sm:flex-row` on small screens

### Files
- Edit: `src/app/dashboard/layout.tsx` — responsive padding
- Edit: `src/app/dashboard/DashboardContent.tsx` — responsive spacing
- Edit: `src/app/dashboard/AssignReliefModal.tsx` — mobile margins

## 3. Teachers — Card Layout

### Add teacher form
- Fixed widths (`w-64`, `w-48`) → `w-full md:w-64`
- Stack vertically: `flex-col md:flex-row`
- Submit button: `w-full md:w-auto`

### Teacher list
- Mobile: card layout (`md:hidden`)
  - Avatar + name at top
  - Subject and role as badges below
  - Edit/delete in top-right corner
  - Cards stacked with `gap-3`
- Desktop: keep current grid table (`hidden md:grid`)

### Files
- Edit: `src/app/dashboard/teachers/TeachersClient.tsx`

## 4. Settings — Period Cards

### Add period form
- Inputs: `w-full md:w-28` / `w-full md:w-36`
- Stack vertically on mobile: `flex-col md:flex-row`

### Period list
- Mobile: card layout (`md:hidden`)
  - Period label prominent at top
  - Start/end time on one row
  - Delete button in top-right
- Desktop: keep current grid (`hidden md:grid`)

### Files
- Edit: `src/app/dashboard/settings/SettingsClient.tsx`

## 5. Timetable — Day-by-Day View

### Mobile (below md)
- Day tab bar: Mon/Tue/Wed/Thu/Fri as horizontal tabs
- Active day highlighted with orange accent
- Below tabs: vertical list of period cards for selected day
  - Each card: period label, time range, assigned teacher/subject
  - Edit mode: tap to select teacher
- Teacher filter select: `w-full` above day tabs
- Week type selector: full-width above day tabs

### Desktop (unchanged)
- Full grid table as-is

### Implementation
- `selectedDay` state defaulting to today's weekday (mobile only)
- Day tabs + card list in `md:hidden` wrapper
- Existing table in `hidden md:block` wrapper
- Same data source, filtered by day on mobile

### Files
- Edit: `src/app/dashboard/timetable/TimetableGrid.tsx`

## 6. Landing Page & Report Form

### Landing page
- Padding: `py-20` → `py-10 md:py-20`
- Heading: `text-5xl` → `text-3xl md:text-5xl`
- Feature grids: `grid-cols-1 md:grid-cols-3`
- CTA buttons: `w-full sm:w-auto`

### Report form
- Already mostly responsive (`max-w-md`, `p-6 sm:p-8`)
- Ensure all inputs `w-full`
- Submit button full-width on mobile

### Files
- Edit: `src/app/page.tsx`
- Edit: `src/app/report/page.tsx`

## 7. General Fixes

- All modals: add `mx-4` wrapper padding on mobile
- Touch targets: ensure minimum 44x44px for interactive elements
- Render both mobile and desktop layouts, toggle with responsive classes (no JS needed for layout switching)
