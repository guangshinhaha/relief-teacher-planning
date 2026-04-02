import { prisma } from "@/lib/prisma";
import { getSchoolId } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const schoolId = await getSchoolId();
  const { id } = await params;

  // Ensure teacher belongs to this school
  const teacher = await prisma.teacher.findFirst({ where: { id, schoolId } });
  if (!teacher) {
    return NextResponse.json({ error: "Teacher not found." }, { status: 404 });
  }

  await prisma.teacher.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
