import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST as requestOtp } from "@/app/api/auth/request-otp/route";
import { POST as verifyOtp } from "@/app/api/auth/verify-otp/route";
import {
  truncateAll,
  testPrisma,
  createUser,
  createSchool,
} from "../helpers";

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

beforeEach(truncateAll);

describe("POST /api/auth/request-otp", () => {
  it("returns success for unknown email (no user leak)", async () => {
    await mockNoSession();
    const req = new Request("http://localhost/api/auth/request-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "nonexistent@test.com" }),
    });
    const res = await requestOtp(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it("creates OTP for known user", async () => {
    await mockNoSession();
    const user = await createUser({ email: "alice@test.com" });
    const req = new Request("http://localhost/api/auth/request-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "alice@test.com" }),
    });
    const res = await requestOtp(req);
    expect(res.status).toBe(200);

    // Verify OTP was created in DB
    const otp = await testPrisma.otpCode.findFirst({
      where: { email: "alice@test.com", used: false },
    });
    expect(otp).not.toBeNull();
    expect(otp!.code).toMatch(/^\d{6}$/);
  });

  it("invalidates previous OTP when new one is requested", async () => {
    await mockNoSession();
    await createUser({ email: "bob@test.com" });

    // First request
    const req1 = new Request("http://localhost/api/auth/request-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "bob@test.com" }),
    });
    await requestOtp(req1);

    // Second request
    const req2 = new Request("http://localhost/api/auth/request-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "bob@test.com" }),
    });
    await requestOtp(req2);

    // Only 1 active OTP
    const activeOtps = await testPrisma.otpCode.findMany({
      where: { email: "bob@test.com", used: false },
    });
    expect(activeOtps.length).toBe(1);
  });

  it("returns 400 for missing email", async () => {
    await mockNoSession();
    const req = new Request("http://localhost/api/auth/request-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const res = await requestOtp(req);
    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/verify-otp", () => {
  it("returns 401 for wrong code", async () => {
    await mockNoSession();
    const user = await createUser({ email: "carol@test.com" });
    // Create a real OTP
    await testPrisma.otpCode.create({
      data: {
        email: "carol@test.com",
        code: "111111",
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    const req = new Request("http://localhost/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "carol@test.com", code: "999999" }),
    });
    const res = await verifyOtp(req);
    expect(res.status).toBe(401);
  });

  it("returns 401 for expired code", async () => {
    await mockNoSession();
    await createUser({ email: "dave@test.com" });
    await testPrisma.otpCode.create({
      data: {
        email: "dave@test.com",
        code: "123456",
        expiresAt: new Date(Date.now() - 1000), // expired
      },
    });

    const req = new Request("http://localhost/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "dave@test.com", code: "123456" }),
    });
    const res = await verifyOtp(req);
    expect(res.status).toBe(401);
  });

  it("redirects SUPERADMIN to /admin on success", async () => {
    await mockNoSession();
    const user = await createUser({ email: "super@test.com", role: "SUPERADMIN" });
    await testPrisma.otpCode.create({
      data: {
        email: "super@test.com",
        code: "000001",
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    const req = new Request("http://localhost/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "super@test.com", code: "000001" }),
    });
    const res = await verifyOtp(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.redirect).toBe("/admin");
  });

  it("redirects incomplete SCHOOL_ADMIN to /onboarding", async () => {
    await mockNoSession();
    await createUser({ email: "admin@test.com", role: "SCHOOL_ADMIN", onboardingComplete: false });
    await testPrisma.otpCode.create({
      data: {
        email: "admin@test.com",
        code: "000002",
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    const req = new Request("http://localhost/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@test.com", code: "000002" }),
    });
    const res = await verifyOtp(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.redirect).toBe("/onboarding");
  });

  it("redirects complete SCHOOL_ADMIN to /dashboard", async () => {
    await mockNoSession();
    const school = await createSchool();
    await createUser({
      email: "complete@test.com",
      role: "SCHOOL_ADMIN",
      onboardingComplete: true,
      schoolId: school.id,
    });
    await testPrisma.otpCode.create({
      data: {
        email: "complete@test.com",
        code: "000003",
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    const req = new Request("http://localhost/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "complete@test.com", code: "000003" }),
    });
    const res = await verifyOtp(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.redirect).toBe("/dashboard");
  });

  it("marks OTP as used after successful verify", async () => {
    await mockNoSession();
    await createUser({ email: "eve@test.com", role: "SCHOOL_ADMIN", onboardingComplete: true });
    const otp = await testPrisma.otpCode.create({
      data: {
        email: "eve@test.com",
        code: "000004",
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    const req = new Request("http://localhost/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "eve@test.com", code: "000004" }),
    });
    await verifyOtp(req);

    const updatedOtp = await testPrisma.otpCode.findUnique({ where: { id: otp.id } });
    expect(updatedOtp!.used).toBe(true);
  });
});
