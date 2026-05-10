import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, StatusBadge, ProgressBar, fmtUsd } from "@/components/masmer/AppShell";
import { useRequireAuth } from "@/components/masmer/useRequireAuth";
import { VapiCard } from "@/components/masmer/VapiCard";
import { Plus, FolderKanban, DollarSign, Clock, Sparkles, Loader2, PhoneIncoming, Copy, Check } from "lucide-react";
import { CalendarDays, Navigation } from "lucide-react";
import { ScheduledJob, fmtTime, todayISO, singleMapsUrl } from "@/components/masmer/planner/types";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Masmer AI" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardPage,
});

type Project = {
  id: string;
  customer_name: string;
  customer_address: string | null;
  project_title: string;
  status: string;
  progress_pct: number;
  contract_total: number;
  deposit: number;
  deposit_paid: boolean;
  payment1_paid: boolean;
  payment2_paid: boolean;
  payment3_paid: boolean;
  final_paid: boolean;
  created_at: string;
};

type CallRow = {
  id: string;
  caller_name: string | null;
  caller_phone: string | null;
  call_duration: number | null;
  ai_summary: string | null;
  job_type: string | null;
  lead_status: string | null;
  lead_score: number | null;
  created_at: string;
  transcript?: string | null;
  job_address?: string | null;
  estimated_budget?: string | null;
};

function fmtDuration(sec: number | null) {
  if (!sec) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

function DashboardPage() {
  const ready = useRequireAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [calls, setCalls] = useState<CallRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCall, setSelectedCall] = useState<CallRow | null>(null);
  const [copied, setCopied] = useState(false);
  const [todayJobs, setTodayJobs] = useState<ScheduledJob[]>([]);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    (async () => {
      const { data: projData } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });
      if (cancelled) return;
      setProjects((projData ?? []) as Project[]);

      const { data: callsData } = await (supabase as any)
        .from("calls")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(3);
      if (!cancelled) setCalls((callsData ?? []) as CallRow[]);

      const { data: jobsData } = await (supabase as any)
        .from("scheduled_jobs")
        .select("*")
        .eq("scheduled_date", todayISO())
        .order("start_time")
        .limit(3);
      if (!cancelled) setTodayJobs((jobsData ?? []) as ScheduledJob[]);

      setLoading(false);
    })();

    const channel = supabase
      .channel("calls-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "calls" },
        (payload) => {
          const newCall = payload.new as CallRow;
          setCalls((prev) => [newCall, ...prev].slice(0, 3));
          toast("📞 New call received");
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [ready]);

  if (!ready) return null;

  const active = projects.filter((p) => p.status === "in_progress").length;
  const newLeads = projects.filter((p) => p.status === "new").length;
  const revenue = projects
    .filter((p) => p.final_paid)
    .reduce((s, p) => s + Number(p.contract_total), 0);
  const pending = projects.reduce((s, p) => {
    const t = Number(p.contract_total);
    let unpaid = 0;
    if (!p.deposit_paid) unpaid += Number(p.deposit);
    if (!p.payment1_paid) unpaid += t * 0.5;
    if (!p.payment2_paid) unpaid += t * 0.25;
    if (!p.payment3_paid) unpaid += t * 0.15;
    if (!p.final_paid) unpaid += t * 0.1;
    return s + unpaid;
  }, 0);

  const stats = [
    { label: "Active Projects", value: active.toString(), icon: FolderKanban },
    { label: "Total Revenue", value: fmtUsd(revenue), icon: DollarSign },
    { label: "Pending Payments", value: fmtUsd(pending), icon: Clock },
    { label: "New Leads", value: newLeads.toString(), icon: Sparkles },
  ];

  return (
    <AppShell
      title="Dashboard"
      action={
        <Link
          to="/estimate"
          className="inline-flex items-center gap-2 rounded-md bg-gradient-orange px-4 py-2 text-sm font-bold text-foreground shadow-orange hover:scale-[1.02] transition-transform"
        >
          <Plus className="h-4 w-4" />
          New Project
        </Link>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
              <div className="h-8 w-8 rounded-md bg-orange/15 text-orange flex items-center justify-center">
                <s.icon className="h-4 w-4" />
              </div>
            </div>
            <p className="font-display mt-3 text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mb-6">
        <VapiCard />
      </div>

      {calls.length > 0 && (
        <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-display text-lg font-bold flex items-center gap-2">
              <PhoneIncoming className="h-4 w-4 text-orange" />
              Recent AI Calls
            </h2>
            <span className="text-xs text-muted-foreground">Last {calls.length}</span>
          </div>
          <div className="divide-y divide-border">
            {calls.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => { setSelectedCall(c); setCopied(false); }}
                className="w-full text-left px-5 py-4 hover:bg-muted/30 transition-colors focus:outline-none focus:bg-muted/40"
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="font-semibold">{c.caller_name ?? "Unknown caller"}</div>
                    <div className="text-xs text-muted-foreground font-mono">{c.caller_phone}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {c.job_type && (
                      <span className="rounded-full border border-orange/40 text-orange px-2 py-0.5 text-xs">{c.job_type}</span>
                    )}
                    {c.lead_status === "booked" ? (
                      <span className="rounded-full bg-green-500/15 text-green-400 border border-green-500/40 px-2 py-0.5 text-xs font-semibold">Booked</span>
                    ) : (
                      <span className="rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/40 px-2 py-0.5 text-xs font-semibold">{c.lead_status ?? "new"}</span>
                    )}
                    <span className="text-xs text-muted-foreground">{fmtDuration(c.call_duration)}</span>
                  </div>
                </div>
                {c.ai_summary && (
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{c.ai_summary}</p>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <Sheet open={!!selectedCall} onOpenChange={(o) => !o && setSelectedCall(null)}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto bg-card border-border">
          {selectedCall && (
            <>
              <SheetHeader className="text-left">
                <SheetTitle className="font-display text-2xl flex items-center gap-2">
                  <PhoneIncoming className="h-5 w-5 text-orange" />
                  {selectedCall.caller_name ?? "Unknown caller"}
                </SheetTitle>
                <SheetDescription className="font-mono text-xs">
                  {selectedCall.caller_phone} · {fmtDuration(selectedCall.call_duration)} · {new Date(selectedCall.created_at).toLocaleString()}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 flex flex-wrap gap-2">
                {selectedCall.job_type && (
                  <span className="rounded-full border border-orange/40 text-orange px-2 py-0.5 text-xs">{selectedCall.job_type}</span>
                )}
                {selectedCall.estimated_budget && (
                  <span className="rounded-full border border-border px-2 py-0.5 text-xs">{selectedCall.estimated_budget}</span>
                )}
                {selectedCall.lead_status === "booked" ? (
                  <span className="rounded-full bg-green-500/15 text-green-400 border border-green-500/40 px-2 py-0.5 text-xs font-semibold">Booked</span>
                ) : (
                  <span className="rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/40 px-2 py-0.5 text-xs font-semibold">{selectedCall.lead_status ?? "new"}</span>
                )}
              </div>

              {selectedCall.job_address && (
                <div className="mt-4 text-sm">
                  <span className="text-muted-foreground">Address: </span>
                  <span>{selectedCall.job_address}</span>
                </div>
              )}

              <div className="mt-6">
                <h3 className="font-display text-sm uppercase tracking-wider text-muted-foreground mb-2">AI Summary</h3>
                <div className="rounded-lg border border-border bg-background/50 p-4 text-sm whitespace-pre-wrap">
                  {selectedCall.ai_summary || <span className="text-muted-foreground italic">No summary available.</span>}
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-display text-sm uppercase tracking-wider text-muted-foreground">Transcript</h3>
                  <button
                    type="button"
                    onClick={async () => {
                      const text = `Caller: ${selectedCall.caller_name ?? "Unknown"} (${selectedCall.caller_phone ?? ""})\nDate: ${new Date(selectedCall.created_at).toLocaleString()}\nDuration: ${fmtDuration(selectedCall.call_duration)}\n\n--- AI SUMMARY ---\n${selectedCall.ai_summary ?? "(none)"}\n\n--- TRANSCRIPT ---\n${selectedCall.transcript ?? "(none)"}`;
                      try {
                        await navigator.clipboard.writeText(text);
                        setCopied(true);
                        toast.success("Copied to clipboard");
                        setTimeout(() => setCopied(false), 2000);
                      } catch {
                        toast.error("Failed to copy");
                      }
                    }}
                    className="inline-flex items-center gap-1.5 rounded-md border border-orange/40 text-orange px-3 py-1.5 text-xs font-semibold hover:bg-orange/10 transition-colors"
                  >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? "Copied" : "Copy all"}
                  </button>
                </div>
                <div className="rounded-lg border border-border bg-background/50 p-4 text-sm whitespace-pre-wrap font-mono max-h-[40vh] overflow-y-auto">
                  {selectedCall.transcript || <span className="text-muted-foreground italic font-sans">No transcript available.</span>}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-display text-lg font-bold flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-orange" />
            Today's Schedule
          </h2>
          <Link to="/planner" className="text-sm text-orange hover:text-orange/80">View Full Planner →</Link>
        </div>
        {todayJobs.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-muted-foreground mb-3">No jobs scheduled today</p>
            <Link
              to="/planner"
              className="inline-flex items-center gap-2 rounded-md bg-gradient-orange px-4 py-2 text-sm font-bold text-foreground shadow-orange"
            >
              <Plus className="h-4 w-4" /> Plan your day →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {todayJobs.map((j) => (
              <div key={j.id} className="px-5 py-3 flex items-center gap-3">
                <span className="inline-flex rounded-full bg-orange/15 text-orange px-2 py-0.5 text-[11px] font-bold shrink-0">
                  {fmtTime(j.start_time)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm truncate">{j.customer_name}</div>
                  {j.job_address && <div className="text-xs text-muted-foreground truncate">{j.job_address}</div>}
                </div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground hidden sm:inline">
                  {j.status.replace("_", " ")}
                </span>
                {j.job_address && (
                  <a
                    href={singleMapsUrl(j.job_address)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-orange hover:text-orange/80"
                    aria-label="Directions"
                  >
                    <Navigation className="h-4 w-4" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Recent Projects</h2>
          <Link to="/projects" className="text-sm text-orange hover:text-orange/80">View all</Link>
        </div>
        {loading ? (
          <div className="py-12 text-center"><Loader2 className="inline h-5 w-5 animate-spin text-orange" /></div>
        ) : projects.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-sm">No projects yet. Click "New Project" to start.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 text-left">Customer</th>
                  <th className="px-5 py-3 text-left">Address</th>
                  <th className="px-5 py-3 text-left">Project</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-left w-40">Progress</th>
                  <th className="px-5 py-3 text-right">Total</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {projects.slice(0, 8).map((p) => (
                  <tr key={p.id} className="border-t border-border hover:bg-secondary/50">
                    <td className="px-5 py-4 font-medium">{p.customer_name}</td>
                    <td className="px-5 py-4 text-muted-foreground">{p.customer_address ?? "—"}</td>
                    <td className="px-5 py-4">{p.project_title}</td>
                    <td className="px-5 py-4"><StatusBadge status={p.status} /></td>
                    <td className="px-5 py-4"><ProgressBar value={p.progress_pct} /></td>
                    <td className="px-5 py-4 text-right font-bold">{fmtUsd(p.contract_total)}</td>
                    <td className="px-5 py-4 text-right">
                      <Link to="/projects/$id" params={{ id: p.id }} className="text-orange hover:text-orange/80 text-sm font-semibold">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
