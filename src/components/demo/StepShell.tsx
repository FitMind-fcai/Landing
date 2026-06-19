"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { ReactNode } from "react";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function StepShell({
  stepKey,
  stepNumber,
  totalSteps,
  title,
  onBack,
  children,
  footer,
}: {
  stepKey: string;
  stepNumber: number;
  totalSteps: number;
  title: string;
  onBack?: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background px-4 sm:px-6 py-8">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
        <div className="flex items-center justify-between">
          {onBack ? (
            <button
              onClick={onBack}
              aria-label="Back"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-foreground transition-colors hover:bg-surface-2"
            >
              <ChevronLeft size={18} />
            </button>
          ) : (
            <span className="h-9 w-9" />
          )}
          <LanguageSwitcher />
          <span className="rounded-full bg-brand/15 px-3 py-1 text-xs font-semibold text-brand">
            {stepNumber} / {totalSteps}
          </span>
        </div>

        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface">
          <motion.div
            className="h-full rounded-full bg-brand"
            initial={false}
            animate={{ width: `${(stepNumber / totalSteps) * 100}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={stepKey}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25 }}
            className="flex flex-1 flex-col"
          >
            <h1 className="font-display mt-8 text-2xl font-extrabold leading-tight sm:text-3xl">
              {title}
            </h1>
            <div className="mt-8 flex-1">{children}</div>
          </motion.div>
        </AnimatePresence>

        {footer && <div className="mt-8">{footer}</div>}
      </div>
    </div>
  );
}
