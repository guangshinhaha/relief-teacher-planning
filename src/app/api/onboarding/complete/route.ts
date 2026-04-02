import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const session = await requireAuth();

    if (session.user.role !== "SCHOOL_ADMIN") {
      return NextResponse.json({ error: "Only school admins can complete onboarding." }, { status: 403 });
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { onboardingComplete: true },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to complete onboarding." }, { status: 500 });
  }
}
