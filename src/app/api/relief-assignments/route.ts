import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { sickReportId, timetableEntryId, reliefTeacherId, date: dateStr } = body;

  if (!sickReportId || !timetableEntryId || !reliefTeacherId || !dateStr) {
    return NextResponse.json(
      { error: "All fields are required." },
      { status: 400 }
    );
  }

  const date = new Date(dateStr + "T00:00:00.000Z");

  // Verify the timetable entry exists
  const timetableEntry = await prisma.timetableEntry.findUnique({
    where: { id: timetableEntryId },
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
    },
  });

  return NextResponse.json(assignment, { status: 201 });
}
