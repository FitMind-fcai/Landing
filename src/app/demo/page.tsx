"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ApiError,
  BENCHMARK_MODELS,
  buildNutritionGenerationPayload,
  buildProfilePayload,
  buildWorkoutGenerationPayload,
  createProfile,
  FullNutritionPlan,
  FullWorkoutPlan,
  generateNutrition,
  generateWorkout,
  getActivePlans,
  getMe,
  getMyProfile,
  login,
  resendVerification,
  saveNutrition,
  saveWorkout,
  signup,
} from "@/lib/api";
import { PlanPreferences, ProfileAnswers } from "@/lib/types";
import { profileSteps, planSteps, Step } from "@/components/demo/steps";
import StepShell from "@/components/demo/StepShell";
import ContinueButton from "@/components/demo/ContinueButton";
import AssessmentStep from "@/components/demo/AssessmentStep";
import TrainingSetupStep from "@/components/demo/TrainingSetupStep";
import AccountStep from "@/components/demo/AccountStep";
import VerifyStep from "@/components/demo/VerifyStep";
import GeneratingStep from "@/components/demo/GeneratingStep";
import ProfileReadyStep from "@/components/demo/ProfileReadyStep";
import PlanTypeChoiceStep from "@/components/demo/PlanTypeChoiceStep";
import ResultsStep from "@/components/demo/ResultsStep";
import FeedbackStep, { ModelEvaluation } from "@/components/demo/FeedbackStep";
import ComparisonStep, { ModelDraft } from "@/components/demo/ComparisonStep";

type Phase =
  | "profile"
  | "account"
  | "verify"
  | "creatingProfile"
  | "profileReady"
  | "planTypeChoice"
  | "planPrefs"
  | "generatingPlans"
  | "comparing"
  | "savingChosen"
  | "results"
  | "feedback";

type PlanTypeChoice = "workout" | "nutrition" | "both" | "";

const defaultProfileAnswers: Partial<ProfileAnswers> = {
  weightKg: 70,
  heightCm: 170,
  age: 25,
  fitnessLevel: 3,
  physicalLimitations: [],
  allergies: [],
  supplements: [],
};

const defaultPlanAnswers: Partial<PlanPreferences> = {
  durationWeeks: 4,
  daysPerWeek: 3,
  sessionDurationMinutes: 45,
  mealsPerDay: 4,
  excludeIngredients: [],
};

const PROFILE_TOTAL_STEPS = profileSteps.length + 1;
const PLAN_TOTAL_STEPS = planSteps.length + 1;

function nextValidIndex(steps: Step[], from: number, dir: 1 | -1, answers: Record<string, unknown>) {
  let i = from + dir;
  while (i >= 0 && i < steps.length && steps[i].skipIf?.(answers)) i += dir;
  return i;
}

const SESSION_KEY = "fitmind_demo";

function loadSession() {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(data: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  try {
    const existing = loadSession() || {};
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ ...existing, ...data }));
  } catch { /* quota exceeded — non-fatal */ }
}

function resumePhase(saved: Record<string, unknown> | null): Phase {
  if (!saved?.token) return "account";
  if (!saved.profileCreated) return "profile";
  return "profileReady";
}

export default function DemoPage() {
  const [restored] = useState(() => loadSession());
  const [phase, setPhase] = useState<Phase>(() => resumePhase(restored));

  const [profileIndex, setProfileIndex] = useState(0);
  const [profileAnswers, setProfileAnswers] = useState<Partial<ProfileAnswers>>(
    () => (restored?.profileAnswers as Partial<ProfileAnswers>) || defaultProfileAnswers
  );

  const [planTypeChoice, setPlanTypeChoice] = useState<PlanTypeChoice>("");
  const [planIndex, setPlanIndex] = useState(0);
  const [planAnswers, setPlanAnswers] = useState<Partial<PlanPreferences>>(defaultPlanAnswers);

  const [email, setEmail] = useState(() => (restored?.email as string) || "");
  const [password, setPassword] = useState(() => (restored?.password as string) || "");
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);

  const [verifyLoading, setVerifyLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const [token, setToken] = useState<string | null>(() => (restored?.token as string) || null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

  // Validate restored token on mount — if expired, try re-login; then check user state
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        await getMe(token);
        await checkUserStateAndResume(token);
      } catch {
        if (email && password) {
          try {
            const { token: fresh } = await login(email, password);
            setToken(fresh);
            persistAuth(fresh, email, password);
            await checkUserStateAndResume(fresh);
            return;
          } catch { /* re-login failed */ }
        }
        setToken(null);
        setPhase("account");
        sessionStorage.removeItem(SESSION_KEY);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const persistAuth = useCallback((t: string, e: string, p: string) => {
    saveSession({ token: t, email: e, password: p });
  }, []);

  const persistProfileDone = useCallback(() => {
    saveSession({ profileCreated: true, profileAnswers });
  }, [profileAnswers]);

  // Benchmark: 3 model drafts
  const [modelDrafts, setModelDrafts] = useState<ModelDraft[]>([]);
  const [chosenModelIndex, setChosenModelIndex] = useState<number | null>(null);

  const [workoutFull, setWorkoutFull] = useState<FullWorkoutPlan | null>(null);
  const [nutritionFull, setNutritionFull] = useState<FullNutritionPlan | null>(null);

  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const currentProfileStep = profileSteps[profileIndex];
  const currentPlanStep = planSteps[planIndex];

  function setProfileAnswer<K extends keyof ProfileAnswers>(key: K, value: ProfileAnswers[K]) {
    setProfileAnswers((prev) => ({ ...prev, [key]: value }));
  }

  function setPlanAnswer<K extends keyof PlanPreferences>(key: K, value: PlanPreferences[K]) {
    setPlanAnswers((prev) => ({ ...prev, [key]: value }));
  }

  function isProfileStepValid(): boolean {
    const value = (profileAnswers as Record<string, unknown>)[currentProfileStep.key];
    if (currentProfileStep.kind === "cards") return typeof value === "string" && value.length > 0;
    return true;
  }

  function isPlanStepValid(): boolean {
    if (currentPlanStep.kind === "training-setup") {
      return Boolean(planAnswers.workoutLocation && planAnswers.equipmentAvailability);
    }
    const value = (planAnswers as Record<string, unknown>)[currentPlanStep.key];
    if (currentPlanStep.kind === "cards") return typeof value === "string" && value.length > 0;
    return true;
  }

  function goProfileNext() {
    const next = nextValidIndex(profileSteps, profileIndex, 1, profileAnswers as Record<string, unknown>);
    if (next < profileSteps.length) setProfileIndex(next);
    else if (token) runProfileCreation(token);
  }

  function goProfileBack() {
    const prev = nextValidIndex(profileSteps, profileIndex, -1, profileAnswers as Record<string, unknown>);
    if (prev >= 0) setProfileIndex(prev);
  }

  function goPlanNext() {
    const next = nextValidIndex(planSteps, planIndex, 1, planAnswers as Record<string, unknown>);
    if (next < planSteps.length) setPlanIndex(next);
    else runBenchmarkGeneration();
  }

  function goPlanBack() {
    const prev = nextValidIndex(planSteps, planIndex, -1, planAnswers as Record<string, unknown>);
    if (prev >= 0) setPlanIndex(prev);
  }

  async function runProfileCreation(userToken: string) {
    setProfileError(null);
    setPhase("creatingProfile");
    try {
      const me = await getMe(userToken);
      await createProfile(userToken, buildProfilePayload(profileAnswers as ProfileAnswers, me.id));
      persistProfileDone();
      setPhase("profileReady");
    } catch (err) {
      setProfileError(
        err instanceof ApiError ? err.message : "Couldn't create your profile. Please try again."
      );
    }
  }

  async function runBenchmarkGeneration() {
    if (!token) return;
    setGenError(null);
    setPhase("generatingPlans");

    const prefs = planAnswers as PlanPreferences;

    // Generate one plan per model, all in parallel, all with skip_judge=true
    const results = await Promise.allSettled(
      BENCHMARK_MODELS.map(async (model) => {
        const [workoutDraft, nutritionDraft] = await Promise.all([
          prefs.wantsWorkout
            ? generateWorkout(token, buildWorkoutGenerationPayload(prefs, model.id, true))
            : null,
          prefs.wantsNutrition
            ? generateNutrition(token, buildNutritionGenerationPayload(prefs, model.id, true))
            : null,
        ]);
        return { workoutDraft, nutritionDraft };
      })
    );

    const drafts: ModelDraft[] = results.map((result, i) => {
      const model = BENCHMARK_MODELS[i];
      if (result.status === "fulfilled") {
        return {
          label: model.label,
          modelId: model.id,
          workoutDraft: result.value.workoutDraft,
          nutritionDraft: result.value.nutritionDraft,
          error: null,
        };
      }
      return {
        label: model.label,
        modelId: model.id,
        workoutDraft: null,
        nutritionDraft: null,
        error: result.reason instanceof ApiError ? result.reason.message : "Generation failed",
      };
    });

    const hasAny = drafts.some((d) => !d.error);
    if (!hasAny) {
      setGenError("All three models failed to generate a plan. Please try again.");
      return;
    }

    setModelDrafts(drafts);
    setPhase("comparing");
  }

  async function handleComparisonSelect(index: number) {
    if (!token) return;
    setChosenModelIndex(index);
    setPhase("savingChosen");

    const chosen = modelDrafts[index];
    try {
      const [savedWorkout, savedNutrition] = await Promise.all([
        chosen.workoutDraft ? saveWorkout(token, chosen.workoutDraft) : null,
        chosen.nutritionDraft ? saveNutrition(token, chosen.nutritionDraft) : null,
      ]);
      setWorkoutFull(savedWorkout);
      setNutritionFull(savedNutrition);
      setPhase("results");
    } catch (err) {
      setGenError(
        err instanceof ApiError ? err.message : "Couldn't save the chosen plan. Please try again."
      );
      setPhase("comparing");
    }
  }

  function handlePlanTypeContinue() {
    if (!planTypeChoice) return;
    setPlanAnswers((prev) => ({
      ...prev,
      wantsWorkout: planTypeChoice === "workout" || planTypeChoice === "both",
      wantsNutrition: planTypeChoice === "nutrition" || planTypeChoice === "both",
    }));
    setPlanIndex(0);
    setPhase("planPrefs");
  }

  async function checkUserStateAndResume(userToken: string) {
    // 1. Check for active plans — if they exist, show them directly
    try {
      const plans = await getActivePlans(userToken);
      if (plans.workout_plan || plans.nutrition_plan) {
        setWorkoutFull(plans.workout_plan);
        setNutritionFull(plans.nutrition_plan);
        setPhase("results");
        return;
      }
    } catch { /* no active plans, continue */ }

    // 2. Check if profile exists — if so, go to plan generation
    try {
      await getMyProfile(userToken);
      saveSession({ profileCreated: true });
      setPhase("profileReady");
      return;
    } catch { /* no profile, go to profile creation */ }

    setPhase("profile");
  }

  async function handleAccountSubmit(name: string, emailInput: string, passwordInput: string) {
    setAccountLoading(true);
    setAccountError(null);
    try {
      await signup(name, emailInput, passwordInput);
      setEmail(emailInput);
      setPassword(passwordInput);
      saveSession({ email: emailInput, password: passwordInput });
      setPhase("verify");
    } catch (err) {
      setAccountError(
        err instanceof ApiError ? err.message : "Couldn't create your account. Please try again."
      );
    } finally {
      setAccountLoading(false);
    }
  }

  async function handleLogin(emailInput: string, passwordInput: string) {
    setAccountLoading(true);
    setAccountError(null);
    try {
      const { token: newToken } = await login(emailInput, passwordInput);
      setToken(newToken);
      setEmail(emailInput);
      setPassword(passwordInput);
      persistAuth(newToken, emailInput, passwordInput);
      await checkUserStateAndResume(newToken);
    } catch (err) {
      setAccountError(
        err instanceof ApiError ? err.message : "Invalid email or password."
      );
    } finally {
      setAccountLoading(false);
    }
  }

  async function handleVerifyContinue() {
    setVerifyLoading(true);
    setVerifyError(null);
    try {
      const { token: newToken } = await login(email, password);
      setToken(newToken);
      persistAuth(newToken, email, password);
      await checkUserStateAndResume(newToken);
    } catch {
      setVerifyError("Your email isn't verified yet. Check your inbox, then try again.");
    } finally {
      setVerifyLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    try {
      await resendVerification(email);
    } finally {
      setResending(false);
    }
  }

  const modelEval: ModelEvaluation | undefined =
    chosenModelIndex !== null && modelDrafts[chosenModelIndex]
      ? {
          chosenModelId: modelDrafts[chosenModelIndex].modelId,
          chosenModelLabel: modelDrafts[chosenModelIndex].label,
          allModelIds: BENCHMARK_MODELS.map((m) => m.id),
        }
      : undefined;

  async function handleFeedbackSubmit(data: {
    rating: number;
    foundPlanHelpful: boolean | null;
    comments: string;
    planClarity: number;
    planPersonalization: number;
    wouldFollowPlan: boolean | null;
  }) {
    setFeedbackSubmitting(true);
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          rating: data.rating,
          comments: data.comments,
          foundPlanHelpful: data.foundPlanHelpful,
          assessmentAnswers: { profile: profileAnswers, planPreferences: planAnswers },
          generatedPlanSummary: {
            workout: workoutFull
              ? { planName: workoutFull.plan_name, dayCount: workoutFull.workout_days.length }
              : null,
            nutrition: nutritionFull
              ? { planName: nutritionFull.plan_name, dailyCalories: nutritionFull.daily_calories }
              : null,
          },
          // Model evaluation data
          ...(modelEval
            ? {
                chosenModelId: modelEval.chosenModelId,
                chosenModelLabel: modelEval.chosenModelLabel,
                allModelIds: modelEval.allModelIds,
                planClarity: data.planClarity,
                planPersonalization: data.planPersonalization,
                wouldFollowPlan: data.wouldFollowPlan,
              }
            : {}),
        }),
      });
      setFeedbackSubmitted(true);
    } finally {
      setFeedbackSubmitting(false);
    }
  }

  // ── Render phases ─────────────────────────────────────────────────────

  if (phase === "account") {
    return (
      <AccountStep
        stepNumber={1}
        totalSteps={PROFILE_TOTAL_STEPS}
        onSubmit={handleAccountSubmit}
        onLogin={handleLogin}
        loading={accountLoading}
        error={accountError}
      />
    );
  }

  if (phase === "verify") {
    return (
      <VerifyStep
        stepNumber={1}
        totalSteps={PROFILE_TOTAL_STEPS}
        email={email}
        onContinue={handleVerifyContinue}
        onResend={handleResend}
        loading={verifyLoading}
        resending={resending}
        error={verifyError}
      />
    );
  }

  if (phase === "creatingProfile") {
    return (
      <GeneratingStep
        error={profileError}
        onRetry={() => token && runProfileCreation(token)}
      />
    );
  }

  if (phase === "profileReady") {
    return <ProfileReadyStep onGeneratePlan={() => setPhase("planTypeChoice")} />;
  }

  if (phase === "planTypeChoice") {
    return (
      <StepShell
        stepKey="planType"
        stepNumber={1}
        totalSteps={PLAN_TOTAL_STEPS}
        title="What would you like generated?"
        footer={<ContinueButton onClick={handlePlanTypeContinue} disabled={!planTypeChoice} />}
      >
        <PlanTypeChoiceStep value={planTypeChoice} onChange={setPlanTypeChoice} />
      </StepShell>
    );
  }

  if (phase === "generatingPlans") {
    return <GeneratingStep error={genError} onRetry={runBenchmarkGeneration} />;
  }

  if (phase === "comparing") {
    return <ComparisonStep drafts={modelDrafts} onSelect={handleComparisonSelect} />;
  }

  if (phase === "savingChosen") {
    return <GeneratingStep error={genError} onRetry={() => chosenModelIndex !== null && handleComparisonSelect(chosenModelIndex)} />;
  }

  if (phase === "results") {
    return (
      <ResultsStep
        workout={workoutFull}
        nutrition={nutritionFull}
        onContinue={() => setPhase("feedback")}
      />
    );
  }

  if (phase === "feedback") {
    return (
      <FeedbackStep
        onSubmit={handleFeedbackSubmit}
        submitting={feedbackSubmitting}
        submitted={feedbackSubmitted}
        modelEval={modelEval}
      />
    );
  }

  if (phase === "planPrefs") {
    return (
      <StepShell
        stepKey={currentPlanStep.key}
        stepNumber={planIndex + 2}
        totalSteps={PLAN_TOTAL_STEPS}
        title={currentPlanStep.title}
        onBack={planIndex > 0 ? goPlanBack : () => setPhase("planTypeChoice")}
        footer={<ContinueButton onClick={goPlanNext} disabled={!isPlanStepValid()} />}
      >
        {currentPlanStep.kind === "training-setup" ? (
          <TrainingSetupStep
            location={planAnswers.workoutLocation ?? ""}
            equipment={planAnswers.equipmentAvailability ?? ""}
            onLocationChange={(v) => setPlanAnswer("workoutLocation", v as PlanPreferences["workoutLocation"])}
            onEquipmentChange={(v) =>
              setPlanAnswer("equipmentAvailability", v as PlanPreferences["equipmentAvailability"])
            }
          />
        ) : (
          <AssessmentStep
            step={currentPlanStep}
            value={(planAnswers as Record<string, unknown>)[currentPlanStep.key]}
            onChange={(v) => setPlanAnswer(currentPlanStep.key as keyof PlanPreferences, v)}
          />
        )}
      </StepShell>
    );
  }

  return (
    <StepShell
      stepKey={currentProfileStep.key}
      stepNumber={profileIndex + 2}
      totalSteps={PROFILE_TOTAL_STEPS}
      title={currentProfileStep.title}
      onBack={profileIndex > 0 ? goProfileBack : undefined}
      footer={<ContinueButton onClick={goProfileNext} disabled={!isProfileStepValid()} />}
    >
      <AssessmentStep
        step={currentProfileStep}
        value={(profileAnswers as Record<string, unknown>)[currentProfileStep.key]}
        onChange={(v) => setProfileAnswer(currentProfileStep.key as keyof ProfileAnswers, v)}
      />
    </StepShell>
  );
}
