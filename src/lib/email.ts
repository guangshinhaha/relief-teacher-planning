/**
 * Stub email service — logs OTP to console instead of sending.
 * Replace this with a real email provider (e.g. Resend, SendGrid) later.
 */
export async function sendOtpEmail(email: string, code: string): Promise<void> {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`📧 OTP for ${email}: ${code}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}
