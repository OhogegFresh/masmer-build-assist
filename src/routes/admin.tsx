import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Search, LogOut, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Waitlist Admin — Masmer AI" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

type Row = {
  id: string;
  full_name: string;
  business_name: string;
  phone: string;
  email: string;
  contractor_type: string;
  feature_interest: string;
  created_at: string;
};

function AdminPage() {
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [forbidden, setForbidden] = useState(false);
  const [search, setSearch] = useState("");
  const [contractorType, setContractorType] = useState("");
  const [feature, setFeature] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        navigate({ to: "/login" });
        return;
      }
      setAuthed(true);
      setAuthChecked(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) navigate({ to: "/login" });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!authed) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("waitlist_signups")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        toast.error("Failed to load");
        setLoading(false);
        return;
      }
      if (!data || data.length === 0) {
        // Could be empty or not admin — verify role
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          const { data: roles } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", userData.user.id)
            .eq("role", "admin")
            .maybeSingle();
          if (!roles) setForbidden(true);
        }
      }
      setRows((data as Row[]) ?? []);
      setLoading(false);
    })();
  }, [authed]);

  const types = useMemo(
    () => Array.from(new Set(rows.map((r) => r.contractor_type))).sort(),
    [rows],
  );
  const features = useMemo(
    () => Array.from(new Set(rows.map((r) => r.feature_interest))).sort(),
    [rows],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (contractorType && r.contractor_type !== contractorType) return false;
      if (feature && r.feature_interest !== feature) return false;
      if (!q) return true;
      return (
        r.full_name.toLowerCase().includes(q) ||
        r.business_name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.phone.toLowerCase().includes(q)
      );
    });
  }, [rows, search, contractorType, feature]);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-orange" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-5 flex items-center justify-between">
          <div>
            <Link to="/" className="text-xs text-muted-foreground hover:text-orange">
              ← Site
            </Link>
            <h1 className="text-2xl font-black tracking-tighter mt-1">
              Waitlist <span className="text-gradient-orange">Admin</span>
            </h1>
          </div>
          <button
            onClick={signOut}
            className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:border-orange hover:text-orange"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {forbidden ? (
          <div className="rounded-2xl border border-destructive/40 bg-card p-10 text-center">
            <ShieldAlert className="mx-auto h-12 w-12 text-destructive" />
            <h2 className="mt-4 text-2xl font-black">Access denied</h2>
            <p className="mt-2 text-muted-foreground max-w-md mx-auto">
              Your account doesn't have admin access. Ask an existing admin to
              grant you the <code className="text-orange">admin</code> role in the
              <code className="text-orange"> user_roles</code> table.
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-3 md:grid-cols-4 mb-6">
              <div className="md:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  placeholder="Search name, business, email, phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-md border border-border bg-card pl-10 pr-4 py-2.5 text-sm focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/40"
                />
              </div>
              <select
                value={contractorType}
                onChange={(e) => setContractorType(e.target.value)}
                className="rounded-md border border-border bg-card px-3 py-2.5 text-sm focus:border-orange focus:outline-none"
              >
                <option value="">All contractor types</option>
                {types.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <select
                value={feature}
                onChange={(e) => setFeature(e.target.value)}
                className="rounded-md border border-border bg-card px-3 py-2.5 text-sm focus:border-orange focus:outline-none"
              >
                <option value="">All feature interests</option>
                {features.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>

            <div className="text-xs text-muted-foreground mb-3">
              Showing {filtered.length} of {rows.length} signups
            </div>

            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="text-left px-4 py-3">Name</th>
                      <th className="text-left px-4 py-3">Business</th>
                      <th className="text-left px-4 py-3">Phone</th>
                      <th className="text-left px-4 py-3">Email</th>
                      <th className="text-left px-4 py-3">Type</th>
                      <th className="text-left px-4 py-3">Interest</th>
                      <th className="text-left px-4 py-3">Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                        <Loader2 className="inline h-5 w-5 animate-spin text-orange" />
                      </td></tr>
                    ) : filtered.length === 0 ? (
                      <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                        No signups match these filters.
                      </td></tr>
                    ) : filtered.map((r) => (
                      <tr key={r.id} className="border-t border-border hover:bg-secondary/20">
                        <td className="px-4 py-3 font-medium">{r.full_name}</td>
                        <td className="px-4 py-3">{r.business_name}</td>
                        <td className="px-4 py-3 font-mono text-xs">{r.phone}</td>
                        <td className="px-4 py-3 font-mono text-xs">{r.email}</td>
                        <td className="px-4 py-3"><span className="rounded-full bg-secondary px-2 py-0.5 text-xs">{r.contractor_type}</span></td>
                        <td className="px-4 py-3"><span className="rounded-full border border-orange/40 text-orange px-2 py-0.5 text-xs">{r.feature_interest}</span></td>
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(r.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}