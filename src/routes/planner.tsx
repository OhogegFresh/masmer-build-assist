import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/masmer/AppShell";
import { useRequireAuth } from "@/components/masmer/useRequireAuth";
import { ChevronLeft, ChevronRight, Plus, ChevronDown, Navigation, Loader2, Sparkles, Route as RouteIcon } from "lucide-react";
import {
  ScheduledJob,
  STATUS_BORDER,
  fmtTime,
  todayISO,
  shiftDate,
  fmtDateLong,
  estDistanceMiles,
  driveMinutes,
  singleMapsUrl,
} from "@/components/masmer/planner/types";
import { AddJobModal } from "@/components/masmer/planner/AddJobModal";
import { CustomerLeadPipe } from "@/components/masmer/CustomerLeadPipe";

export const Route = createFileRoute("/planner")({
  head: () => ({
    meta: [
      { title: "Day Planner — Masmer AI" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PlannerPage,
});

const HOURS = Array.from({ length: 13 }, (_, i) => 7 + i); // 7am..7pm

function PlannerPage() {
  const ready = useRequireAuth();
  const [date, setDate] = useState(todayISO());
  const [view, setView] = useState<"day" | "week" | "month">("day");
  const [jobs, setJobs] = useState<ScheduledJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [addTime, setAddTime] = useState<string | undefined>();
  const [briefingOpen, setBriefingOpen] = useState(true);
  const [leadOpen, setLeadOpen] = useState(false);
  const [leadJob, setLeadJob] = useState<ScheduledJob | null>(null);

  function openLead(j: ScheduledJob) {
    setLeadJob(j);
    setLeadOpen(true);
  }

  const weekStart = useMemo(() => {
    const d = new Date(date + "T00:00:00");
    const day = d.getDay(); // 0=Sun
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, [date]);

  const weekDates = useMemo(() => Array.from({ length: 7 }, (_, i) => shiftDate(weekStart, i)), [weekStart]);

  const monthRange = useMemo(() => {
    const d = new Date(date + "T00:00:00");
    const first = new Date(d.getFullYear(), d.getMonth(), 1);
    const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    const iso = (x: Date) =>
      `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
    return { first: iso(first), last: iso(last), year: d.getFullYear(), month: d.getMonth() };
  }, [date]);

  useEffect(() => {
    if (!ready) return;
    setLoading(true);
    const range =
      view === "day"
        ? [date, date]
        : view === "week"
          ? [weekDates[0], weekDates[6]]
          : [monthRange.first, monthRange.last];
    (supabase as any)
      .from("scheduled_jobs")
      .select("*")
      .gte("scheduled_date", range[0])
      .lte("scheduled_date", range[1])
      .order("scheduled_date")
      .order("start_time")
      .then(({ data }: any) => {
        setJobs((data ?? []) as ScheduledJob[]);
        setLoading(false);
      });
  }, [ready, date, view, weekDates, monthRange.first, monthRange.last]);

  function refresh() {
    setLoading(true);
    const range =
      view === "day"
        ? [date, date]
        : view === "week"
          ? [weekDates[0], weekDates[6]]
          : [monthRange.first, monthRange.last];
    (supabase as any)
      .from("scheduled_jobs")
      .select("*")
      .gte("scheduled_date", range[0])
      .lte("scheduled_date", range[1])
      .order("scheduled_date")
      .order("start_time")
      .then(({ data }: any) => {
        setJobs((data ?? []) as ScheduledJob[]);
        setLoading(false);
      });
  }

  async function toggleStatus(j: ScheduledJob) {
    const next: ScheduledJob["status"] =
      j.status === "scheduled" ? "in_progress" : j.status === "in_progress" ? "completed" : "scheduled";
    await (supabase as any).from("scheduled_jobs").update({ status: next }).eq("id", j.id);
    refresh();
  }

  if (!ready) return null;

  const todayJobs = jobs.filter((j) => j.scheduled_date === date).sort((a, b) => a.start_time.localeCompare(b.start_time));
  const totalMinutes = todayJobs.reduce((s, j) => s + j.duration_minutes, 0);
  let totalDrive = 0;
  for (let i = 1; i < todayJobs.length; i++) {
    totalDrive += driveMinutes(estDistanceMiles(todayJobs[i - 1].job_address, todayJobs[i].job_address));
  }

  const briefing =
    todayJobs.length === 0
      ? "No jobs scheduled for today. Click 'Add Job' to get started or check your projects for pending work."
      : `You have ${todayJobs.length} job${todayJobs.length === 1 ? "" : "s"} scheduled today starting at ${fmtTime(
          todayJobs[0].start_time,
    )}. Estimated total job time is ${(totalMinutes / 60).toFixed(1)} hours plus roughly ${totalDrive} minutes of driving (estimated). Your first stop is ${todayJobs[0].customer_name}${todayJobs[0].job_address ? ` at ${todayJobs[0].job_address}` : ""}.`;

  return (
    <AppShell
      title="Day Planner"
      action={
        <button
          onClick={() => {
            setAddTime(undefined);
            setAddOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-md bg-gradient-orange px-4 py-2 text-sm font-bold text-foreground shadow-orange hover:scale-[1.02] transition-transform"
        >
          <Plus className="h-4 w-4" />
          Add Job
        </button>
      }
    >
      <AddJobModal open={addOpen} onClose={() => setAddOpen(false)} onSaved={refresh} defaultDate={date} defaultTime={addTime} />
      <CustomerLeadPipe
        open={leadOpen}
        onClose={() => setLeadOpen(false)}
        customerName={leadJob?.customer_name ?? ""}
        address={leadJob?.job_address}
      />

      {/* AI Briefing */}
      <div className="mb-5 rounded-xl border border-border bg-card overflow-hidden">
        <button
          onClick={() => setBriefingOpen((o) => !o)}
          className="w-full flex items-center justify-between px-5 py-3 hover:bg-secondary/50"
        >
          <span className="flex items-center gap-2 font-bold text-sm">
            <Sparkles className="h-4 w-4 text-orange" />
            📋 Today's Briefing
          </span>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${briefingOpen ? "" : "-rotate-90"}`} />
        </button>
        {briefingOpen && <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">{briefing}</div>}
      </div>

      {/* Top nav bar */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (view === "month") {
                const d = new Date(date + "T00:00:00");
                d.setMonth(d.getMonth() - 1);
                setDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
              } else {
                setDate(shiftDate(date, view === "week" ? -7 : -1));
              }
            }}
            className="h-9 w-9 rounded-md border border-border bg-card hover:bg-secondary inline-flex items-center justify-center"
            aria-label="Previous"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setDate(todayISO())}
            className="h-9 px-3 rounded-md border border-border bg-card hover:bg-secondary text-sm font-semibold"
          >
            Today
          </button>
          <button
            onClick={() => {
              if (view === "month") {
                const d = new Date(date + "T00:00:00");
                d.setMonth(d.getMonth() + 1);
                setDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
              } else {
                setDate(shiftDate(date, view === "week" ? 7 : 1));
              }
            }}
            className="h-9 w-9 rounded-md border border-border bg-card hover:bg-secondary inline-flex items-center justify-center"
            aria-label="Next"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <h2 className="font-display text-2xl font-bold ml-2">
            {view === "month"
              ? new Date(date + "T00:00:00").toLocaleDateString("en-US", { month: "long", year: "numeric" })
              : fmtDateLong(date)}
          </h2>
        </div>
        <div className="inline-flex rounded-md border border-border bg-card overflow-hidden">
          <button
            onClick={() => setView("day")}
            className={`px-3 py-1.5 text-sm font-semibold ${view === "day" ? "bg-orange/15 text-orange" : "text-muted-foreground"}`}
          >
            Day
          </button>
          <button
            onClick={() => setView("week")}
            className={`px-3 py-1.5 text-sm font-semibold ${view === "week" ? "bg-orange/15 text-orange" : "text-muted-foreground"}`}
          >
            Week
          </button>
          <button
            onClick={() => setView("month")}
            className={`px-3 py-1.5 text-sm font-semibold ${view === "month" ? "bg-orange/15 text-orange" : "text-muted-foreground"}`}
          >
            Month
          </button>
        </div>
      </div>

      <div className={`grid gap-5 ${view === "month" ? "" : "lg:grid-cols-[2fr_1fr]"}`}>
        {/* Calendar */}
        <div
          className={`rounded-xl border border-border bg-card overflow-hidden ${
            view === "month" ? "block" : "hidden md:block"
          }`}
        >
          {view === "day" ? (
            <DayCalendar
              jobs={todayJobs}
              onSlotClick={(t) => {
                setAddTime(t);
                setAddOpen(true);
              }}
              onJobClick={openLead}
            />
          ) : view === "week" ? (
            <WeekCalendar
              dates={weekDates}
              jobs={jobs}
              onPickDay={(d) => {
                setDate(d);
                setView("day");
              }}
              onJobClick={openLead}
            />
          ) : (
            <MonthCalendar
              year={monthRange.year}
              month={monthRange.month}
              jobs={jobs}
              onPickDay={(d) => {
                setDate(d);
                setView("day");
              }}
            />
          )}
        </div>

        {/* Today's jobs sidebar — hidden in month view */}
        {view !== "month" && (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-display text-lg font-bold">Today's Schedule</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {todayJobs.length} jobs • Est. {(totalMinutes / 60).toFixed(1)} hours
              </p>
            </div>
          </div>

          {loading ? (
            <div className="py-10 flex justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : todayJobs.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No jobs scheduled.
              <br />
              <button onClick={() => setAddOpen(true)} className="text-orange font-semibold mt-2">
                + Add first job
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {todayJobs.map((j, i) => {
                const prev = todayJobs[i - 1];
                const miles = prev ? estDistanceMiles(prev.job_address, j.job_address) : 0;
                const dmin = prev ? driveMinutes(miles) : 0;
                return (
                  <div key={j.id}>
                    {prev && (
                      <div className="flex items-center gap-2 ml-3 mb-2 text-[11px] text-muted-foreground">
                        <div className="w-px h-4 bg-border" />
                        <span>
                          {dmin} min (est.) • {miles.toFixed(1)} mi
                        </span>
                      </div>
                    )}
                    <div
                      onClick={() => openLead(j)}
                      className={`cursor-pointer rounded-lg border border-border bg-background p-3 border-l-4 hover:border-orange/60 transition-colors ${STATUS_BORDER[j.status]}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="inline-flex rounded-full bg-orange/15 text-orange px-2 py-0.5 text-[11px] font-bold">
                          {fmtTime(j.start_time)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleStatus(j);
                          }}
                          className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground hover:text-orange"
                        >
                          {j.status.replace("_", " ")}
                        </button>
                      </div>
                      <div className="font-bold text-[15px]">{j.customer_name}</div>
                      {j.job_address && <div className="text-[13px] text-muted-foreground">{j.job_address}</div>}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          {j.job_type && (
                            <span className="text-[10px] rounded border border-border px-1.5 py-0.5 text-muted-foreground">
                              {j.job_type}
                            </span>
                          )}
                          <span className="text-[10px] text-muted-foreground">{j.duration_minutes} min</span>
                        </div>
                        {j.job_address && (
                          <a
                            href={singleMapsUrl(j.job_address)}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-orange hover:underline"
                          >
                            <Navigation className="h-3 w-3" /> Directions
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {todayJobs.length > 0 && (
            <div className="mt-5 pt-4 border-t border-border space-y-1.5 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Total drive time (est.)</span>
                <span className="font-bold text-foreground">{totalDrive} min</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Total job time</span>
                <span className="font-bold text-foreground">{(totalMinutes / 60).toFixed(1)} hours</span>
              </div>
              <Link
                to="/planner/routes"
                className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-md bg-gradient-orange px-4 py-2 text-sm font-bold text-foreground shadow-orange"
              >
                <RouteIcon className="h-4 w-4" />
                Optimize Route →
              </Link>
            </div>
          )}
        </div>
        )}
      </div>

      {/* Mobile vertical list — hidden in month view (month grid renders on all sizes) */}
      {view !== "month" && (
      <div className="md:hidden mt-5 space-y-3">
        {todayJobs.map((j) => (
          <div key={j.id} className={`rounded-lg border border-border bg-card p-3 border-l-4 ${STATUS_BORDER[j.status]}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="inline-flex rounded-full bg-orange/15 text-orange px-2 py-0.5 text-[11px] font-bold">
                {fmtTime(j.start_time)}
              </span>
              <button onClick={() => toggleStatus(j)} className="text-[10px] uppercase font-bold text-muted-foreground">
                {j.status.replace("_", " ")}
              </button>
            </div>
            <div className="font-bold">{j.customer_name}</div>
            {j.job_address && <div className="text-xs text-muted-foreground">{j.job_address}</div>}
            {j.job_address && (
              <a
                href={singleMapsUrl(j.job_address)}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-orange"
              >
                <Navigation className="h-3 w-3" /> Directions
              </a>
            )}
          </div>
        ))}
      </div>
      )}

      {/* Mobile FAB */}
      <button
        onClick={() => setAddOpen(true)}
        className="md:hidden fixed bottom-6 right-6 h-14 w-14 rounded-full bg-gradient-orange shadow-orange flex items-center justify-center z-40"
        aria-label="Add job"
      >
        <Plus className="h-6 w-6 text-foreground" />
      </button>
    </AppShell>
  );
}

function DayCalendar({ jobs, onSlotClick, onJobClick }: { jobs: ScheduledJob[]; onSlotClick: (t: string) => void; onJobClick: (j: ScheduledJob) => void }) {
  return (
    <div className="relative">
      {HOURS.map((h) => (
        <div key={h} className="flex border-b border-border last:border-b-0" style={{ height: 60 }}>
          <div className="w-16 shrink-0 px-2 py-1 text-[11px] text-muted-foreground border-r border-border">
            {((h + 11) % 12) + 1} {h < 12 ? "AM" : "PM"}
          </div>
          <div className="relative flex-1">
            <button
              onClick={() => onSlotClick(`${String(h).padStart(2, "0")}:00`)}
              className="absolute inset-x-0 top-0 h-[30px] hover:border hover:border-dashed hover:border-orange/50 group flex items-center justify-center"
            >
              <Plus className="h-3 w-3 text-orange opacity-0 group-hover:opacity-100" />
            </button>
            <button
              onClick={() => onSlotClick(`${String(h).padStart(2, "0")}:30`)}
              className="absolute inset-x-0 top-[30px] h-[30px] hover:border hover:border-dashed hover:border-orange/50 group flex items-center justify-center border-t border-dashed border-border/50"
            >
              <Plus className="h-3 w-3 text-orange opacity-0 group-hover:opacity-100" />
            </button>
          </div>
        </div>
      ))}
      {/* Job overlays */}
      <div className="absolute inset-0 pointer-events-none">
        {jobs.map((j) => {
          const [hh, mm] = j.start_time.split(":").map(Number);
          const startMin = hh * 60 + mm - 7 * 60;
          if (startMin < 0) return null;
          const top = (startMin / 60) * 60;
          const height = (j.duration_minutes / 60) * 60 - 2;
          return (
            <div
              key={j.id}
              onClick={() => onJobClick(j)}
              className={`pointer-events-auto cursor-pointer absolute left-[68px] right-2 rounded-md border border-l-4 hover:border-orange/60 transition-colors ${STATUS_BORDER[j.status]} bg-card px-3 py-1.5 shadow-card text-xs overflow-hidden`}
              style={{ top, height }}
            >
              <div className="font-bold text-[13px] text-foreground truncate">{j.customer_name}</div>
              <div className="text-[11px] text-muted-foreground truncate">{j.job_type ?? ""}</div>
              {j.job_address && height > 50 && (
                <div className="text-[11px] text-muted-foreground/70 truncate">{j.job_address}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekCalendar({ dates, jobs, onPickDay, onJobClick }: { dates: string[]; jobs: ScheduledJob[]; onPickDay: (d: string) => void; onJobClick: (j: ScheduledJob) => void }) {
  return (
    <div className="grid grid-cols-[60px_repeat(7,1fr)]">
      <div className="border-b border-r border-border" />
      {dates.map((d) => {
        const day = new Date(d + "T00:00:00");
        return (
          <button
            key={d}
            onClick={() => onPickDay(d)}
            className="border-b border-r border-border last:border-r-0 px-2 py-2 text-left hover:bg-secondary"
          >
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {day.toLocaleDateString("en-US", { weekday: "short" })}
            </div>
            <div className="font-display text-lg font-bold">{day.getDate()}</div>
          </button>
        );
      })}
      {HOURS.map((h) => (
        <Row key={h} hour={h} dates={dates} jobs={jobs} onJobClick={onJobClick} />
      ))}
    </div>
  );
}

function Row({ hour, dates, jobs, onJobClick }: { hour: number; dates: string[]; jobs: ScheduledJob[]; onJobClick: (j: ScheduledJob) => void }) {
  return (
    <>
      <div className="border-b border-r border-border px-2 py-1 text-[10px] text-muted-foreground" style={{ height: 50 }}>
        {((hour + 11) % 12) + 1} {hour < 12 ? "AM" : "PM"}
      </div>
      {dates.map((d) => {
        const dayJobs = jobs.filter((j) => j.scheduled_date === d && Number(j.start_time.split(":")[0]) === hour);
        return (
          <div key={d} className="border-b border-r border-border last:border-r-0 p-1 space-y-1" style={{ height: 50 }}>
            {dayJobs.map((j) => (
              <div
                key={j.id}
                onClick={() => onJobClick(j)}
                className={`cursor-pointer rounded border-l-2 hover:bg-secondary ${STATUS_BORDER[j.status]} bg-background px-1.5 py-0.5 text-[10px] font-semibold truncate`}
              >
                {j.customer_name}
              </div>
            ))}
          </div>
        );
      })}
    </>
  );
}

function MonthCalendar({
  year,
  month,
  jobs,
  onPickDay,
}: {
  year: number;
  month: number;
  jobs: ScheduledJob[];
  onPickDay: (d: string) => void;
}) {
  const today = todayISO();
  const first = new Date(year, month, 1);
  const startWeekday = first.getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const iso = (y: number, m: number, d: number) =>
    `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const prevMonthDays = new Date(year, month, 0).getDate();
  const cells: { iso: string; inMonth: boolean }[] = [];
  for (let i = startWeekday - 1; i >= 0; i--) {
    const dn = prevMonthDays - i;
    const py = month === 0 ? year - 1 : year;
    const pm = month === 0 ? 11 : month - 1;
    cells.push({ iso: iso(py, pm, dn), inMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ iso: iso(year, month, d), inMonth: true });
  }
  let nextDay = 1;
  while (cells.length % 7 !== 0) {
    const ny = month === 11 ? year + 1 : year;
    const nm = month === 11 ? 0 : month + 1;
    cells.push({ iso: iso(ny, nm, nextDay++), inMonth: false });
  }

  const counts = jobs.reduce<Record<string, number>>((acc, j) => {
    acc[j.scheduled_date] = (acc[j.scheduled_date] ?? 0) + 1;
    return acc;
  }, {});

  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div>
      <div className="grid grid-cols-7 border-b border-border">
        {dayLabels.map((d) => (
          <div key={d} className="px-2 py-2 text-[10px] uppercase tracking-wider text-muted-foreground text-center">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((cell, i) => {
          const count = counts[cell.iso] ?? 0;
          const isToday = cell.iso === today;
          const dayNum = Number(cell.iso.slice(-2));
          return (
            <button
              key={i}
              onClick={() => onPickDay(cell.iso)}
              className={`h-20 md:h-24 border-b border-r border-border p-2 text-left hover:bg-secondary transition-colors flex flex-col ${
                !cell.inMonth ? "bg-background/30 text-muted-foreground/50" : ""
              } ${cell.inMonth && count > 0 ? "bg-orange/5 border-l-2 border-l-orange/50" : ""} ${
                isToday ? "ring-2 ring-orange ring-inset" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-sm font-bold ${isToday ? "text-orange" : ""}`}>{dayNum}</span>
                {cell.inMonth && count > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full bg-orange text-[10px] font-bold text-foreground">
                    {count}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}