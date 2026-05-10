export type ScheduledJob = {
  id: string;
  project_id: string | null;
  customer_name: string;
  job_address: string | null;
  job_type: string | null;
  scheduled_date: string;
  start_time: string;
  duration_minutes: number;
  assigned_to: string | null;
  notes: string | null;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  created_at: string;
};

export const STATUS_COLORS: Record<string, string> = {
  scheduled: "border-blue-400 bg-blue-500/15 text-blue-300",
  in_progress: "border-orange bg-orange/20 text-orange",
  completed: "border-emerald-400 bg-emerald-500/15 text-emerald-300",
  cancelled: "border-muted-foreground bg-secondary text-muted-foreground",
};

export const STATUS_BORDER: Record<string, string> = {
  scheduled: "border-l-blue-400",
  in_progress: "border-l-orange",
  completed: "border-l-emerald-400",
  cancelled: "border-l-muted-foreground",
};

export function fmtTime(t: string) {
  const [hh, mm] = t.split(":").map(Number);
  const h12 = ((hh + 11) % 12) + 1;
  const ampm = hh < 12 ? "AM" : "PM";
  return `${h12}:${String(mm).padStart(2, "0")} ${ampm}`;
}

export function addMinutes(t: string, mins: number): string {
  const [hh, mm] = t.split(":").map(Number);
  const total = hh * 60 + mm + mins;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
}

export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function shiftDate(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function fmtDateLong(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

// quick deterministic pseudo distance (miles) using string hash; UI-only estimate
export function estDistanceMiles(a: string | null, b: string | null): number {
  const s = (a ?? "") + "|" + (b ?? "");
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h % 180) / 10 + 1.5; // 1.5 - ~19.5
}

export function driveMinutes(miles: number) {
  return Math.round((miles / 30) * 60);
}

export function mapsDirectionsUrl(stops: string[]) {
  return `https://www.google.com/maps/dir/${stops.map((s) => encodeURIComponent(s)).join("/")}`;
}

export function singleMapsUrl(addr: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`;
}