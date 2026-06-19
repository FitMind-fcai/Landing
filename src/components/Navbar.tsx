"use client";

import Link from "next/link";
import Image from "next/image";
import { useLang } from "@/lib/lang-context";
import { ts } from "@/lib/translations";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const { lang } = useLang();
  const [open, setOpen] = useState(false);

  const links = [
    { href: "#features", label: ts(lang, "navFeatures") },
    { href: "#how-it-works", label: ts(lang, "navHowItWorks") },
    { href: "#testimonials", label: ts(lang, "navStories") },
  ];

  return (
    <header className="fixed top-4 inset-x-0 z-40 flex justify-center px-4">
      <nav className="flex w-full max-w-2xl items-center justify-between gap-2 sm:gap-4 rounded-full border border-white/10 bg-[#0a0908]/90 px-2.5 py-2 shadow-2xl shadow-black/40 backdrop-blur-md">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-full bg-brand px-3 py-1.5 font-display font-bold text-sm text-background"
        >
          <Image src="/logo.svg" alt="" width={16} height={16} className="h-4 w-4" />
          FitMind
        </Link>

        <div className="hidden items-center gap-6 text-sm text-white/70 md:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="transition-colors hover:text-white">
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <Link
            href="/demo"
            className="hidden rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition-transform hover:scale-105 sm:inline-flex"
          >
            {ts(lang, "navTryCoach")}
          </Link>
          <button
            onClick={() => setOpen(!open)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-white md:hidden"
            aria-label="Menu"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="absolute top-full mt-2 w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0a0908]/95 px-6 py-4 backdrop-blur-md md:hidden">
          <div className="flex flex-col gap-4 text-sm text-white/70">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="transition-colors hover:text-white"
              >
                {l.label}
              </a>
            ))}
            <Link
              href="/demo"
              onClick={() => setOpen(false)}
              className="rounded-full bg-white px-4 py-2.5 text-center text-sm font-semibold text-black"
            >
              {ts(lang, "navTryCoach")}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
