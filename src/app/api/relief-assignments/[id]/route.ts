import { prisma } from "@/lib/prisma";
import { getSchoolId } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const schoolId = await getSchoolId();
  const { id } = await params;

  const assignment = await prisma.reliefAssignment.findFirst({ where: { id, schoolId } });
  if (!assignment) {
    return NextResponse.json({ error: "Assignment not found." }, { status: 404 });
  }

  await prisma.reliefAssignment.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
