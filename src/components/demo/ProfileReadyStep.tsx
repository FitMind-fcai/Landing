"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { CheckCircle2, Sparkles } from "lucide-react";
import { useLang } from "@/lib/lang-context";
import { ts } from "@/lib/translations";

export default function ProfileReadyStep({
  onGeneratePlan,
}: {
  onGeneratePlan: () => void;
}) {
  const { lang } = useLang();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-5"
      >
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/15 text-brand">
          <CheckCircle2 size={32} />
        </span>
        <h1 className="font-display text-2xl font-extrabold sm:text-3xl">
          {ts(lang, "profileReadyTitle")}
        </h1>
        <p className="max-w-sm text-sm text-muted">
          {ts(lang, "profileReadySub")}
        </p>

        <div className="max-w-sm rounded-2xl border border-border bg-surface/50 p-4 text-start">
          <p className="text-sm font-semibold">{ts(lang, "profileReadyNextTitle")}</p>
          <p className="mt-1.5 text-xs text-muted">{ts(lang, "profileReadyNextBody")}</p>
        </div>

        <div className="mt-4 flex w-full max-w-xs flex-col gap-3">
          <button
            onClick={onGeneratePlan}
            className="flex items-center justify-center gap-2 rounded-full bg-brand py-4 font-semibold text-background transition-transform hover:scale-[1.02]"
          >
            <Sparkles size={16} />
            {ts(lang, "profileReadyCta")}
          </button>
          <Link
            href="/"
            className="rounded-full border border-border py-3.5 text-center font-semibold text-muted transition-colors hover:border-brand/40 hover:text-foreground"
          >
            {ts(lang, "profileReadyLater")}
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
