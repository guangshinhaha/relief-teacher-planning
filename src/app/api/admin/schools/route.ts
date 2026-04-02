import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    await requireSuperAdmin();

    const schools = await prisma.school.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { teachers: true, users: true, sickReports: true },
        },
      },
    });

    return NextResponse.json(schools);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "Unauthorized" || msg === "Forbidden: superadmin required") {
      return NextResponse.json({ error: msg }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireSuperAdmin();

    const { name, slug } = await request.json();

    if (!name?.trim() || !slug?.trim()) {
      return NextResponse.json({ error: "Name and slug are required." }, { status: 400 });
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { error: "Slug must contain only lowercase letters, numbers, and hyphens." },
        { status: 400 }
      );
    }

    // Check for duplicate slug
    const existing = await prisma.school.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: "A school with this slug already exists." }, { status: 409 });
    }

    const school = await prisma.school.create({
      data: { name: name.trim(), slug: slug.trim() },
    });

    return NextResponse.json(school, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "Unauthorized" || msg === "Forbidden: superadmin required") {
      return NextResponse.json({ error: msg }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
