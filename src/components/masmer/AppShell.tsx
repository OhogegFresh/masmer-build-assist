import { Link, useRouterState } from "@tanstack/react-router";
import { Logo } from "./Logo";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Calculator,
  Menu,
  Phone,
  LogOut,
  Settings,
  ChevronUp,
  CalendarDays,
} from "lucide-react";
import { useState, useRef, useEffect, type ReactNode } from "react";
import { useAuth } from "./AuthContext";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/planner", label: "Day Planner", icon: CalendarDays },
  { to: "/calls", label: "AI Call Leads", icon: Phone },
  { to: "/estimate", label: "Estimate Builder", icon: Calculator },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { appUser, signOut } = useAuth();

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    if (menuOpen) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  const initials = (appUser?.full_name ?? appUser?.email ?? "U")
    .split(/\s+/).map((s) => s[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
  const roleLabel = appUser?.role === "admin" ? "Admin" : appUser?.role === "demo" ? "Demo" : "User";
  const roleClass = appUser?.role === "admin"
    ? "bg-orange/15 text-orange border-orange/30"
    : appUser?.role === "demo"
    ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
    : "bg-secondary text-muted-foreground border-border";

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
      <div className="p-3 border-t border-border relative" ref={menuRef}>
        {menuOpen && (
          <div className="absolute bottom-full left-3 right-3 mb-2 rounded-lg border border-border bg-card shadow-lg overflow-hidden">
            <Link to="/settings" onClick={() => { setMenuOpen(false); setOpen(false); }}
              className="flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-secondary">
              <Settings className="h-4 w-4" /> My Settings
            </Link>
            <div className="h-px bg-border" />
            <button onClick={() => { setMenuOpen(false); signOut(); }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-secondary text-left">
              <LogOut className="h-4 w-4" /> Sign Out
            </button>
          </div>
        )}
        <button onClick={() => setMenuOpen((m) => !m)}
          className="w-full flex items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-secondary transition-colors">
          <div className="h-9 w-9 rounded-full bg-orange flex items-center justify-center text-white font-bold text-sm shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold truncate">{appUser?.full_name ?? "User"}</span>
              <span className={`shrink-0 rounded-full border px-1.5 py-0 text-[10px] font-bold uppercase tracking-wider ${roleClass}`}>{roleLabel}</span>
            </div>
            <div className="text-xs text-muted-foreground truncate">{appUser?.business_name ?? appUser?.email ?? "—"}</div>
          </div>
          <ChevronUp className={`h-4 w-4 text-muted-foreground transition-transform ${menuOpen ? "" : "rotate-180"}`} />
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