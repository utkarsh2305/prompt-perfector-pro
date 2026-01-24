import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FrameworkRule {
  id: string;
  rule_number: number;
  rule_name: string;
  rule_description: string | null;
  category_id: string | null;
  weight: number;
  detection_keywords: string[];
  detection_patterns: string[];
  improvement_template: string | null;
  tier_required: string;
  rule_categories?: { name: string }[] | { name: string } | null;
}

interface RuleBreakdown {
  ruleId: string;
  ruleName: string;
  category: string | null;
  weight: number;
  score: number;
  suggestion: string | null;
}

interface PromptComponents {
  fullPrompt: string;
  action: string | null;
  subject: string | null;
  coreTask: string | null;
  topic: string | null;
  format: string | null;
}

interface ContextualSuggestion {
  ruleId: string;
  ruleName: string;
  category: string | null;
  weight: number;
  genericSuggestion: string | null;
  contextualSuggestion: string;
  examplePrompt: string | null;
  quickInsertions: string[];
}

interface ScoreResponse {
  analysisId: string;
  score: number;
  grade: string;
  gradeLabel: string;
  breakdown: RuleBreakdown[];
  passed: string[];
  partial: string[];
  failed: string[];
  topImprovements: ContextualSuggestion[];
  strengths: string[];
  promptComponents: {
    detectedAction: string | null;
    detectedSubject: string | null;
    detectedFormat: string | null;
    detectedTopic: string | null;
  };
}

// Extract components from the user's prompt for contextual suggestions
function extractPromptComponents(prompt: string): PromptComponents {
  const components: PromptComponents = {
    fullPrompt: prompt,
    action: null,
    subject: null,
    coreTask: null,
    topic: null,
    format: null,
  };

  // Extract action verb at the start
  const actionMatch = prompt.match(
    /^(write|create|generate|explain|analyze|summarize|make|build|design|draft|compose|develop|help me with|help me|give me|show me|tell me|find|list|describe|compare|review|check|fix|improve|optimize|refactor|translate|convert|calculate|solve|plan|outline|suggest|recommend|brainstorm)\s+/i
  );
  
  if (actionMatch) {
    components.action = actionMatch[1].toLowerCase();
    components.subject = prompt.slice(actionMatch[0].length).trim();
  } else {
    components.subject = prompt;
  }

  // Extract core task (remove leading articles)
  components.coreTask = (components.subject || prompt).replace(/^(a|an|the)\s+/i, "");

  // Try to extract format type
  const formatMatch = (components.subject || prompt).match(
    /\b(blog post|email|article|report|essay|code|function|script|letter|message|summary|list|guide|tutorial|presentation|proposal|story|poem|tweet|post|review|analysis|documentation|readme|api|query|sql|regex|prompt|template|response|reply|comment|feedback|description|headline|title|tagline|slogan|bio|introduction|conclusion|outline|plan|strategy|roadmap|checklist|schedule|agenda|minutes|notes|memo|announcement|newsletter|press release|case study|white paper|ebook|landing page|homepage|product description|faq|help article|knowledge base|sop|policy|contract|terms|privacy policy|job description|resume|cover letter|linkedin|portfolio|pitch|deck|slides|dashboard|chart|graph|table|spreadsheet|formula|macro|test|unit test|spec|requirement|user story|acceptance criteria|bug report|feature request|changelog|commit message|pr description|code review)\b/i
  );
  if (formatMatch) {
    components.format = formatMatch[1].toLowerCase();
  }

  // Try to extract topic (after "about", "for", "on", "regarding")
  const topicMatch = prompt.match(
    /\b(?:about|for|on|regarding|concerning|related to)\s+(.+?)(?:\.|$|,|\s+(?:that|which|with|in|using|and|or|but|to|from|by|as|at|into|onto|upon|within|without|through|during|before|after|above|below|between|among|against|toward|towards))/i
  );
  if (topicMatch) {
    components.topic = topicMatch[1].trim();
  } else {
    // Fallback: try to get topic from the core task
    const fallbackTopic = (components.coreTask || "").replace(
      /^(a|an|the|some|any|my|your|our|their|this|that|these|those)\s+/i,
      ""
    );
    if (fallbackTopic.length > 3 && fallbackTopic.length < 100) {
      components.topic = fallbackTopic;
    }
  }

  return components;
}

// Generate contextual suggestion based on rule and prompt components
function generateContextualSuggestion(
  rule: FrameworkRule & { categoryName: string | null },
  promptComponents: PromptComponents
): ContextualSuggestion {
  const { fullPrompt, action, subject, coreTask, topic, format } = promptComponents;

  // Reconstruct base prompt for suggestions
  const baseAction = action ? capitalizeFirst(action) : "Create";
  const baseSubject = subject || coreTask || fullPrompt.slice(0, 50);
  const displaySubject = baseSubject.length > 60 ? baseSubject.slice(0, 60) + "..." : baseSubject;

  // Build the reconstructed prompt base
  const reconstructed = action ? `${baseAction} ${displaySubject}` : displaySubject;

  // Define contextual templates based on common rule patterns
  const ruleNameLower = rule.rule_name.toLowerCase();
  
  let contextualSuggestion = "";
  let examplePrompt: string | null = null;
  let quickInsertions: string[] = [];

  // CONTEXT-related rules
  if (ruleNameLower.includes("context") || ruleNameLower.includes("background")) {
    contextualSuggestion = `${reconstructed} **for [your context/situation]**`;
    examplePrompt = `${reconstructed} **for my company's quarterly planning meeting**`;
    quickInsertions = ["for my team at [company]", "for a [industry] audience", "given that [situation]"];
  }
  // AUDIENCE-related rules
  else if (ruleNameLower.includes("audience") || ruleNameLower.includes("reader") || ruleNameLower.includes("who")) {
    contextualSuggestion = `${reconstructed} **for [target audience]**`;
    examplePrompt = `${reconstructed} **for senior executives with limited technical knowledge**`;
    quickInsertions = ["for beginners", "for experts in [field]", "for non-technical stakeholders", "for [role]s"];
  }
  // LENGTH/SIZE-related rules
  else if (ruleNameLower.includes("length") || ruleNameLower.includes("word") || ruleNameLower.includes("size") || ruleNameLower.includes("brief") || ruleNameLower.includes("concise")) {
    const formatDisplay = format || "response";
    contextualSuggestion = `${baseAction} **a [length]** ${coreTask || formatDisplay}`;
    examplePrompt = `${baseAction} **a 500-word** ${coreTask || formatDisplay}`;
    quickInsertions = ["500-word", "3-paragraph", "brief 2-minute", "comprehensive 2000-word", "one-page"];
  }
  // FORMAT/STRUCTURE-related rules
  else if (ruleNameLower.includes("format") || ruleNameLower.includes("structure") || ruleNameLower.includes("output")) {
    contextualSuggestion = `${reconstructed} **formatted as [format type]**`;
    examplePrompt = `${reconstructed} **formatted as bullet points with headers**`;
    quickInsertions = ["as a numbered list", "in markdown with headers", "as a table", "in JSON format", "with sections"];
  }
  // EXAMPLE-related rules
  else if (ruleNameLower.includes("example") || ruleNameLower.includes("sample") || ruleNameLower.includes("instance")) {
    contextualSuggestion = `${reconstructed}. **Example: [sample input] → [expected output]**`;
    examplePrompt = `${reconstructed}. **Example: "AI in healthcare" → should cover diagnostics, treatment, admin**`;
    quickInsertions = ["For example: [sample]", "Like this: [example]", "Such as: [instance]"];
  }
  // TONE-related rules
  else if (ruleNameLower.includes("tone") || ruleNameLower.includes("style") || ruleNameLower.includes("voice")) {
    contextualSuggestion = `${reconstructed} **in a [tone] tone**`;
    examplePrompt = `${reconstructed} **in a professional yet conversational tone**`;
    quickInsertions = ["professional", "casual", "formal", "friendly", "authoritative", "empathetic"];
  }
  // PERSONA/ROLE-related rules
  else if (ruleNameLower.includes("persona") || ruleNameLower.includes("role") || ruleNameLower.includes("act as") || ruleNameLower.includes("expert")) {
    contextualSuggestion = `**Act as a [role].** ${reconstructed}`;
    examplePrompt = `**Act as a senior content strategist.** ${reconstructed}`;
    quickInsertions = ["Act as an expert in [field]", "You are a [professional role]", "As a [persona]"];
  }
  // SCOPE/FOCUS-related rules
  else if (ruleNameLower.includes("scope") || ruleNameLower.includes("focus") || ruleNameLower.includes("limit") || ruleNameLower.includes("specific")) {
    contextualSuggestion = `${reconstructed}. **Focus only on [specific aspect]**`;
    examplePrompt = `${reconstructed}. **Focus only on the technical implementation, not business case**`;
    quickInsertions = ["Focus on [aspect]", "Limit to [boundary]", "Only cover [X]", "Exclude [Y]"];
  }
  // AVOID/EXCLUDE-related rules
  else if (ruleNameLower.includes("avoid") || ruleNameLower.includes("exclude") || ruleNameLower.includes("don't") || ruleNameLower.includes("not include")) {
    contextualSuggestion = `${reconstructed}. **Avoid [things to exclude]**`;
    examplePrompt = `${reconstructed}. **Avoid technical jargon and keep it accessible**`;
    quickInsertions = ["Avoid jargon", "Don't include [X]", "Exclude [Y]", "Skip [Z]"];
  }
  // STEP/PROCESS-related rules
  else if (ruleNameLower.includes("step") || ruleNameLower.includes("process") || ruleNameLower.includes("break") || ruleNameLower.includes("sequence")) {
    contextualSuggestion = `${reconstructed}. **Step 1: [first]. Step 2: [second]. Step 3: [third]**`;
    examplePrompt = `${reconstructed}. **Step 1: Outline key points. Step 2: Write draft. Step 3: Add examples**`;
    quickInsertions = ["First... Then... Finally...", "Step 1... Step 2...", "Phase 1... Phase 2..."];
  }
  // THINKING/REASONING-related rules
  else if (ruleNameLower.includes("think") || ruleNameLower.includes("reason") || ruleNameLower.includes("explain") || ruleNameLower.includes("logic")) {
    contextualSuggestion = `${reconstructed}. **Think step by step before answering**`;
    examplePrompt = `${reconstructed}. **Think step by step and explain your reasoning**`;
    quickInsertions = ["Think through this carefully", "Explain your reasoning", "Show your thought process"];
  }
  // GOAL/OBJECTIVE-related rules
  else if (ruleNameLower.includes("goal") || ruleNameLower.includes("objective") || ruleNameLower.includes("purpose") || ruleNameLower.includes("outcome")) {
    contextualSuggestion = `${reconstructed} **to achieve [goal/outcome]**`;
    examplePrompt = `${reconstructed} **to achieve a 20% increase in user engagement**`;
    quickInsertions = ["to achieve [goal]", "with the objective of [outcome]", "so that [result]"];
  }
  // CONSTRAINT-related rules
  else if (ruleNameLower.includes("constraint") || ruleNameLower.includes("requirement") || ruleNameLower.includes("must") || ruleNameLower.includes("condition")) {
    contextualSuggestion = `${reconstructed}. **Requirements: [constraint 1], [constraint 2]**`;
    examplePrompt = `${reconstructed}. **Requirements: must be mobile-friendly, load under 3 seconds**`;
    quickInsertions = ["Must include [X]", "Ensure [requirement]", "Within [constraint]"];
  }
  // TERMINOLOGY-related rules
  else if (ruleNameLower.includes("terminolog") || ruleNameLower.includes("define") || ruleNameLower.includes("clarif") || ruleNameLower.includes("meaning")) {
    contextualSuggestion = `${reconstructed}. **By "[term]" I mean [definition]**`;
    examplePrompt = `${reconstructed}. **By "performance" I mean response time and throughput**`;
    quickInsertions = ["Define: [term] means [meaning]", "When I say [X], I mean [Y]"];
  }
  // OPTIONS/ALTERNATIVES-related rules
  else if (ruleNameLower.includes("option") || ruleNameLower.includes("alternative") || ruleNameLower.includes("multiple") || ruleNameLower.includes("variation")) {
    contextualSuggestion = `${baseAction} **3 different versions of** ${coreTask || "this"}`;
    examplePrompt = `${baseAction} **3 different versions of** ${coreTask || "this"} **with varying tones**`;
    quickInsertions = ["Give me 3 options", "Provide 5 alternatives", "List several variations"];
  }
  // EMOTION/IMPACT-related rules
  else if (ruleNameLower.includes("emotion") || ruleNameLower.includes("impact") || ruleNameLower.includes("feel") || ruleNameLower.includes("inspire")) {
    contextualSuggestion = `${reconstructed}. **The reader should feel [emotion]**`;
    examplePrompt = `${reconstructed}. **The reader should feel inspired and motivated to take action**`;
    quickInsertions = ["Feel confident", "Feel excited", "Feel reassured", "Feel curious"];
  }
  // PRIORITY-related rules
  else if (ruleNameLower.includes("priorit") || ruleNameLower.includes("important") || ruleNameLower.includes("key") || ruleNameLower.includes("main")) {
    contextualSuggestion = `${reconstructed}. **Prioritize [most important aspect]**`;
    examplePrompt = `${reconstructed}. **Prioritize clarity and actionable takeaways**`;
    quickInsertions = ["Focus on [priority]", "Most importantly [X]", "Key requirement: [Y]"];
  }
  // LANGUAGE-related rules
  else if (ruleNameLower.includes("language") || ruleNameLower.includes("translat") || ruleNameLower.includes("locali")) {
    contextualSuggestion = `${reconstructed} **in [language]**`;
    examplePrompt = `${reconstructed} **in Spanish, using formal register**`;
    quickInsertions = ["in [language]", "translate to [lang]", "localize for [region]"];
  }
  // Fallback: create a basic contextual suggestion using the rule's template
  else {
    const templateAction = rule.improvement_template
      ? rule.improvement_template.replace(/^(Add|Specify|Include|Define|Provide|Set|Use|Consider)\s+/i, "**$1** ")
      : `Add ${rule.rule_name.toLowerCase()}`;
    contextualSuggestion = `${reconstructed} — ${templateAction}`;
    quickInsertions = [];
  }

  return {
    ruleId: rule.id,
    ruleName: rule.rule_name,
    category: rule.categoryName,
    weight: rule.weight,
    genericSuggestion: rule.improvement_template,
    contextualSuggestion,
    examplePrompt,
    quickInsertions,
  };
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Check if a prompt follows a rule
function checkRule(prompt: string, rule: FrameworkRule): number {
  const promptLower = prompt.toLowerCase();
  let score = 0;

  // Check keywords (partial match)
  const keywordMatches = (rule.detection_keywords || []).filter((kw) =>
    promptLower.includes(kw.toLowerCase())
  );
  if (keywordMatches.length > 0) {
    score += 0.5;
  }

  // Check regex patterns (if any match, full score)
  const patterns = rule.detection_patterns || [];
  if (patterns.length > 0) {
    const patternMatches = patterns.some((pattern) => {
      try {
        return new RegExp(pattern, "i").test(prompt);
      } catch {
        return false;
      }
    });
    if (patternMatches) {
      score = 1;
    }
  }

  return Math.min(score, 1);
}

// Determine grade from percentage
function getGrade(percentage: number): { grade: string; label: string } {
  if (percentage >= 90) return { grade: "A", label: "Excellent" };
  if (percentage >= 80) return { grade: "B+", label: "Great" };
  if (percentage >= 70) return { grade: "B", label: "Good" };
  if (percentage >= 60) return { grade: "C", label: "Needs Work" };
  if (percentage >= 50) return { grade: "D", label: "Poor" };
  return { grade: "F", label: "Rewrite Recommended" };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
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

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'prompt' field" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (prompt.length > 10000) {
      return new Response(
        JSON.stringify({ error: "Prompt too long. Maximum 10,000 characters." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user tier to filter rules
    const { data: profile } = await supabase
      .from("profiles")
      .select("tier")
      .eq("id", user.id)
      .maybeSingle();

    const userTier = profile?.tier || "free";
    const allowedTiers = ["free"];
    if (userTier === "pro" || userTier === "enterprise") {
      allowedTiers.push("pro");
    }
    if (userTier === "enterprise") {
      allowedTiers.push("enterprise");
    }

    // Fetch all active rules
    const { data: rules, error: rulesError } = await supabase
      .from("framework_rules")
      .select(`
        id,
        rule_number,
        rule_name,
        rule_description,
        category_id,
        weight,
        detection_keywords,
        detection_patterns,
        improvement_template,
        tier_required,
        rule_categories (name)
      `)
      .eq("is_active", true)
      .in("tier_required", allowedTiers)
      .order("rule_number", { ascending: true });

    if (rulesError) {
      throw new Error(`Failed to fetch rules: ${rulesError.message}`);
    }

    if (!rules || rules.length === 0) {
      return new Response(
        JSON.stringify({ error: "No active rules found" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract prompt components for contextual suggestions
    const promptComponents = extractPromptComponents(prompt);

    // Score each rule
    const breakdown: RuleBreakdown[] = [];
    const passed: string[] = [];
    const partial: string[] = [];
    const failed: string[] = [];
    const failedRulesData: (FrameworkRule & { categoryName: string | null })[] = [];
    let maxPossible = 0;
    let actualScore = 0;

    for (const rule of rules as FrameworkRule[]) {
      const ruleScore = checkRule(prompt, rule);
      const weight = Number(rule.weight) || 1;

      maxPossible += weight;
      actualScore += ruleScore * weight;

      const categoryName = Array.isArray(rule.rule_categories)
        ? rule.rule_categories[0]?.name || null
        : rule.rule_categories?.name || null;

      const item: RuleBreakdown = {
        ruleId: rule.id,
        ruleName: rule.rule_name,
        category: categoryName,
        weight,
        score: ruleScore,
        suggestion: ruleScore < 1 ? rule.improvement_template : null,
      };

      breakdown.push(item);

      if (ruleScore === 1) {
        passed.push(rule.id);
      } else if (ruleScore === 0.5) {
        partial.push(rule.id);
      } else {
        failed.push(rule.id);
        failedRulesData.push({ ...rule, categoryName });
      }
    }

    // Calculate percentage score
    const percentage = maxPossible > 0 ? Math.round((actualScore / maxPossible) * 100) : 0;
    const { grade, label } = getGrade(percentage);

    // Generate contextual suggestions for top 5 failed rules (sorted by weight)
    const topImprovements = failedRulesData
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 5)
      .map((rule) => generateContextualSuggestion(rule, promptComponents));

    // Get top 3 strengths from passed rules
    const strengths = breakdown
      .filter((b) => b.score === 1)
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 3)
      .map((b) => b.ruleName);

    // Update user_weak_rules for failed rules
    const failedRulePromises = failed.map((ruleId) =>
      supabase.rpc("increment_weak_rule", {
        p_user_id: user.id,
        p_rule_id: ruleId,
      })
    );

    const effectivenessPromises = breakdown.map((b) =>
      supabase.rpc("update_rule_effectiveness", {
        p_rule_id: b.ruleId,
        p_was_triggered: true,
        p_was_followed: b.score === 1,
      })
    );

    // Log to prompt_analysis_log
    const processingTimeMs = Date.now() - startTime;

    const violations = breakdown
      .filter((b) => b.score < 1)
      .map((b) => ({
        rule_id: b.ruleId,
        section: b.category || "General",
        principle: b.ruleName,
        issue: b.score === 0 ? "Rule not followed" : "Rule partially followed",
        severity: b.weight >= 4 ? "critical" : b.weight >= 3 ? "major" : "minor",
        penalty: Math.round((1 - b.score) * b.weight),
        suggestion: b.suggestion || "",
      }));

    const { data: logData, error: logError } = await supabase
      .from("prompt_analysis_log")
      .insert({
        user_id: user.id,
        original_prompt: prompt,
        prompt_length: prompt.length,
        score: percentage,
        max_score: 100,
        grade: grade.replace("+", "") as "A" | "B" | "C" | "D" | "F",
        violations,
        analysis_method: "template",
        improved_prompt: "",
        processing_time_ms: processingTimeMs,
      })
      .select("id")
      .single();

    if (logError) {
      console.error("Failed to log analysis:", logError);
    }

    const analysisId = logData?.id ?? crypto.randomUUID();

    // Execute background operations (don't wait)
    Promise.all([
      ...failedRulePromises,
      ...effectivenessPromises,
    ]).catch((err) => console.error("Background operations failed:", err));

    // Build response with enhanced structure
    const response: ScoreResponse = {
      analysisId,
      score: percentage,
      grade,
      gradeLabel: label,
      breakdown,
      passed,
      partial,
      failed,
      topImprovements,
      strengths,
      promptComponents: {
        detectedAction: promptComponents.action,
        detectedSubject: promptComponents.subject,
        detectedFormat: promptComponents.format,
        detectedTopic: promptComponents.topic,
      },
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("score-prompt error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});