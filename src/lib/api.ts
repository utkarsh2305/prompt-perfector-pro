import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

export type AiPlatform = "chatgpt" | "claude" | "gemini" | "other";
export type Severity = "critical" | "major" | "minor";
export type LetterGrade = "A" | "B" | "C" | "D" | "F";

export type Violation = {
  rule_id: number;
  section: string;
  principle: string;
  issue: string;
  severity: Severity;
  penalty: number; // positive number of points to subtract
  suggestion: string;
};

export type AnalysisResultSuccess = {
  success: true;
  analysis: {
    original_prompt: string;
    score: number;
    max_score: 10;
    grade: LetterGrade;
    violations: Violation[];
    improved_prompt: string;
    improvement_summary: string;
    analysis_method: "template";
    processing_time_ms: number;
  };
  tier_info: {
    current_tier: "free";
    analyses_used_today: number;
    analyses_remaining: number;
    daily_limit: number;
    features: string[];
    locked_features: string[];
  };
  upgrade_prompt: {
    show: true;
    message: string;
    cta_text: "Upgrade to Pro";
    cta_url: "/pricing";
  };
  milestone?: {
    reached: boolean;
    milestone: number;
  };
};

export type AnalysisResultError = {
  success: false;
  error: string;
  message: string;
  code: string;
  details?: unknown;
};

export type AnalysisResult = AnalysisResultSuccess | AnalysisResultError;

const PROMPT_SCHEMA = z
  .string()
  .transform((v) => v.trim())
  .refine((v) => v.length > 0, { message: "Prompt cannot be empty" })
  .refine((v) => v.length <= 5000, { message: "Prompt must be 5000 characters or fewer" });

const CODE_TRIGGER = ["code", "function", "bug", "error", "script", "debug", "compile"];
const LANG_WORDS = ["python", "javascript", "java", "typescript", "c++", "c#", "ruby", "go", "rust"];
const VAGUE_ACTION = ["fix", "help", "improve", "make better", "optimize", "enhance"];
const CONTEXT_HINTS = ["because", "error", "expected", "should", "when", "trying to"];
const GENERAL_TERMS = ["thing", "stuff", "something", "kind of", "sort of"];
const CONTENT_TRIGGER = ["write", "create", "generate", "summarize", "list"];
const FORMAT_HINTS = ["bullet points", "table", "paragraph", "list", "steps"];
const AMBIG_QUANT = ["a lot", "some", "many", "few", "soon", "later", "recently"];
const AUDIENCE_TRIGGER = ["explain", "write", "article", "post", "guide"];
const AUDIENCE_HINTS = ["beginner", "expert", "for", "to"];
const EXAMPLE_TRIGGER = ["like", "similar to", "compare", "analyze"];

const passiveRegex = /\b(?:was|were|been|is|are|be)\b\s+\b(\w+ed|\w+en)\b/gi;

function includesAny(haystack: string, needles: string[]) {
  const h = haystack.toLowerCase();
  return needles.some((n) => h.includes(n));
}

function wordCount(prompt: string) {
  return prompt
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function sentenceCount(prompt: string) {
  const sentences = prompt
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return Math.max(1, sentences.length);
}

function gradeForScore(score: number): LetterGrade {
  if (score >= 9) return "A";
  if (score >= 7) return "B";
  if (score >= 5) return "C";
  if (score >= 3) return "D";
  return "F";
}

function buildImprovedPrompt(prompt: string, violations: Violation[]): { improved: string; summary: string } {
  const lower = prompt.toLowerCase();
  const added: string[] = [];

  const needsLanguage = includesAny(lower, CODE_TRIGGER) && !includesAny(lower, LANG_WORDS);
  if (needsLanguage) added.push("language");

  const hasAction = includesAny(lower, [...VAGUE_ACTION, ...CONTENT_TRIGGER, "analyze", "compare"]);
  const needsContext = hasAction && !includesAny(lower, CONTEXT_HINTS);
  if (needsContext) added.push("context");

  const needsOutputFormat = includesAny(lower, CONTENT_TRIGGER) && !includesAny(lower, FORMAT_HINTS);
  if (needsOutputFormat) added.push("output format");

  const needsAudience = includesAny(lower, AUDIENCE_TRIGGER) && !includesAny(lower, AUDIENCE_HINTS);
  if (needsAudience) added.push("target audience");

  const needsExamples = includesAny(lower, EXAMPLE_TRIGGER) && !lower.includes("example");
  if (needsExamples) added.push("examples");

  // Minimal “fill-in-the-blanks” structure. Keeps original intent while prompting the user to supply missing details.
  const lines: string[] = [];
  lines.push("Goal: [GOAL]");
  if (needsLanguage) lines.push("Language: [LANGUAGE]");
  if (lower.includes("error") || needsContext) lines.push("Error: [ERROR_MESSAGE]");
  if (needsContext) lines.push("Context: [CONTEXT — what you're trying to achieve and why]");
  lines.push("Expected: [EXPECTED_BEHAVIOR]");
  if (needsOutputFormat) lines.push("Format: [FORMAT — bullets, table, steps, etc.]");
  if (needsAudience) lines.push("For: [AUDIENCE]");
  if (needsExamples) lines.push("Examples: [EXAMPLE_INPUT] → [EXAMPLE_OUTPUT]");

  lines.push("");
  lines.push("Original prompt:");
  lines.push(prompt.trim());
  lines.push("");
  lines.push("Please show your reasoning.");
  lines.push("If anything is unclear, ask clarifying questions before proceeding.");

  const summary = added.length > 0 ? `Added: ${added.join(", ")}` : "No changes needed";
  return { improved: lines.join("\n"), summary };
}

function evaluateRules(prompt: string): { score: number; violations: Violation[]; improved_prompt: string; improvement_summary: string } {
  const startScore = 10;
  const lower = prompt.toLowerCase();
  const violations: Violation[] = [];

  // RULE 1: Length Check (Critical)
  if (wordCount(prompt) < 10) {
    violations.push({
      rule_id: 1,
      section: "Provide Context",
      principle: "Sufficient detail required",
      issue: "Prompt is too short to be effective",
      severity: "critical",
      penalty: 3,
      suggestion: "Add context: what you're trying to achieve, relevant details, desired output format",
    });
  }

  // RULE 2: Programming Language Detection (Major)
  if (includesAny(lower, CODE_TRIGGER) && !includesAny(lower, LANG_WORDS)) {
    violations.push({
      rule_id: 2,
      section: "Provide Context",
      principle: "Specify technical requirements",
      issue: "Coding task without programming language specified",
      severity: "major",
      penalty: 2,
      suggestion: "Add the programming language (e.g., 'in Python', 'using JavaScript')",
    });
  }

  // RULE 3: Vague Action Words (Major)
  if (includesAny(lower, VAGUE_ACTION) && !includesAny(lower, CONTEXT_HINTS)) {
    violations.push({
      rule_id: 3,
      section: "Language Precision",
      principle: "Avoid vague instructions",
      issue: "Vague action word without describing what to fix/improve",
      severity: "major",
      penalty: 2,
      suggestion: "Be specific: what exactly needs to be fixed/improved and why",
    });
  }

  // RULE 4: Missing Context (Major)
  if (includesAny(lower, [...VAGUE_ACTION, ...CONTENT_TRIGGER, "analyze", "compare"]) && !includesAny(lower, CONTEXT_HINTS)) {
    violations.push({
      rule_id: 4,
      section: "Provide Context",
      principle: "Include background information",
      issue: "No explanation of what you're trying to achieve",
      severity: "major",
      penalty: 2,
      suggestion: "Add why you need this, what you've tried, what's not working",
    });
  }

  // RULE 5: Generalized Terms (Minor)
  if (includesAny(lower, GENERAL_TERMS)) {
    violations.push({
      rule_id: 5,
      section: "Language Precision",
      principle: "Use specific nouns",
      issue: "Vague, non-specific language",
      severity: "minor",
      penalty: 1,
      suggestion: "Replace with precise nouns and descriptors",
    });
  }

  // RULE 6: No Output Format (Minor)
  if (includesAny(lower, CONTENT_TRIGGER) && !includesAny(lower, FORMAT_HINTS)) {
    violations.push({
      rule_id: 6,
      section: "Provide Context",
      principle: "Specify output format",
      issue: "No output format specified for content task",
      severity: "minor",
      penalty: 1,
      suggestion: "Specify how you want the output formatted (bullets, paragraphs, table, etc.)",
    });
  }

  // RULE 7: Ambiguous Quantifiers (Minor)
  if (includesAny(lower, AMBIG_QUANT)) {
    violations.push({
      rule_id: 7,
      section: "Language Precision",
      principle: "Use specific quantities",
      issue: "Ambiguous quantity or timeframe",
      severity: "minor",
      penalty: 1,
      suggestion: "Use specific numbers or dates (e.g., '5 items', 'by Friday', 'in the last week')",
    });
  }

  // RULE 8: No Target Audience (Minor)
  if (includesAny(lower, AUDIENCE_TRIGGER) && !includesAny(lower, AUDIENCE_HINTS)) {
    violations.push({
      rule_id: 8,
      section: "Provide Context",
      principle: "Define target audience",
      issue: "No target audience specified",
      severity: "minor",
      penalty: 1,
      suggestion: "Specify who this is for (e.g., 'for beginners', 'for data scientists', 'for 10-year-olds')",
    });
  }

  // RULE 9: Passive Voice Overuse (Minor)
  const passiveMatches = prompt.match(passiveRegex)?.length ?? 0;
  const passiveRatio = passiveMatches / sentenceCount(prompt);
  if (passiveRatio > 0.3) {
    violations.push({
      rule_id: 9,
      section: "Language Precision",
      principle: "Use active voice",
      issue: "Overuse of passive voice obscures responsibility",
      severity: "minor",
      penalty: 1,
      suggestion: "Use active voice with clear subjects (e.g., 'The team missed the deadline' not 'The deadline was missed')",
    });
  }

  // RULE 10: No Examples (Minor)
  if (includesAny(lower, EXAMPLE_TRIGGER) && !lower.includes("example")) {
    violations.push({
      rule_id: 10,
      section: "Provide Context",
      principle: "Use examples",
      issue: "No examples provided for comparison/pattern task",
      severity: "minor",
      penalty: 1,
      suggestion: "Include example input/output to clarify what you're looking for",
    });
  }

  // Score + prioritize
  const score = Math.max(
    1,
    startScore -
      violations.reduce((sum, v) => sum + v.penalty, 0),
  );

  const prioritized = [...violations]
    .sort((a, b) => b.penalty - a.penalty)
    .slice(0, 5);

  const { improved, summary } = buildImprovedPrompt(prompt, prioritized);
  return { score, violations: prioritized, improved_prompt: improved, improvement_summary: summary };
}

function todayIsoDate(): string {
  // Use UTC date component for stable comparisons.
  return new Date().toISOString().slice(0, 10);
}

export async function analyzePrompt(
  prompt: string,
  userId: string,
  platform: AiPlatform = "other",
): Promise<AnalysisResult> {
  const start = performance.now();

  try {
    // 1) AUTH CHECK
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id,tier,daily_usage_count,total_analyses_count,last_usage_reset_date")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      return {
        success: false,
        error: "Service unavailable",
        message: "We couldn't verify your account right now. Please try again.",
        code: "DB_ERROR",
        details: { context: "profiles_select" },
      };
    }

    if (!profile?.id) {
      return {
        success: false,
        error: "Unauthorized",
        message: "You must be signed in to analyze prompts.",
        code: "UNAUTHORIZED",
      };
    }

    // 2) DAILY RESET CHECK
    const today = todayIsoDate();
    const lastReset = (profile.last_usage_reset_date as string | null) ?? today;
    if (lastReset < today) {
      const { error: resetError } = await supabase.rpc("reset_daily_usage");
      if (resetError) {
        return {
          success: false,
          error: "Service unavailable",
          message: "We couldn't reset daily usage right now. Please try again.",
          code: "DB_ERROR",
          details: { context: "reset_daily_usage" },
        };
      }
    }

    // 3) RATE LIMIT CHECK
    const { data: canData, error: canError } = await supabase.rpc("can_user_analyze", {
      user_uuid: userId,
    });

    if (canError || !canData) {
      return {
        success: false,
        error: "Service unavailable",
        message: "We couldn't check your daily limit right now. Please try again.",
        code: "DB_ERROR",
        details: { context: "can_user_analyze" },
      };
    }

    const canRow = Array.isArray(canData) ? canData[0] : canData;
    const canAnalyze = Boolean(canRow?.can_analyze);
    const usageCount = Number(canRow?.usage_count ?? 0);
    const usageLimit = canRow?.usage_limit === null ? null : Number(canRow?.usage_limit ?? 10);

    if (!canAnalyze) {
      return {
        success: false,
        error: "Rate limit exceeded",
        message: "Daily limit reached. Upgrade to Pro for unlimited.",
        code: "RATE_LIMIT_EXCEEDED",
        details: {
          analyses_used_today: usageCount,
          daily_limit: usageLimit ?? 10,
          reset_time: "midnight",
          upgrade_url: "/pricing",
        },
      };
    }

    // 4) INPUT VALIDATION
    const parsed = PROMPT_SCHEMA.safeParse(prompt);
    if (!parsed.success) {
      return {
        success: false,
        error: "Bad request",
        message: parsed.error.issues[0]?.message ?? "Invalid prompt",
        code: "VALIDATION_ERROR",
        details: parsed.error.flatten(),
      };
    }
    const cleanPrompt = parsed.data;

    // ANALYSIS
    const { score, violations, improved_prompt, improvement_summary } = evaluateRules(cleanPrompt);
    const grade = gradeForScore(score);

    // POST-ACTIONS: log + increment usage
    const processingMs = Math.round(performance.now() - start);
    const promptToStore = cleanPrompt.slice(0, 500);

    const { error: insertError } = await supabase.from("prompt_analysis_log").insert({
      user_id: userId,
      original_prompt: promptToStore,
      prompt_length: cleanPrompt.length,
      ai_platform: platform,
      score,
      max_score: 10,
      grade,
      violations,
      analysis_method: "template",
      improved_prompt,
      processing_time_ms: processingMs,
      llm_tokens_input: 0,
      llm_tokens_output: 0,
      llm_cost_cents: 0,
    });

    if (insertError) {
      return {
        success: false,
        error: "Service unavailable",
        message: "We couldn't save your analysis right now. Please try again.",
        code: "DB_ERROR",
        details: { context: "prompt_analysis_log_insert" },
      };
    }

    const { error: incError } = await supabase.rpc("increment_usage", { user_uuid: userId });
    if (incError) {
      return {
        success: false,
        error: "Service unavailable",
        message: "We couldn't update your usage right now. Please try again.",
        code: "DB_ERROR",
        details: { context: "increment_usage" },
      };
    }

    const { data: afterProfile } = await supabase
      .from("profiles")
      .select("daily_usage_count,total_analyses_count")
      .eq("id", userId)
      .maybeSingle();

    const analysesUsedToday = Number(afterProfile?.daily_usage_count ?? usageCount + 1);
    const totalAnalyses = Number(afterProfile?.total_analyses_count ?? profile.total_analyses_count ?? 0);

    const dailyLimit = usageLimit ?? 10;
    const analysesRemaining = Math.max(0, dailyLimit - analysesUsedToday);

    const milestones = [10, 50, 100];
    const reached = milestones.find((m) => totalAnalyses === m);

    return {
      success: true,
      analysis: {
        original_prompt: cleanPrompt,
        score,
        max_score: 10,
        grade,
        violations,
        improved_prompt,
        improvement_summary: improvement_summary + (violations.length > 0 ? ". Fix these critical issues first." : ""),
        analysis_method: "template",
        processing_time_ms: processingMs,
      },
      tier_info: {
        current_tier: "free",
        analyses_used_today: analysesUsedToday,
        analyses_remaining: analysesRemaining,
        daily_limit: dailyLimit,
        features: ["10 analyses/day", "Template-based analysis", "Basic rules (10)", "Works on all platforms"],
        locked_features: ["AI-powered analysis", "Real-time mode", "Advanced analytics"],
      },
      upgrade_prompt: {
        show: true,
        message: "Upgrade to Pro for unlimited analyses and AI-powered improvements.",
        cta_text: "Upgrade to Pro",
        cta_url: "/pricing",
      },
      ...(reached
        ? {
            milestone: {
              reached: true,
              milestone: reached,
            },
          }
        : undefined),
    };
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("analyzePrompt unexpected error", e);
    return {
      success: false,
      error: "Server error",
      message: "Something went wrong. Please try again.",
      code: "INTERNAL_ERROR",
    };
  }
}
