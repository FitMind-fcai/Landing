"use client";

import { ReactNode } from "react";
import { LangProvider } from "@/lib/lang-context";
import { ThemeProvider } from "@/lib/theme-context";

export default function ClientShell({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <LangProvider>
        {children}
      </LangProvider>
    </ThemeProvider>
  );
}
