import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, StatusBadge, ProgressBar, fmtUsd } from "@/components/masmer/AppShell";
import { useRequireAuth } from "@/components/masmer/useRequireAuth";
import { useDemo } from "@/components/masmer/DemoContext";
import { VapiCard } from "@/components/masmer/VapiCard";
import { OnboardingWizard, hasCompletedOnboarding } from "@/components/masmer/OnboardingWizard";
import { Plus, FolderKanban, DollarSign, Clock, Sparkles, Loader2, PhoneIncoming } from "lucide-react";

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
};

const SAMPLE_PROJECTS = [
  {
    customer_name: "Sarah Johnson",
    customer_address: "142 Oak Street, Binghamton NY",
    project_title: "Kitchen & Bathroom Renovation",
    status: "in_progress",
    progress_pct: 60,
    contract_total: 24500,
    deposit_paid: true,
    payment1_paid: true,
  },
  {
    customer_name: "Mike Rodriguez",
    customer_address: "89 Elm Ave, Endicott NY",
    project_title: "Exterior Siding & Roofing",
    status: "new",
    progress_pct: 0,
    contract_total: 36800,
    deposit_paid: true,
  },
  {
    customer_name: "The Williams Family",
    customer_address: "334 Pine Road, Vestal NY",
    project_title: "Full Interior Renovation",
    status: "completed",
    progress_pct: 100,
    contract_total: 18200,
    deposit_paid: true,
    payment1_paid: true,
    payment2_paid: true,
    payment3_paid: true,
    final_paid: true,
  },
];

function fmtDuration(sec: number | null) {
  if (!sec) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

function DashboardPage() {
  const ready = useRequireAuth();
  const { isDemo, invite } = useDemo();
  const [projects, setProjects] = useState<Project[]>([]);
  const [calls, setCalls] = useState<CallRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    (async () => {
      const { data: projData } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });
      if (cancelled) return;
      let projectsList = (projData ?? []) as Project[];

      // Seed sample projects for demo users on first visit
      if (isDemo && projectsList.length === 0) {
        const { data: seeded } = await supabase
          .from("projects")
          .insert(SAMPLE_PROJECTS as any)
          .select();
        if (seeded) projectsList = seeded as Project[];
      }
      setProjects(projectsList);

      const { data: callsData } = await (supabase as any)
        .from("calls")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(3);
      if (!cancelled) setCalls((callsData ?? []) as CallRow[]);

      setLoading(false);

      // Show onboarding wizard once for demo users
      if (isDemo && !hasCompletedOnboarding()) {
        setShowOnboarding(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, isDemo]);

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
      {showOnboarding && (
        <OnboardingWizard
          inviteeName={invite?.invitee_name ?? "there"}
          onClose={() => setShowOnboarding(false)}
        />
      )}

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
              <div key={c.id} className="px-5 py-4">
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
              </div>
            ))}
          </div>
        </div>
      )}

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
