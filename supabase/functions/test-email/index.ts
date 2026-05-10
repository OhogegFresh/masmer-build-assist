// Diagnostic: send a test email to admin via Resend
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const apiKey = Deno.env.get("RESEND_API_KEY");
    console.log("[test-email] RESEND_API_KEY present:", !!apiKey);
    if (!apiKey) throw new Error("RESEND_API_KEY not set");

    let to = "jacob@casacapsolutions.com";
    try {
      const body = await req.json().catch(() => null);
      if (body?.to) to = String(body.to);
    } catch { /* GET request */ }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Masmer AI <onboarding@resend.dev>",
        to: [to],
        subject: "Masmer AI — Resend test",
        text: `This is a Resend connectivity test from Masmer AI.\n\nTimestamp: ${new Date().toISOString()}`,
      }),
    });
    const text = await res.text();
    console.log("[test-email] resend response", res.status, text);
    return new Response(JSON.stringify({ status: res.status, response: text }), {
      status: res.ok ? 200 : 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[test-email] failed", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});