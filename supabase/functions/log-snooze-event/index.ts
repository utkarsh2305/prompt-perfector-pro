import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LogSnoozeEventInput {
  snooze_type: "snooze" | "unsnooze";
  snooze_reason: "manual" | "timer_15" | "timer_30" | "timer_60" | "session" | "auto_expired";
  platform: "chatgpt" | "claude" | "gemini" | "perplexity" | "other";
  duration_minutes: number | null;
  session_id: string;
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
    const body: LogSnoozeEventInput = await req.json();

    // Validate input
    if (!["snooze", "unsnooze"].includes(body.snooze_type)) {
      return new Response(
        JSON.stringify({ error: "Invalid snooze_type. Must be 'snooze' or 'unsnooze'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const validReasons = ["manual", "timer_15", "timer_30", "timer_60", "session", "auto_expired"];
    if (body.snooze_reason && !validReasons.includes(body.snooze_reason)) {
      return new Response(
        JSON.stringify({ error: `Invalid snooze_reason. Must be one of: ${validReasons.join(", ")}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const validPlatforms = ["chatgpt", "claude", "gemini", "perplexity", "other"];
    if (body.platform && !validPlatforms.includes(body.platform)) {
      return new Response(
        JSON.stringify({ error: `Invalid platform. Must be one of: ${validPlatforms.join(", ")}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!body.session_id) {
      return new Response(
        JSON.stringify({ error: "session_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user has snooze analytics enabled
    const { data: preferences } = await supabase
      .from("user_preferences")
      .select("snooze_analytics_enabled")
      .eq("user_id", user.id)
      .maybeSingle();

    // If analytics disabled, return early
    if (preferences?.snooze_analytics_enabled === false) {
      return new Response(
        JSON.stringify({ logged: false, reason: "analytics_disabled" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate actual_duration_minutes if this is an unsnooze event
    let actualDurationMinutes: number | null = null;

    if (body.snooze_type === "unsnooze") {
      // Find most recent "snooze" event for this user + session_id
      const { data: lastSnooze } = await supabase
        .from("snooze_events")
        .select("created_at")
        .eq("user_id", user.id)
        .eq("session_id", body.session_id)
        .eq("snooze_type", "snooze")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastSnooze?.created_at) {
        const snoozeTime = new Date(lastSnooze.created_at);
        const now = new Date();
        actualDurationMinutes = Math.round((now.getTime() - snoozeTime.getTime()) / 60000);
      }
    }

    // Insert the event
    const { data: event, error: insertError } = await supabase
      .from("snooze_events")
      .insert({
        user_id: user.id,
        snooze_type: body.snooze_type,
        snooze_reason: body.snooze_reason,
        platform: body.platform,
        duration_minutes: body.duration_minutes,
        actual_duration_minutes: actualDurationMinutes,
        session_id: body.session_id,
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
    console.error("log-snooze-event error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
