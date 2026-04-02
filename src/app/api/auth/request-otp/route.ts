import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOtpCode } from "@/lib/auth";
import { sendOtpEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (!user) {
      // Don't reveal whether the email exists — return success either way
      return NextResponse.json({ success: true });
    }

    // Invalidate previous unused OTPs for this email
    await prisma.otpCode.updateMany({
      where: { email: normalizedEmail, used: false },
      data: { used: true },
    });

    // Generate and store new OTP
    const code = generateOtpCode();
    await prisma.otpCode.create({
      data: {
        email: normalizedEmail,
        code,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      },
    });

    // Send OTP (stub: logs to console)
    await sendOtpEmail(normalizedEmail, code);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
