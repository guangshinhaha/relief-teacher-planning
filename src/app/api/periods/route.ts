import { prisma } from "@/lib/prisma";
import { getSchoolId } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const schoolId = await getSchoolId();
  const periods = await prisma.period.findMany({
    where: { schoolId },
    orderBy: { number: "asc" },
  });
  return NextResponse.json(periods);
}

export async function POST(request: NextRequest) {
  const schoolId = await getSchoolId();
  const body = await request.json();
  const { number, startTime, endTime } = body;

  if (!number || !startTime || !endTime) {
    return NextResponse.json(
      { error: "number, startTime, and endTime are required." },
      { status: 400 }
    );
  }

  const period = await prisma.period.create({
    data: { number, startTime, endTime, schoolId },
  });

  return NextResponse.json(period, { status: 201 });
}
