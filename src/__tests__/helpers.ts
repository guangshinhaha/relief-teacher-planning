import { PrismaClient, UserRole, TeacherType } from "@prisma/client";
import { generateSessionToken } from "@/lib/auth";

const TEST_DB_URL = "postgresql://postgres:postgres@localhost:5433/reliefcher_test";

export const testPrisma = new PrismaClient({
  datasources: { db: { url: TEST_DB_URL } },
});

/** Truncate all tables in dependency order */
export async function truncateAll() {
  await testPrisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "ReliefAssignment",
      "SickReport",
      "TimetableEntry",
      "Period",
      "Teacher",
      "Session",
      "OtpCode",
      "User",
      "School"
    RESTART IDENTITY CASCADE;
  `);
}

export async function createSchool(overrides: { name?: string; slug?: string } = {}) {
  return testPrisma.school.create({
    data: {
      name: overrides.name ?? "Test School",
      slug: overrides.slug ?? `school-${Date.now()}`,
    },
  });
}

export async function createUser(overrides: {
  email?: string;
  role?: UserRole;
  schoolId?: string | null;
  onboardingComplete?: boolean;
} = {}) {
  return testPrisma.user.create({
    data: {
      email: overrides.email ?? `user-${Date.now()}@test.com`,
      role: overrides.role ?? UserRole.SCHOOL_ADMIN,
      schoolId: overrides.schoolId ?? null,
      onboardingComplete: overrides.onboardingComplete ?? false,
    },
  });
}

export async function createSession(userId: string) {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await testPrisma.session.create({ data: { userId, token, expiresAt } });
  return token;
}

/** Returns a Request with session cookie set */
export function authedRequest(token: string, init: RequestInit = {}): Request {
  return new Request("http://localhost/api/test", {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Cookie: `reliefcher_session=${token}`,
      ...(init.headers ?? {}),
    },
  });
}

export async function createTeacher(schoolId: string, overrides: { name?: string; type?: TeacherType } = {}) {
  return testPrisma.teacher.create({
    data: {
      name: overrides.name ?? `Teacher ${Date.now()}`,
      type: overrides.type ?? TeacherType.REGULAR,
      schoolId,
    },
  });
}

export async function createPeriod(schoolId: string, number: number) {
  return testPrisma.period.create({
    data: {
      number,
      startTime: `0${6 + number}:00`,
      endTime: `0${7 + number}:00`,
      schoolId,
    },
  });
}
