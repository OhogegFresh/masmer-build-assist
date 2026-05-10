import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function normalizePhone(phone: string): string {
  const digits = (phone || "").replace(/\D/g, "");
  return digits.slice(-10);
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, name, address, email } = await req.json();

    if (!name || typeof name !== "string") {
      return json({ error: "name is required" }, 400);
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return json({ error: "Missing Supabase env" }, 500);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const normalized = normalizePhone(phone || "");

    // 1. Search by normalized phone (last 10 digits)
    if (normalized.length === 10) {
      const { data: phoneMatches, error: phoneErr } = await supabase
        .from("customers")
        .select("id, phone, name")
        .not("phone", "is", null);

      if (phoneErr) {
        console.error("phone lookup error", phoneErr);
        return json({ error: phoneErr.message }, 500);
      }

      const match = (phoneMatches || []).find(
        (r: { phone: string | null }) =>
          normalizePhone(r.phone || "") === normalized,
      );
      if (match) {
        return json({ customer_id: match.id, created: false });
      }
    }

    // 2. Search by lower(name)
    const { data: nameMatches, error: nameErr } = await supabase
      .from("customers")
      .select("id, name, phone")
      .ilike("name", name.trim());

    if (nameErr) {
      console.error("name lookup error", nameErr);
      return json({ error: nameErr.message }, 500);
    }

    const nameMatch = (nameMatches || []).find(
      (r: { name: string }) =>
        (r.name || "").trim().toLowerCase() === name.trim().toLowerCase(),
    );

    if (nameMatch) {
      // Update phone if empty and we have one
      if (!nameMatch.phone && phone) {
        const { error: updErr } = await supabase
          .from("customers")
          .update({ phone })
          .eq("id", nameMatch.id);
        if (updErr) console.error("phone update error", updErr);
      }
      return json({ customer_id: nameMatch.id, created: false });
    }

    // 3. Insert new customer
    const { data: inserted, error: insErr } = await supabase
      .from("customers")
      .insert({
        name: name.trim(),
        phone: phone || null,
        address: address || null,
        email: email || null,
      })
      .select("id")
      .single();

    if (insErr || !inserted) {
      console.error("insert error", insErr);
      return json({ error: insErr?.message || "Failed to create customer" }, 500);
    }

    return json({ customer_id: inserted.id, created: true });
  } catch (err) {
    console.error("find-or-create-customer error", err);
    return json({ error: String(err) }, 500);
  }
});