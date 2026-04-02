"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type School = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  teacherCount: number;
  userCount: number;
  sickReportCount: number;
};

type User = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  schoolName: string | null;
  schoolId: string | null;
  onboardingComplete: boolean;
  createdAt: string;
};

export default function AdminDashboard({
  initialSchools,
  initialUsers,
}: {
  initialSchools: School[];
  initialUsers: User[];
}) {
  const router = useRouter();
  const [schools, setSchools] = useState(initialSchools);
  const [users, setUsers] = useState(initialUsers);

  // Create school form
  const [schoolName, setSchoolName] = useState("");
  const [schoolSlug, setSchoolSlug] = useState("");
  const [schoolLoading, setSchoolLoading] = useState(false);
  const [schoolError, setSchoolError] = useState("");

  // Create user form
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [userSchoolId, setUserSchoolId] = useState("");
  const [userRole, setUserRole] = useState<"SCHOOL_ADMIN" | "TEACHER">("SCHOOL_ADMIN");
  const [userLoading, setUserLoading] = useState(false);
  const [userError, setUserError] = useState("");

  async function handleCreateSchool(e: React.FormEvent) {
    e.preventDefault();
    setSchoolError("");
    setSchoolLoading(true);

    try {
      const res = await fetch("/api/admin/schools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: schoolName, slug: schoolSlug }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create school");
      }

      setSchoolName("");
      setSchoolSlug("");
      router.refresh();
      // Optimistically update
      const data = await res.json();
      setSchools((prev) => [
        {
          id: data.id,
          name: data.name,
          slug: data.slug,
          createdAt: data.createdAt,
          teacherCount: 0,
          userCount: 0,
          sickReportCount: 0,
        },
        ...prev,
      ]);
    } catch (err) {
      setSchoolError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSchoolLoading(false);
    }
  }

  async function handleDeleteSchool(id: string, name: string) {
    if (!confirm(`Delete "${name}" and all its data? This cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/admin/schools/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete school");
      }
      setSchools((prev) => prev.filter((s) => s.id !== id));
      setUsers((prev) => prev.filter((u) => u.schoolId !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    }
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setUserError("");
    setUserLoading(true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          name: userName || null,
          role: userRole,
          schoolId: userSchoolId || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create user");
      }

      setUserEmail("");
      setUserName("");
      router.refresh();
      const data = await res.json();
      const school = schools.find((s) => s.id === data.schoolId);
      setUsers((prev) => [
        {
          id: data.id,
          email: data.email,
          name: data.name,
          role: data.role,
          schoolName: school?.name ?? null,
          schoolId: data.schoolId,
          onboardingComplete: data.onboardingComplete,
          createdAt: data.createdAt,
        },
        ...prev,
      ]);
    } catch (err) {
      setUserError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setUserLoading(false);
    }
  }

  return (
    <div className="space-y-12">
      {/* Schools section */}
      <section>
        <h2 className="font-display text-lg font-semibold text-foreground mb-4">
          Schools ({schools.length})
        </h2>

        {/* Create school form */}
        <form
          onSubmit={handleCreateSchool}
          className="mb-6 rounded-xl border border-card-border bg-card p-4 shadow-sm"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="block text-xs font-medium text-muted mb-1">School Name</label>
              <input
                type="text"
                required
                value={schoolName}
                onChange={(e) => {
                  setSchoolName(e.target.value);
                  setSchoolSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
                }}
                placeholder="Bukit Timah Primary"
                className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div className="w-40">
              <label className="block text-xs font-medium text-muted mb-1">Slug</label>
              <input
                type="text"
                required
                value={schoolSlug}
                onChange={(e) => setSchoolSlug(e.target.value)}
                placeholder="bukit-timah"
                className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <button
              type="submit"
              disabled={schoolLoading}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark disabled:opacity-50"
            >
              {schoolLoading ? "Creating..." : "Create School"}
            </button>
          </div>
          {schoolError && <p className="mt-2 text-sm text-danger">{schoolError}</p>}
        </form>

        {/* Schools list */}
        <div className="space-y-2">
          {schools.map((school) => (
            <div
              key={school.id}
              className="flex items-center justify-between rounded-xl border border-card-border bg-card px-4 py-3 shadow-sm"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{school.name}</span>
                  <span className="rounded bg-background px-1.5 py-0.5 text-xs text-muted font-mono">
                    /{school.slug}
                  </span>
                  {school.slug === "demo" && (
                    <span className="rounded-full bg-warning-light px-2 py-0.5 text-xs font-medium text-warning">
                      Demo
                    </span>
                  )}
                </div>
                <div className="mt-1 flex gap-4 text-xs text-muted">
                  <span>{school.teacherCount} teachers</span>
                  <span>{school.userCount} users</span>
                  <span>{school.sickReportCount} sick reports</span>
                </div>
              </div>
              {school.slug !== "demo" && (
                <button
                  onClick={() => handleDeleteSchool(school.id, school.name)}
                  className="rounded-lg px-3 py-1.5 text-xs text-danger hover:bg-danger-light transition-colors"
                >
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Users section */}
      <section>
        <h2 className="font-display text-lg font-semibold text-foreground mb-4">
          Users ({users.length})
        </h2>

        {/* Create user form */}
        <form
          onSubmit={handleCreateUser}
          className="mb-6 rounded-xl border border-card-border bg-card p-4 shadow-sm"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="block text-xs font-medium text-muted mb-1">Email</label>
              <input
                type="email"
                required
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="admin@school.edu"
                className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div className="w-36">
              <label className="block text-xs font-medium text-muted mb-1">Name (optional)</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="John Doe"
                className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div className="w-40">
              <label className="block text-xs font-medium text-muted mb-1">School</label>
              <select
                required
                value={userSchoolId}
                onChange={(e) => setUserSchoolId(e.target.value)}
                className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">Select school...</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-36">
              <label className="block text-xs font-medium text-muted mb-1">Role</label>
              <select
                value={userRole}
                onChange={(e) => setUserRole(e.target.value as "SCHOOL_ADMIN" | "TEACHER")}
                className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="SCHOOL_ADMIN">School Admin</option>
                <option value="TEACHER">Teacher</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={userLoading}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark disabled:opacity-50"
            >
              {userLoading ? "Creating..." : "Create User"}
            </button>
          </div>
          {userError && <p className="mt-2 text-sm text-danger">{userError}</p>}
        </form>

        {/* Users list */}
        <div className="space-y-2">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between rounded-xl border border-card-border bg-card px-4 py-3 shadow-sm"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">
                    {user.name || user.email}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      user.role === "SUPERADMIN"
                        ? "bg-accent-light text-accent-dark"
                        : user.role === "SCHOOL_ADMIN"
                        ? "bg-success-light text-success"
                        : "bg-background text-muted"
                    }`}
                  >
                    {user.role.replace("_", " ")}
                  </span>
                  {user.role !== "SUPERADMIN" && !user.onboardingComplete && (
                    <span className="rounded-full bg-warning-light px-2 py-0.5 text-xs font-medium text-warning">
                      Pending onboarding
                    </span>
                  )}
                </div>
                <div className="mt-1 flex gap-4 text-xs text-muted">
                  <span>{user.email}</span>
                  {user.schoolName && <span>{user.schoolName}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
