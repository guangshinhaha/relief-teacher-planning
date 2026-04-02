import { prisma } from "@/lib/prisma";
import { requireSchool } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { schoolId } = await requireSchool();
    const body = await request.json();
    const { sickReportId, timetableEntryId, reliefTeacherId, date: dateStr } = body;

    if (!sickReportId || !timetableEntryId || !reliefTeacherId || !dateStr) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }

    const date = new Date(dateStr + "T00:00:00.000Z");

    // Verify the timetable entry exists and belongs to this school
    const timetableEntry = await prisma.timetableEntry.findFirst({
      where: { id: timetableEntryId, schoolId },
    });

    if (!timetableEntry) {
      return NextResponse.json(
        { error: "Timetable entry not found." },
        { status: 404 }
      );
    }

    // Verify teacher isn't already covering this period on this date
    const existing = await prisma.reliefAssignment.findFirst({
      where: {
        reliefTeacherId,
        date,
        timetableEntry: { periodId: timetableEntry.periodId },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Teacher is already covering another class at this time." },
        { status: 409 }
      );
    }

    const assignment = await prisma.reliefAssignment.create({
      data: {
        sickReportId,
        timetableEntryId,
        reliefTeacherId,
        date,
        schoolId,
      },
    });

    return NextResponse.json(assignment, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message === "Unauthorized" || message === "No school associated with user") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
