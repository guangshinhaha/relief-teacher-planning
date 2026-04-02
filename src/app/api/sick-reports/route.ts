import { prisma } from "@/lib/prisma";
import { requireSchool } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { schoolId } = await requireSchool();
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

    const teacher = await prisma.teacher.findFirst({
      where: { id: teacherId, schoolId },
    });

    if (!teacher) {
      return NextResponse.json(
        { error: "Teacher not found." },
        { status: 404 }
      );
    }

    const start = new Date(startDate + "T00:00:00.000Z");
    const end = new Date(start);
    end.setDate(end.getDate() + numberOfDays - 1);

    const sickReport = await prisma.sickReport.create({
      data: {
        teacherId,
        startDate: start,
        endDate: end,
        schoolId,
      },
    });

    return NextResponse.json(sickReport, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message === "Unauthorized" || message === "No school associated with user") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
