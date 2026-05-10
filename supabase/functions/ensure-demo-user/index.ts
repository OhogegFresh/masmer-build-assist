// Idempotently provisions the shared demo account anyone can use to test the app.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const DEMO_EMAIL = "demo@masmer.ai";
const DEMO_PASSWORD = "MasmerDemo2026!";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Find existing user
    const { data: list } = await admin.auth.admin.listUsers();
    const existing = list?.users.find((u) => u.email?.toLowerCase() === DEMO_EMAIL);

    let userId = existing?.id ?? null;
    if (!existing) {
      const created = await admin.auth.admin.createUser({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: { role: "demo", shared: true },
      });
      if (created.error) throw created.error;
      userId = created.data.user?.id ?? null;
    } else {
      // Make sure password stays in sync in case it ever drifts
      await admin.auth.admin.updateUserById(existing.id, {
        password: DEMO_PASSWORD,
        email_confirm: true,
      });
    }

    // Ensure app_users row exists & active
    const { data: appRow } = await admin
      .from("app_users").select("id").eq("email", DEMO_EMAIL).maybeSingle();
    if (!appRow) {
      await admin.from("app_users").insert({
        email: DEMO_EMAIL, role: "demo", is_active: true, user_id: userId,
        full_name: "Demo Tester", business_name: "Masmer Demo",
      });
    } else {
      await admin.from("app_users").update({
        is_active: true, user_id: userId,
      }).eq("email", DEMO_EMAIL);
    }

    return new Response(
      JSON.stringify({ ok: true, email: DEMO_EMAIL, password: DEMO_PASSWORD }),
      { headers: { ...cors, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("ensure-demo-user failed", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});