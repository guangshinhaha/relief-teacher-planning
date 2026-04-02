import { prisma } from "@/lib/prisma";
import { getSchoolId } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const schoolId = await getSchoolId();
  const teachers = await prisma.teacher.findMany({
    where: { schoolId },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(teachers);
}

export async function POST(request: NextRequest) {
  const schoolId = await getSchoolId();
  const body = await request.json();
  const { name, type } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }

  const teacher = await prisma.teacher.create({
    data: {
      name: name.trim(),
      type: type || "REGULAR",
      schoolId,
    },
  });

  return NextResponse.json(teacher, { status: 201 });
}
