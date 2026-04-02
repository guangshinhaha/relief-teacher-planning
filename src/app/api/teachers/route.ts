import { prisma } from "@/lib/prisma";
import { requireSchool } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

function handleAuthError(err: unknown): NextResponse {
  const message = err instanceof Error ? err.message : "";
  if (message === "Unauthorized" || message === "No school associated with user") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

export async function GET() {
  try {
    const { schoolId } = await requireSchool();
    const teachers = await prisma.teacher.findMany({
      where: { schoolId },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(teachers);
  } catch (err) {
    return handleAuthError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { schoolId } = await requireSchool();
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
  } catch (err) {
    return handleAuthError(err);
  }
}
