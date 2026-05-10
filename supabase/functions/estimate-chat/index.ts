import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are Masmer AI, an estimating assistant for contractors.

CONVERSATION FLOW:
1. Greet warmly and ask the user to describe their project.
2. Ask follow-up questions ONE AT A TIME (do not lump multiple questions in one message). Cover all of:
   - Type of work (bathroom, kitchen, flooring, drywall, roofing, siding, or other)
   - Room dimensions and total square footage
   - Material grade preference (budget, mid-range, premium)
   - Whether demolition work is needed (yes/no)
   - Timeline / desired completion window
3. Once you have ALL required info, call the "generate_estimate" tool with realistic US construction pricing. Do NOT include the estimate as text — only via the tool call.

Keep messages short, friendly, professional. Use plain text, no markdown headings.`;

const tools = [
  {
    type: "function",
    function: {
      name: "generate_estimate",
      description:
        "Generate a final professional estimate once all project info has been gathered.",
      parameters: {
        type: "object",
        properties: {
          project_title: { type: "string" },
          project_summary: { type: "string" },
          square_footage: { type: "number" },
          timeline: { type: "string" },
          materials: {
            type: "array",
            items: {
              type: "object",
              properties: {
                item: { type: "string" },
                qty: { type: "number" },
                unit: { type: "string" },
                unit_cost: { type: "number" },
                total: { type: "number" },
              },
              required: ["item", "qty", "unit", "unit_cost", "total"],
              additionalProperties: false,
            },
          },
          labor: {
            type: "array",
            items: {
              type: "object",
              properties: {
                task: { type: "string" },
                hours: { type: "number" },
                rate: { type: "number" },
                total: { type: "number" },
              },
              required: ["task", "hours", "rate", "total"],
              additionalProperties: false,
            },
          },
          materials_subtotal: { type: "number" },
          labor_subtotal: { type: "number" },
          contractor_markup: { type: "number" },
          project_total: { type: "number" },
        },
        required: [
          "project_title",
          "project_summary",
          "square_footage",
          "timeline",
          "materials",
          "labor",
          "materials_subtotal",
          "labor_subtotal",
          "contractor_markup",
          "project_total",
        ],
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
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "Missing LOVABLE_API_KEY" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        tools,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(
        JSON.stringify({ error: "AI gateway error", status: response.status, detail: errText }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await response.json();
    const choice = data.choices?.[0]?.message ?? {};
    const toolCall = choice.tool_calls?.[0];
    let estimate = null;
    if (toolCall?.function?.name === "generate_estimate") {
      try {
        estimate = JSON.parse(toolCall.function.arguments);
      } catch (e) {
        console.error("Failed to parse estimate JSON", e);
      }
    }

    return new Response(
      JSON.stringify({ content: choice.content ?? "", estimate }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("estimate-chat error", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});