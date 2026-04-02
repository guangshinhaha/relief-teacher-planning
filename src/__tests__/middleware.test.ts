import { describe, it, expect } from "vitest";
import { middleware } from "@/middleware";
import { NextRequest } from "next/server";

function makeRequest(path: string, cookies: Record<string, string> = {}): NextRequest {
  const url = `http://localhost${path}`;
  const headers: Record<string, string> = {};
  if (Object.keys(cookies).length > 0) {
    headers["cookie"] = Object.entries(cookies)
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");
  }
  return new NextRequest(url, { headers });
}

describe("middleware", () => {
  it("allows /demo/* without session", () => {
    const res = middleware(makeRequest("/demo/dashboard"));
    expect(res.status).not.toBe(307);
  });

  it("redirects /dashboard to /login without session", () => {
    const res = middleware(makeRequest("/dashboard"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login");
  });

  it("allows /dashboard with session cookie", () => {
    const res = middleware(makeRequest("/dashboard", { reliefcher_session: "abc123" }));
    expect(res.status).not.toBe(307);
  });

  it("redirects /admin to /login without session", () => {
    const res = middleware(makeRequest("/admin"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login");
  });

  it("redirects /onboarding to /login without session", () => {
    const res = middleware(makeRequest("/onboarding"));
    expect(res.status).toBe(307);
  });

  it("redirects /login to /dashboard when session exists", () => {
    const res = middleware(makeRequest("/login", { reliefcher_session: "abc123" }));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/dashboard");
  });
});
