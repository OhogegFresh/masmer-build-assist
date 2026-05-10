import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/masmer/AppShell";
import { useRequireAuth } from "@/components/masmer/useRequireAuth";
import { Loader2, RefreshCw, Search, ShieldCheck, Users } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Masmer AI" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

type AdminUser = {
  id: string;
  user_id: string | null;
  email: string;
  full_name: string | null;
  business_name: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
};

function AdminPage() {
  const ready = useRequireAuth({ adminOnly: true });
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  async function loadUsers() {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("app_users")
      .select("id,user_id,email,full_name,business_name,role,is_active,created_at")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Could not load admin users");
      setUsers([]);
    } else {
      setUsers((data ?? []) as AdminUser[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (!ready) return;
    void loadUsers();
  }, [ready]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((user) =>
      [user.email, user.full_name, user.business_name, user.role]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q)),
    );
  }, [users, search]);

  const activeUsers = users.filter((user) => user.is_active).length;
  const admins = users.filter((user) => user.role === "admin").length;

  if (!ready) return null;

  return (
    <AppShell
      title="Admin"
      action={
        <button
          type="button"
          onClick={loadUsers}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground hover:border-orange hover:text-orange disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      }
    >
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase text-muted-foreground">Registered Users</p>
            <Users className="h-4 w-4 text-orange" />
          </div>
          <p className="font-display mt-3 text-2xl font-bold">{users.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase text-muted-foreground">Active Accounts</p>
            <Users className="h-4 w-4 text-orange" />
          </div>
          <p className="font-display mt-3 text-2xl font-bold">{activeUsers}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase text-muted-foreground">Admins</p>
            <ShieldCheck className="h-4 w-4 text-orange" />
          </div>
          <p className="font-display mt-3 text-2xl font-bold">{admins}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
        <div className="border-b border-border p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search users..."
              className="w-full rounded-md border border-border bg-background/60 py-2.5 pl-10 pr-4 text-sm focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/40"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">User</th>
                <th className="px-4 py-3 text-left">Business</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Joined</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                    <Loader2 className="inline h-5 w-5 animate-spin text-orange" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                    No users found.
                  </td>
                </tr>
              ) : (
                filtered.map((user) => (
                  <tr key={user.id} className="border-t border-border hover:bg-secondary/20">
                    <td className="px-4 py-3">
                      <div className="font-medium">{user.full_name || "Unnamed user"}</div>
                      <div className="font-mono text-xs text-muted-foreground">{user.email}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{user.business_name || "—"}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full border border-orange/30 bg-orange/10 px-2 py-0.5 text-xs font-semibold text-orange">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${
                        user.is_active
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                          : "border-destructive/30 bg-destructive/10 text-destructive"
                      }`}>
                        {user.is_active ? "Active" : "Suspended"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
