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
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-accent-light px-4 py-1.5">
          <svg
            className="h-4 w-4 text-accent"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
            />
          </svg>
          <span className="text-sm font-semibold text-accent">
            StandIn
          </span>
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
