import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireSuperAdmin();
  const { id } = await params;

  const school = await prisma.school.findUnique({ where: { id } });
  if (!school) {
    return NextResponse.json({ error: "School not found." }, { status: 404 });
  }

  if (school.slug === "demo") {
    return NextResponse.json({ error: "Cannot delete the demo school." }, { status: 403 });
  }

  // Cascade delete: Prisma relations with onDelete: Cascade handle this
  await prisma.school.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
