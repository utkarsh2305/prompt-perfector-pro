import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UpdatePreferencesInput {
  analysisMode?: string;
  activePlatforms?: string[];
  primaryAiPlatform?: string;
  showScoreBadge?: boolean;
  showHoverSuggestions?: boolean;
  autoReplaceOnRewrite?: boolean;
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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body: UpdatePreferencesInput = await req.json();

    // Build update object with only valid fields
    const updateData: Record<string, unknown> = {};

    if (body.analysisMode !== undefined) {
      if (!["realtime", "manual"].includes(body.analysisMode)) {
        return new Response(
          JSON.stringify({ error: "Invalid analysisMode. Must be 'realtime' or 'manual'" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      updateData.analysis_mode = body.analysisMode;
    }

    if (body.activePlatforms !== undefined) {
      if (!Array.isArray(body.activePlatforms)) {
        return new Response(
          JSON.stringify({ error: "activePlatforms must be an array" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      updateData.active_platforms = body.activePlatforms;
    }

    if (body.primaryAiPlatform !== undefined) {
      updateData.primary_ai_platform = body.primaryAiPlatform;
    }

    if (body.showScoreBadge !== undefined) {
      updateData.show_score_badge = body.showScoreBadge;
    }

    if (body.showHoverSuggestions !== undefined) {
      updateData.show_hover_suggestions = body.showHoverSuggestions;
    }

    if (body.autoReplaceOnRewrite !== undefined) {
      updateData.auto_replace_on_rewrite = body.autoReplaceOnRewrite;
    }

    if (Object.keys(updateData).length === 0) {
      return new Response(
        JSON.stringify({ error: "No valid fields to update" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Ensure user has preferences record (create if not exists)
    await supabase.rpc("get_or_create_user_preferences", { p_user_id: user.id });

    // Update preferences
    const { data: updated, error: updateError } = await supabase
      .from("user_preferences")
      .update(updateData)
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Return updated preferences in camelCase
    const response = {
      success: true,
      preferences: {
        analysisMode: updated.analysis_mode,
        activePlatforms: updated.active_platforms,
        primaryAiPlatform: updated.primary_ai_platform,
        showScoreBadge: updated.show_score_badge,
        showHoverSuggestions: updated.show_hover_suggestions,
        autoReplaceOnRewrite: updated.auto_replace_on_rewrite,
      },
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("update-preferences error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
