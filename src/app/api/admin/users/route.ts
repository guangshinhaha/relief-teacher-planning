import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    await requireSuperAdmin();

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: { school: true },
    });

    return NextResponse.json(users);
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

    const { email, name, role, schoolId } = await request.json();

    if (!email?.trim()) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check for duplicate email
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json({ error: "A user with this email already exists." }, { status: 409 });
    }

    // Validate role
    const validRoles = ["SCHOOL_ADMIN", "TEACHER"];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Role must be SCHOOL_ADMIN or TEACHER." }, { status: 400 });
    }

    // Validate school exists if provided
    if (schoolId) {
      const school = await prisma.school.findUnique({ where: { id: schoolId } });
      if (!school) {
        return NextResponse.json({ error: "School not found." }, { status: 404 });
      }
    }

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: name?.trim() || null,
        role,
        schoolId: schoolId || null,
        onboardingComplete: role === "TEACHER", // Teachers don't need onboarding
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "Unauthorized" || msg === "Forbidden: superadmin required") {
      return NextResponse.json({ error: msg }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
