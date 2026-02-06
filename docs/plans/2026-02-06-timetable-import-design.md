# Timetable Import from aSc Timetables XML

## Overview

Import school timetable data from aSc Timetables XML exports, automatically creating teachers, periods, and timetable entries. Located in the Settings page as an "Import Timetable" tab.

## Flow

1. KP opens Settings > Import Timetable tab
2. Toggles whether the school uses odd/even week rotation
3. Single mode: one file upload zone. Rotation mode: side-by-side upload zones for Odd Week and Even Week XMLs
4. System parses XML client-side and shows summary (teacher count, period count, entry count)
5. KP chooses Replace All or Merge with existing
6. KP clicks Import, API processes in a single transaction

## Data Mapping

| XML Element         | Maps To          | Details                                                                 |
| ------------------- | ---------------- | ----------------------------------------------------------------------- |
| `<period>`          | `Period`         | `period` attr -> `number`, `starttime` -> `startTime`, `endtime` -> `endTime` |
| `<teacher>`         | `Teacher`        | Combine `firstname` + `lastname`, fall back to `short`. Imported as `REGULAR`. |
| `<lesson>` + `<card>` | `TimetableEntry` | Join lesson's teacherids/subjectid/classids with card's period/days     |

### Days Decoding

- `10000` -> 1 (Monday)
- `01000` -> 2 (Tuesday)
- `00100` -> 3 (Wednesday)
- `00010` -> 4 (Thursday)
- `00001` -> 5 (Friday)

### Subject + Class Resolution

Look up `subjectid` and `classids` from the lesson against `<subjects>` and `<classes>` lists to get short name strings (e.g. "EL", "1EX1").

### Week Type Assignment

- Single file upload: all entries get `weekType: ALL`
- Two file upload: odd file entries get `ODD`, even file entries get `EVEN`

### Teacher Name Logic

Use `firstname + " " + lastname` when both present. Fall back to `short` code.

## API

### `POST /api/import-timetable`

**Request body:**

```json
{
  "mode": "replace | merge",
  "teachers": [{ "name": "ARJNG" }],
  "periods": [{ "number": 1, "startTime": "07:50", "endTime": "08:30" }],
  "entries": [
    {
      "teacherName": "ARJNG",
      "dayOfWeek": 1,
      "periodNumber": 1,
      "className": "1EX1",
      "subject": "EL",
      "weekType": "ODD"
    }
  ]
}
```

**Replace mode:**

1. Delete all TimetableEntry, Teacher, Period records (cascades handle ReliefAssignment and SickReport)
2. Create all periods
3. Create all teachers
4. Create all timetable entries (linking by teacher name -> id, period number -> id)

**Merge mode:**

1. Upsert periods by number (update start/end times if they differ)
2. Upsert teachers by name (match existing, create new)
3. Delete existing timetable entries for teachers found in the import, then insert new ones

**Response:** `{ success: true, created: { teachers: 45, periods: 8, entries: 320 } }`

## UI Components

### Import Timetable Tab (in Settings page)

1. **Week rotation toggle** - "Does this school use odd/even week rotation?" Switch control.

2. **File upload area:**
   - Single mode: one drop zone - "Upload Timetable XML"
   - Rotation mode: two drop zones side-by-side - "Odd Week XML" / "Even Week XML"
   - Accepts .xml files only

3. **Summary card** (after successful parse):
   - Teachers: N found
   - Periods: N found
   - Timetable entries: N found
   - Rotation mode: counts per week

4. **Import mode selector** - Radio buttons:
   - "Replace all existing data" - warns: "This will delete all existing teachers, periods, timetable entries, sick reports, and relief assignments."
   - "Merge with existing data" - warns: "Existing teachers matched by name will have their timetable replaced. New teachers and periods will be added."

5. **Import button** - Disabled until file(s) parsed and mode selected. Loading spinner during import, then success/error message.

## No Schema Changes

Everything fits the existing Prisma schema. No new models or migrations needed.
