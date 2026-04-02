import { cookies } from "next/headers";
import { prisma } from "./prisma";

const SESSION_COOKIE = "reliefcher_session";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function generateSessionToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function generateOtpCode(): string {
  const bytes = new Uint8Array(3);
  crypto.getRandomValues(bytes);
  const num = (bytes[0] * 65536 + bytes[1] * 256 + bytes[2]) % 1000000;
  return num.toString().padStart(6, "0");
}

export async function createSession(userId: string): Promise<string> {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await prisma.session.create({
    data: { userId, token, expiresAt },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return token;
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { token } });
    cookieStore.delete(SESSION_COOKIE);
  }
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: { include: { school: true } } },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } });
    }
    return null;
  }

  return session;
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requireSchool() {
  const session = await requireAuth();
  if (!session.user.schoolId || !session.user.school) {
    throw new Error("No school associated with user");
  }
  return { session, schoolId: session.user.schoolId, school: session.user.school };
}

export async function requireSuperAdmin() {
  const session = await requireAuth();
  if (session.user.role !== "SUPERADMIN") {
    throw new Error("Forbidden: superadmin required");
  }
  return session;
}

/** Get schoolId from session or fall back to demo school for unauthenticated requests */
export async function getSchoolId(): Promise<string> {
  const session = await getSession();
  if (session?.user.schoolId) {
    return session.user.schoolId;
  }
  // Fall back to demo school
  const demoSchool = await prisma.school.findUnique({ where: { slug: "demo" } });
  if (!demoSchool) throw new Error("Demo school not found");
  return demoSchool.id;
}
