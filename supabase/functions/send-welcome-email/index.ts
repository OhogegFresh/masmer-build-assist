// Welcome email for new free signups
// Requires RESEND_API_KEY

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const RESEND_API = "https://api.resend.com/emails";
// TODO: switch to "Masmer AI <hello@masmer.pro>" once DNS is verified in Resend.
const FROM = "Masmer AI <onboarding@resend.dev>";
const ADMIN_EMAIL = "jacob@casacapsolutions.com";
const LOGIN_URL = "https://masmer.pro/login";

function welcomeHtml(firstName: string, email: string) {
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#0A0F1E;font-family:Arial,Helvetica,sans-serif;color:#F8FAFC;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0F1E;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#111827;border-radius:16px;overflow:hidden;border:1px solid rgba(197,90,17,0.25);">
        <tr><td style="padding:32px;text-align:center;background:linear-gradient(135deg,#0A0F1E,#111827);">
          <h1 style="margin:0;font-size:30px;font-weight:800;letter-spacing:-0.02em;color:#F8FAFC;">Welcome to Masmer AI 🏠</h1>
        </td></tr>
        <tr><td style="padding:24px 32px 8px;">
          <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#CBD5E1;">Hi ${firstName}!</p>
          <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#CBD5E1;">Your Masmer AI account is ready.</p>
          <p style="margin:24px 0 12px;font-size:16px;color:#F8FAFC;font-weight:600;">Here's what you can do:</p>
          <ul style="margin:0 0 24px;padding:0;list-style:none;color:#CBD5E1;font-size:15px;line-height:2;">
            <li>🔧 Build scopes of work in minutes</li>
            <li>🛒 Get itemized materials lists</li>
            <li>📄 Download professional contracts</li>
            <li>✅ Generate crew punchlists</li>
            <li>📞 Try our AI receptionist demo</li>
          </ul>
          <div style="text-align:center;margin:28px 0;">
            <a href="${LOGIN_URL}" style="display:inline-block;background:#C55A11;color:#ffffff;padding:14px 30px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;">Sign in to Masmer AI →</a>
          </div>
          <p style="margin:0 0 6px;font-size:14px;color:#94A3B8;">Login anytime at: <a href="${LOGIN_URL}" style="color:#C55A11;">masmer.pro/login</a></p>
          <p style="margin:0 0 20px;font-size:14px;color:#94A3B8;">Email: <strong style="color:#F8FAFC;">${email}</strong></p>
          <p style="margin:0 0 4px;font-size:14px;color:#CBD5E1;">Questions? Reply to this email.</p>
          <p style="margin:18px 0 0;font-size:14px;color:#CBD5E1;">— Jacob</p>
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid rgba(248,250,252,0.08);text-align:center;background:#0A0F1E;">
          <p style="margin:0;font-size:12px;color:#64748B;line-height:1.6;">
            607 Home Improvement CCS Group<br/>
            <a href="https://masmer.pro" style="color:#64748B;">masmer.pro</a>
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
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) throw new Error("RESEND_API_KEY not set");

    const body = await req.json();
    const { email, full_name, source } = body ?? {};
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

    let userEmailSent = false;
    let userEmailError: string | null = null;
    try {
      await sendEmail(
        {
          from: FROM,
          to: [email],
          subject: "Welcome to Masmer AI 🏠",
          html: welcomeHtml(firstName, email),
        },
        apiKey,
      );
      userEmailSent = true;
    } catch (e) {
      userEmailError = (e as Error).message;
    }

    try {
      await sendEmail(
        {
          from: FROM,
          to: [ADMIN_EMAIL],
          subject: `New Masmer AI signup — ${email}`,
          text:
            `New free signup\n\n` +
            `Email: ${email}\n` +
            `Name: ${full_name ?? "—"}\n` +
            `Source: ${source ?? "—"}\n` +
            `User email delivered: ${userEmailSent}\n` +
            (userEmailError ? `User email error: ${userEmailError}\n` : ""),
        },
        apiKey,
      );
    } catch (e) {
      console.error("admin notify failed", (e as Error).message);
    }

    return new Response(JSON.stringify({ ok: true, userEmailSent, userEmailError }), {
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
