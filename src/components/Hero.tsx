"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, FlaskConical, Sparkles } from "lucide-react";
import GlowBackground from "./GlowBackground";
import PhoneFrame from "./PhoneFrame";
import CalorieStatsCard from "./CalorieStatsCard";
import { useLang } from "@/lib/lang-context";
import { ts } from "@/lib/translations";

export default function Hero() {
  const { lang } = useLang();
  const headline = ts(lang, "heroHeadline");

  return (
    <section className="relative overflow-hidden pt-36 pb-24 sm:pt-44">
      <GlowBackground />

      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16">
        <div>
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-xs sm:text-sm text-muted"
          >
            <Sparkles size={14} className="text-brand" />
            {ts(lang, "heroBadge")}
          </motion.span>

          <h1 className="font-display mt-6 text-3xl font-extrabold leading-[1.1] sm:text-5xl lg:text-6xl">
            {headline.split(" ").map((word, i) => (
              <motion.span
                key={`${word}-${i}`}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 + i * 0.07 }}
                className={`inline-block ${lang === "ar" ? "ml-3" : "mr-3"} ${
                  (lang === "en" && (word === "AI" || word === "Fitness")) ||
                  (lang === "ar" && (word === "الشخصي" || word === "الاصطناعي"))
                    ? "text-gradient-brand"
                    : ""
                }`}
              >
                {word}
              </motion.span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-6 max-w-md text-base sm:text-lg text-muted"
          >
            {ts(lang, "heroSub")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.65 }}
            className="mt-9 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-4"
          >
            <Link
              href="/demo"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-brand px-7 py-3.5 font-semibold text-background transition-transform hover:scale-105"
            >
              {ts(lang, "heroCta")}
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href="#features"
              className="rounded-full border border-border px-7 py-3.5 text-center font-semibold text-foreground transition-colors hover:border-brand/60"
            >
              {ts(lang, "heroExplore")}
            </a>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.75 }}
            className="mt-4 flex items-start gap-2 max-w-md text-xs sm:text-sm text-muted"
          >
            <FlaskConical size={16} className="mt-0.5 shrink-0 text-brand" />
            <span>{ts(lang, "heroTestingNote")}</span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="mt-10 flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm text-muted"
          >
            <span>{ts(lang, "heroStat1")}</span>
            <span className="h-1 w-1 rounded-full bg-border" />
            <span>{ts(lang, "heroStat2")}</span>
            <span className="hidden sm:inline h-1 w-1 rounded-full bg-border" />
            <span className="hidden sm:inline">{ts(lang, "heroStat3")}</span>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mx-auto w-full max-w-xs sm:max-w-sm lg:max-w-none"
        >
          <PhoneFrame>
            <CalorieStatsCard />
          </PhoneFrame>
        </motion.div>
      </div>
    </section>
  );
}
