import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, StatusBadge, fmtUsd } from "@/components/masmer/AppShell";
import { useRequireAuth } from "@/components/masmer/useRequireAuth";
import { ArrowLeft, Loader2, Mail, Phone, MapPin } from "lucide-react";

export const Route = createFileRoute("/customers/$id")({
  head: () => ({
    meta: [
      { title: "Customer — Masmer AI" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CustomerDetailPage,
});

type Customer = { id: string; name: string; address: string | null; phone: string | null; email: string | null; notes: string | null };
type Project = { id: string; project_title: string; status: string; contract_total: number; created_at: string };

function CustomerDetailPage() {
  const ready = useRequireAuth();
  const { id } = Route.useParams();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;
    (async () => {
      const { data: c } = await supabase.from("customers").select("*").eq("id", id).maybeSingle();
      setCustomer(c as Customer | null);
      if (c) {
        const { data: p } = await supabase
          .from("projects")
          .select("id,project_title,status,contract_total,created_at")
          .ilike("customer_name", c.name)
          .order("created_at", { ascending: false });
        setProjects((p ?? []) as Project[]);
      }
      setLoading(false);
    })();
  }, [ready, id]);

  if (!ready) return null;

  return (
    <AppShell
      title={customer?.name ?? "Customer"}
      action={
        <Link to="/customers" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-orange">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
      }
    >
      {loading ? (
        <div className="py-20 text-center"><Loader2 className="inline h-6 w-6 animate-spin text-orange" /></div>
      ) : !customer ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">Customer not found.</div>
      ) : (
        <>
          <div className="rounded-xl border border-border bg-card p-6 shadow-card mb-6">
            <h2 className="font-display text-2xl font-bold mb-4">{customer.name}</h2>
            <div className="grid gap-3 sm:grid-cols-3 text-sm">
              <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-orange shrink-0" /><span>{customer.address ?? "—"}</span></div>
              <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-orange shrink-0" /><span>{customer.phone ?? "—"}</span></div>
              <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-orange shrink-0" /><span className="truncate">{customer.email ?? "—"}</span></div>
            </div>
            {customer.notes && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Notes</p>
                <p className="text-sm whitespace-pre-wrap">{customer.notes}</p>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="font-display text-lg font-bold">Projects ({projects.length})</h3>
            </div>
            {projects.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">No projects yet for this customer.</div>
            ) : (
              <ul className="divide-y divide-border">
                {projects.map((p) => (
                  <li key={p.id}>
                    <Link to="/projects/$id" params={{ id: p.id }} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-secondary/50">
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{p.project_title}</p>
                        <p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <StatusBadge status={p.status} />
                        <span className="font-bold">{fmtUsd(p.contract_total)}</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </AppShell>
  );
}