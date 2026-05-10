import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/masmer/AppShell";
import { useRequireAuth } from "@/components/masmer/useRequireAuth";
import { Search, Plus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { CustomerLeadPipe } from "@/components/masmer/CustomerLeadPipe";

export const Route = createFileRoute("/customers")({
  head: () => ({
    meta: [
      { title: "Customers — Masmer AI" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CustomersPage,
});

type Customer = { id: string; name: string; address: string | null; phone: string | null; email: string | null; created_at: string };
type ProjectLite = { id: string; customer_name: string; created_at: string };

function CustomersPage() {
  const ready = useRequireAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [projects, setProjects] = useState<ProjectLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [pipeCustomer, setPipeCustomer] = useState<Customer | null>(null);

  async function load() {
    const [{ data: c }, { data: p }] = await Promise.all([
      supabase.from("customers").select("*").order("created_at", { ascending: false }),
      supabase.from("projects").select("id,customer_name,created_at"),
    ]);
    setCustomers((c ?? []) as Customer[]);
    setProjects((p ?? []) as ProjectLite[]);
    setLoading(false);
  }

  useEffect(() => {
    if (!ready) return;
    load();
  }, [ready]);

  const projectsByName = useMemo(() => {
    const map = new Map<string, ProjectLite[]>();
    for (const p of projects) {
      const k = (p.customer_name ?? "").toLowerCase();
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(p);
    }
    return map;
  }, [projects]);

  const filtered = useMemo(() => {
    if (!q) return customers;
    const ql = q.toLowerCase();
    return customers.filter((c) =>
      `${c.name} ${c.email ?? ""} ${c.phone ?? ""} ${c.address ?? ""}`.toLowerCase().includes(ql),
    );
  }, [customers, q]);

  async function addCustomer(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get("name") ?? "").trim(),
      address: String(fd.get("address") ?? "").trim() || null,
      phone: String(fd.get("phone") ?? "").trim() || null,
      email: String(fd.get("email") ?? "").trim() || null,
      notes: String(fd.get("notes") ?? "").trim() || null,
    };
    if (!payload.name) return toast.error("Name required");
    const { data, error } = await supabase.from("customers").insert(payload).select().single();
    if (error) return toast.error(error.message);
    if (data) setCustomers((prev) => [data as Customer, ...prev]);
    toast.success("Customer added.");
    setShowModal(false);
  }

  if (!ready) return null;

  return (
    <AppShell
      title="Customers"
      action={
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-md bg-gradient-orange px-4 py-2 text-sm font-bold text-foreground shadow-orange hover:scale-[1.02] transition-transform"
        >
          <Plus className="h-4 w-4" />
          Add Customer
        </button>
      }
    >
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search customers..."
          className="w-full rounded-md border border-border bg-card pl-10 pr-4 py-2.5 text-sm focus:border-orange focus:outline-none"
        />
      </div>

      <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
        {loading ? (
          <div className="py-16 text-center"><Loader2 className="inline h-6 w-6 animate-spin text-orange" /></div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground text-sm">No customers found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 text-left">Name</th>
                  <th className="px-5 py-3 text-left">Address</th>
                  <th className="px-5 py-3 text-left">Phone</th>
                  <th className="px-5 py-3 text-left">Email</th>
                  <th className="px-5 py-3 text-center">Projects</th>
                  <th className="px-5 py-3 text-left">Last Project</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const list = projectsByName.get(c.name.toLowerCase()) ?? [];
                  const last = list.length > 0 ? new Date(Math.max(...list.map((p) => +new Date(p.created_at)))) : null;
                  return (
                    <tr key={c.id} className="border-t border-border hover:bg-secondary/50">
                      <td className="px-5 py-4">
                        <div className="font-medium">{c.name}</div>
                        {(c.phone || c.email) && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {[c.phone, c.email].filter(Boolean).join(" · ")}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">{c.address ?? "—"}</td>
                      <td className="px-5 py-4 text-muted-foreground">{c.phone ?? "—"}</td>
                      <td className="px-5 py-4 text-muted-foreground">{c.email ?? "—"}</td>
                      <td className="px-5 py-4 text-center"><span className="rounded-full border border-orange/40 text-orange px-2 py-0.5 text-xs">{list.length}</span></td>
                      <td className="px-5 py-4 text-muted-foreground">{last ? last.toLocaleDateString() : "—"}</td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => setPipeCustomer(c)}
                            className="text-orange hover:text-orange/80 text-sm font-semibold"
                          >
                            Pipe
                          </button>
                          <Link to="/customers/$id" params={{ id: c.id }} className="text-orange hover:text-orange/80 text-sm font-semibold">View</Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-card" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-bold">Add Customer</h2>
              <button onClick={() => setShowModal(false)} className="p-1 rounded hover:bg-secondary"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={addCustomer} className="space-y-3">
              <input name="name" required placeholder="Full name *" className="w-full rounded-md border border-border bg-secondary px-3 py-2.5 text-sm focus:border-orange focus:outline-none" />
              <input name="address" placeholder="Address" className="w-full rounded-md border border-border bg-secondary px-3 py-2.5 text-sm focus:border-orange focus:outline-none" />
              <input name="phone" placeholder="Phone" className="w-full rounded-md border border-border bg-secondary px-3 py-2.5 text-sm focus:border-orange focus:outline-none" />
              <input name="email" type="email" placeholder="Email" className="w-full rounded-md border border-border bg-secondary px-3 py-2.5 text-sm focus:border-orange focus:outline-none" />
              <textarea name="notes" rows={3} placeholder="Notes" className="w-full rounded-md border border-border bg-secondary px-3 py-2.5 text-sm focus:border-orange focus:outline-none" />
              <button type="submit" className="w-full rounded-md bg-gradient-orange px-4 py-2.5 text-sm font-bold text-foreground shadow-orange hover:scale-[1.01] transition-transform">
                Save Customer
              </button>
            </form>
          </div>
        </div>
      )}

      <CustomerLeadPipe
        open={!!pipeCustomer}
        onClose={() => setPipeCustomer(null)}
        customerName={pipeCustomer?.name ?? ""}
        phone={pipeCustomer?.phone ?? null}
        address={pipeCustomer?.address ?? null}
      />
    </AppShell>
  );
}