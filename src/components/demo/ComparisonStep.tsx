"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import type { WorkoutDraftResponse, NutritionDraftResponse } from "@/lib/api";
import { useLang } from "@/lib/lang-context";
import { ta, ts } from "@/lib/translations";

export interface ModelDraft {
  label: string;
  modelId: string;
  workoutDraft: WorkoutDraftResponse | null;
  nutritionDraft: NutritionDraftResponse | null;
  error: string | null;
}

/* eslint-disable @typescript-eslint/no-explicit-any */

function WorkoutDraftPreview({ draft }: { draft: WorkoutDraftResponse }) {
  const { lang } = useLang();
  const plan = draft.draft_plan;
  return (
    <div className="space-y-3">
      <h4 className="font-display text-lg font-bold">{plan.plan_name}</h4>
      {plan.description && <p className="text-sm text-muted">{plan.description}</p>}
      {plan.frequency && (
        <p className="text-xs text-muted">
          <span className="font-medium">{ts(lang, "compFrequency")}</span> {plan.frequency}
        </p>
      )}
      <div className="space-y-3">
        {(plan.workout_days ?? []).map((day: any, i: number) => (
          <div key={i} className="rounded-xl border border-border bg-surface/50 p-3">
            <p className="text-sm font-semibold">
              {day.day_name}
              {day.focus_area && (
                <span className="ml-2 text-xs text-muted">({day.focus_area})</span>
              )}
            </p>
            {day.notes && <p className="mt-1 text-xs italic text-muted">{day.notes}</p>}
            <ul className="mt-2 space-y-1 text-xs text-muted">
              {(day.exercises ?? []).map((ex: any, j: number) => (
                <li key={j} className="flex items-start gap-1">
                  <span className="mt-0.5 text-brand">&#8226;</span>
                  <span>
                    <span className="font-medium text-foreground">{ex.exercise_name}</span>
                    {ex.sets && ex.reps ? ` — ${ex.sets}x${ex.reps}` : ""}
                    {ex.duration_seconds ? ` — ${ex.duration_seconds}s` : ""}
                    {ex.rest_seconds ? ` (${ts(lang, "exRest").toLowerCase()} ${ex.rest_seconds}s)` : ""}
                    {ex.instructions && (
                      <span className="block mt-0.5 text-muted">{ex.instructions}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function NutritionDraftPreview({ draft }: { draft: NutritionDraftResponse }) {
  const { lang } = useLang();
  const plan = draft.draft_plan;
  return (
    <div className="space-y-3">
      <h4 className="font-display text-lg font-bold">{plan.plan_name}</h4>
      {plan.description && <p className="text-sm text-muted">{plan.description}</p>}
      <div className="grid grid-cols-4 gap-2 text-center text-xs">
        <div className="rounded-lg bg-surface/50 p-2">
          <span className="block text-base font-bold">{Math.round(plan.daily_calories)}</span>
          kcal
        </div>
        <div className="rounded-lg bg-surface/50 p-2">
          <span className="block text-base font-bold">{Math.round(plan.daily_protein_g)}g</span>
          {ts(lang, "statProtein").toLowerCase()}
        </div>
        <div className="rounded-lg bg-surface/50 p-2">
          <span className="block text-base font-bold">{Math.round(plan.daily_carbs_g)}g</span>
          {ts(lang, "statCarbs").toLowerCase()}
        </div>
        <div className="rounded-lg bg-surface/50 p-2">
          <span className="block text-base font-bold">{Math.round(plan.daily_fats_g)}g</span>
          {ts(lang, "statFats").toLowerCase()}
        </div>
      </div>
      <div className="space-y-3">
        {(plan.days ?? []).map((day: any, i: number) => (
          <div key={i} className="rounded-xl border border-border bg-surface/50 p-3">
            <p className="text-sm font-semibold">{day.day_name}</p>
            {day.notes && <p className="mt-1 text-xs italic text-muted">{day.notes}</p>}
            <div className="mt-2 space-y-2">
              {(day.meals ?? []).map((meal: any, j: number) => (
                <div key={j} className="rounded-lg border border-border/50 bg-background/50 p-2">
                  <p className="text-xs font-semibold">
                    <span className="text-brand">{meal.meal_type}</span>
                    <span className="mx-1">—</span>
                    {meal.meal_name}
                  </p>
                  {meal.instructions && (
                    <p className="mt-1 text-xs text-muted">{meal.instructions}</p>
                  )}
                  {meal.ingredients && meal.ingredients.length > 0 && (
                    <p className="mt-1 text-xs text-muted">
                      {meal.ingredients.length} ingredient{meal.ingredients.length > 1 ? "s" : ""}
                      {meal.prep_time_minutes ? ` · ${meal.prep_time_minutes} min prep` : ""}
                      {meal.cook_time_minutes ? ` · ${meal.cook_time_minutes} min cook` : ""}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* eslint-enable @typescript-eslint/no-explicit-any */

export default function ComparisonStep({
  drafts,
  onSelect,
}: {
  drafts: ModelDraft[];
  onSelect: (index: number) => void;
}) {
  const { lang } = useLang();
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-[90rem]">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-center text-xl sm:text-2xl font-extrabold">
            {ts(lang, "compTitle")}
          </h1>
          <p className="mx-auto mt-2 max-w-md text-center text-sm text-muted">
            {ts(lang, "compSub")}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mx-auto mt-6 max-w-2xl rounded-2xl border border-border bg-surface/50 p-4 sm:p-5"
        >
          <p className="text-sm font-semibold">{ts(lang, "compHowTitle")}</p>
          <ul className="mt-2 space-y-1.5 text-xs sm:text-sm text-muted">
            {ta(lang, "compHowPoints").map((point, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-0.5 text-brand">&#8226;</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        <div className="mt-8 grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {drafts.map((draft, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => !draft.error && setSelected(i)}
              disabled={!!draft.error}
              className={`relative flex flex-col rounded-2xl border-2 p-6 text-left transition-all ${
                draft.error
                  ? "cursor-not-allowed border-border opacity-50"
                  : selected === i
                    ? "border-brand bg-brand/5 shadow-lg shadow-brand/10"
                    : "border-border bg-surface hover:border-brand/40"
              }`}
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="rounded-full bg-brand/10 px-3 py-1 text-sm font-bold text-brand">
                  {draft.label}
                </span>
                {selected === i && (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-background">
                    <Check size={14} />
                  </span>
                )}
              </div>

              {draft.error ? (
                <p className="text-sm text-red-400">{ts(lang, "compFailed")} {draft.error}</p>
              ) : (
                <div className="space-y-5 overflow-y-auto max-h-[75vh] pr-1">
                  {draft.workoutDraft && <WorkoutDraftPreview draft={draft.workoutDraft} />}
                  {draft.nutritionDraft && <NutritionDraftPreview draft={draft.nutritionDraft} />}
                </div>
              )}
            </motion.button>
          ))}
        </div>

        {selected !== null && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="sticky bottom-6 mt-8 flex justify-center"
          >
            <button
              onClick={() => onSelect(selected)}
              className="flex items-center gap-2 rounded-full bg-brand px-8 py-3.5 font-semibold text-background shadow-lg transition-transform hover:scale-[1.02]"
            >
              {ts(lang, "compUse")} {drafts[selected].label} {ts(lang, "compPlan")}
              <ArrowRight size={16} />
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
