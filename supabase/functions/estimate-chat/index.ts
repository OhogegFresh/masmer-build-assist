import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are an expert construction estimating assistant for 607 The Home Improvement CCS Group — a professional home improvement company.

Your job is to collect project information through friendly conversation and generate a complete professional estimate.

CONVERSATION RULES:
- Be warm, friendly and professional
- Ask ONE question at a time — never multiple
- Keep responses SHORT (1-3 sentences max)
- Sound like a real person, not a robot
- Never mention timelines, schedules, or deadlines
- Never ask about budget or payment preferences
- Use the customer's name once you have it

INFORMATION TO COLLECT IN ORDER:

Step 1 — Greeting:
Say hello warmly. Ask for their first and last name.

Step 2 — Address:
Ask for the property address where the work will be done.

Step 3 — Project description:
Ask them to describe what work they need done. Listen carefully — they may describe multiple items. Ask a follow-up if something is unclear.

Step 4 — Measurements:
Based on what they described, ask for specific measurements needed. Examples:
- For flooring: "What are the dimensions of the room? Length and width in feet."
- For siding: "What are the wall dimensions? Height and width of each wall."
- For roofing: "What's the approximate size of the roof area?"
- For painting: "What are the room dimensions and ceiling height?"
Only ask for measurements that are relevant to their specific project. If they already provided measurements in their description, skip this step.

Step 5 — Additional details:
Ask if there's anything else important to know about the project. Examples:
- Existing conditions (old flooring to remove, existing damage, etc.)
- Material preferences if relevant
- Access to the property

Step 6 — Confirm and generate:
Summarize what you collected in 3-4 bullet points. Ask: "Does this look correct? Should I generate your estimate now?"
When they confirm → call generate_project tool.

IMPORTANT RULES:
- Never ask about timeline or schedule
- Never ask about budget
- Never ask how they want to pay
- If they give you all info upfront, confirm it and generate immediately
- Be encouraging: "Great!" "Perfect!" "Got it!"
- If measurements seem missing, ask once then proceed
- Customer-provided materials: if they mention they're supplying something, note it clearly`;

const tools = [
  {
    type: "function",
    function: {
      name: "generate_project",
      description:
        "Generate all three project documents once all project info has been gathered: private materials list, full scope of work contract, and quick crew punchlist.",
      parameters: {
        type: "object",
        properties: {
          customer_name: { type: "string" },
          project_address: { type: "string" },
          project_title: { type: "string" },
          project_summary: { type: "string" },

          // MATERIALS LIST (private, office only)
          materials_sections: {
            type: "array",
            description: "Grouped sections of materials needed for the job",
            items: {
              type: "object",
              properties: {
                section_title: { type: "string" },
                section_subtitle: { type: "string", description: "Measurement summary for this section" },
                items: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      item: { type: "string" },
                      qty: { type: "number", description: "Base quantity BEFORE 15% buffer" },
                      unit: { type: "string" },
                      unit_cost: { type: "number" },
                      hd_link: { type: "string", description: "Home Depot category URL for this item" },
                      tbd_note: { type: "string", description: "Leave empty string if not TBD" },
                    },
                    required: ["item", "qty", "unit", "unit_cost", "hd_link", "tbd_note"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["section_title", "section_subtitle", "items"],
              additionalProperties: false,
            },
          },

          // SCOPE OF WORK sections
          scope_sections: {
            type: "array",
            description: "Sections of the scope of work for the customer contract",
            items: {
              type: "object",
              properties: {
                section_label: { type: "string", description: "e.g. SECTION A — HARDWOOD FLOOR RESTORATION" },
                work_items: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      code: { type: "string", description: "e.g. A-1" },
                      title: { type: "string" },
                      bullets: { type: "array", items: { type: "string" } },
                    },
                    required: ["code", "title", "bullets"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["section_label", "work_items"],
              additionalProperties: false,
            },
          },

          // PUNCHLIST
          punchlist_items: {
            type: "array",
            description: "Short simple bullet tasks for the crew punchlist",
            items: { type: "string" },
          },

          // JOB-SPECIFIC DISCLAIMER BULLETS
          job_specific_disclaimers: {
            type: "array",
            description: "1-3 job-specific disclaimer bullets based on the type of work",
            items: { type: "string" },
          },

          // TOTALS
          materials_grand_total: {
            type: "number",
            description: "Grand total of all materials WITH 15% buffer applied",
          },
        },
        required: [
          "customer_name",
          "project_address",
          "project_title",
          "project_summary",
          "materials_sections",
          "scope_sections",
          "punchlist_items",
          "job_specific_disclaimers",
          "materials_grand_total",
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
        model: "google/gemini-2.5-pro",
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
    console.log("AI response:", JSON.stringify(data).slice(0, 2000));
    const choice = data.choices?.[0]?.message ?? {};
    const toolCall = choice.tool_calls?.[0];
    let project = null;
    let parseError: string | null = null;

    if (toolCall?.function?.name === "generate_project") {
      try {
        project = JSON.parse(toolCall.function.arguments);
        // Apply 15% buffer to all material quantities
        project.materials_sections = project.materials_sections.map((sec: any) => ({
          ...sec,
          items: sec.items.map((item: any) => ({
            ...item,
            qty_buffered: Math.ceil(item.qty * 1.15),
            total: Math.ceil(item.qty * 1.15) * item.unit_cost,
          })),
          section_total: sec.items.reduce(
            (sum: number, item: any) => sum + Math.ceil(item.qty * 1.15) * item.unit_cost,
            0,
          ),
        }));
        // Recalculate grand total with buffer
        project.materials_grand_total = project.materials_sections.reduce(
          (sum: number, sec: any) => sum + sec.section_total,
          0,
        );
      } catch (e) {
        console.error("Failed to parse project JSON", e, toolCall.function.arguments);
        parseError = String(e);
      }
    }

    let content = choice.content ?? "";
    if (!content && !project) {
      content = parseError
        ? "I tried to generate your estimate but hit a formatting issue. Please tell me again the project type, dimensions, and material grade."
        : "Could you give me a bit more detail about the project (type of work, room dimensions, and material grade)?";
    }

    return new Response(
      JSON.stringify({ content, project }),
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
