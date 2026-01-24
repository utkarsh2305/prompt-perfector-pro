import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LogRevertEventInput {
  prompt_analysis_id?: string;
  revert_reason: "preferred_original" | "ai_changed_meaning" | "too_long" | "other";
  score_before: number;
  score_after: number;
  platform: string;
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
    const body: LogRevertEventInput = await req.json();

    // Validate input
    const validReasons = ["preferred_original", "ai_changed_meaning", "too_long", "other"];
    if (!body.revert_reason || !validReasons.includes(body.revert_reason)) {
      return new Response(
        JSON.stringify({ error: `Invalid revert_reason. Must be one of: ${validReasons.join(", ")}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (typeof body.score_before !== "number" || typeof body.score_after !== "number") {
      return new Response(
        JSON.stringify({ error: "score_before and score_after must be numbers" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const validPlatforms = ["chatgpt", "claude", "gemini", "perplexity", "other"];
    const platform = validPlatforms.includes(body.platform) ? body.platform : "other";

    // Insert the event
    const { data: event, error: insertError } = await supabase
      .from("revert_events")
      .insert({
        user_id: user.id,
        prompt_analysis_id: body.prompt_analysis_id || null,
        revert_reason: body.revert_reason,
        score_before: body.score_before,
        score_after: body.score_after,
        platform,
      })
      .select("id")
      .single();

    if (insertError) {
      throw insertError;
    }

    return new Response(
      JSON.stringify({ logged: true, event_id: event.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("log-revert-event error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
