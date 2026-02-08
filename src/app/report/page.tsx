import Link from "next/link";
import { prisma } from "@/lib/prisma";
import SickReportForm from "./SickReportForm";

export const dynamic = "force-dynamic";

export default async function ReportPage() {
  const teachers = await prisma.teacher.findMany({
    where: { type: "REGULAR" },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="flex min-h-screen flex-col items-center bg-background px-4 py-12 sm:py-16">
      {/* App Header */}
      <div className="mb-10 text-center">
        <div className="mb-3">
          <img
            src="/stand-in-logo.svg"
            alt="StandIn"
            className="mx-auto h-10 w-auto"
          />
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Report Sick Leave
        </h1>
        <p className="mt-2 text-base text-muted sm:text-lg">
          Not feeling well? Let us know so we can arrange coverage.
        </p>
      </div>

      {/* Form Card */}
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-card-border bg-card p-6 shadow-lg shadow-black/[0.03] sm:p-8">
          <SickReportForm teachers={teachers} />
        </div>

        {/* Dashboard Link */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted">
            Are you a Key Personnel?{" "}
            <Link
              href="/dashboard"
              className="font-semibold text-accent underline decoration-accent/30 underline-offset-2 transition-colors hover:text-accent-dark hover:decoration-accent-dark/30"
            >
              Go to Dashboard
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
