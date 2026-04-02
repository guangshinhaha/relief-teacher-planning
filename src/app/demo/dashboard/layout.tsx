import { SchoolProvider } from "@/lib/SchoolContext";
import DashboardSidebar from "@/app/dashboard/DashboardSidebar";
import MobileHeader from "@/app/dashboard/MobileHeader";
import BottomTabBar from "@/app/dashboard/BottomTabBar";

export default function DemoDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SchoolProvider basePath="/demo/dashboard" isDemo={true}>
      <div className="flex h-[100dvh] overflow-hidden bg-background">
        <div className="hidden md:flex">
          <DashboardSidebar />
        </div>

        <main className="flex flex-1 flex-col overflow-hidden">
          <MobileHeader />
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-6xl px-4 py-4 md:px-8 md:py-8">
              {children}
            </div>
          </div>

          <BottomTabBar />
        </main>
      </div>
    </SchoolProvider>
  );
}
