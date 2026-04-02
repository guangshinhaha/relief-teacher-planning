import { prisma } from "@/lib/prisma";
import { getSchoolId } from "@/lib/auth";
import { WeekType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const teacherId = searchParams.get("teacherId");
  const weekType = searchParams.get("weekType") as WeekType | null;

  if (!teacherId) {
    return NextResponse.json(
      { error: "teacherId is required." },
      { status: 400 }
    );
  }

  const schoolId = await getSchoolId();

  const where: { teacherId: string; schoolId: string; weekType?: WeekType } = {
    teacherId,
    schoolId,
  };
  if (weekType) {
    where.weekType = weekType;
  }

  const entries = await prisma.timetableEntry.findMany({
    where,
    include: { period: true },
    orderBy: { period: { number: "asc" } },
  });

  return NextResponse.json(entries);
}

export async function POST(request: NextRequest) {
  const schoolId = await getSchoolId();
  const body = await request.json();
  const { teacherId, dayOfWeek, periodId, className, subject, weekType } = body;

  if (!teacherId || !dayOfWeek || !periodId || !className?.trim() || !subject?.trim()) {
    return NextResponse.json(
      { error: "All fields are required." },
      { status: 400 }
    );
  }

  const wt: WeekType = weekType || "ALL";

  const entry = await prisma.timetableEntry.upsert({
    where: {
      schoolId_teacherId_dayOfWeek_periodId_weekType: {
        schoolId,
        teacherId,
        dayOfWeek,
        periodId,
        weekType: wt,
      },
    },
    update: {
      className: className.trim(),
      subject: subject.trim(),
    },
    create: {
      teacherId,
      dayOfWeek,
      periodId,
      className: className.trim(),
      subject: subject.trim(),
      weekType: wt,
      schoolId,
    },
  });

  return NextResponse.json(entry, { status: 201 });
}
