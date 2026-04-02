import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import OnboardingWizard from "./OnboardingWizard";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "SCHOOL_ADMIN") {
    redirect("/dashboard");
  }

  if (session.user.onboardingComplete) {
    redirect("/dashboard");
  }

  const schoolName = session.user.school?.name ?? "Your School";

  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-4 py-12">
      <div className="mb-8 text-center">
        <img
          src="/stand-in-logo.svg"
          alt="ReliefCher"
          className="mx-auto h-10 w-auto mb-4"
        />
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
          Welcome to ReliefCher
        </h1>
        <p className="mt-2 text-muted">
          Let&apos;s set up <strong className="text-foreground">{schoolName}</strong> in a few steps.
        </p>
      </div>

      <OnboardingWizard schoolName={schoolName} />
    </div>
  );
}
