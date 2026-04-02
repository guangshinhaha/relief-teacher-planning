import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();

    if (session.user.role !== "SCHOOL_ADMIN") {
      return NextResponse.json({ error: "Only school admins can whitelist users." }, { status: 403 });
    }

    if (!session.user.schoolId) {
      return NextResponse.json({ error: "No school associated with your account." }, { status: 400 });
    }

    const { emails } = await request.json();

    if (!Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ error: "At least one email is required." }, { status: 400 });
    }

    // Filter out emails that already exist
    const existingUsers = await prisma.user.findMany({
      where: { email: { in: emails } },
      select: { email: true },
    });
    const existingEmails = new Set(existingUsers.map((u) => u.email));
    const newEmails = emails.filter((e: string) => !existingEmails.has(e));

    if (newEmails.length > 0) {
      await prisma.user.createMany({
        data: newEmails.map((email: string) => ({
          email,
          role: "TEACHER" as const,
          schoolId: session.user.schoolId!,
          onboardingComplete: true, // Teachers don't need onboarding
        })),
      });
    }

    return NextResponse.json({
      success: true,
      created: newEmails.length,
      skipped: emails.length - newEmails.length,
    });
  } catch {
    return NextResponse.json({ error: "Failed to whitelist users." }, { status: 500 });
  }
}
