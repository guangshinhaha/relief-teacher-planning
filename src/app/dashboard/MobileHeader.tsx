"use client";

import { usePathname } from "next/navigation";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/teachers": "Teachers",
  "/dashboard/timetable": "Timetable",
  "/dashboard/settings": "Settings",
};

export default function MobileHeader() {
  const pathname = usePathname();

  const title = pageTitles[pathname] ?? "Dashboard";

  return (
    <header className="flex items-center gap-3 border-b border-card-border bg-card px-4 py-3 md:hidden">
      <img
        src="/stand-in-logo.svg"
        alt="StandIn"
        className="h-8 w-auto"
      />
      <span className="font-display text-lg font-bold tracking-tight text-foreground">
        {title}
      </span>
    </header>
  );
}
