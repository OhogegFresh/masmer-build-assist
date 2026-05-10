import { Link, useRouterState } from "@tanstack/react-router";
import { Logo } from "./Logo";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Calculator,
  Menu,
  LogOut,
  Settings,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/estimate", label: "Estimate Builder", icon: Calculator },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    window.location.href = "/login";
  }

  const SidebarBody = (
    <div className="flex h-full flex-col bg-background border-r border-border">
      <div className="h-16 flex items-center px-6 border-b border-border">
        <Logo />
      </div>
      <nav className="flex-1 px-3 py-6 space-y-1">
        {nav.map((item) => {
          const active = path === item.to || path.startsWith(item.to + "/");
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={`relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-orange/10 text-orange"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-orange" />}
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-border">
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-secondary">
      {/* Desktop sidebar */}
      <aside className="hidden md:block w-64 shrink-0">{SidebarBody}</aside>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="w-64">{SidebarBody}</div>
          <button
            aria-label="Close menu"
            className="flex-1 bg-black/50"
            onClick={() => setOpen(false)}
          />
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-background/90 backdrop-blur px-4 md:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <button
              className="md:hidden p-2 -ml-2 rounded-md hover:bg-secondary"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="font-display text-xl md:text-2xl font-bold tracking-tight truncate">{title}</h1>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
        <main className="flex-1 p-4 md:p-8 bg-secondary">{children}</main>
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    new: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    in_progress: "bg-orange/15 text-orange border-orange/40",
    completed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  };
  const label: Record<string, string> = {
    new: "New",
    in_progress: "In Progress",
    completed: "Completed",
  };
  const cls = map[status] ?? map.new;
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {label[status] ?? status}
    </span>
  );
}

export function ProgressBar({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="h-2 w-full rounded-full bg-secondary overflow-hidden border border-border">
      <div
        className="h-full bg-gradient-orange transition-all"
        style={{ width: `${v}%` }}
      />
    </div>
  );
}

export function fmtUsd(n: number | null | undefined) {
  return (n ?? 0).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}