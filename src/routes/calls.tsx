import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/masmer/AppShell";
import { useRequireAuth } from "@/components/masmer/useRequireAuth";
import { Search, Loader2, Phone, Copy, ArrowRight, FolderPlus } from "lucide-react";
import { toast } from "sonner";
import { CustomerLeadPipe } from "@/components/masmer/CustomerLeadPipe";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/calls")({
  head: () => ({
    meta: [
      { title: "AI Call Leads — Masmer AI" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CallsPage,
});

type Call = {
  id: string;
  created_at: string;
  caller_name: string | null;
  caller_phone: string | null;
  job_type: string | null;
  job_address: string | null;
  estimated_budget: string | null;
  ai_summary: string | null;
  transcript: string | null;
  call_duration: number | null;
  lead_status: string | null;
  lead_score: number | null;
};

const STATUSES = ["new", "contacted", "booked", "lost"] as const;
type LeadStatus = (typeof STATUSES)[number];

function fmtDuration(s: number | null) {
  const sec = s ?? 0;
  const m = Math.floor(sec / 60);
  const r = sec % 60;
  return `${m}m ${r}s`;
}

function statusBadgeClass(s: string | null) {
  if (s === "booked") return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
  if (s === "lost") return "bg-muted text-muted-foreground border-border";
  return "bg-blue-500/15 text-blue-400 border-blue-500/30";
}

function CallsPage() {
  const ready = useRequireAuth();
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | LeadStatus>("all");
  const [openCall, setOpenCall] = useState<Call | null>(null);
  const [pipeCall, setPipeCall] = useState<Call | null>(null);
  const [convertCall, setConvertCall] = useState<Call | null>(null);
  const [form, setForm] = useState({
    customer_name: "",
    customer_address: "",
    project_title: "",
    contract_total: "",
    deposit: "1000",
  });
  const [creating, setCreating] = useState(false);
  const [projectIdByCall, setProjectIdByCall] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!ready) return;
    supabase
      .from("calls")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setCalls((data ?? []) as Call[]);
        setLoading(false);
      });
  }, [ready]);

  const filtered = useMemo(() => {
    return calls.filter((c) => {
      if (filter !== "all" && (c.lead_status ?? "new") !== filter) return false;
      if (q) {
        const hay = `${c.caller_name ?? ""} ${c.caller_phone ?? ""}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [calls, q, filter]);

  async function updateStatus(id: string, status: LeadStatus) {
    setCalls((prev) => prev.map((c) => (c.id === id ? { ...c, lead_status: status } : c)));
    const { error } = await supabase.from("calls").update({ lead_status: status }).eq("id", id);
    if (error) {
      toast.error("Failed to update status");
    } else {
      toast.success(`Marked as ${status}`);
    }
  }

  function openConvert(c: Call) {
    setForm({
      customer_name: c.caller_name ?? "",
      customer_address: c.job_address ?? "",
      project_title: c.job_type ? `${c.job_type} Project` : "New Project",
      contract_total: "",
      deposit: "1000",
    });
    setConvertCall(c);
  }

  async function createProject() {
    if (!convertCall) return;
    if (!form.customer_name.trim() || !form.project_title.trim()) {
      toast.error("Customer name and project title are required");
      return;
    }
    setCreating(true);
    const { data, error } = await supabase
      .from("projects")
      .insert({
        customer_name: form.customer_name,
        customer_address: form.customer_address || null,
        project_title: form.project_title,
        contract_total: Number(form.contract_total) || 0,
        deposit: Number(form.deposit) || 0,
        status: "new",
        progress_pct: 0,
        deposit_paid: false,
        payment1_paid: false,
        payment2_paid: false,
        payment3_paid: false,
        final_paid: false,
      })
      .select("id")
      .single();
    if (error || !data) {
      setCreating(false);
      toast.error("Failed to create project");
      return;
    }
    await supabase.from("calls").update({ lead_status: "booked" }).eq("id", convertCall.id);
    setCalls((prev) => prev.map((c) => (c.id === convertCall.id ? { ...c, lead_status: "booked" } : c)));
    setProjectIdByCall((prev) => ({ ...prev, [convertCall.id]: data.id }));
    setCreating(false);
    setConvertCall(null);
    toast.success("Project created!");
  }

  function copyAll(c: Call) {
    const text = [
      `Caller: ${c.caller_name ?? "Unknown"}`,
      `Phone: ${c.caller_phone ?? "—"}`,
      `Job Type: ${c.job_type ?? "—"}`,
      `Job Address: ${c.job_address ?? "—"}`,
      `Estimated Budget: ${c.estimated_budget ?? "—"}`,
      `Duration: ${fmtDuration(c.call_duration)}`,
      `Lead Status: ${c.lead_status ?? "new"}`,
      `Lead Score: ${c.lead_score ?? 0}`,
      "",
      "AI Summary:",
      c.ai_summary ?? "—",
      "",
      "Transcript:",
      c.transcript ?? "—",
    ].join("\n");
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  }

  if (!ready) return null;

  const filters: Array<{ key: "all" | LeadStatus; label: string }> = [
    { key: "all", label: "All" },
    { key: "new", label: "New" },
    { key: "contacted", label: "Contacted" },
    { key: "booked", label: "Booked" },
    { key: "lost", label: "Lost" },
  ];

  return (
    <AppShell title="AI Call Leads">
      <div className="flex flex-col gap-3 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by caller name or phone..."
            className="w-full rounded-md border border-border bg-card pl-10 pr-4 py-2.5 text-sm focus:border-orange focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  active
                    ? "bg-orange/15 border-orange/60 text-orange"
                    : "bg-card border-border text-muted-foreground hover:border-orange/40"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="inline h-6 w-6 animate-spin text-orange" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
          No calls found.
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => {
            const status = (c.lead_status ?? "new") as LeadStatus;
            return (
              <div key={c.id} className="rounded-xl border border-border bg-card p-5 shadow-card flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{c.caller_name ?? "Unknown caller"}</p>
                    <p className="font-mono text-xs text-muted-foreground truncate flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {c.caller_phone ?? "—"}
                    </p>
                  </div>
                  <span className={`shrink-0 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${statusBadgeClass(status)}`}>
                    {status}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {c.job_type && (
                    <span className="inline-flex items-center rounded-md border border-orange/50 px-2 py-0.5 text-xs font-semibold text-orange">
                      {c.job_type}
                    </span>
                  )}
                  {c.lead_score !== null && c.lead_score !== undefined && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      Score: <span className="font-bold text-foreground">{c.lead_score}</span>
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">{fmtDuration(c.call_duration)}</span>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2">
                  {c.ai_summary ?? "No summary available."}
                </p>

                <p className="text-xs text-muted-foreground">
                  {new Date(c.created_at).toLocaleString()}
                </p>

                <div className="flex flex-wrap gap-1.5">
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => updateStatus(c.id, s)}
                      className={`rounded-md border px-2 py-1 text-[11px] font-semibold capitalize transition-colors ${
                        status === s
                          ? "bg-orange/15 border-orange/60 text-orange"
                          : "bg-secondary border-border text-muted-foreground hover:border-orange/40"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setPipeCall(c)}
                  className="mt-auto inline-flex items-center justify-center rounded-md border border-orange/60 px-4 py-2 text-sm font-bold text-orange hover:bg-orange/10 transition-colors"
                >
                  View Details
                </button>

                {projectIdByCall[c.id] ? (
                  <Link
                    to="/projects/$id"
                    params={{ id: projectIdByCall[c.id] }}
                    className="inline-flex items-center justify-center gap-1 rounded-md bg-emerald-500/15 border border-emerald-500/40 px-4 py-2 text-sm font-bold text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                  >
                    View Project <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : status !== "booked" ? (
                  <button
                    onClick={() => openConvert(c)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-md bg-gradient-orange px-4 py-2 text-sm font-bold text-foreground shadow-orange hover:scale-[1.02] transition-transform"
                  >
                    <FolderPlus className="h-4 w-4" />
                    Convert to Project
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      <Sheet open={!!openCall} onOpenChange={(o) => !o && setOpenCall(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto bg-card border-border">
          {openCall && (
            <>
              <SheetHeader>
                <SheetTitle>{openCall.caller_name ?? "Unknown caller"}</SheetTitle>
                <SheetDescription className="font-mono">
                  {openCall.caller_phone ?? "—"}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-5">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Job Address</p>
                    <p className="font-medium">{openCall.job_address ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Estimated Budget</p>
                    <p className="font-medium">{openCall.estimated_budget ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Job Type</p>
                    <p className="font-medium">{openCall.job_type ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="font-medium">{fmtDuration(openCall.call_duration)}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">AI Summary</p>
                  <p className="text-sm whitespace-pre-wrap rounded-md border border-border bg-secondary p-3">
                    {openCall.ai_summary ?? "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Transcript</p>
                  <pre className="text-xs font-mono whitespace-pre-wrap rounded-md border border-border bg-secondary p-3 max-h-96 overflow-y-auto">
{openCall.transcript ?? "—"}
                  </pre>
                </div>

                <button
                  onClick={() => copyAll(openCall)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-orange/60 px-4 py-2 text-sm font-bold text-orange hover:bg-orange/10 transition-colors"
                >
                  <Copy className="h-4 w-4" />
                  Copy All
                </button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <CustomerLeadPipe
        open={!!pipeCall}
        onClose={() => setPipeCall(null)}
        customerName={pipeCall?.caller_name ?? "Unknown"}
        phone={pipeCall?.caller_phone ?? null}
        address={pipeCall?.job_address ?? null}
      />

      <Dialog open={!!convertCall} onOpenChange={(o) => !o && !creating && setConvertCall(null)}>
        <DialogContent className="bg-card border-border sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Project from Call</DialogTitle>
            <DialogDescription>
              Review and edit the details, then create a project.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Customer Name</label>
              <input
                value={form.customer_name}
                onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                className="mt-1 w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm focus:border-orange focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Customer Address</label>
              <input
                value={form.customer_address}
                onChange={(e) => setForm({ ...form, customer_address: e.target.value })}
                className="mt-1 w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm focus:border-orange focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Project Title</label>
              <input
                value={form.project_title}
                onChange={(e) => setForm({ ...form, project_title: e.target.value })}
                className="mt-1 w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm focus:border-orange focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contract Total ($)</label>
                <input
                  type="number"
                  value={form.contract_total}
                  onChange={(e) => setForm({ ...form, contract_total: e.target.value })}
                  placeholder="0"
                  className="mt-1 w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm focus:border-orange focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Deposit ($)</label>
                <input
                  type="number"
                  value={form.deposit}
                  onChange={(e) => setForm({ ...form, deposit: e.target.value })}
                  className="mt-1 w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm focus:border-orange focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              onClick={() => setConvertCall(null)}
              disabled={creating}
              className="rounded-md border border-border bg-secondary px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={createProject}
              disabled={creating}
              className="inline-flex items-center gap-2 rounded-md bg-gradient-orange px-4 py-2 text-sm font-bold text-foreground shadow-orange hover:scale-[1.02] transition-transform disabled:opacity-60"
            >
              {creating && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Project
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}