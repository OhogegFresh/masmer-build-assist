import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, StatusBadge, ProgressBar, fmtUsd } from "@/components/masmer/AppShell";
import { useRequireAuth } from "@/components/masmer/useRequireAuth";
import { Search, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "Projects — Masmer AI" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProjectsPage,
});

type Project = {
  id: string;
  customer_name: string;
  customer_address: string | null;
  project_title: string;
  status: string;
  progress_pct: number;
  contract_total: number;
  deposit_paid: boolean;
  payment1_paid: boolean;
  payment2_paid: boolean;
  payment3_paid: boolean;
  final_paid: boolean;
};

const milestones = [
  { key: "deposit_paid", label: "Deposit" },
  { key: "payment1_paid", label: "P1" },
  { key: "payment2_paid", label: "P2" },
  { key: "payment3_paid", label: "P3" },
  { key: "final_paid", label: "Final" },
] as const;

function ProjectsPage() {
  const ready = useRequireAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");

  useEffect(() => {
    if (!ready) return;
    supabase.from("projects").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      setProjects((data ?? []) as Project[]);
      setLoading(false);
    });
  }, [ready]);

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (status !== "all" && p.status !== status) return false;
      if (q && !`${p.customer_name} ${p.project_title} ${p.customer_address ?? ""}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [projects, q, status]);

  type MilestoneKey = (typeof milestones)[number]["key"];
  async function toggle(id: string, key: MilestoneKey, val: boolean) {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, [key]: val } : p)));
    const { error } = await supabase.from("projects").update({ [key]: val } as Record<MilestoneKey, boolean>).eq("id", id);
    if (error) toast.error("Failed to save");
  }

  if (!ready) return null;

  const STATUS_OPTIONS = [
    { value: "all", label: "All" },
    { value: "new", label: "New" },
    { value: "in_progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
  ] as const;

  return (
    <AppShell
      title={`Projects${loading ? "" : ` · ${filtered.length} ${filtered.length === 1 ? "project" : "projects"}`}`}
      action={
        <Link to="/estimate" className="inline-flex items-center gap-2 rounded-md bg-gradient-orange px-4 py-2 text-sm font-bold text-foreground shadow-orange hover:scale-[1.02] transition-transform">
          <Plus className="h-4 w-4" />
          New Project
        </Link>
      }
    >
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by customer, title, or address..."
            className="w-full rounded-md border border-border bg-card pl-10 pr-4 py-2.5 text-sm focus:border-orange focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((opt) => {
            const active = status === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStatus(opt.value)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                  active
                    ? "bg-orange/15 border-orange text-orange"
                    : "bg-card border-border text-muted-foreground hover:border-orange/40 hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center"><Loader2 className="inline h-6 w-6 animate-spin text-orange" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">No projects match your search.</div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => (
            <div key={p.id} className="rounded-xl border border-border bg-card p-5 shadow-card flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{p.customer_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{p.customer_address ?? "—"}</p>
                </div>
                <StatusBadge status={p.status} />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold leading-tight">{p.project_title}</h3>
                <p className="mt-1 text-2xl font-bold text-orange">{fmtUsd(p.contract_total)}</p>
              </div>
              <ProgressBar value={p.progress_pct} />
              <div className="flex flex-wrap gap-2">
                {milestones.map((m) => {
                  const checked = (p as unknown as Record<string, boolean>)[m.key];
                  return (
                    <label
                      key={m.key}
                      className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold cursor-pointer transition-colors ${
                        checked ? "bg-orange/15 border-orange/50 text-orange" : "bg-secondary border-border text-muted-foreground hover:border-orange/40"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={checked}
                        onChange={(e) => toggle(p.id, m.key, e.target.checked)}
                      />
                      {m.label}
                    </label>
                  );
                })}
              </div>
              <Link
                to="/projects/$id"
                params={{ id: p.id }}
                className="mt-auto inline-flex items-center justify-center rounded-md border border-orange/60 px-4 py-2 text-sm font-bold text-orange hover:bg-orange/10 transition-colors"
              >
                View Details
              </Link>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}