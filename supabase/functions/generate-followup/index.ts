import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are a professional follow-up assistant for 607 The Home Improvement CCS Group, a home improvement company.

Your job: write warm, professional follow-up messages to customers based on their recent call and project context.

Tone: friendly, helpful, concise, never pushy. Always sign off as "607 The Home Improvement CCS Group" in the email.

You MUST call the return_followup tool with two outputs:
1. sms: a short SMS/WhatsApp message UNDER 160 characters. Friendly, mention the job type and a clear next step (e.g. confirm details, schedule a visit, answer questions).
2. email: { subject, body }. Professional email — 3 to 4 sentences. Reference the project and offer to answer any questions. Subject line should be short and specific.

Never invent facts not present in the provided context. If a field is missing, keep the message generic but still relevant.`;

const tools = [
  {
    type: "function",
    function: {
      name: "return_followup",
      description: "Return the generated SMS and email follow-up content.",
      parameters: {
        type: "object",
        properties: {
          sms: { type: "string", description: "SMS/WhatsApp message under 160 characters" },
          email: {
            type: "object",
            properties: {
              subject: { type: "string" },
              body: { type: "string" },
            },
            required: ["subject", "body"],
            additionalProperties: false,
          },
        },
        required: ["sms", "email"],
        additionalProperties: false,
      },
    },
  },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      customer_name,
      call_summary,
      project_title,
      project_status,
      last_call_date,
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "Missing LOVABLE_API_KEY" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userContext = `Customer: ${customer_name ?? "Unknown"}
Last call date: ${last_call_date ?? "n/a"}
Last call summary: ${call_summary ?? "No recent call summary available."}
Current project: ${project_title ?? "No active project"}
Project status: ${project_status ?? "n/a"}

Generate a follow-up SMS and email now.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContext },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "return_followup" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(
        JSON.stringify({ error: "AI gateway error", detail: errText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      console.error("No tool call in response", JSON.stringify(data).slice(0, 1000));
      return new Response(JSON.stringify({ error: "No follow-up generated" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("generate-followup error", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});