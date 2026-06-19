import { ActivityLevel, PlanPreferences, ProfileAnswers } from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/v1";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, headers, ...rest } = options;
  const res = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body?.detail ? JSON.stringify(body.detail) : detail;
    } catch {
      // response had no JSON body
    }
    throw new ApiError(detail, res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export interface SignupResult {
  id: number;
  name: string;
  email: string;
  is_verified: boolean;
}

export function signup(name: string, email: string, password: string) {
  return request<SignupResult>("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

export function resendVerification(email: string) {
  return request<{ message: string }>("/auth/resend-verification", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export interface LoginResult {
  token: string;
  user: SignupResult;
}

export function login(email: string, password: string) {
  return request<LoginResult>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function getMe(token: string) {
  return request<SignupResult>("/auth/me", { token });
}

function mapActivityLevel(fitnessLevel: number): ActivityLevel {
  if (fitnessLevel <= 1) return ActivityLevel.Sedentary;
  if (fitnessLevel === 2) return ActivityLevel.LightlyActive;
  if (fitnessLevel === 3) return ActivityLevel.ModeratelyActive;
  if (fitnessLevel === 4) return ActivityLevel.VeryActive;
  return ActivityLevel.ExtraActive;
}

export function buildProfilePayload(answers: ProfileAnswers, userId: number) {
  return {
    user_id: userId,
    age: answers.age,
    gender: answers.gender,
    height: answers.heightCm,
    weight: answers.weightKg,
    fitness_goal: answers.fitnessGoal,
    activity_level: mapActivityLevel(answers.fitnessLevel),
    dietary_preference: answers.dietPreference,
    medical_conditions: answers.physicalLimitations.join(", ") || "None reported",
    allergies: answers.allergies.join(", ") || "None reported",
    injuries: answers.physicalLimitations.join(", ") || "None reported",
    medications: answers.supplements.join(", ") || "None",
  };
}

export interface ProfileResponse {
  id: number;
  user_id: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createProfile(token: string, payload: Record<string, any>) {
  return request<ProfileResponse>("/profiles/", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function getMyProfile(token: string) {
  return request<ProfileResponse>("/profiles/me", { token });
}

export interface ActivePlansResponse {
  workout_plan: FullWorkoutPlan | null;
  nutrition_plan: FullNutritionPlan | null;
  message: string;
}

export function getActivePlans(token: string) {
  return request<ActivePlansResponse>("/plans/active", { token });
}

export const BENCHMARK_MODELS = [
  { id: "qwen/qwen3-235b-a22b-2507", label: "Model A" },
  { id: "openai/gpt-4.1-mini", label: "Model B" },
  { id: "google/gemini-2.5-flash-preview-05-20", label: "Model C" },
] as const;

export function buildWorkoutGenerationPayload(
  prefs: PlanPreferences,
  modelOverride?: string,
  skipJudge?: boolean,
) {
  return {
    duration_weeks: prefs.durationWeeks,
    workout_preferences: {
      workout_days_per_week: prefs.daysPerWeek,
      workout_location: prefs.workoutLocation,
      equipment_availability: prefs.equipmentAvailability,
      workout_focus: prefs.workoutFocus,
      workout_difficulty: prefs.workoutDifficulty,
      session_duration_minutes: prefs.sessionDurationMinutes,
    },
    ...(modelOverride ? { model_override: modelOverride } : {}),
    ...(skipJudge ? { skip_judge: true } : {}),
  };
}

export function buildNutritionGenerationPayload(
  prefs: PlanPreferences,
  modelOverride?: string,
  skipJudge?: boolean,
) {
  return {
    duration_weeks: prefs.durationWeeks,
    nutrition_preferences: {
      calorie_preference: prefs.caloriePreference,
      custom_calorie_target:
        prefs.caloriePreference === "Custom" ? prefs.customCalorieTarget : undefined,
      meals_per_day: prefs.mealsPerDay,
      meal_complexity: prefs.mealComplexity,
      cuisine_preference: prefs.cuisinePreference,
      exclude_ingredients: prefs.excludeIngredients.length ? prefs.excludeIngredients : undefined,
    },
    ...(modelOverride ? { model_override: modelOverride } : {}),
    ...(skipJudge ? { skip_judge: true } : {}),
  };
}

export interface WorkoutDraftResponse {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  draft_plan: any;
  generated_from_preferences: Record<string, unknown>;
  update_plan_id: number | null;
}

export interface NutritionDraftResponse {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  draft_plan: any;
  generated_from_preferences: Record<string, unknown>;
  update_plan_id: number | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function generateWorkout(token: string, payload: Record<string, any>) {
  return request<WorkoutDraftResponse>("/plans/generate/workout", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function generateNutrition(token: string, payload: Record<string, any>) {
  return request<NutritionDraftResponse>("/plans/generate/nutrition", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

// Full, fully-resolved plan shapes returned once a draft is saved — these
// include food/exercise names, instructions, and per-day breakdowns, unlike
// the generate/* draft responses which only carry catalog IDs.
export interface FullWorkoutPlan {
  id: number;
  plan_name: string;
  description: string | null;
  frequency: string | null;
  difficulty_level: string | null;
  estimated_duration_per_session: number | null;
  workout_days: {
    id: number;
    day_name: string;
    day_number: number;
    focus_area: string | null;
    estimated_duration: number | null;
    notes: string | null;
    exercises: {
      id: number;
      sets: number | null;
      reps: number | null;
      weight_kg: number | null;
      duration_seconds: number | null;
      rest_seconds: number | null;
      notes: string | null;
      central_exercise: {
        name: string;
        primary_muscle_group: string;
        equipment_required: string;
        instructions: string | null;
      };
    }[];
  }[];
}

export interface FullNutritionPlan {
  id: number;
  plan_name: string;
  description: string | null;
  daily_calories: number;
  daily_protein_g: number;
  daily_carbs_g: number;
  daily_fats_g: number;
  days: {
    id: number;
    day_name: string;
    day_number: number;
    notes: string | null;
    meals: {
      id: number;
      meal_type: string;
      meal_name: string;
      calories: number;
      protein_g: number;
      carbs_g: number;
      fats_g: number;
      instructions: string | null;
      prep_time_minutes: number | null;
      cook_time_minutes: number | null;
      servings: number;
      ingredients: { food_name: string; amount_g: number; calories: number }[];
    }[];
  }[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function saveWorkout(token: string, payload: Record<string, any>) {
  return request<FullWorkoutPlan>("/plans/save/workout", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function saveNutrition(token: string, payload: Record<string, any>) {
  return request<FullNutritionPlan>("/plans/save/nutrition", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}
