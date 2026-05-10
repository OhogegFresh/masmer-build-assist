// Welcome email + auto-create demo account
// Requires RESEND_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const RESEND_API = "https://api.resend.com/emails";
const FROM = "Masmer AI <onboarding@resend.dev>";
const ADMIN_EMAIL = "jacob@casacapsolutions.com";
const DEMO_LINK = "https://masmer-build-assist.lovable.app/login?team=true";

function genPassword(): string {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  let out = "";
  const buf = new Uint8Array(12);
  crypto.getRandomValues(buf);
  for (let i = 0; i < 12; i++) out += chars[buf[i] % chars.length];
  return out;
}

function welcomeHtml(firstName: string, email: string, password: string) {
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#0A0F1E;font-family:Arial,Helvetica,sans-serif;color:#F8FAFC;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0F1E;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#111827;border-radius:16px;overflow:hidden;border:1px solid rgba(197,90,17,0.25);">
        <tr><td style="padding:32px 32px 16px 32px;text-align:center;background:linear-gradient(135deg,#0A0F1E,#111827);">
          <h1 style="margin:0;font-size:32px;font-weight:800;letter-spacing:-0.02em;color:#F8FAFC;">Masmer AI</h1>
          <p style="margin:8px 0 0;color:#C55A11;font-size:13px;text-transform:uppercase;letter-spacing:0.18em;font-weight:700;">Your free demo is ready</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <h2 style="margin:0 0 16px;font-size:26px;color:#F8FAFC;font-weight:700;">Welcome, ${firstName}! 👋</h2>
          <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#CBD5E1;">
            You've been granted <strong style="color:#C55A11;">free demo access to Masmer AI</strong> — the complete AI platform built for contractors.
          </p>
          <div style="background:#0A0F1E;border:1px solid rgba(197,90,17,0.4);border-radius:10px;padding:20px;margin:24px 0;">
            <p style="margin:0 0 12px;font-size:13px;color:#C55A11;text-transform:uppercase;letter-spacing:0.12em;font-weight:700;">Your login credentials</p>
            <p style="margin:0 0 8px;font-size:14px;color:#CBD5E1;">Email: <strong style="color:#F8FAFC;">${email}</strong></p>
            <p style="margin:0;font-size:14px;color:#CBD5E1;">Password: <code style="background:#1B3A6B;color:#F8FAFC;padding:4px 10px;border-radius:6px;font-size:14px;font-family:monospace;letter-spacing:0.04em;">${password}</code></p>
            <p style="margin:14px 0 0;font-size:12px;color:#94A3B8;">You can change this password from your settings after signing in.</p>
          </div>
          <div style="text-align:center;margin:32px 0;">
            <a href="${DEMO_LINK}" style="display:inline-block;background:#C55A11;color:#ffffff;padding:16px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:16px;letter-spacing:0.02em;">Sign In to Masmer AI →</a>
          </div>
          <p style="margin:0 0 12px;font-size:16px;color:#F8FAFC;font-weight:600;">What you can do:</p>
          <ul style="margin:0 0 28px;padding:0;list-style:none;color:#CBD5E1;font-size:15px;line-height:1.9;">
            <li>🔧 Build a full Scope of Work in minutes</li>
            <li>🛒 Get an itemized Home Depot materials list</li>
            <li>📄 Download professional PDF contracts</li>
            <li>📞 See your AI receptionist in action</li>
          </ul>
        </td></tr>
        <tr><td style="padding:24px 32px;border-top:1px solid rgba(248,250,252,0.08);text-align:center;background:#0A0F1E;">
          <p style="margin:0;font-size:12px;color:#64748B;line-height:1.6;">
            607 The Home Improvement CCS Group × Masmer AI<br/>
            Built by a contractor. Built for contractors.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

async function sendEmail(payload: Record<string, unknown>, apiKey: string) {
  const res = await fetch(RESEND_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error("Resend error", res.status, text);
    throw new Error(`Resend ${res.status}: ${text}`);
  }
  return text;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) throw new Error("RESEND_API_KEY not set");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    const body = await req.json();
    const { email, full_name, business_name, phone, contractor_type, source } = body ?? {};

    if (!email) {
      return new Response(JSON.stringify({ error: "email required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const firstName =
      (full_name && String(full_name).trim().split(/\s+/)[0]) ||
      String(email).split("@")[0] ||
      "there";

    // Auto-provision demo auth user if it doesn't already exist
    let password = genPassword();
    let createdNew = false;
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { source: source ?? "landing_page_demo", role: "demo" },
    });

    if (createErr) {
      // User likely already exists — generate a new password and reset it
      const msg = String(createErr.message || "").toLowerCase();
      if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
        // Find user by email and update password
        const { data: list } = await admin.auth.admin.listUsers();
        const existing = list?.users.find(
          (u) => u.email?.toLowerCase() === String(email).toLowerCase(),
        );
        if (existing) {
          const upd = await admin.auth.admin.updateUserById(existing.id, { password });
          if (upd.error) throw upd.error;
        } else {
          throw createErr;
        }
      } else {
        throw createErr;
      }
    } else {
      createdNew = true;
    }

    const userId = created?.user?.id ?? null;

    // Provision app_users row so login check passes (idempotent on email)
    try {
      const { data: existingApp } = await admin
        .from("app_users")
        .select("id")
        .eq("email", email)
        .maybeSingle();
      if (!existingApp) {
        await admin.from("app_users").insert({
          email,
          full_name: full_name ?? null,
          business_name: business_name ?? null,
          role: "demo",
          is_active: true,
          user_id: userId,
        });
      } else if (userId) {
        await admin.from("app_users").update({ user_id: userId, is_active: true }).eq("email", email);
      }
    } catch (e) {
      console.error("app_users provision failed", e);
    }

    // Welcome email to user (with credentials)
    await sendEmail(
      {
        from: FROM,
        to: [email],
        subject: "Your Masmer AI demo access is ready 🏠",
        html: welcomeHtml(firstName, email, password),
      },
      apiKey,
    );

    // Notification to admin
    await sendEmail(
      {
        from: FROM,
        to: [ADMIN_EMAIL],
        subject: `New Free Demo Signup — ${email}`,
        text:
          `New free demo signup\n\n` +
          `Email: ${email}\n` +
          `Name: ${full_name ?? "—"}\n` +
          `Business: ${business_name ?? "—"}\n` +
          `Phone: ${phone ?? "—"}\n` +
          `Contractor type: ${contractor_type ?? "—"}\n` +
          `Source: ${source ?? "—"}\n` +
          `Created new account: ${createdNew}\n`,
      },
      apiKey,
    );

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-welcome-email failed", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
