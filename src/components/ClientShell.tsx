"use client";

import { ReactNode } from "react";
import { LangProvider } from "@/lib/lang-context";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function ClientShell({ children }: { children: ReactNode }) {
  return (
    <LangProvider>
      {children}
    </LangProvider>
  );
}
