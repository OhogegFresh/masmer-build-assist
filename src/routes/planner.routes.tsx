import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/masmer/AppShell";
import { useRequireAuth } from "@/components/masmer/useRequireAuth";
import { ArrowDown, MapPin, ExternalLink, ChevronLeft, Loader2 } from "lucide-react";
import {
  ScheduledJob,
  fmtTime,
  todayISO,
  estDistanceMiles,
  driveMinutes,
  mapsDirectionsUrl,
} from "@/components/masmer/planner/types";

export const Route = createFileRoute("/planner/routes")({
  head: () => ({
    meta: [
      { title: "Route Optimizer — Masmer AI" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RouteOptimizerPage,
});

function RouteOptimizerPage() {
  const ready = useRequireAuth();
  const [date, setDate] = useState(todayISO());
  const [start, setStart] = useState("");
  const [jobs, setJobs] = useState<ScheduledJob[]>([]);
  const [optimized, setOptimized] = useState<ScheduledJob[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ready) return;
    (supabase as any)
      .from("company_settings")
      .select("address")
      .limit(1)
      .then(({ data }: any) => {
        if (data?.[0]?.address) setStart(data[0].address);
      });
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    setLoading(true);
    setOptimized(null);
    (supabase as any)
      .from("scheduled_jobs")
      .select("*")
      .eq("scheduled_date", date)
      .order("start_time")
      .then(({ data }: any) => {
        setJobs((data ?? []) as ScheduledJob[]);
        setLoading(false);
      });
  }, [ready, date]);

  function calculate() {
    // Nearest-neighbor using deterministic est distance
    const remaining = [...jobs];
    const ordered: ScheduledJob[] = [];
    let last = start || "start";
    while (remaining.length) {
      remaining.sort(
        (a, b) => estDistanceMiles(last, a.job_address) - estDistanceMiles(last, b.job_address),
      );
      const next = remaining.shift()!;
      ordered.push(next);
      last = next.job_address ?? last;
    }
    setOptimized(ordered);
  }

  const summary = useMemo(() => {
    if (!optimized) return null;
    let dist = 0;
    let drive = 0;
    let last = start || "start";
    const stops = optimized.map((j) => {
      const m = estDistanceMiles(last, j.job_address);
      const d = driveMinutes(m);
      dist += m;
      drive += d;
      last = j.job_address ?? last;
      return { job: j, miles: m, drive: d };
    });
    const totalJob = optimized.reduce((s, j) => s + j.duration_minutes, 0);
    const finishMin = drive + totalJob + 9 * 60; // assume 9am start
    const fh = Math.floor(finishMin / 60) % 24;
    const fm = finishMin % 60;
    const finish = `${String(fh).padStart(2, "0")}:${String(fm).padStart(2, "0")}`;
    return { stops, dist, drive, totalJob, finish };
  }, [optimized, start]);

  if (!ready) return null;

  const mapsUrl = optimized
    ? mapsDirectionsUrl([start, ...optimized.map((j) => j.job_address ?? j.customer_name)].filter(Boolean))
    : "";

  return (
    <AppShell
      title="Route Optimizer"
      action={
        <Link to="/planner" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Back to Planner
        </Link>
      }
    >
      <div className="rounded-xl border border-border bg-card p-5 mb-5">
        <div className="grid gap-3 md:grid-cols-[160px_1fr_auto] items-end">
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground mb-1 block">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground mb-1 block">Starting Location</label>
            <input
              value={start}
              onChange={(e) => setStart(e.target.value)}
              placeholder="Your shop or home address"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <button
            onClick={calculate}
            disabled={!jobs.length}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-gradient-orange px-4 py-2.5 text-sm font-bold text-foreground shadow-orange disabled:opacity-50"
          >
            Calculate Best Route
          </button>
        </div>
        {loading && (
          <div className="mt-3 text-xs text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-3 w-3 animate-spin" /> Loading jobs…
          </div>
        )}
        {!loading && jobs.length === 0 && (
          <p className="mt-3 text-sm text-muted-foreground">No jobs scheduled for this date.</p>
        )}
      </div>

      {optimized && summary && (
        <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <div>
            <div className="space-y-3">
              {summary.stops.map((s, i) => (
                <div key={s.job.id}>
                  {i > 0 && (
                    <div className="flex items-center gap-2 ml-5 mb-2 text-[11px] text-muted-foreground">
                      <ArrowDown className="h-3 w-3" />
                      <span>
                        {s.miles.toFixed(1)} mi • {s.drive} min drive
                      </span>
                    </div>
                  )}
                  <div className="rounded-xl border border-border bg-card p-4 flex gap-3">
                    <div className="h-9 w-9 rounded-full bg-orange text-foreground font-bold inline-flex items-center justify-center shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="font-bold text-base truncate">{s.job.customer_name}</div>
                        <span className="inline-flex rounded-full bg-orange/15 text-orange px-2 py-0.5 text-[11px] font-bold shrink-0">
                          {fmtTime(s.job.start_time)}
                        </span>
                      </div>
                      {s.job.job_address && (
                        <div className="text-sm text-muted-foreground truncate">{s.job.job_address}</div>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-[11px]">
                        <span className="rounded border border-border px-1.5 py-0.5 text-muted-foreground">
                          {s.job.duration_minutes} min
                        </span>
                        {s.job.job_type && (
                          <span className="rounded border border-border px-1.5 py-0.5 text-muted-foreground">
                            {s.job.job_type}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-xl border border-border bg-card p-5">
              <h3 className="font-display text-lg font-bold mb-3">Trip Summary</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Stat label="Total stops" value={String(summary.stops.length)} />
                <Stat label="Total distance" value={`${summary.dist.toFixed(1)} mi`} />
                <Stat label="Total drive time" value={`${summary.drive} min`} />
                <Stat label="Total job time" value={`${(summary.totalJob / 60).toFixed(1)} hrs`} />
                <Stat label="Est. finish time" value={fmtTime(summary.finish)} />
              </div>
              <p className="mt-3 text-[11px] text-muted-foreground">Approximate times — based on straight-line estimates.</p>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-md bg-gradient-orange px-4 py-2.5 text-sm font-bold text-foreground shadow-orange"
              >
                <ExternalLink className="h-4 w-4" />
                Open Full Route in Google Maps
              </a>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 flex flex-col items-center justify-center text-center min-h-[400px]">
            <MapPin className="h-10 w-10 text-orange mb-3" />
            <h3 className="font-display text-lg font-bold mb-1">Route Map</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-xs">
              View your full optimized route with turn-by-turn directions in Google Maps.
            </p>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-orange/40 bg-orange/10 text-orange px-4 py-2 text-sm font-bold hover:bg-orange/20"
            >
              Open in Google Maps →
            </a>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-display text-lg font-bold mt-0.5">{value}</div>
    </div>
  );
}