import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const RESEND_API = "https://api.resend.com/emails";
const FROM = "Masmer AI <onboarding@resend.dev>";
const LOGIN_URL = "https://masmer-build-assist.lovable.app/login";

async function sendEmail(payload: Record<string, unknown>, apiKey: string) {
  const res = await fetch(RESEND_API, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error("Resend error", res.status, text);
  }
}

function approvalHtml(firstName: string, email: string, password: string) {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#080C14;font-family:Arial,sans-serif;color:#F8FAFC;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 0;"><tr><td align="center">
    <table width="600" style="max-width:600px;background:#0F1623;border-radius:16px;border:1px solid rgba(224,92,26,0.3);">
      <tr><td style="padding:32px;">
        <h1 style="margin:0 0 8px;font-size:28px;color:#F8FAFC;">You're approved! 🎉</h1>
        <p style="margin:0 0 24px;color:#E05C1A;text-transform:uppercase;letter-spacing:0.15em;font-size:12px;font-weight:700;">Welcome to Masmer AI</p>
        <p style="margin:0 0 16px;font-size:16px;color:#CBD5E1;">Great news, ${firstName}! Your access to Masmer AI has been approved.</p>
        <div style="background:#161E2E;border:1px solid rgba(224,92,26,0.3);border-radius:10px;padding:20px;margin:24px 0;">
          <p style="margin:0 0 6px;font-size:12px;color:#94A3B8;text-transform:uppercase;letter-spacing:0.1em;">Login URL</p>
          <p style="margin:0 0 14px;font-size:14px;color:#F8FAFC;font-family:monospace;">${LOGIN_URL}</p>
          <p style="margin:0 0 6px;font-size:12px;color:#94A3B8;text-transform:uppercase;letter-spacing:0.1em;">Email</p>
          <p style="margin:0 0 14px;font-size:14px;color:#F8FAFC;font-family:monospace;">${email}</p>
          <p style="margin:0 0 6px;font-size:12px;color:#94A3B8;text-transform:uppercase;letter-spacing:0.1em;">Temporary Password</p>
          <p style="margin:0;font-size:14px;color:#E05C1A;font-family:monospace;font-weight:700;">${password}</p>
        </div>
        <p style="margin:0 0 24px;font-size:13px;color:#94A3B8;">⚠️ Please change your password after first login.</p>
        <div style="text-align:center;margin:24px 0;">
          <a href="${LOGIN_URL}" style="display:inline-block;background:#E05C1A;color:#fff;padding:16px 36px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;">Login to Masmer AI →</a>
        </div>
        <h3 style="margin:32px 0 12px;font-size:15px;color:#F8FAFC;">What you can do:</h3>
        <ul style="margin:0;padding:0 0 0 20px;color:#CBD5E1;font-size:14px;line-height:1.9;">
          <li>🔧 Build full Scopes of Work in minutes</li>
          <li>🛒 Generate itemized materials lists</li>
          <li>📄 Download professional PDF contracts</li>
          <li>📞 Use the AI receptionist 24/7</li>
        </ul>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const apiKey = Deno.env.get("RESEND_API_KEY");

    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    // Verify caller is admin
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    const { data: roleRow } = await userClient
      .from("user_roles").select("role").eq("user_id", userData.user.id).eq("role", "admin").maybeSingle();
    if (!roleRow) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });

    const body = await req.json();
    const { request_id, email, password, full_name, business_name } = body;
    if (!request_id || !email || !password) {
      return new Response(JSON.stringify({ error: "request_id, email, password required" }), { status: 400, headers: corsHeaders });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Create auth user
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email, password, email_confirm: true,
      user_metadata: { full_name, business_name },
    });
    if (createErr && !String(createErr.message).toLowerCase().includes("already")) {
      throw createErr;
    }
    let userId = created?.user?.id;
    if (!userId) {
      // user already exists — find them
      const { data: existing } = await admin.auth.admin.listUsers();
      userId = existing?.users.find((u) => u.email === email)?.id;
    }

    // Insert app_user
    await admin.from("app_users").upsert({
      user_id: userId, email, full_name, business_name, role: "user", is_active: true,
    }, { onConflict: "email" });

    // Update request
    await admin.from("access_requests").update({
      status: "approved", reviewed_at: new Date().toISOString(), approved_by: userData.user.email,
    }).eq("id", request_id);

    // Send approval email
    if (apiKey) {
      const firstName = (full_name || "there").split(/\s+/)[0];
      await sendEmail({
        from: FROM, to: [email],
        subject: "You're approved! Welcome to Masmer AI 🎉",
        html: approvalHtml(firstName, email, password),
      }, apiKey);
    }

    return new Response(JSON.stringify({ ok: true, user_id: userId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("approve-access-request failed", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});