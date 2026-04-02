"use client";

import { createContext, useContext } from "react";

type SchoolContextValue = {
  /** Base path prefix: "/dashboard" for auth, "/demo/dashboard" for demo */
  basePath: string;
  /** Whether this is the demo mode */
  isDemo: boolean;
};

const SchoolContext = createContext<SchoolContextValue>({
  basePath: "/dashboard",
  isDemo: false,
});

export function SchoolProvider({
  children,
  basePath,
  isDemo,
}: {
  children: React.ReactNode;
  basePath: string;
  isDemo: boolean;
}) {
  return (
    <SchoolContext.Provider value={{ basePath, isDemo }}>
      {children}
    </SchoolContext.Provider>
  );
}

export function useSchool() {
  return useContext(SchoolContext);
}
