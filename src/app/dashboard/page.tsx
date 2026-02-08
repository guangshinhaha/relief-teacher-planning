import { prisma } from "@/lib/prisma";
import DashboardContent from "./DashboardContent";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date: dateParam } = await searchParams;

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const dateStr = dateParam || todayStr;

  const rotationEntry = await prisma.timetableEntry.findFirst({
    where: { weekType: { in: ["ODD", "EVEN"] } },
    select: { id: true },
  });
  const hasWeekRotation = !!rotationEntry;

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
          Relief Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted">
          Manage daily relief teacher assignments.
        </p>
      </div>
      <DashboardContent
        initialDate={dateStr}
        hasWeekRotation={hasWeekRotation}
      />
    </div>
  );
}
