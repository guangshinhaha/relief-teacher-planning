import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "SUPERADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b border-card-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <img
              src="/stand-in-logo.svg"
              alt="ReliefCher"
              className="h-8 w-auto"
            />
            <span className="rounded-full bg-accent-light px-2.5 py-0.5 text-xs font-semibold text-accent-dark">
              Super Admin
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted">{session.user.email}</span>
            <Link
              href="/"
              className="text-sm text-muted hover:text-foreground"
            >
              Home
            </Link>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-5xl px-6 py-8">
        {children}
      </main>
    </div>
  );
}
