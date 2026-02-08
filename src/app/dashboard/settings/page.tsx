import { prisma } from "@/lib/prisma";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const periods = await prisma.period.findMany({
    orderBy: { number: "asc" },
  });

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="mt-1 text-sm text-muted">
          Configure school periods and import timetable data.
        </p>
      </div>

      <SettingsClient initialPeriods={periods} />
    </div>
  );
}
