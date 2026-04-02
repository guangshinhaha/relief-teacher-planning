import { prisma } from "@/lib/prisma";
import { getSchoolId } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const schoolId = await getSchoolId();
  const { id } = await params;

  const period = await prisma.period.findFirst({ where: { id, schoolId } });
  if (!period) {
    return NextResponse.json({ error: "Period not found." }, { status: 404 });
  }

  await prisma.period.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
