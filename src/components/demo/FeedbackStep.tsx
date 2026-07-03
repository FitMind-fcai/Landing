"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Star, Check } from "lucide-react";
import { useLang } from "@/lib/lang-context";
import { ts } from "@/lib/translations";

export interface ModelEvaluation {
  chosenModelId: string;
  chosenModelLabel: string;
  allModelIds: string[];
}

export default function FeedbackStep({
  onSubmit,
  submitting,
  submitted,
  error,
  modelEval,
}: {
  onSubmit: (data: {
    rating: number;
    foundPlanHelpful: boolean | null;
    comments: string;
    planClarity: number;
    planPersonalization: number;
    wouldFollowPlan: boolean | null;
  }) => void;
  submitting: boolean;
  submitted: boolean;
  error?: string | null;
  modelEval?: ModelEvaluation;
}) {
  const { lang } = useLang();
  const [rating, setRating] = useState(0);
  const [helpful, setHelpful] = useState<boolean | null>(null);
  const [comments, setComments] = useState("");
  const [clarity, setClarity] = useState(0);
  const [personalization, setPersonalization] = useState(0);
  const [wouldFollow, setWouldFollow] = useState<boolean | null>(null);

  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-background">
          <Check size={26} />
        </span>
        <h1 className="font-display text-2xl font-extrabold">{ts(lang, "fbThanks")}</h1>
        <p className="max-w-sm text-sm text-muted">{ts(lang, "fbThanksSub")}</p>
        {modelEval && (
          <p className="mt-2 text-xs text-muted">
            {ts(lang, "fbPicked")}{" "}
            <span className="font-semibold text-brand">{modelEval.chosenModelLabel}</span>.{" "}
            {ts(lang, "fbReveal")}
          </p>
        )}
        <Link href="/" className="mt-2 text-sm font-semibold text-brand hover:underline">
          {ts(lang, "fbHome")}
        </Link>
      </div>
    );
  }

  const isValid = rating > 0 && clarity > 0 && personalization > 0;

  return (
    <div className="flex min-h-screen flex-col bg-background px-4 sm:px-6 py-12">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
        <h1 className="font-display text-xl sm:text-2xl font-extrabold">{ts(lang, "fbTitle")}</h1>
        <p className="mt-2 text-sm text-muted">{ts(lang, "fbSub")}</p>

        <p className="mt-8 text-sm font-semibold">{ts(lang, "fbOverall")}</p>
        <div className="mt-2 flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => setRating(n)} aria-label={`${n} stars`}>
              <Star size={32} className={n <= rating ? "fill-brand text-brand" : "text-border"} />
            </button>
          ))}
        </div>

        <p className="mt-8 text-sm font-semibold">{ts(lang, "fbClarity")}</p>
        <div className="mt-2 flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setClarity(n)}
              className={`flex h-10 w-10 items-center justify-center rounded-xl border text-sm font-bold transition-colors ${
                clarity === n
                  ? "border-brand bg-brand/10 text-brand"
                  : "border-border bg-surface hover:border-brand/40"
              }`}
            >
              {n}
            </button>
          ))}
        </div>

        <p className="mt-6 text-sm font-semibold">{ts(lang, "fbPersonalization")}</p>
        <div className="mt-2 flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setPersonalization(n)}
              className={`flex h-10 w-10 items-center justify-center rounded-xl border text-sm font-bold transition-colors ${
                personalization === n
                  ? "border-brand bg-brand/10 text-brand"
                  : "border-border bg-surface hover:border-brand/40"
              }`}
            >
              {n}
            </button>
          ))}
        </div>

        <p className="mt-6 text-sm font-semibold">{ts(lang, "fbWouldFollow")}</p>
        <div className="mt-2 flex gap-3">
          {[
            { label: ts(lang, "fbYes"), value: true },
            { label: ts(lang, "fbNo"), value: false },
          ].map((opt) => (
            <button
              key={opt.label}
              onClick={() => setWouldFollow(opt.value)}
              className={`flex-1 rounded-2xl border py-3 font-medium transition-colors ${
                wouldFollow === opt.value
                  ? "border-brand bg-brand/10"
                  : "border-border bg-surface hover:border-brand/40"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <p className="mt-8 text-sm font-semibold">{ts(lang, "fbPersonalized")}</p>
        <div className="mt-3 flex gap-3">
          {[
            { label: ts(lang, "fbYes"), value: true },
            { label: ts(lang, "fbNo"), value: false },
          ].map((opt) => (
            <button
              key={opt.label}
              onClick={() => setHelpful(opt.value)}
              className={`flex-1 rounded-2xl border py-3 font-medium transition-colors ${
                helpful === opt.value
                  ? "border-brand bg-brand/10"
                  : "border-border bg-surface hover:border-brand/40"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <p className="mt-8 text-sm font-semibold">{ts(lang, "fbAnything")}</p>
        <textarea
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          rows={3}
          placeholder={ts(lang, "fbPlaceholder")}
          className="mt-3 rounded-xl border border-border bg-surface p-4 text-sm outline-none focus:border-brand/60"
        />

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() =>
            onSubmit({
              rating,
              foundPlanHelpful: helpful,
              comments,
              planClarity: clarity,
              planPersonalization: personalization,
              wouldFollowPlan: wouldFollow,
            })
          }
          disabled={!isValid || submitting}
          className="mt-10 rounded-full bg-brand py-4 font-semibold text-background disabled:opacity-40"
        >
          {submitting ? ts(lang, "fbSending") : ts(lang, "fbSubmit")}
        </motion.button>

        {error && <p className="mt-3 text-center text-sm text-red-400">{error}</p>}
      </div>
    </div>
  );
}
