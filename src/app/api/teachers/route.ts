import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const teachers = await prisma.teacher.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json(teachers);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, type } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }

  const teacher = await prisma.teacher.create({
    data: {
      name: name.trim(),
      type: type || "REGULAR",
    },
  });

  return NextResponse.json(teacher, { status: 201 });
}
