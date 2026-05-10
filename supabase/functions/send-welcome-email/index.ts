// Requires RESEND_API_KEY environment variable
// Get your free API key at resend.com
// Add to Supabase: Settings > Edge Functions > Secrets

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const RESEND_API = "https://api.resend.com/emails";
const FROM = "Masmer AI <onboarding@resend.dev>";
const ADMIN_EMAIL = "jacob@casacapsolutions.com";
const DEMO_LINK = "https://masmer-build-assist.lovable.app/estimate";

function welcomeHtml(firstName: string) {
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#0A0F1E;font-family:Arial,Helvetica,sans-serif;color:#F8FAFC;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0F1E;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#111827;border-radius:16px;overflow:hidden;border:1px solid rgba(197,90,17,0.25);">
        <tr><td style="padding:32px 32px 16px 32px;text-align:center;background:linear-gradient(135deg,#0A0F1E,#111827);">
          <h1 style="margin:0;font-size:32px;font-weight:800;letter-spacing:-0.02em;color:#F8FAFC;">Masmer AI</h1>
          <p style="margin:8px 0 0;color:#C55A11;font-size:13px;text-transform:uppercase;letter-spacing:0.18em;font-weight:700;">The AI Brain Behind Your Business</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <h2 style="margin:0 0 16px;font-size:26px;color:#F8FAFC;font-weight:700;">Welcome, ${firstName}! 👋</h2>
          <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#CBD5E1;">
            You've been granted <strong style="color:#C55A11;">7 days of free access to Masmer AI</strong> — the complete AI platform built for contractors and home improvement companies.
          </p>
          <p style="margin:0 0 12px;font-size:16px;color:#F8FAFC;font-weight:600;">Here's what you can do right now:</p>
          <ul style="margin:0 0 28px;padding:0;list-style:none;color:#CBD5E1;font-size:15px;line-height:1.9;">
            <li>🔧 Build a full Scope of Work in minutes</li>
            <li>🛒 Get an itemized Home Depot materials list</li>
            <li>📄 Download professional PDF contracts</li>
            <li>✅ Generate crew punchlists instantly</li>
            <li>📞 See your AI receptionist in action</li>
          </ul>
          <div style="text-align:center;margin:32px 0;">
            <a href="${DEMO_LINK}" style="display:inline-block;background:#C55A11;color:#ffffff;padding:16px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:16px;letter-spacing:0.02em;">Start Using Masmer AI →</a>
          </div>
          <div style="background:rgba(197,90,17,0.08);border-left:3px solid #C55A11;padding:14px 18px;border-radius:6px;margin-top:24px;">
            <p style="margin:0;font-size:13px;color:#CBD5E1;line-height:1.6;">
              ⏰ Your free access expires in <strong style="color:#C55A11;">7 days</strong>. After that, choose a plan to keep access. Questions? Reply to this email anytime.
            </p>
          </div>
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

    const body = await req.json();
    const {
      email,
      full_name,
      business_name,
      phone,
      contractor_type,
    } = body ?? {};

    if (!email || !full_name) {
      return new Response(
        JSON.stringify({ error: "email and full_name required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const firstName = String(full_name).trim().split(/\s+/)[0] || "there";

    // Welcome email to user
    await sendEmail(
      {
        from: FROM,
        to: [email],
        subject: "You're in — Welcome to Masmer AI 🏠",
        html: welcomeHtml(firstName),
      },
      apiKey,
    );

    // Notification to admin
    await sendEmail(
      {
        from: FROM,
        to: [ADMIN_EMAIL],
        subject: `New Early Access Signup — ${business_name ?? "Unknown"}`,
        text:
          `New early access signup\n\n` +
          `Name: ${full_name}\n` +
          `Email: ${email}\n` +
          `Business: ${business_name ?? "—"}\n` +
          `Phone: ${phone ?? "—"}\n` +
          `Contractor type: ${contractor_type ?? "—"}\n`,
      },
      apiKey,
    );

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-welcome-email failed", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});