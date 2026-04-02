import { prisma } from "@/lib/prisma";
import { getSchoolId } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const schoolId = await getSchoolId();
  const { id } = await params;

  const entry = await prisma.timetableEntry.findFirst({ where: { id, schoolId } });
  if (!entry) {
    return NextResponse.json({ error: "Entry not found." }, { status: 404 });
  }

  await prisma.timetableEntry.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
