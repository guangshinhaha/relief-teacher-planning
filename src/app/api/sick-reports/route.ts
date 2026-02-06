import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { teacherId, startDate, numberOfDays } = body;

  if (!teacherId || !startDate || !numberOfDays) {
    return NextResponse.json(
      { error: "teacherId, startDate, and numberOfDays are required." },
      { status: 400 }
    );
  }

  if (numberOfDays < 1 || numberOfDays > 14) {
    return NextResponse.json(
      { error: "numberOfDays must be between 1 and 14." },
      { status: 400 }
    );
  }

  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
  });

  if (!teacher) {
    return NextResponse.json(
      { error: "Teacher not found." },
      { status: 404 }
    );
  }

  const start = new Date(startDate + "T00:00:00");
  const end = new Date(start);
  end.setDate(end.getDate() + numberOfDays - 1);

  const sickReport = await prisma.sickReport.create({
    data: {
      teacherId,
      startDate: start,
      endDate: end,
    },
  });

  return NextResponse.json(sickReport, { status: 201 });
}
