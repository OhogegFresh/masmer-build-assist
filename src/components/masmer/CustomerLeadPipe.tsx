import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Loader2,
  Phone,
  MapPin,
  Sparkles,
  FileText,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Calendar,
  PhoneCall,
  FolderKanban,
  Copy,
  Check,
  RefreshCw,
} from "lucide-react";

export interface CustomerLeadPipeProps {
  open: boolean;
  onClose: () => void;
  customerName: string;
  phone?: string | null;
  address?: string | null;
}

type CallRow = {
  id: string;
  created_at: string;
  caller_name: string | null;
  caller_phone: string | null;
  job_type: string | null;
  ai_summary: string | null;
  call_duration: number | null;
  lead_status: string | null;
};

type ProjectRow = {
  id: string;
  customer_name: string;
  project_title: string;
  status: string;
  progress_pct: number;
  contract_total: number;
  created_at: string;
};

type JobRow = {
  id: string;
  customer_name: string;
  scheduled_date: string;
  start_time: string;
  job_type: string | null;
  status: string;
};

function fmtDur(s: number | null) {
  const sec = s ?? 0;
  const m = Math.floor(sec / 60);
  return `${m}m ${sec % 60}s`;
}

function statusBadge(s: string | null) {
  const v = (s ?? "").toLowerCase();
  if (v === "booked" || v === "completed") return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
  if (v === "lost") return "bg-muted text-muted-foreground border-border";
  if (v === "contacted" || v === "in_progress") return "bg-blue-500/15 text-blue-400 border-blue-500/30";
  return "bg-orange/15 text-orange border-orange/30";
}

export function CustomerLeadPipe({ open, onClose, customerName, phone, address }: CustomerLeadPipeProps) {
  const [loading, setLoading] = useState(false);
  const [calls, setCalls] = useState<CallRow[]>([]);
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [followupOpen, setFollowupOpen] = useState(false);
  const [followupLoading, setFollowupLoading] = useState(false);
  const [followupError, setFollowupError] = useState<string | null>(null);
  const [followup, setFollowup] = useState<{ sms: string; email: { subject: string; body: string } } | null>(null);
  const [copied, setCopied] = useState<"sms" | "email" | null>(null);

  useEffect(() => {
    if (!open || !customerName) return;
    let cancelled = false;
    setLoading(true);

    const callsQ = phone
      ? supabase
          .from("calls")
          .select("*")
          .or(`caller_name.eq.${customerName},caller_phone.eq.${phone}`)
          .order("created_at", { ascending: false })
      : supabase
          .from("calls")
          .select("*")
          .eq("caller_name", customerName)
          .order("created_at", { ascending: false });

    Promise.all([
      callsQ,
      supabase.from("projects").select("*").eq("customer_name", customerName).order("created_at", { ascending: false }),
      supabase.from("scheduled_jobs").select("*").eq("customer_name", customerName).order("scheduled_date", { ascending: false }),
    ]).then(([c, p, j]) => {
      if (cancelled) return;
      setCalls((c.data ?? []) as CallRow[]);
      setProjects((p.data ?? []) as ProjectRow[]);
      setJobs((j.data ?? []) as JobRow[]);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [open, customerName, phone]);

  async function generateFollowup() {
    setFollowupLoading(true);
    setFollowupError(null);
    setFollowup(null);
    try {
      const latestCall = calls[0];
      const latestProject = projects[0];
      const { data, error } = await supabase.functions.invoke("generate-followup", {
        body: {
          customer_name: customerName,
          call_summary: latestCall?.ai_summary ?? null,
          project_title: latestProject?.project_title ?? null,
          project_status: latestProject?.status ?? null,
          last_call_date: latestCall?.created_at ?? null,
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setFollowup(data as any);
    } catch (e: any) {
      setFollowupError(e?.message ?? "Failed to generate follow-up");
    } finally {
      setFollowupLoading(false);
    }
  }

  function openFollowup() {
    setFollowupOpen(true);
    if (!followup && !followupLoading) generateFollowup();
  }

  async function copyText(text: string, which: "sms" | "email") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-lg p-0 bg-card border-border flex flex-col h-full"
        >
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <SheetTitle className="font-display text-2xl font-bold truncate">{customerName}</SheetTitle>
                <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                  {phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3 w-3 text-orange" /> {phone}
                    </div>
                  )}
                  {address && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3 w-3 text-orange" /> {address}
                    </div>
                  )}
                </div>
              </div>
              <span className="shrink-0 rounded-full bg-orange/15 border border-orange/40 text-orange px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider">
                Lead Pipe
              </span>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-7">
            {loading ? (
              <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin text-orange" />
                <p className="text-sm">Loading customer pipeline…</p>
              </div>
            ) : (
              <>
                {/* Calls */}
                <section>
                  <h3 className="font-display text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-3">
                    <PhoneCall className="h-3.5 w-3.5 text-orange" />
                    Calls & Lead History
                  </h3>
                  {calls.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">No call history found.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {calls.map((c) => {
                        const isOpen = !!expanded[c.id];
                        return (
                          <div key={c.id} className="rounded-lg border border-border bg-background p-3">
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <span className="text-xs text-muted-foreground">
                                {new Date(c.created_at).toLocaleString()}
                              </span>
                              <span className="text-[11px] text-muted-foreground">{fmtDur(c.call_duration)}</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              {c.job_type && (
                                <span className="rounded border border-border bg-secondary px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                  {c.job_type}
                                </span>
                              )}
                              {c.lead_status && (
                                <span className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold capitalize ${statusBadge(c.lead_status)}`}>
                                  {c.lead_status}
                                </span>
                              )}
                            </div>
                            {c.ai_summary && (
                              <>
                                <p className={`text-sm text-foreground/90 ${isOpen ? "" : "line-clamp-2"}`}>
                                  {c.ai_summary}
                                </p>
                                <button
                                  onClick={() => setExpanded((p) => ({ ...p, [c.id]: !isOpen }))}
                                  className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-orange hover:underline"
                                >
                                  {isOpen ? <>Less <ChevronUp className="h-3 w-3" /></> : <>More <ChevronDown className="h-3 w-3" /></>}
                                </button>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

                {/* Projects */}
                <section>
                  <h3 className="font-display text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-3">
                    <FolderKanban className="h-3.5 w-3.5 text-orange" />
                    Projects
                  </h3>
                  {projects.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">No projects yet.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {projects.map((p) => (
                        <div key={p.id} className="rounded-lg border border-border bg-background p-3">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="font-bold text-sm truncate">{p.project_title}</div>
                            <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold capitalize ${statusBadge(p.status)}`}>
                              {p.status.replace("_", " ")}
                            </span>
                          </div>
                          <div className="mt-2 h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                            <div className="h-full bg-gradient-orange" style={{ width: `${p.progress_pct}%` }} />
                          </div>
                          <div className="mt-2 flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">
                              ${Number(p.contract_total).toLocaleString()} • {p.progress_pct}%
                            </span>
                            <Link
                              to="/projects/$id"
                              params={{ id: p.id }}
                              onClick={onClose}
                              className="inline-flex items-center gap-1 font-bold text-orange hover:underline"
                            >
                              View Project <ArrowRight className="h-3 w-3" />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Schedule */}
                <section>
                  <h3 className="font-display text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-3">
                    <Calendar className="h-3.5 w-3.5 text-orange" />
                    Schedule
                  </h3>
                  {jobs.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">No scheduled jobs.</p>
                  ) : (
                    <div className="space-y-2">
                      {jobs.map((j) => (
                        <div key={j.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2">
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold">
                              {new Date(j.scheduled_date + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                              <span className="text-muted-foreground font-normal"> • {j.start_time.slice(0, 5)}</span>
                            </div>
                            {j.job_type && <div className="text-xs text-muted-foreground truncate">{j.job_type}</div>}
                          </div>
                          <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold capitalize ${statusBadge(j.status)}`}>
                            {j.status.replace("_", " ")}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}
          </div>

          {/* Sticky bottom action bar */}
          <div className="sticky bottom-0 border-t border-border bg-card px-6 py-3 flex gap-2">
            <Link
              to="/estimate"
              onClick={onClose}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md border border-orange/60 bg-card px-4 py-2.5 text-sm font-bold text-orange hover:bg-orange/10 transition-colors"
            >
              <FileText className="h-4 w-4" />
              New Estimate
            </Link>
            <button
              onClick={openFollowup}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-gradient-orange px-4 py-2.5 text-sm font-bold text-foreground shadow-orange hover:scale-[1.02] transition-transform"
            >
              <Sparkles className="h-4 w-4" />
              Generate Follow-up
            </button>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={followupOpen} onOpenChange={setFollowupOpen}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-orange" />
              AI Follow-up
            </DialogTitle>
            <DialogDescription>
              AI-generated follow-up for {customerName}.
            </DialogDescription>
          </DialogHeader>

          {followupLoading ? (
            <div className="py-10 flex flex-col items-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-orange" />
              <p className="text-sm">Generating follow-up…</p>
            </div>
          ) : followupError ? (
            <div className="py-6 space-y-3">
              <p className="text-sm text-red-400">{followupError}</p>
              <button
                onClick={generateFollowup}
                className="inline-flex items-center gap-1.5 rounded-md border border-orange/60 px-3 py-1.5 text-sm font-bold text-orange hover:bg-orange/10"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Try again
              </button>
            </div>
          ) : followup ? (
            <div className="space-y-4">
              {/* SMS */}
              <div className="rounded-lg border border-border bg-background p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">SMS / WhatsApp</span>
                  <button
                    onClick={() => copyText(followup.sms, "sms")}
                    className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-[11px] font-bold text-orange hover:bg-orange/10"
                  >
                    {copied === "sms" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copied === "sms" ? "Copied" : "Copy SMS"}
                  </button>
                </div>
                <p className="text-sm text-foreground/90 whitespace-pre-wrap">{followup.sms}</p>
                <div className="mt-1 text-[10px] text-muted-foreground">{followup.sms.length} chars</div>
              </div>

              {/* Email */}
              <div className="rounded-lg border border-border bg-background p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Email</span>
                  <button
                    onClick={() => copyText(`Subject: ${followup.email.subject}\n\n${followup.email.body}`, "email")}
                    className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-[11px] font-bold text-orange hover:bg-orange/10"
                  >
                    {copied === "email" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copied === "email" ? "Copied" : "Copy Email"}
                  </button>
                </div>
                <div className="text-sm font-bold mb-1.5">{followup.email.subject}</div>
                <p className="text-sm text-foreground/90 whitespace-pre-wrap">{followup.email.body}</p>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={generateFollowup}
                  className="inline-flex items-center gap-1.5 rounded-md border border-orange/60 px-3 py-1.5 text-sm font-bold text-orange hover:bg-orange/10"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Regenerate
                </button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
