import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, StatusBadge, ProgressBar, fmtUsd } from "@/components/masmer/AppShell";
import { useRequireAuth } from "@/components/masmer/useRequireAuth";
import { Plus, FolderKanban, DollarSign, Clock, Sparkles, Loader2 } from "lucide-react";

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

function DashboardPage() {
  const ready = useRequireAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;
    supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setProjects((data ?? []) as Project[]);
        setLoading(false);
      });
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