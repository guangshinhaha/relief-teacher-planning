import DashboardSidebar from "./DashboardSidebar";
import MobileHeader from "./MobileHeader";
import BottomTabBar from "./BottomTabBar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-[100dvh] overflow-hidden bg-background">
      {/* Desktop sidebar — hidden on mobile */}
      <div className="hidden md:flex">
        <DashboardSidebar />
      </div>

      {/* Main content */}
      <main className="flex flex-1 flex-col overflow-hidden">
        <MobileHeader />
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl px-4 py-4 md:px-8 md:py-8">
            {children}
          </div>
        </div>

        {/* Bottom tab bar — mobile only */}
        <BottomTabBar />
      </main>
    </div>
  );
}
