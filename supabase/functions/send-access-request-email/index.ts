const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const RESEND_API = "https://api.resend.com/emails";
const FROM = "Masmer AI <onboarding@resend.dev>";
const ADMIN_EMAIL = "jacob@casacapsolutions.com";
const ADMIN_LINK = "https://masmer-build-assist.lovable.app/admin?tab=requests";

async function sendEmail(payload: Record<string, unknown>, apiKey: string) {
  const res = await fetch(RESEND_API, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error("Resend error", res.status, text);
    throw new Error(`Resend ${res.status}: ${text}`);
  }
  return text;
}

function adminHtml(d: Record<string, string>) {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#080C14;font-family:Arial,sans-serif;color:#F8FAFC;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 0;"><tr><td align="center">
    <table width="600" style="max-width:600px;background:#0F1623;border-radius:16px;border:1px solid rgba(224,92,26,0.3);">
      <tr><td style="padding:32px;">
        <h1 style="margin:0 0 8px;font-size:24px;color:#F8FAFC;">🔔 New Access Request</h1>
        <p style="margin:0 0 24px;color:#E05C1A;font-size:13px;text-transform:uppercase;letter-spacing:0.15em;font-weight:700;">Masmer AI</p>
        <table width="100%" style="background:#161E2E;border-radius:8px;padding:16px;border:1px solid rgba(255,255,255,0.05);">
          <tr><td style="padding:6px 0;color:#94A3B8;font-size:13px;">Name</td><td style="padding:6px 0;color:#F8FAFC;font-weight:600;">${d.full_name}</td></tr>
          <tr><td style="padding:6px 0;color:#94A3B8;font-size:13px;">Email</td><td style="padding:6px 0;color:#F8FAFC;">${d.email}</td></tr>
          <tr><td style="padding:6px 0;color:#94A3B8;font-size:13px;">Phone</td><td style="padding:6px 0;color:#F8FAFC;">${d.phone}</td></tr>
          <tr><td style="padding:6px 0;color:#94A3B8;font-size:13px;">Business</td><td style="padding:6px 0;color:#F8FAFC;">${d.business_name}</td></tr>
          <tr><td style="padding:6px 0;color:#94A3B8;font-size:13px;">Type</td><td style="padding:6px 0;color:#F8FAFC;">${d.business_type}</td></tr>
          <tr><td style="padding:6px 0;color:#94A3B8;font-size:13px;">Source</td><td style="padding:6px 0;color:#F8FAFC;">${d.referral_source}</td></tr>
          <tr><td style="padding:6px 0;color:#94A3B8;font-size:13px;vertical-align:top;">Message</td><td style="padding:6px 0;color:#F8FAFC;">${d.message || "—"}</td></tr>
          <tr><td style="padding:6px 0;color:#94A3B8;font-size:13px;">Submitted</td><td style="padding:6px 0;color:#F8FAFC;">${new Date().toLocaleString()}</td></tr>
        </table>
        <div style="text-align:center;margin:32px 0 0;">
          <a href="${ADMIN_LINK}" style="display:inline-block;background:#E05C1A;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;margin:0 6px;">✅ Approve</a>
          <a href="${ADMIN_LINK}" style="display:inline-block;background:transparent;color:#F8FAFC;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;border:1px solid rgba(255,255,255,0.2);margin:0 6px;">❌ Deny</a>
        </div>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}

function applicantHtml(firstName: string) {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#080C14;font-family:Arial,sans-serif;color:#F8FAFC;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 0;"><tr><td align="center">
    <table width="600" style="max-width:600px;background:#0F1623;border-radius:16px;border:1px solid rgba(224,92,26,0.3);">
      <tr><td style="padding:32px 32px 16px;text-align:center;">
        <h1 style="margin:0;font-size:30px;font-weight:800;color:#F8FAFC;">Masmer AI</h1>
        <p style="margin:8px 0 0;color:#E05C1A;font-size:12px;text-transform:uppercase;letter-spacing:0.18em;font-weight:700;">Request Received</p>
      </td></tr>
      <tr><td style="padding:8px 32px 32px;">
        <h2 style="margin:0 0 16px;font-size:22px;color:#F8FAFC;">Hi ${firstName}! 👋</h2>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#CBD5E1;">Thanks for requesting access to Masmer AI.</p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#CBD5E1;">We review all requests personally and will get back to you within 24 hours.</p>
        <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#CBD5E1;">In the meantime, feel free to reply to this email with any questions.</p>
        <p style="margin:24px 0 0;font-size:14px;color:#94A3B8;">Signed,<br/><strong style="color:#E05C1A;">Jacob</strong> — 607 Home Improvement CCS Group</p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) throw new Error("RESEND_API_KEY not set");
    const body = await req.json();
    const d = {
      full_name: String(body.full_name ?? ""),
      email: String(body.email ?? ""),
      phone: String(body.phone ?? ""),
      business_name: String(body.business_name ?? ""),
      business_type: String(body.business_type ?? ""),
      referral_source: String(body.referral_source ?? ""),
      message: String(body.message ?? ""),
    };
    if (!d.email || !d.full_name) {
      return new Response(JSON.stringify({ error: "email and full_name required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const firstName = d.full_name.trim().split(/\s+/)[0] || "there";

    await sendEmail({
      from: FROM, to: [ADMIN_EMAIL],
      subject: `🔔 New Access Request — ${d.business_name || d.full_name}`,
      html: adminHtml(d),
    }, apiKey);

    await sendEmail({
      from: FROM, to: [d.email],
      subject: "We received your request — Masmer AI",
      html: applicantHtml(firstName),
    }, apiKey);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-access-request-email failed", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});