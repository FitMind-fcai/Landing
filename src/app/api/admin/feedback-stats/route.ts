import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Friendly display names for the internal dashboard only — user-facing copy
// keeps these anonymized as "Model A/B/C" (see src/lib/api.ts BENCHMARK_MODELS).
const MODEL_DISPLAY_NAMES: Record<string, string> = {
  "qwen/qwen3-235b-a22b-2507": "Qwen3 235B",
  "deepseek/deepseek-chat": "DeepSeek Chat",
  "openai/gpt-4o-mini": "GPT-4o mini",
};

function displayName(modelId: string): string {
  return MODEL_DISPLAY_NAMES[modelId] ?? modelId;
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-admin-token",
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export async function GET(req: NextRequest) {
  const expectedToken = process.env.ADMIN_DASHBOARD_TOKEN;
  if (!expectedToken) {
    return NextResponse.json(
      { error: "ADMIN_DASHBOARD_TOKEN is not configured on the server" },
      { status: 500, headers: corsHeaders() }
    );
  }

  const providedToken = req.headers.get("x-admin-token");
  if (providedToken !== expectedToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders() });
  }

  const rows = await prisma.feedback.findMany({
    select: {
      rating: true,
      comments: true,
      foundPlanHelpful: true,
      chosenModelId: true,
      allModelIds: true,
      planClarity: true,
      planPersonalization: true,
      wouldFollowPlan: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const total = rows.length;

  const avgRating = average(rows.map((r) => r.rating));
  const avgClarity = average(
    rows.filter((r) => r.planClarity != null).map((r) => r.planClarity as number)
  );
  const avgPersonalization = average(
    rows.filter((r) => r.planPersonalization != null).map((r) => r.planPersonalization as number)
  );

  const wouldFollowRows = rows.filter((r) => r.wouldFollowPlan != null);
  const wouldFollowRate = wouldFollowRows.length
    ? wouldFollowRows.filter((r) => r.wouldFollowPlan).length / wouldFollowRows.length
    : null;

  const helpfulRows = rows.filter((r) => r.foundPlanHelpful != null);
  const foundHelpfulRate = helpfulRows.length
    ? helpfulRows.filter((r) => r.foundPlanHelpful).length / helpfulRows.length
    : null;

  interface ModelAgg {
    appearances: number;
    wins: number;
    claritySum: number;
    clarityCount: number;
    personalizationSum: number;
    personalizationCount: number;
  }
  const modelAgg = new Map<string, ModelAgg>();
  const emptyAgg = (): ModelAgg => ({
    appearances: 0,
    wins: 0,
    claritySum: 0,
    clarityCount: 0,
    personalizationSum: 0,
    personalizationCount: 0,
  });

  for (const row of rows) {
    const allIds = Array.isArray(row.allModelIds) ? (row.allModelIds as unknown as string[]) : [];
    for (const id of allIds) {
      const entry = modelAgg.get(id) ?? emptyAgg();
      entry.appearances += 1;
      modelAgg.set(id, entry);
    }
    if (row.chosenModelId) {
      const entry = modelAgg.get(row.chosenModelId) ?? emptyAgg();
      entry.wins += 1;
      if (row.planClarity != null) {
        entry.claritySum += row.planClarity;
        entry.clarityCount += 1;
      }
      if (row.planPersonalization != null) {
        entry.personalizationSum += row.planPersonalization;
        entry.personalizationCount += 1;
      }
      modelAgg.set(row.chosenModelId, entry);
    }
  }

  const modelStats = Array.from(modelAgg.entries())
    .map(([modelId, agg]) => ({
      modelId,
      name: displayName(modelId),
      appearances: agg.appearances,
      wins: agg.wins,
      winRate: agg.appearances > 0 ? agg.wins / agg.appearances : null,
      avgClarity: agg.clarityCount > 0 ? agg.claritySum / agg.clarityCount : null,
      avgPersonalization:
        agg.personalizationCount > 0 ? agg.personalizationSum / agg.personalizationCount : null,
    }))
    .sort((a, b) => b.wins - a.wins);

  const recentComments = rows
    .filter((r) => r.comments && r.comments.trim().length > 0)
    .slice(0, 8)
    .map((r) => ({
      rating: r.rating,
      comment: r.comments,
      modelName: r.chosenModelId ? displayName(r.chosenModelId) : null,
      createdAt: r.createdAt,
    }));

  const dailyCountsMap = new Map<string, number>();
  const now = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    dailyCountsMap.set(d.toISOString().slice(0, 10), 0);
  }
  for (const row of rows) {
    const key = row.createdAt.toISOString().slice(0, 10);
    if (dailyCountsMap.has(key)) {
      dailyCountsMap.set(key, (dailyCountsMap.get(key) ?? 0) + 1);
    }
  }
  const dailyCounts = Array.from(dailyCountsMap.entries()).map(([date, count]) => ({
    date,
    count,
  }));

  return NextResponse.json(
    {
      total,
      avgRating,
      avgClarity,
      avgPersonalization,
      wouldFollowRate,
      foundHelpfulRate,
      wouldFollowSampleSize: wouldFollowRows.length,
      foundHelpfulSampleSize: helpfulRows.length,
      modelStats,
      recentComments,
      dailyCounts,
    },
    { headers: corsHeaders() }
  );
}
