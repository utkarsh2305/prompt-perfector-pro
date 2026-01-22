import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { assertAdmin, corsHeaders } from "../_shared/admin.ts";

// Section names mapping
const SECTION_NAMES: Record<number, string> = {
  1: "Goal Clarity",
  2: "Context Provision",
  3: "Formatting Preferences",
  4: "Constraints and Boundaries",
  5: "Quality Expectations",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const adminResult = await assertAdmin(req);
    if (!adminResult.ok) {
      return new Response(JSON.stringify(adminResult.body), {
        status: adminResult.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = adminResult.adminClient;
    const { rows } = await req.json();

    if (!Array.isArray(rows) || rows.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "No rows provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate and transform rows
    const toInsert = rows.map((row, index) => {
      const sectionNumber = Number(row.section_number);
      if (!sectionNumber || sectionNumber < 1 || sectionNumber > 5) {
        throw new Error(`Row ${index + 1}: Invalid section_number`);
      }

      const penalty = Number(row.default_penalty);
      if (!penalty || penalty < 1 || penalty > 5) {
        throw new Error(`Row ${index + 1}: Invalid default_penalty`);
      }

      const severity = String(row.severity_level).toLowerCase();
      if (!["critical", "major", "minor"].includes(severity)) {
        throw new Error(`Row ${index + 1}: Invalid severity_level`);
      }

      const tier = String(row.tier_required).toLowerCase();
      if (!["free", "pro", "enterprise"].includes(tier)) {
        throw new Error(`Row ${index + 1}: Invalid tier_required`);
      }

      return {
        section_number: sectionNumber,
        section_name: SECTION_NAMES[sectionNumber] || `Section ${sectionNumber}`,
        principle: String(row.principle),
        severity_level: severity,
        default_penalty: penalty,
        tier_required: tier,
        is_active: row.is_active === true || row.is_active === "true",
        why_matters: "Imported via CSV",
        better_practice: "See principle description",
        detection_keywords: [],
      };
    });

    const { data, error } = await supabase
      .from("framework_principles")
      .insert(toInsert)
      .select("id");

    if (error) {
      throw new Error(error.message);
    }

    return new Response(
      JSON.stringify({ success: true, inserted: data?.length || 0 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.includes("Unauthorized") || message.includes("Forbidden") ? 403 : 500;
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
