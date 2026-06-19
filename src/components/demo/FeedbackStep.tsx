"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Star, Check } from "lucide-react";

export interface ModelEvaluation {
  chosenModelId: string;
  chosenModelLabel: string;
  allModelIds: string[];
}

export default function FeedbackStep({
  onSubmit,
  submitting,
  submitted,
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
  modelEval?: ModelEvaluation;
}) {
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
        <h1 className="font-display text-2xl font-extrabold">Thank you!</h1>
        <p className="max-w-sm text-sm text-muted">
          Your feedback helps us pick the best AI model and make FitMind&apos;s plans more
          accurate for everyone.
        </p>
        {modelEval && (
          <p className="mt-2 text-xs text-muted">
            You picked <span className="font-semibold text-brand">{modelEval.chosenModelLabel}</span>.
            We&apos;ll reveal which model won overall once we have enough votes!
          </p>
        )}
        <Link href="/" className="mt-2 text-sm font-semibold text-brand hover:underline">
          Back to home
        </Link>
      </div>
    );
  }

  const isValid = rating > 0 && (modelEval ? clarity > 0 && personalization > 0 : true);

  return (
    <div className="flex min-h-screen flex-col bg-background px-6 py-12">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
        <h1 className="font-display text-2xl font-extrabold">Rate your plan</h1>
        <p className="mt-2 text-sm text-muted">
          Be honest — this directly shapes which AI model powers FitMind.
        </p>

        {/* Overall rating */}
        <p className="mt-8 text-sm font-semibold">Overall quality</p>
        <div className="mt-2 flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => setRating(n)} aria-label={`${n} stars`}>
              <Star size={32} className={n <= rating ? "fill-brand text-brand" : "text-border"} />
            </button>
          ))}
        </div>

        {/* Model-specific evaluation questions */}
        {modelEval && (
          <>
            <p className="mt-8 text-sm font-semibold">
              How clear and readable was the plan?
            </p>
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

            <p className="mt-6 text-sm font-semibold">
              How personalized did it feel to your profile?
            </p>
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

            <p className="mt-6 text-sm font-semibold">Would you actually follow this plan?</p>
            <div className="mt-2 flex gap-3">
              {[
                { label: "Yes", value: true },
                { label: "Not really", value: false },
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
          </>
        )}

        <p className="mt-8 text-sm font-semibold">Did this feel personalized to you?</p>
        <div className="mt-3 flex gap-3">
          {[
            { label: "Yes", value: true },
            { label: "Not really", value: false },
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

        <p className="mt-8 text-sm font-semibold">Anything else? (optional)</p>
        <textarea
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          rows={3}
          placeholder="What felt off, or what you loved..."
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
          {submitting ? "Sending..." : "Submit feedback"}
        </motion.button>
      </div>
    </div>
  );
}
