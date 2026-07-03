"use client";

import { useEffect, useState, type FormEvent } from "react";
import { RefreshCw, Printer, LogOut } from "lucide-react";

interface ModelStat {
  modelId: string;
  name: string;
  appearances: number;
  wins: number;
  winRate: number | null;
  avgClarity: number | null;
  avgPersonalization: number | null;
}

interface RecentComment {
  rating: number;
  comment: string;
  modelName: string | null;
  createdAt: string;
}

interface DailyCount {
  date: string;
  count: number;
}

interface FeedbackStats {
  total: number;
  avgRating: number | null;
  avgClarity: number | null;
  avgPersonalization: number | null;
  wouldFollowRate: number | null;
  foundHelpfulRate: number | null;
  wouldFollowSampleSize: number;
  foundHelpfulSampleSize: number;
  modelStats: ModelStat[];
  recentComments: RecentComment[];
  dailyCounts: DailyCount[];
}

// Fixed categorical order — never cycled or re-assigned by rank, so a model
// keeps its color across every chart on the page.
const SERIES_COLORS = ["#3987e5", "#199e70", "#d95926", "#9085e9", "#c98500"];

const SESSION_URL_KEY = "fitmind_dashboard_url";
const SESSION_TOKEN_KEY = "fitmind_dashboard_token";

function pct(v: number | null): string {
  return v == null ? "—" : `${Math.round(v * 100)}%`;
}

function num(v: number | null, digits = 1): string {
  return v == null ? "—" : v.toFixed(digits);
}

function StatTile({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-2 font-display text-3xl font-extrabold">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
    </div>
  );
}

function ModelBarRow({
  stat,
  color,
  maxValue,
}: {
  stat: ModelStat;
  color: string;
  maxValue: number;
}) {
  const value = stat.winRate ?? 0;
  const widthPct = maxValue > 0 ? Math.max((value / maxValue) * 100, value > 0 ? 3 : 0) : 0;
  return (
    <div
      className="group"
      title={`${stat.name}: ${stat.wins} win${stat.wins === 1 ? "" : "s"} out of ${stat.appearances} time${stat.appearances === 1 ? "" : "s"} shown`}
    >
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 font-medium">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: color }}
          />
          {stat.name}
        </span>
        <span className="tabular-nums text-muted">
          {pct(stat.winRate)} <span className="text-xs">({stat.wins}/{stat.appearances})</span>
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full transition-[width,filter] duration-300 group-hover:brightness-125"
          style={{ width: `${widthPct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function MiniScoreBar({
  stat,
  color,
  field,
}: {
  stat: ModelStat;
  color: string;
  field: "avgClarity" | "avgPersonalization";
}) {
  const value = stat[field];
  const widthPct = value != null ? Math.max((value / 5) * 100, 3) : 0;
  return (
    <div title={value != null ? `${stat.name}: ${value.toFixed(2)} / 5` : `${stat.name}: no data`}>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-muted">
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
          {stat.name}
        </span>
        <span className="tabular-nums font-medium">{num(value, 2)}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full"
          style={{ width: `${widthPct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

const TREND_HEIGHT_PX = 96;

function Trend({ data }: { data: DailyCount[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="flex items-end gap-1" style={{ height: TREND_HEIGHT_PX }}>
      {data.map((d) => (
        <div
          key={d.date}
          className="group relative flex-1"
          title={`${d.date}: ${d.count} response${d.count === 1 ? "" : "s"}`}
        >
          <div
            className="mx-auto w-full rounded-t-[3px] bg-[#3987e5] transition-[filter] group-hover:brightness-125"
            style={{
              height: Math.max((d.count / max) * TREND_HEIGHT_PX, d.count > 0 ? 6 : 2),
            }}
          />
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const [baseUrl, setBaseUrl] = useState(
    () => (typeof window !== "undefined" && sessionStorage.getItem(SESSION_URL_KEY)) || ""
  );
  const [token, setToken] = useState(
    () => (typeof window !== "undefined" && sessionStorage.getItem(SESSION_TOKEN_KEY)) || ""
  );
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSourceForm, setShowSourceForm] = useState(true);

  useEffect(() => {
    if (baseUrl && token) {
      void loadStats(baseUrl, token);
    }
    // Only run once on mount, using whatever was restored from sessionStorage above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadStats(url: string, adminToken: string) {
    setLoading(true);
    setError(null);
    try {
      const cleanUrl = url.replace(/\/+$/, "");
      const res = await fetch(`${cleanUrl}/api/admin/feedback-stats`, {
        headers: { "x-admin-token": adminToken },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed (${res.status})`);
      }
      const data: FeedbackStats = await res.json();
      setStats(data);
      setShowSourceForm(false);
      sessionStorage.setItem(SESSION_URL_KEY, url);
      sessionStorage.setItem(SESSION_TOKEN_KEY, adminToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stats");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!baseUrl || !token) return;
    void loadStats(baseUrl, token);
  }

  function handleSignOut() {
    sessionStorage.removeItem(SESSION_URL_KEY);
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
    setStats(null);
    setToken("");
    setShowSourceForm(true);
  }

  const maxWinRate = stats
    ? Math.max(...stats.modelStats.map((m) => m.winRate ?? 0), 0.0001)
    : 1;

  return (
    <div className="min-h-screen bg-background px-4 py-10 sm:px-8 print:bg-white print:text-black">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
          <div>
            <h1 className="font-display text-2xl font-extrabold">Feedback Dashboard</h1>
            <p className="text-sm text-muted">
              Model benchmark results from the FitMind demo testing round.
            </p>
          </div>
          {stats && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => loadStats(baseUrl, token)}
                disabled={loading}
                className="flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium hover:border-brand/40 disabled:opacity-50"
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                Refresh
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium hover:border-brand/40"
              >
                <Printer size={14} />
                Print / Export
              </button>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium text-muted hover:border-brand/40"
              >
                <LogOut size={14} />
                Change source
              </button>
            </div>
          )}
        </div>

        {showSourceForm && (
          <form
            onSubmit={handleSubmit}
            className="mt-6 flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5 print:hidden sm:flex-row sm:items-end"
          >
            <div className="flex-1">
              <label className="text-xs font-medium text-muted">Server URL</label>
              <input
                type="url"
                required
                placeholder="https://your-droplet-domain.com"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand/50"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-medium text-muted">Admin token</label>
              <input
                type="password"
                required
                placeholder="ADMIN_DASHBOARD_TOKEN"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand/50"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-brand px-5 py-2 text-sm font-semibold text-background disabled:opacity-50"
            >
              {loading ? "Loading…" : "Load data"}
            </button>
          </form>
        )}

        {error && (
          <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400 print:hidden">
            {error}
          </p>
        )}

        {stats && (
          <div className="mt-8 space-y-8">
            <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <StatTile label="Total responses" value={String(stats.total)} />
              <StatTile label="Avg overall rating" value={`${num(stats.avgRating)} / 5`} />
              <StatTile label="Avg clarity" value={`${num(stats.avgClarity)} / 5`} />
              <StatTile label="Avg personalization" value={`${num(stats.avgPersonalization)} / 5`} />
              <StatTile
                label="Would follow plan"
                value={pct(stats.wouldFollowRate)}
                sub={`n=${stats.wouldFollowSampleSize}`}
              />
              <StatTile
                label="Found plan helpful"
                value={pct(stats.foundHelpfulRate)}
                sub={`n=${stats.foundHelpfulSampleSize}`}
              />
            </section>

            <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
              <h2 className="font-display text-lg font-bold">Model comparison</h2>
              <p className="mt-1 text-xs text-muted">
                Win rate = times a model&apos;s plan was picked ÷ times it was shown.
              </p>
              {stats.modelStats.length === 0 ? (
                <p className="mt-4 text-sm text-muted">No model comparison data yet.</p>
              ) : (
                <div className="mt-5 space-y-4">
                  {stats.modelStats.map((m, i) => (
                    <ModelBarRow
                      key={m.modelId}
                      stat={m}
                      color={SERIES_COLORS[i % SERIES_COLORS.length]}
                      maxValue={maxWinRate}
                    />
                  ))}
                </div>
              )}

              {stats.modelStats.length > 0 && (
                <>
                  <div className="mt-6 grid gap-6 border-t border-border pt-6 sm:grid-cols-2">
                    <div>
                      <h3 className="text-sm font-semibold">Avg clarity when chosen</h3>
                      <div className="mt-3 space-y-3">
                        {stats.modelStats.map((m, i) => (
                          <MiniScoreBar
                            key={m.modelId}
                            stat={m}
                            color={SERIES_COLORS[i % SERIES_COLORS.length]}
                            field="avgClarity"
                          />
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold">Avg personalization when chosen</h3>
                      <div className="mt-3 space-y-3">
                        {stats.modelStats.map((m, i) => (
                          <MiniScoreBar
                            key={m.modelId}
                            stat={m}
                            color={SERIES_COLORS[i % SERIES_COLORS.length]}
                            field="avgPersonalization"
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 overflow-x-auto border-t border-border pt-4">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="text-xs uppercase tracking-wide text-muted">
                          <th className="pb-2 pr-4 font-medium">Model</th>
                          <th className="pb-2 pr-4 font-medium">Shown</th>
                          <th className="pb-2 pr-4 font-medium">Wins</th>
                          <th className="pb-2 pr-4 font-medium">Win rate</th>
                          <th className="pb-2 pr-4 font-medium">Avg clarity</th>
                          <th className="pb-2 font-medium">Avg personalization</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.modelStats.map((m) => (
                          <tr key={m.modelId} className="border-t border-border/60 tabular-nums">
                            <td className="py-2 pr-4 font-medium">{m.name}</td>
                            <td className="py-2 pr-4">{m.appearances}</td>
                            <td className="py-2 pr-4">{m.wins}</td>
                            <td className="py-2 pr-4">{pct(m.winRate)}</td>
                            <td className="py-2 pr-4">{num(m.avgClarity, 2)}</td>
                            <td className="py-2">{num(m.avgPersonalization, 2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </section>

            <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
              <h2 className="font-display text-lg font-bold">Responses, last 14 days</h2>
              <div className="mt-4">
                <Trend data={stats.dailyCounts} />
              </div>
              <div className="mt-1 flex justify-between text-xs text-muted">
                <span>{stats.dailyCounts[0]?.date}</span>
                <span>{stats.dailyCounts[stats.dailyCounts.length - 1]?.date}</span>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
              <h2 className="font-display text-lg font-bold">Recent comments</h2>
              {stats.recentComments.length === 0 ? (
                <p className="mt-4 text-sm text-muted">No comments left yet.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {stats.recentComments.map((c, i) => (
                    <div key={i} className="rounded-xl border border-border/60 bg-surface-2/50 p-3">
                      <div className="flex items-center justify-between text-xs text-muted">
                        <span>
                          {c.rating}/5{c.modelName ? ` · ${c.modelName}` : ""}
                        </span>
                        <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="mt-1.5 text-sm">{c.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
