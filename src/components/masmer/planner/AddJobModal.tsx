import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type Project = { id: string; customer_name: string; customer_address: string | null; project_title: string };

const DURATIONS = [
  { label: "1 hour", value: 60 },
  { label: "2 hours", value: 120 },
  { label: "3 hours", value: 180 },
  { label: "4 hours", value: 240 },
  { label: "Half day (4h)", value: 240 },
  { label: "Full day (8h)", value: 480 },
];

export function AddJobModal({
  open,
  onClose,
  onSaved,
  defaultDate,
  defaultTime,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  defaultDate: string;
  defaultTime?: string;
}) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [address, setAddress] = useState("");
  const [jobType, setJobType] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState(defaultTime ?? "09:00");
  const [duration, setDuration] = useState(120);
  const [crew, setCrew] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDate(defaultDate);
    if (defaultTime) setTime(defaultTime);
    supabase
      .from("projects")
      .select("id, customer_name, customer_address, project_title")
      .order("created_at", { ascending: false })
      .then(({ data }) => setProjects((data ?? []) as Project[]));
  }, [open, defaultDate, defaultTime]);

  async function save() {
    setSaving(true);
    const selected = projects.find((p) => p.id === projectId);
    const payload: any = {
      project_id: selected?.id ?? null,
      customer_name: selected?.customer_name ?? customerName,
      job_address: selected?.customer_address ?? address,
      job_type: jobType,
      scheduled_date: date,
      start_time: time,
      duration_minutes: duration,
      assigned_to: crew || null,
      notes: notes || null,
      status: "scheduled",
    };
    if (!payload.customer_name) {
      toast.error("Customer name required");
      setSaving(false);
      return;
    }
    const { error } = await (supabase as any).from("scheduled_jobs").insert(payload);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Job added to schedule");
    setProjectId("");
    setCustomerName("");
    setAddress("");
    setJobType("");
    setNotes("");
    setCrew("");
    onSaved();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Add Job to Schedule</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground mb-1 block">Select Project</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="">— Quick job (enter manually) —</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.customer_name} — {p.project_title}
                </option>
              ))}
            </select>
          </div>
          {!projectId && (
            <>
              <Field label="Customer Name" value={customerName} onChange={setCustomerName} placeholder="Jane Doe" />
              <Field label="Address" value={address} onChange={setAddress} placeholder="123 Main St" />
            </>
          )}
          <Field label="Job Type" value={jobType} onChange={setJobType} placeholder="Estimate / Walk-through / Install" />
          <div className="grid grid-cols-2 gap-3">
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
              <label className="text-xs uppercase tracking-wider text-muted-foreground mb-1 block">Start time</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground mb-1 block">Duration</label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              {DURATIONS.map((d) => (
                <option key={d.label} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
          <Field label="Assigned Crew (optional)" value={crew} onChange={setCrew} placeholder="John, Mike" />
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground mb-1 block">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <button
            disabled={saving}
            onClick={save}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-gradient-orange px-4 py-2.5 text-sm font-bold text-foreground shadow-orange disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Add to Schedule
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wider text-muted-foreground mb-1 block">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
      />
    </div>
  );
}