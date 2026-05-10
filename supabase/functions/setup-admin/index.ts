// One-time admin bootstrap. Refuses once any admin already exists.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const ADMIN_EMAIL = "jacob@casacapsolutions.com";
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...cors, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const url = new URL(req.url);
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Status check
  const { data: existingAdmins, error: chkErr } = await admin
    .from("app_users").select("id,email").eq("role", "admin").limit(1);
  if (chkErr) return json({ error: chkErr.message }, 500);
  const adminExists = (existingAdmins?.length ?? 0) > 0;

  if (req.method === "GET" || url.searchParams.get("check") === "1") {
    return json({ adminExists });
  }

  if (adminExists) return json({ error: "Admin already exists. Setup disabled." }, 403);

  let password = "";
  try {
    const body = await req.json();
    password = String(body?.password ?? "");
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  if (password.length < 8) return json({ error: "Password must be at least 8 characters" }, 400);

  // Create or update auth user
  let userId: string | null = null;
  const created = await admin.auth.admin.createUser({
    email: ADMIN_EMAIL, password, email_confirm: true,
    user_metadata: { role: "admin" },
  });
  if (created.error) {
    const msg = created.error.message?.toLowerCase() ?? "";
    if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
      const { data: list } = await admin.auth.admin.listUsers();
      const u = list?.users.find((x) => x.email?.toLowerCase() === ADMIN_EMAIL);
      if (!u) return json({ error: "Could not locate existing user" }, 500);
      const upd = await admin.auth.admin.updateUserById(u.id, { password, email_confirm: true });
      if (upd.error) return json({ error: upd.error.message }, 500);
      userId = u.id;
    } else {
      return json({ error: created.error.message }, 500);
    }
  } else {
    userId = created.data.user?.id ?? null;
  }

  // Upsert app_users row as admin
  const { data: existingRow } = await admin.from("app_users")
    .select("id").eq("email", ADMIN_EMAIL).maybeSingle();
  if (existingRow) {
    await admin.from("app_users")
      .update({ role: "admin", is_active: true, user_id: userId })
      .eq("email", ADMIN_EMAIL);
  } else {
    await admin.from("app_users").insert({
      email: ADMIN_EMAIL, role: "admin", is_active: true, user_id: userId,
      full_name: "Jacob", business_name: "CasaCap Solutions",
    });
  }

  // Also add user_roles entry so has_role() works
  if (userId) {
    await admin.from("user_roles").insert({ user_id: userId, role: "admin" })
      .then(() => null, () => null);
  }

  return json({ ok: true, email: ADMIN_EMAIL });
});