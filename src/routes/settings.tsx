import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/masmer/AppShell";
import { useRequireAuth } from "@/components/masmer/useRequireAuth";
import { Loader2, Upload, Check } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Masmer AI" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SettingsPage,
});

type Settings = {
  id?: string;
  company_name: string;
  license_number: string;
  phone: string;
  email: string;
  address: string;
  logo_url: string | null;
  default_deposit: number;
  default_general_conditions: string;
  default_disclaimer: string;
  notify_call_email: boolean;
  notify_lead_whatsapp: boolean;
  notify_payment_reminders: boolean;
};

const empty: Settings = {
  company_name: "",
  license_number: "",
  phone: "",
  email: "",
  address: "",
  logo_url: null,
  default_deposit: 0,
  default_general_conditions: "",
  default_disclaimer: "",
  notify_call_email: true,
  notify_lead_whatsapp: false,
  notify_payment_reminders: true,
};

function SettingsPage() {
  const ready = useRequireAuth();
  const [settings, setSettings] = useState<Settings>(empty);
  const [loading, setLoading] = useState(true);
  const [savedField, setSavedField] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!ready) return;
    (async () => {
      const { data } = await (supabase as any)
        .from("company_settings")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (data) setSettings({ ...empty, ...data });
      setLoading(false);
    })();
  }, [ready]);

  async function persist(next: Settings, fieldKey?: string) {
    const payload = { ...next };
    delete (payload as any).id;
    let res;
    if (next.id) {
      res = await (supabase as any)
        .from("company_settings")
        .update(payload)
        .eq("id", next.id)
        .select()
        .maybeSingle();
    } else {
      res = await (supabase as any)
        .from("company_settings")
        .insert(payload)
        .select()
        .maybeSingle();
    }
    if (res.error) {
      toast.error("Failed to save");
      return;
    }
    if (res.data) setSettings({ ...empty, ...res.data });
    if (fieldKey) {
      setSavedField(fieldKey);
      setTimeout(() => setSavedField((v) => (v === fieldKey ? null : v)), 1500);
    }
  }

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((s) => ({ ...s, [key]: value }));
  }

  async function onLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop() ?? "png";
    const path = `logo-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("company-logos").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) {
      setUploading(false);
      toast.error("Upload failed");
      return;
    }
    const { data: pub } = supabase.storage.from("company-logos").getPublicUrl(path);
    setUploading(false);
    const next = { ...settings, logo_url: pub.publicUrl };
    setSettings(next);
    persist(next, "logo_url");
    toast.success("Logo uploaded");
  }

  if (!ready || loading) {
    return (
      <AppShell title="Settings">
        <div className="py-20 text-center"><Loader2 className="inline h-6 w-6 animate-spin text-orange" /></div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Settings">
      <div className="max-w-3xl space-y-6">
        <Section title="Company Info">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Company name" saved={savedField === "company_name"}>
              <input
                value={settings.company_name}
                onChange={(e) => update("company_name", e.target.value)}
                onBlur={() => persist(settings, "company_name")}
                className={inputCls}
              />
            </Field>
            <Field label="License number" saved={savedField === "license_number"}>
              <input
                value={settings.license_number}
                onChange={(e) => update("license_number", e.target.value)}
                onBlur={() => persist(settings, "license_number")}
                className={inputCls}
              />
            </Field>
            <Field label="Phone" saved={savedField === "phone"}>
              <input
                value={settings.phone}
                onChange={(e) => update("phone", e.target.value)}
                onBlur={() => persist(settings, "phone")}
                className={inputCls}
              />
            </Field>
            <Field label="Email" saved={savedField === "email"}>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => update("email", e.target.value)}
                onBlur={() => persist(settings, "email")}
                className={inputCls}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Address" saved={savedField === "address"}>
                <input
                  value={settings.address}
                  onChange={(e) => update("address", e.target.value)}
                  onBlur={() => persist(settings, "address")}
                  className={inputCls}
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">Logo</label>
              <div className="flex items-center gap-4">
                {settings.logo_url ? (
                  <img src={settings.logo_url} alt="Logo" className="h-16 w-16 rounded-lg object-contain bg-secondary border border-border" />
                ) : (
                  <div className="h-16 w-16 rounded-lg bg-secondary border border-border flex items-center justify-center text-xs text-muted-foreground">No logo</div>
                )}
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-semibold hover:border-orange hover:text-orange disabled:opacity-50"
                >
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {settings.logo_url ? "Replace logo" : "Upload logo"}
                </button>
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={onLogoChange} />
              </div>
            </div>
          </div>
        </Section>

        <Section title="Contract Defaults">
          <div className="grid gap-4">
            <Field label="Default deposit amount ($)" saved={savedField === "default_deposit"}>
              <input
                type="number"
                value={settings.default_deposit}
                onChange={(e) => update("default_deposit", Number(e.target.value))}
                onBlur={() => persist(settings, "default_deposit")}
                className={inputCls}
              />
            </Field>
            <Field label="Default general conditions" saved={savedField === "default_general_conditions"}>
              <textarea
                rows={4}
                value={settings.default_general_conditions}
                onChange={(e) => update("default_general_conditions", e.target.value)}
                onBlur={() => persist(settings, "default_general_conditions")}
                className={inputCls}
              />
            </Field>
            <Field label="Default disclaimer text" saved={savedField === "default_disclaimer"}>
              <textarea
                rows={3}
                value={settings.default_disclaimer}
                onChange={(e) => update("default_disclaimer", e.target.value)}
                onBlur={() => persist(settings, "default_disclaimer")}
                className={inputCls}
              />
            </Field>
          </div>
        </Section>

        <Section title="Notification Settings">
          <div className="space-y-3">
            <Toggle
              label="Email me when a call comes in"
              checked={settings.notify_call_email}
              onChange={(v) => { const n = { ...settings, notify_call_email: v }; setSettings(n); persist(n); }}
            />
            <Toggle
              label="WhatsApp notification on new lead"
              checked={settings.notify_lead_whatsapp}
              onChange={(v) => { const n = { ...settings, notify_lead_whatsapp: v }; setSettings(n); persist(n); }}
            />
            <Toggle
              label="Payment reminder emails"
              checked={settings.notify_payment_reminders}
              onChange={(v) => { const n = { ...settings, notify_payment_reminders: v }; setSettings(n); persist(n); }}
            />
          </div>
        </Section>
      </div>
    </AppShell>
  );
}

const inputCls =
  "w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/40";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 md:p-6 shadow-card">
      <h2 className="font-display text-xl font-bold mb-5">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, saved, children }: { label: string; saved?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">
        <span>{label}</span>
        {saved && <span className="inline-flex items-center gap-1 text-green-400 normal-case tracking-normal"><Check className="h-3 w-3" />Saved</span>}
      </label>
      {children}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-lg border border-border p-3 cursor-pointer hover:border-orange/40">
      <span className="text-sm font-medium">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition-colors ${checked ? "bg-orange" : "bg-secondary"}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
      </button>
    </label>
  );
}
