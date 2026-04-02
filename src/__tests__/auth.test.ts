import { describe, it, expect, beforeEach, vi } from "vitest";
import { generateOtpCode, generateSessionToken, getSession } from "@/lib/auth";
import { truncateAll, testPrisma, createUser } from "./helpers";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

async function mockSession(token: string) {
  const { cookies } = await import("next/headers");
  vi.mocked(cookies).mockResolvedValue({
    get: vi.fn().mockReturnValue({ value: token }),
    set: vi.fn(),
    delete: vi.fn(),
  } as never);
}

async function mockNoSession() {
  const { cookies } = await import("next/headers");
  vi.mocked(cookies).mockResolvedValue({
    get: vi.fn().mockReturnValue(undefined),
    set: vi.fn(),
    delete: vi.fn(),
  } as never);
}

describe("generateOtpCode", () => {
  it("returns a 6-digit string", () => {
    const code = generateOtpCode();
    expect(code).toMatch(/^\d{6}$/);
  });

  it("generates different values on subsequent calls", () => {
    const codes = new Set(Array.from({ length: 20 }, () => generateOtpCode()));
    expect(codes.size).toBeGreaterThan(1);
  });
});

describe("generateSessionToken", () => {
  it("returns a 64-character hex string", () => {
    const token = generateSessionToken();
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it("generates unique values", () => {
    const tokens = new Set(Array.from({ length: 20 }, () => generateSessionToken()));
    expect(tokens.size).toBe(20);
  });
});

describe("getSession", () => {
  beforeEach(truncateAll);

  it("returns null when no cookie is present", async () => {
    await mockNoSession();
    const session = await getSession();
    expect(session).toBeNull();
  });

  it("returns null and cleans up expired session", async () => {
    const user = await createUser();
    const token = "expiredtoken" + Math.random().toString(36).slice(2);
    // Create an expired session directly in the DB
    const expiredDate = new Date(Date.now() - 1000);
    await testPrisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt: expiredDate,
      },
    });

    await mockSession(token);
    const session = await getSession();
    expect(session).toBeNull();

    // Session should be cleaned up from DB
    const remaining = await testPrisma.session.findFirst({ where: { token } });
    expect(remaining).toBeNull();
  });

  it("returns session for valid token", async () => {
    const user = await createUser();
    const token = "validtoken" + Math.random().toString(36).slice(2);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await testPrisma.session.create({
      data: { userId: user.id, token, expiresAt },
    });

    await mockSession(token);
    const session = await getSession();
    expect(session).not.toBeNull();
    expect(session!.user.id).toBe(user.id);
  });
});
