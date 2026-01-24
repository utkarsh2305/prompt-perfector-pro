import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ImportRow {
  rule_number: number;
  rule_name: string;
  rule_description?: string;
  category?: string;
  weight?: number;
  detection_keywords?: string[];
  detection_patterns?: string[];
  positive_examples?: string[];
  negative_examples?: string[];
  improvement_template?: string;
  tier_required?: string;
}

interface ImportOptions {
  skipDuplicates: boolean;
  updateExisting: boolean;
  autoCreateCategories: boolean;
}

interface ImportResult {
  imported: number;
  skipped: number;
  errors: { row: number; message: string }[];
  warnings: { row: number; message: string }[];
  categories_created: string[];
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user is admin
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { rows, options }: { rows: ImportRow[]; options: ImportOptions } = await req.json();

    if (!rows || !Array.isArray(rows)) {
      return new Response(
        JSON.stringify({ error: "Invalid request: rows array required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result: ImportResult = {
      imported: 0,
      skipped: 0,
      errors: [],
      warnings: [],
      categories_created: [],
    };

    // Get existing categories
    const { data: existingCategories } = await supabase
      .from("rule_categories")
      .select("id, name");

    const categoryMap = new Map<string, string>(
      (existingCategories || []).map((c) => [c.name.toLowerCase(), c.id])
    );

    // Get existing rules by rule_number
    const { data: existingRules } = await supabase
      .from("framework_rules")
      .select("id, rule_number, version");

    const existingRuleNumbers = new Set(
      (existingRules || []).map((r) => r.rule_number)
    );
    const ruleDataByNumber = new Map<number, { id: string; version: number }>(
      (existingRules || []).map((r) => [r.rule_number, { id: r.id, version: r.version }])
    );

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // +2 for 1-indexed and header row

      // Validate required fields
      if (!row.rule_number || isNaN(row.rule_number)) {
        result.errors.push({ row: rowNum, message: "rule_number is required and must be a number" });
        continue;
      }
      if (!row.rule_name || row.rule_name.trim() === "") {
        result.errors.push({ row: rowNum, message: "rule_name is required" });
        continue;
      }

      // Check for duplicates
      const isDuplicate = existingRuleNumbers.has(row.rule_number);
      
      if (isDuplicate) {
        if (options.skipDuplicates && !options.updateExisting) {
          result.skipped++;
          continue;
        } else if (!options.updateExisting) {
          result.errors.push({ row: rowNum, message: `Rule number ${row.rule_number} already exists` });
          continue;
        }
      }

      // Resolve category to category_id
      let categoryId: string | null = null;
      if (row.category) {
        const catLower = row.category.toLowerCase().trim();
        if (categoryMap.has(catLower)) {
          categoryId = categoryMap.get(catLower)!;
        } else if (options.autoCreateCategories) {
          // Create new category
          const { data: newCat, error: catError } = await supabase
            .from("rule_categories")
            .insert({
              name: row.category.trim(),
              description: `Auto-created during import`,
              color: "#6B7280",
              icon: "tag",
              sort_order: categoryMap.size + 1,
            })
            .select("id")
            .single();

          if (catError) {
            result.warnings.push({ row: rowNum, message: `Failed to create category: ${row.category}` });
          } else {
            categoryId = newCat.id;
            categoryMap.set(catLower, newCat.id);
            result.categories_created.push(row.category.trim());
          }
        } else {
          result.warnings.push({ row: rowNum, message: `Category "${row.category}" doesn't exist and auto-create is disabled` });
        }
      }

      // Prepare rule data
      const ruleData = {
        rule_number: row.rule_number,
        rule_name: row.rule_name.trim(),
        rule_description: row.rule_description?.trim() || null,
        category_id: categoryId,
        weight: Math.min(5, Math.max(1, row.weight || 3)),
        detection_keywords: row.detection_keywords || [],
        detection_patterns: row.detection_patterns || [],
        positive_examples: row.positive_examples || [],
        negative_examples: row.negative_examples || [],
        improvement_template: row.improvement_template?.trim() || null,
        tier_required: row.tier_required || "free",
        source: "community" as const,
        is_active: true,
      };

      if (isDuplicate && options.updateExisting) {
        // Update existing rule
        const existingRule = ruleDataByNumber.get(row.rule_number)!;
        const { error: updateError } = await supabase
          .from("framework_rules")
          .update({
            ...ruleData,
            version: existingRule.version + 1,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingRule.id);

        if (updateError) {
          result.errors.push({ row: rowNum, message: `Failed to update: ${updateError.message}` });
        } else {
          result.imported++;
        }
      } else {
        // Insert new rule
        const { error: insertError } = await supabase
          .from("framework_rules")
          .insert({
            ...ruleData,
            version: 1,
          });

        if (insertError) {
          result.errors.push({ row: rowNum, message: `Failed to insert: ${insertError.message}` });
        } else {
          existingRuleNumbers.add(row.rule_number);
          result.imported++;
        }
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Import error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
