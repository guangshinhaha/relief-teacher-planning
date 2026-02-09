import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-card-border/50 bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <img
              src="/stand-in-logo.svg"
              alt="ReliefCher"
              className="h-10 w-auto"
            />
            <span className="font-display text-xl font-bold tracking-tight text-foreground">
              ReliefCher
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-lg px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground"
            >
              Dashboard
            </Link>
            <Link
              href="/report"
              className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-accent-dark hover:shadow-md"
            >
              Report Sick
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-accent/[0.04] blur-3xl" />
        </div>
        <div className="mx-auto max-w-5xl px-6 pb-12 pt-12 text-center sm:pb-20 sm:pt-28">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent-light px-4 py-1.5">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
            <span className="text-sm font-medium text-accent-dark">
              Relief planning, simplified
            </span>
          </div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Stop scrambling.
            <br />
            <span className="text-accent">Start standing in.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted sm:text-xl">
            When a teacher calls in sick, every minute counts. ReliefCher replaces
            the morning chaos of WhatsApp messages and manual tracking with a
            simple, real-time system.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/report"
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-8 py-4 text-lg font-semibold text-white shadow-md transition-all hover:bg-accent-dark hover:shadow-lg"
            >
              Report Sick Leave
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                />
              </svg>
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl border border-card-border bg-card px-8 py-4 text-lg font-semibold text-foreground shadow-sm transition-all hover:border-accent/30 hover:shadow-md"
            >
              Open Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="border-t border-card-border/50 bg-card/50">
        <div className="mx-auto max-w-5xl px-6 py-10 md:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              The morning rush shouldn&apos;t be this stressful
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted">
              It&apos;s 6:30 AM. A teacher messages the group chat: &ldquo;Not
              feeling well, can&apos;t come in today.&rdquo; What follows is 45
              minutes of frantic coordination.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {[
              {
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
                  />
                ),
                title: "WhatsApp chaos",
                desc: "Messages flying in a group chat. Who saw it? Who\u2019s responding? Who\u2019s free period 3?",
              },
              {
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                  />
                ),
                title: "Manual tracking",
                desc: "Paper forms, spreadsheets, sticky notes. No single source of truth for who\u2019s covering whom.",
              },
              {
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                ),
                title: "Coverage gaps",
                desc: "Classes left uncovered because no one realised a period was missed until the bell rang.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-card-border bg-card p-6 shadow-sm"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-danger-light">
                  <svg
                    className="h-5 w-5 text-danger"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    {item.icon}
                  </svg>
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-card-border/50">
        <div className="mx-auto max-w-5xl px-6 py-10 md:py-20">
          <div className="text-center">
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Three steps. Zero stress.
            </h2>
            <p className="mt-4 text-lg text-muted">
              From sick report to full coverage in minutes, not hours.
            </p>
          </div>
          <div className="mt-14 grid gap-8 sm:grid-cols-3">
            {[
              {
                step: "1",
                title: "Teacher reports sick",
                desc: "A simple form \u2014 no login required. Pick your name, select the dates, done. Takes 30 seconds.",
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                  />
                ),
              },
              {
                step: "2",
                title: "Uncovered periods appear",
                desc: "The dashboard automatically shows every affected class and period from the timetable. Nothing slips through.",
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                  />
                ),
              },
              {
                step: "3",
                title: "KP assigns relief",
                desc: "See who\u2019s available, click to assign. The system knows who\u2019s free and who\u2019s already covering another class.",
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                ),
              },
            ].map((item) => (
              <div key={item.step} className="relative text-center">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-light">
                  <svg
                    className="h-7 w-7 text-accent"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    {item.icon}
                  </svg>
                </div>
                <div className="mb-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
                  {item.step}
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Getting Started */}
      <section className="border-t border-card-border/50 bg-card/50">
        <div className="mx-auto max-w-5xl px-6 py-10 md:py-20">
          <div className="text-center">
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Up and running in minutes
            </h2>
            <p className="mt-4 text-lg text-muted">
              Already using aSc Timetables? Import your entire school timetable
              with one file upload.
            </p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                step: "1",
                title: "Export from aSc Timetables",
                desc: "In aSc Timetables, go to File \u2192 Export \u2192 XML and save the .xml file.",
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
                  />
                ),
              },
              {
                step: "2",
                title: "Upload in Settings",
                desc: "Open Dashboard \u2192 Settings \u2192 Import Timetable and upload your XML file.",
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z"
                  />
                ),
              },
              {
                step: "3",
                title: "Auto-generated data",
                desc: "Teachers, periods, classes, and the full timetable are created automatically from your XML.",
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"
                  />
                ),
              },
              {
                step: "4",
                title: "Ready to go",
                desc: "Teachers can report sick and the KP can assign relief \u2014 all powered by your real timetable.",
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                ),
              },
            ].map((item) => (
              <div key={item.step} className="relative text-center">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-light">
                  <svg
                    className="h-7 w-7 text-accent"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    {item.icon}
                  </svg>
                </div>
                <div className="mb-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
                  {item.step}
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-card-border/50">
        <div className="mx-auto max-w-5xl px-6 py-10 md:py-20">
          <div className="text-center">
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Built for how schools actually work
            </h2>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "aSc Timetable import",
                desc: "Upload your aSc Timetables XML export and automatically generate all teachers, periods, and timetable entries. No manual data entry.",
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
                  />
                ),
              },
              {
                title: "One-click sick reporting",
                desc: "Teachers select their name and dates \u2014 no accounts, no passwords, no friction. The form takes 30 seconds flat.",
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672ZM12 2.25V4.5m5.834.166-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243-1.59-1.59"
                  />
                ),
              },
              {
                title: "Smart availability",
                desc: "Automatically knows which teachers are free based on their timetable. No more guessing or checking spreadsheets.",
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"
                  />
                ),
              },
              {
                title: "Odd/even week rotation",
                desc: "Schools with alternating timetables can upload separate schedules for odd and even weeks. ReliefCher handles both seamlessly.",
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 0 0-3.7-3.7 48.678 48.678 0 0 0-7.324 0 4.006 4.006 0 0 0-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 0 0 3.7 3.7 48.656 48.656 0 0 0 7.324 0 4.006 4.006 0 0 0 3.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3-3 3"
                  />
                ),
              },
              {
                title: "Real-time dashboard",
                desc: "One screen shows everything: who\u2019s absent, which periods need coverage, and who\u2019s been assigned. Clarity at a glance.",
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"
                  />
                ),
              },
              {
                title: "Mobile friendly",
                desc: "Works on any device. Teachers can report sick from their phone, and KPs can manage relief on the go.",
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"
                  />
                ),
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-card-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-accent-light">
                  <svg
                    className="h-5 w-5 text-accent"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    {item.icon}
                  </svg>
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-card-border/50">
        <div className="mx-auto max-w-5xl px-6 py-10 text-center md:py-20">
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Ready to simplify relief planning?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted">
            Import your aSc Timetable, and you&apos;re ready to go. No setup
            fees, no complicated onboarding.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/report"
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-8 py-4 text-lg font-semibold text-white shadow-md transition-all hover:bg-accent-dark hover:shadow-lg"
            >
              Report Sick Leave
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                />
              </svg>
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl border border-card-border bg-card px-8 py-4 text-lg font-semibold text-foreground shadow-sm transition-all hover:border-accent/30 hover:shadow-md"
            >
              KP Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-card-border/50 bg-card/50">
        <div className="mx-auto max-w-5xl px-6 py-8 text-center">
          <p className="text-sm text-muted">
            ReliefCher — Relief teacher planning for schools
          </p>
        </div>
      </footer>
    </div>
  );
}
