import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const message = body?.message ?? {};
    const call = message.call ?? {};
    const analysis = message.analysis ?? {};
    const structured = analysis.structuredData ?? {};
    const artifact = message.artifact ?? {};

    const caller_phone = call?.customer?.number ?? null;
    const caller_name =
      structured.customerName ?? call?.customer?.name ?? null;
    const transcript = artifact.transcript ?? null;
    const ai_summary = analysis.summary ?? null;
    const job_type = structured.jobType ?? null;
    const job_address = structured.jobAddress ?? null;
    const estimated_budget = structured.estimatedBudget ?? null;

    let call_duration = 0;
    if (call?.startedAt && call?.endedAt) {
      const start = new Date(call.startedAt).getTime();
      const end = new Date(call.endedAt).getTime();
      if (!isNaN(start) && !isNaN(end)) {
        call_duration = Math.max(0, Math.round((end - start) / 1000));
      }
    }

    const customer_id = body?.customer_id ?? null;

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await supabase
      .from("calls")
      .insert({
        caller_phone,
        caller_name,
        transcript,
        ai_summary,
        job_type,
        job_address,
        estimated_budget,
        call_duration,
        lead_status: "new",
        customer_id,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Insert error", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ success: true, call_id: data.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("save-call error", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});