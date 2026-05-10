import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, StatusBadge, ProgressBar, fmtUsd } from "@/components/masmer/AppShell";
import { useRequireAuth } from "@/components/masmer/useRequireAuth";
import { ArrowLeft, Loader2, Upload, FileText, Calendar, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/projects/$id")({
  head: () => ({
    meta: [
      { title: "Project — Masmer AI" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProjectDetailPage,
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
  notes: string | null;
  punchlist_items: string[];
  created_at: string;
  updated_at: string;
};

type Photo = { id: string; url: string; caption: string | null };

function ProjectDetailPage() {
  const ready = useRequireAuth();
  const { id } = Route.useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!ready) return;
    supabase.from("projects").select("*").eq("id", id).maybeSingle().then(({ data }) => {
      if (data) {
        setProject(data as Project);
        setNotes(data.notes ?? "");
      }
    });
    supabase.from("project_photos").select("*").eq("project_id", id).order("created_at", { ascending: false }).then(({ data }) => {
      setPhotos((data ?? []) as Photo[]);
    });
  }, [ready, id]);

  async function update(patch: Partial<Project>) {
    if (!project) return;
    setProject({ ...project, ...patch });
    const { error } = await supabase.from("projects").update(patch).eq("id", project.id);
    if (error) toast.error("Failed to save");
  }

  async function togglePunchlist(idx: number) {
    if (!project) return;
    const items = [...project.punchlist_items];
    const cur = items[idx];
    items[idx] = cur.startsWith("[x] ") ? cur.slice(4) : `[x] ${cur}`;
    await update({ punchlist_items: items });
  }

  async function uploadPhoto(file: File) {
    if (!project) return;
    setUploading(true);
    const path = `${project.id}/${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from("project-photos").upload(path, file);
    if (upErr) {
      setUploading(false);
      toast.error("Upload failed");
      return;
    }
    const { data } = supabase.storage.from("project-photos").getPublicUrl(path);
    const { data: row, error: insErr } = await supabase
      .from("project_photos")
      .insert({ project_id: project.id, url: data.publicUrl })
      .select()
      .single();
    setUploading(false);
    if (insErr) {
      toast.error("Save failed");
      return;
    }
    setPhotos((p) => [row as Photo, ...p]);
    toast.success("Photo uploaded");
  }

  async function deletePhoto(photoId: string) {
    await supabase.from("project_photos").delete().eq("id", photoId);
    setPhotos((p) => p.filter((x) => x.id !== photoId));
  }

  if (!ready || !project) return <AppShell title="Project"><div className="py-20 text-center"><Loader2 className="inline h-6 w-6 animate-spin text-orange" /></div></AppShell>;

  const t = Number(project.contract_total);
  const dep = Number(project.deposit);
  const remaining = Math.max(0, t - dep);
  const milestones = [
    { key: "deposit_paid" as const, label: "Deposit", amount: dep, when: "At signing" },
    { key: "payment1_paid" as const, label: "Payment 1", amount: remaining * 0.5, when: "Mobilization" },
    { key: "payment2_paid" as const, label: "Payment 2", amount: remaining * 0.25, when: "60% complete" },
    { key: "payment3_paid" as const, label: "Payment 3", amount: remaining * 0.15, when: "90% complete" },
    { key: "final_paid" as const, label: "Final", amount: remaining * 0.1, when: "Final walkthrough" },
  ];

  return (
    <AppShell
      title={project.project_title}
      action={
        <Link to="/projects" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-orange">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
      }
    >
      <div className="rounded-xl border border-border bg-card p-6 shadow-card mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Customer</p>
          <p className="font-display text-2xl font-bold">{project.customer_name}</p>
          <p className="text-sm text-muted-foreground">{project.customer_address ?? "—"}</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={project.status}
            onChange={(e) => update({ status: e.target.value })}
            className="rounded-md border border-border bg-secondary px-3 py-2 text-sm focus:border-orange focus:outline-none"
          >
            <option value="new">New</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={100}
              defaultValue={project.progress_pct}
              key={project.id + ":" + project.progress_pct}
              onBlur={(e) => {
                const v = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                if (v !== project.progress_pct) update({ progress_pct: v });
              }}
              className="w-20 rounded-md border border-border bg-secondary px-3 py-2 text-sm focus:border-orange focus:outline-none"
            />
            <span className="text-sm font-semibold text-muted-foreground">{project.progress_pct}%</span>
          </div>
          <StatusBadge status={project.status} />
        </div>
      </div>
      <div className="mb-6"><ProgressBar value={project.progress_pct} /></div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* LEFT */}
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-6 shadow-card">
            <h2 className="font-display text-lg font-bold mb-1">Payment Schedule</h2>
            <p className="text-sm text-muted-foreground mb-4">Total: <span className="text-orange font-bold">{fmtUsd(t)}</span></p>
            <div className="space-y-2">
              {milestones.map((m) => {
                const paid = project[m.key];
                return (
                  <label key={m.key} className={`flex items-center justify-between gap-3 rounded-md border p-3 cursor-pointer transition-colors ${paid ? "border-orange/50 bg-orange/5" : "border-border hover:border-orange/40"}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={paid}
                        onChange={(e) => update({ [m.key]: e.target.checked } as Partial<Project>)}
                        className="h-4 w-4 accent-orange"
                      />
                      <div className="min-w-0">
                        <p className="font-semibold text-sm">{m.label}</p>
                        <p className="text-xs text-muted-foreground">{m.when}</p>
                      </div>
                    </div>
                    <p className="font-bold text-sm">{fmtUsd(m.amount)}</p>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-card">
            <h2 className="font-display text-lg font-bold mb-3">Notes</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => update({ notes })}
              rows={5}
              placeholder="Internal project notes..."
              className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm focus:border-orange focus:outline-none"
            />
            <p className="mt-1 text-xs text-muted-foreground">Auto-saves on blur.</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-card">
            <h2 className="font-display text-lg font-bold mb-3">Punchlist</h2>
            {project.punchlist_items.length === 0 ? (
              <p className="text-sm text-muted-foreground">No punchlist items yet.</p>
            ) : (
              <ul className="space-y-2">
                {project.punchlist_items.map((item, i) => {
                  const done = item.startsWith("[x] ");
                  const text = done ? item.slice(4) : item;
                  return (
                    <li key={i}>
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={done}
                          onChange={() => togglePunchlist(i)}
                          className="mt-0.5 h-4 w-4 accent-orange"
                        />
                        <span className={`text-sm ${done ? "line-through text-muted-foreground" : ""}`}>{text}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* RIGHT */}
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-6 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-bold">Photos</h2>
              <label className="inline-flex items-center gap-2 rounded-md bg-gradient-orange px-3 py-1.5 text-xs font-bold text-foreground cursor-pointer hover:scale-[1.02] transition-transform">
                {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                Upload
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadPhoto(f);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
            {photos.length === 0 ? (
              <p className="text-sm text-muted-foreground">No photos yet.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {photos.map((ph) => (
                  <div key={ph.id} className="relative group aspect-square rounded-md overflow-hidden border border-border">
                    <img src={ph.url} alt={ph.caption ?? ""} className="h-full w-full object-cover" loading="lazy" />
                    <button
                      onClick={() => deletePhoto(ph.id)}
                      className="absolute top-1 right-1 p-1 rounded-md bg-background/80 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Delete photo"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Link
            to="/estimate"
            className="flex items-center justify-center gap-2 rounded-xl border border-orange/60 bg-card p-6 shadow-card text-orange font-bold hover:bg-orange/10 transition-colors"
          >
            <FileText className="h-5 w-5" />
            Generate Documents
          </Link>

          <div className="rounded-xl border border-border bg-card p-6 shadow-card">
            <h2 className="font-display text-lg font-bold mb-4">Timeline</h2>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-orange mt-0.5" />
                <div>
                  <p className="font-semibold">Created</p>
                  <p className="text-muted-foreground">{new Date(project.created_at).toLocaleString()}</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-orange mt-0.5" />
                <div>
                  <p className="font-semibold">Last Updated</p>
                  <p className="text-muted-foreground">{new Date(project.updated_at).toLocaleString()}</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-orange mt-0.5" />
                <div>
                  <p className="font-semibold">Current Status</p>
                  <p className="text-muted-foreground capitalize">{project.status.replace("_", " ")}</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </AppShell>
  );
}