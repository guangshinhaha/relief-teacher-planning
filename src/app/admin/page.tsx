import { prisma } from "@/lib/prisma";
import AdminDashboard from "./AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const schools = await prisma.school.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          teachers: true,
          users: true,
          sickReports: true,
        },
      },
    },
  });

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { school: true },
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
          Schools & Users
        </h1>
        <p className="mt-1 text-sm text-muted">
          Manage schools and their administrators.
        </p>
      </div>

      <AdminDashboard
        initialSchools={schools.map((s) => ({
          id: s.id,
          name: s.name,
          slug: s.slug,
          createdAt: s.createdAt.toISOString(),
          teacherCount: s._count.teachers,
          userCount: s._count.users,
          sickReportCount: s._count.sickReports,
        }))}
        initialUsers={users.map((u) => ({
          id: u.id,
          email: u.email,
          name: u.name,
          role: u.role,
          schoolName: u.school?.name ?? null,
          schoolId: u.schoolId,
          onboardingComplete: u.onboardingComplete,
          createdAt: u.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
