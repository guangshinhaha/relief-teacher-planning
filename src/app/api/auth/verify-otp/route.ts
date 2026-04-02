import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json();
    if (!email || !code) {
      return NextResponse.json({ error: "Email and code are required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find valid OTP
    const otp = await prisma.otpCode.findFirst({
      where: {
        email: normalizedEmail,
        code,
        used: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!otp) {
      return NextResponse.json({ error: "Invalid or expired code" }, { status: 401 });
    }

    // Mark OTP as used
    await prisma.otpCode.update({
      where: { id: otp.id },
      data: { used: true },
    });

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { school: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create session
    await createSession(user.id);

    // Determine redirect based on role and onboarding status
    let redirect = "/dashboard";
    if (user.role === "SUPERADMIN") {
      redirect = "/admin";
    } else if (user.role === "SCHOOL_ADMIN" && !user.onboardingComplete) {
      redirect = "/onboarding";
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        schoolId: user.schoolId,
      },
      redirect,
    });
  } catch {
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
