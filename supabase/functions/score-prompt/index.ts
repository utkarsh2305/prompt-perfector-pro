import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limit.ts";

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

interface ImprovementApplied {
  category: string;
  ruleName: string;
  applied: boolean;
  change: string;
}

interface ScoreResponse {
  analysisId: string;
  score: number;
  grade: string;
  gradeLabel: string;
  // New: Combined suggested prompt
  suggestedPrompt: string | null;
  scoreAfterSuggestion: number | null;
  improvements: ImprovementApplied[];
  // Metadata
  categoriesEvaluated: string[];
  rulesPassed: number;
  rulesFailed: number;
  rulesTotal: number;
  // Existing fields for backward compatibility
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
    hasConditional: boolean;
    hasComparison: boolean;
    hasList: boolean;
    hasQuestion: boolean;
    questionType: string | null;
    detectedAudience: string | null;
    detectedTone: string | null;
    detectedLength: string | null;
    detectedPersona: string | null;
    detectedGoal: string | null;
    detectedLanguage: string | null;
    detectedFramework: string | null;
    detectedPlatform: string | null;
    clauseCount: number;
    constraintCount: number;
    exampleCount: number;
  };
}

// Extended interface for complex prompt parsing
interface ExtendedPromptComponents extends PromptComponents {
  clauses: string[];
  hasConditional: boolean;
  conditionalParts: { condition: string; then: string } | null;
  hasComparison: boolean;
  comparisonItems: string[];
  hasList: boolean;
  listItems: string[];
  hasQuestion: boolean;
  questionType: string | null;
  audience: string | null;
  constraints: string[];
  examples: string[];
  tone: string | null;
  length: string | null;
  persona: string | null;
  goal: string | null;
  programmingLanguage: string | null;
  framework: string | null;
  platform: string | null;
}

// Extract components from the user's prompt for contextual suggestions
function extractPromptComponents(prompt: string): PromptComponents {
  const extended = extractExtendedComponents(prompt);
  return {
    fullPrompt: extended.fullPrompt,
    action: extended.action,
    subject: extended.subject,
    coreTask: extended.coreTask,
    topic: extended.topic,
    format: extended.format,
  };
}

// Full extraction with all advanced patterns
function extractExtendedComponents(prompt: string): ExtendedPromptComponents {
  const components: ExtendedPromptComponents = {
    fullPrompt: prompt,
    action: null,
    subject: null,
    coreTask: null,
    topic: null,
    format: null,
    clauses: [],
    hasConditional: false,
    conditionalParts: null,
    hasComparison: false,
    comparisonItems: [],
    hasList: false,
    listItems: [],
    hasQuestion: false,
    questionType: null,
    audience: null,
    constraints: [],
    examples: [],
    tone: null,
    length: null,
    persona: null,
    goal: null,
    programmingLanguage: null,
    framework: null,
    platform: null,
  };

  const promptLower = prompt.toLowerCase();

  // ===== ACTION VERB EXTRACTION =====
  const actionPatterns = [
    /^(write|create|generate|explain|analyze|summarize|make|build|design|draft|compose|develop|find|list|describe|compare|review|check|fix|improve|optimize|refactor|translate|convert|calculate|solve|plan|outline|suggest|recommend|brainstorm|implement|debug|test|deploy|configure|setup|install|migrate|upgrade|downgrade|integrate|validate|verify|format|parse|serialize|deserialize|encode|decode|encrypt|decrypt|compress|extract|merge|split|combine|sort|filter|search|query|fetch|retrieve|update|delete|insert|modify|transform|map|reduce|iterate|loop|traverse|navigate|render|display|show|hide|toggle|enable|disable|animate|style|layout|align|center|justify|wrap|truncate|paginate|cache|memoize|debounce|throttle|batch|queue|schedule|monitor|log|track|measure|benchmark|profile|audit|scan|lint|minify|bundle|compile|transpile|polyfill)\s+/i,
    /^(help me|help me to|help me with|assist me with|assist me in|guide me through|walk me through|show me how to|teach me to|explain how to)\s+/i,
    /^(?:i want to|i need to|i'd like to|i would like to|can you|could you|would you|please)\s+(write|create|generate|explain|make|build|design|help|show|give|tell|find|list|describe|fix|improve)\s*/i,
    /^(?:how (?:do i|can i|should i|to)|what is the best way to|what's the best way to)\s+/i,
  ];

  for (const pattern of actionPatterns) {
    const match = prompt.match(pattern);
    if (match) {
      const fullMatch = match[0];
      const actionVerb = match[1] ? match[1].toLowerCase() : fullMatch.toLowerCase().trim();
      components.action = normalizeAction(actionVerb);
      components.subject = prompt.slice(fullMatch.length).trim();
      break;
    }
  }

  if (!components.subject) {
    components.subject = prompt;
  }

  // ===== CLAUSE SPLITTING =====
  const clauseDelimiters = /(?:[.!?](?:\s+|$))|(?:\s+(?:and then|then|after that|next|finally|also|additionally|furthermore|moreover|however|but|although|while|whereas|meanwhile)\s+)/gi;
  components.clauses = prompt
    .split(clauseDelimiters)
    .map(c => c.trim())
    .filter(c => c.length > 3);

  // ===== CONDITIONAL DETECTION =====
  const conditionalPatterns = [
    /if\s+(.+?)\s*[,;]\s*(?:then\s+)?(.+?)(?:\.|$)/i,
    /when\s+(.+?)\s*[,;]\s*(.+?)(?:\.|$)/i,
    /(?:in case|in the case that|should)\s+(.+?)\s*[,;]\s*(.+?)(?:\.|$)/i,
    /unless\s+(.+?)\s*[,;]\s*(.+?)(?:\.|$)/i,
  ];

  for (const pattern of conditionalPatterns) {
    const match = prompt.match(pattern);
    if (match) {
      components.hasConditional = true;
      components.conditionalParts = {
        condition: match[1].trim(),
        then: match[2].trim(),
      };
      break;
    }
  }

  // ===== COMPARISON DETECTION =====
  const comparisonPatterns = [
    /compare\s+(.+?)\s+(?:with|to|and|vs\.?|versus)\s+(.+?)(?:\.|,|$)/i,
    /(?:difference|differences)\s+between\s+(.+?)\s+and\s+(.+?)(?:\.|,|$)/i,
    /(.+?)\s+(?:vs\.?|versus|compared to|in comparison to)\s+(.+?)(?:\.|,|$)/i,
    /(?:which is better|what's better|pros and cons of)\s+(.+?)\s+(?:or|vs\.?|versus)\s+(.+?)(?:\?|\.|,|$)/i,
  ];

  for (const pattern of comparisonPatterns) {
    const match = prompt.match(pattern);
    if (match) {
      components.hasComparison = true;
      components.comparisonItems = [match[1].trim(), match[2].trim()];
      break;
    }
  }

  // ===== LIST DETECTION =====
  const inlineListMatch = prompt.match(/(?:including|such as|like|for example|namely)\s+(.+?)(?:\.|$)/i);
  if (inlineListMatch) {
    const items = inlineListMatch[1].split(/,\s*(?:and\s+)?|\s+and\s+/);
    if (items.length >= 2) {
      components.hasList = true;
      components.listItems = items.map(i => i.trim()).filter(i => i.length > 0);
    }
  }

  const multiRequestMatch = prompt.match(/(.+?)\s+and\s+(?:also\s+)?(.+?)\s+and\s+(?:also\s+)?(.+?)(?:\.|$)/i);
  if (multiRequestMatch) {
    components.hasList = true;
    components.listItems = [
      multiRequestMatch[1].trim(),
      multiRequestMatch[2].trim(),
      multiRequestMatch[3].trim(),
    ];
  }

  // ===== QUESTION DETECTION =====
  const questionPatterns = [
    { pattern: /^what\s+(?:is|are|was|were|would|could|should)\s+/i, type: "definition" },
    { pattern: /^how\s+(?:do|does|can|could|should|would|to)\s+/i, type: "process" },
    { pattern: /^why\s+(?:do|does|is|are|did|would|should)\s+/i, type: "explanation" },
    { pattern: /^when\s+(?:do|does|is|are|should|would)\s+/i, type: "timing" },
    { pattern: /^where\s+(?:do|does|is|are|can|should)\s+/i, type: "location" },
    { pattern: /^who\s+(?:is|are|was|were|can|should|would)\s+/i, type: "person" },
    { pattern: /^which\s+(?:is|are|one|ones)\s+/i, type: "selection" },
    { pattern: /^can\s+(?:you|i|we)\s+/i, type: "capability" },
    { pattern: /^(?:is|are|does|do|will|would|should|could|can)\s+.+\?$/i, type: "yes-no" },
  ];

  if (prompt.includes("?") || /^(?:what|how|why|when|where|who|which|can|is|are|does|do)\s+/i.test(prompt)) {
    components.hasQuestion = true;
    for (const { pattern, type } of questionPatterns) {
      if (pattern.test(prompt)) {
        components.questionType = type;
        break;
      }
    }
    if (!components.questionType) {
      components.questionType = "general";
    }
  }

  // ===== AUDIENCE EXTRACTION =====
  const audiencePatterns = [
    /(?:for|targeting|aimed at|intended for|designed for|written for)\s+(?:a\s+)?(.+?)(?:\.|,|;|$|\s+(?:who|that|which))/i,
    /(?:audience|readers?|users?|customers?)\s+(?:is|are|will be|should be)\s+(.+?)(?:\.|,|;|$)/i,
    /(?:this is for|meant for|geared toward|tailored to)\s+(.+?)(?:\.|,|;|$)/i,
  ];

  for (const pattern of audiencePatterns) {
    const match = prompt.match(pattern);
    if (match && !components.audience) {
      components.audience = match[1].trim();
      break;
    }
  }

  // ===== CONSTRAINT EXTRACTION =====
  const constraintPatterns = [
    /(?:must|should|needs? to|has? to|require[sd]?)\s+(.+?)(?:\.|,|;|$)/gi,
    /(?:limit|restrict|constrain|cap|maximum|minimum|at least|at most|no more than|no less than)\s+(.+?)(?:\.|,|;|$)/gi,
    /(?:within|under|over|between)\s+(\d+\s*(?:words?|characters?|paragraphs?|sentences?|pages?|minutes?|seconds?|hours?|days?|mb|kb|gb))/gi,
    /(?:don't|do not|avoid|exclude|without|skip|omit|leave out)\s+(.+?)(?:\.|,|;|$)/gi,
  ];

  for (const pattern of constraintPatterns) {
    let match;
    while ((match = pattern.exec(prompt)) !== null) {
      components.constraints.push(match[1].trim());
    }
  }

  // ===== EXAMPLE EXTRACTION =====
  const examplePatterns = [
    /(?:for example|e\.g\.|such as|like|example:|examples?:)\s+(.+?)(?:\.|$)/gi,
    /(?:similar to|based on|inspired by|following the style of)\s+(.+?)(?:\.|,|$)/gi,
    /(?:here's? (?:an )?example|see (?:the )?example|consider (?:this|the following)):\s*(.+?)(?:\.|$)/gi,
  ];

  for (const pattern of examplePatterns) {
    let match;
    while ((match = pattern.exec(prompt)) !== null) {
      components.examples.push(match[1].trim());
    }
  }

  // ===== TONE EXTRACTION =====
  const tonePatterns = [
    /(?:in (?:a|an)?|with (?:a|an)?|using (?:a|an)?)\s+(professional|casual|formal|informal|friendly|serious|humorous|witty|sarcastic|empathetic|authoritative|conversational|technical|academic|playful|enthusiastic|neutral|objective|persuasive|inspirational|motivational)\s+(?:tone|voice|style|manner)/i,
    /(?:tone|voice|style|manner)\s+(?:should be|is|must be)\s+(professional|casual|formal|informal|friendly|serious|humorous|witty|empathetic|authoritative|conversational|technical|academic|playful)/i,
    /(?:make it|keep it|sound|be)\s+(professional|casual|formal|informal|friendly|serious|fun|playful|authoritative|conversational)/i,
  ];

  for (const pattern of tonePatterns) {
    const match = prompt.match(pattern);
    if (match) {
      components.tone = match[1].toLowerCase();
      break;
    }
  }

  // ===== LENGTH EXTRACTION =====
  const lengthPatterns = [
    /(\d+(?:[-–]\d+)?)\s*(?:words?|characters?|chars?)/i,
    /(\d+(?:[-–]\d+)?)\s*(?:paragraphs?|sentences?|pages?|lines?)/i,
    /(brief|short|concise|long|detailed|comprehensive|extended|in-depth|quick|thorough)/i,
    /(?:about|approximately|around|roughly)\s*(\d+)\s*(?:words?|paragraphs?|sentences?)/i,
    /(?:no (?:more|less) than|at (?:least|most)|maximum|minimum)\s*(\d+)\s*(?:words?|paragraphs?)/i,
  ];

  for (const pattern of lengthPatterns) {
    const match = prompt.match(pattern);
    if (match) {
      components.length = match[1];
      break;
    }
  }

  // ===== PERSONA EXTRACTION =====
  const personaPatterns = [
    /(?:act as|acting as|pretend (?:to be|you're)|you are|imagine you're|assume the role of|take on the role of|as a|as an)\s+(?:a |an )?(.+?)(?:\.|,|;|and\s|who\s|that\s|$)/i,
    /(?:from the perspective of|in the voice of|channeling|embodying)\s+(?:a |an )?(.+?)(?:\.|,|;|$)/i,
    /(?:like|as if)\s+(?:a |an )?(.+?)\s+(?:would|might|could)/i,
  ];

  for (const pattern of personaPatterns) {
    const match = prompt.match(pattern);
    if (match) {
      components.persona = match[1].trim();
      break;
    }
  }

  // ===== GOAL/OBJECTIVE EXTRACTION =====
  const goalPatterns = [
    /(?:goal|objective|purpose|aim|intent|intention)\s+(?:is|being|:)\s*(.+?)(?:\.|,|;|$)/i,
    /(?:in order to|so that|to achieve|to accomplish|to help|to make|to ensure|to improve)\s+(.+?)(?:\.|,|;|$)/i,
    /(?:the result should|outcome should|should result in|should lead to)\s+(.+?)(?:\.|,|;|$)/i,
  ];

  for (const pattern of goalPatterns) {
    const match = prompt.match(pattern);
    if (match) {
      components.goal = match[1].trim();
      break;
    }
  }

  // ===== PROGRAMMING LANGUAGE DETECTION =====
  const langPatterns = [
    /\b(javascript|typescript|python|java|c\+\+|c#|csharp|ruby|go|golang|rust|swift|kotlin|scala|php|perl|r\b|matlab|sql|bash|shell|powershell|html|css|sass|scss|less|jsx|tsx|vue|svelte|dart|lua|haskell|erlang|elixir|clojure|f#|ocaml|assembly|vhdl|verilog|cobol|fortran|pascal|delphi|groovy|objective-c|objectivec)\b/i,
    /\b(?:in|using|with)\s+(javascript|typescript|python|java|c\+\+|c#|ruby|go|rust|swift|kotlin|php|sql)\b/i,
  ];

  for (const pattern of langPatterns) {
    const match = prompt.match(pattern);
    if (match) {
      components.programmingLanguage = match[1].toLowerCase();
      break;
    }
  }

  // ===== FRAMEWORK DETECTION =====
  const frameworkPatterns = [
    /\b(react|angular|vue|svelte|next\.?js|nuxt|gatsby|remix|astro|express|fastify|koa|nest\.?js|django|flask|fastapi|spring|rails|laravel|symfony|asp\.net|blazor|flutter|react native|electron|tauri|unity|unreal|godot|tensorflow|pytorch|keras|scikit-learn|pandas|numpy|matplotlib|d3\.?js|three\.?js|tailwind|bootstrap|material-ui|chakra|antd?|prisma|drizzle|typeorm|mongoose|sequelize|knex|graphql|apollo|trpc|redux|mobx|zustand|jotai|recoil|tanstack|swr|axios|lodash|moment|dayjs|jest|vitest|cypress|playwright|selenium)\b/i,
  ];

  for (const pattern of frameworkPatterns) {
    const match = prompt.match(pattern);
    if (match) {
      components.framework = match[1].toLowerCase();
      break;
    }
  }

  // ===== PLATFORM DETECTION =====
  const platformPatterns = [
    /\b(?:for|on|targeting)\s+(web|mobile|ios|android|desktop|windows|macos|linux|aws|azure|gcp|google cloud|firebase|vercel|netlify|heroku|docker|kubernetes|raspberry pi|arduino|wordpress|shopify|wix|squarespace)\b/i,
    /\b(aws|azure|gcp|firebase|vercel|netlify|heroku|supabase|planetscale|mongodb atlas|redis|elasticsearch|kafka|rabbitmq|nginx|apache|cloudflare)\b/i,
  ];

  for (const pattern of platformPatterns) {
    const match = prompt.match(pattern);
    if (match) {
      components.platform = match[1].toLowerCase();
      break;
    }
  }

  // ===== CORE TASK =====
  components.coreTask = (components.subject || prompt)
    .replace(/^(a|an|the|some|any|my|your|our|their|this|that)\s+/i, "")
    .replace(/^(new|simple|basic|complex|advanced|custom|unique|specific)\s+/i, "$1 ");

  // ===== FORMAT EXTRACTION =====
  const formatPatterns = [
    /\b(?:as (?:a|an)?|in (?:the )?form of(?: a| an)?|formatted as(?: a| an)?|output as(?: a| an)?|give me(?: a| an)?|provide(?: a| an)?|format:(?: a| an)?)\s+(.+?)(?:\.|,|;|\s+with|\s+that|\s+for|$)/i,
    /\b(blog post|email|article|report|essay|code|function|script|letter|message|summary|list|guide|tutorial|presentation|proposal|story|poem|tweet|post|review|analysis|documentation|readme|api|query|sql|regex|prompt|template|response|reply|comment|feedback|description|headline|title|tagline|slogan|bio|introduction|conclusion|outline|plan|strategy|roadmap|checklist|schedule|agenda|minutes|notes|memo|announcement|newsletter|press release|case study|white paper|ebook|landing page|homepage|product description|faq|help article|knowledge base|sop|policy|contract|terms|privacy policy|job description|resume|cv|cover letter|linkedin|portfolio|pitch|deck|slides|dashboard|chart|graph|table|spreadsheet|formula|macro|test|unit test|spec|requirement|user story|acceptance criteria|bug report|feature request|changelog|commit message|pr description|code review|pull request|issue|ticket|epic|sprint|backlog|kanban|wireframe|mockup|prototype|design|logo|icon|banner|infographic|video script|podcast script|social media post|instagram|tiktok|youtube|marketing copy|ad copy|sales copy|product copy|ux copy|microcopy|error message|notification|alert|modal|form|survey|questionnaire|interview|transcript|meeting notes|action items|follow-up|recap|executive summary|abstract|thesis|dissertation|research paper|literature review|methodology|findings|discussion|bibliography|citation|reference|appendix|glossary|index|table of contents|preface|foreword|acknowledgments|dedication)\b/i,
  ];

  for (const pattern of formatPatterns) {
    const match = (components.subject || prompt).match(pattern);
    if (match) {
      components.format = match[1].toLowerCase();
      break;
    }
  }

  // ===== TOPIC EXTRACTION =====
  const topicPatterns = [
    /\b(?:about|regarding|concerning|on the topic of|on the subject of|related to|pertaining to)\s+(.+?)(?:\.|$|,|\s+(?:that|which|with|in|using|and|or|but|to|from|by|as|at|into|for\s+(?:a|an|the|my|our|your)))/i,
    /(?:blog post|article|essay|report|guide|tutorial|summary|review|analysis)\s+(?:about|on|regarding|for)\s+(.+?)(?:\.|$|,)/i,
    /(?:explain|describe|discuss|analyze|explore|examine|investigate|review|cover|address)\s+(.+?)(?:\.|$|,|\s+(?:and|in|with|by|for|to))/i,
  ];

  for (const pattern of topicPatterns) {
    const match = prompt.match(pattern);
    if (match) {
      components.topic = match[1].trim();
      break;
    }
  }

  if (!components.topic) {
    const fallbackTopic = (components.coreTask || "")
      .replace(/^(a|an|the|some|any|my|your|our|their|this|that|these|those)\s+/i, "")
      .replace(/\s+(in|with|for|to|from|by|at|on|about)\s+.*$/i, "");
    if (fallbackTopic.length > 3 && fallbackTopic.length < 100) {
      components.topic = fallbackTopic;
    }
  }

  return components;
}

// Normalize action verbs to standard forms
function normalizeAction(action: string): string {
  const actionMap: Record<string, string> = {
    "help me": "help",
    "help me to": "help",
    "help me with": "help",
    "assist me with": "help",
    "assist me in": "help",
    "guide me through": "guide",
    "walk me through": "explain",
    "show me how to": "explain",
    "teach me to": "explain",
    "explain how to": "explain",
    "i want to": "",
    "i need to": "",
    "i'd like to": "",
    "i would like to": "",
    "can you": "",
    "could you": "",
    "would you": "",
    "please": "",
  };

  const normalized = actionMap[action.toLowerCase()];
  return normalized !== undefined ? normalized : action.toLowerCase();
}

// Generate contextual suggestion based on rule and prompt components
function generateContextualSuggestion(
  rule: FrameworkRule & { categoryName: string | null },
  promptComponents: PromptComponents
): ContextualSuggestion {
  const { fullPrompt, action, subject, coreTask, topic, format } = promptComponents;

  const baseAction = action ? capitalizeFirst(action) : "Create";
  const baseSubject = subject || coreTask || fullPrompt.slice(0, 50);
  const displaySubject = baseSubject.length > 60 ? baseSubject.slice(0, 60) + "..." : baseSubject;
  const reconstructed = action ? `${baseAction} ${displaySubject}` : displaySubject;

  const ruleNameLower = rule.rule_name.toLowerCase();
  
  let contextualSuggestion = "";
  let examplePrompt: string | null = null;
  let quickInsertions: string[] = [];

  if (ruleNameLower.includes("context") || ruleNameLower.includes("background")) {
    contextualSuggestion = `${reconstructed} **for [your context/situation]**`;
    examplePrompt = `${reconstructed} **for my company's quarterly planning meeting**`;
    quickInsertions = ["for my team at [company]", "for a [industry] audience", "given that [situation]"];
  }
  else if (ruleNameLower.includes("audience") || ruleNameLower.includes("reader") || ruleNameLower.includes("who")) {
    contextualSuggestion = `${reconstructed} **for [target audience]**`;
    examplePrompt = `${reconstructed} **for senior executives with limited technical knowledge**`;
    quickInsertions = ["for beginners", "for experts in [field]", "for non-technical stakeholders", "for [role]s"];
  }
  else if (ruleNameLower.includes("length") || ruleNameLower.includes("word") || ruleNameLower.includes("size") || ruleNameLower.includes("brief") || ruleNameLower.includes("concise")) {
    const formatDisplay = format || "response";
    contextualSuggestion = `${baseAction} **a [length]** ${coreTask || formatDisplay}`;
    examplePrompt = `${baseAction} **a 500-word** ${coreTask || formatDisplay}`;
    quickInsertions = ["500-word", "3-paragraph", "brief 2-minute", "comprehensive 2000-word", "one-page"];
  }
  else if (ruleNameLower.includes("format") || ruleNameLower.includes("structure") || ruleNameLower.includes("output")) {
    contextualSuggestion = `${reconstructed} **formatted as [format type]**`;
    examplePrompt = `${reconstructed} **formatted as bullet points with headers**`;
    quickInsertions = ["as a numbered list", "in markdown with headers", "as a table", "in JSON format", "with sections"];
  }
  else if (ruleNameLower.includes("example") || ruleNameLower.includes("sample") || ruleNameLower.includes("instance")) {
    contextualSuggestion = `${reconstructed}. **Example: [sample input] → [expected output]**`;
    examplePrompt = `${reconstructed}. **Example: "AI in healthcare" → should cover diagnostics, treatment, admin**`;
    quickInsertions = ["For example: [sample]", "Like this: [example]", "Such as: [instance]"];
  }
  else if (ruleNameLower.includes("tone") || ruleNameLower.includes("style") || ruleNameLower.includes("voice")) {
    contextualSuggestion = `${reconstructed} **in a [tone] tone**`;
    examplePrompt = `${reconstructed} **in a professional yet conversational tone**`;
    quickInsertions = ["professional", "casual", "formal", "friendly", "authoritative", "empathetic"];
  }
  else if (ruleNameLower.includes("persona") || ruleNameLower.includes("role") || ruleNameLower.includes("act as") || ruleNameLower.includes("expert")) {
    contextualSuggestion = `**Act as a [role].** ${reconstructed}`;
    examplePrompt = `**Act as a senior content strategist.** ${reconstructed}`;
    quickInsertions = ["Act as an expert in [field]", "You are a [professional role]", "As a [persona]"];
  }
  else if (ruleNameLower.includes("scope") || ruleNameLower.includes("focus") || ruleNameLower.includes("limit") || ruleNameLower.includes("specific")) {
    contextualSuggestion = `${reconstructed}. **Focus only on [specific aspect]**`;
    examplePrompt = `${reconstructed}. **Focus only on the technical implementation, not business case**`;
    quickInsertions = ["Focus on [aspect]", "Limit to [boundary]", "Only cover [X]", "Exclude [Y]"];
  }
  else if (ruleNameLower.includes("avoid") || ruleNameLower.includes("exclude") || ruleNameLower.includes("don't") || ruleNameLower.includes("not include")) {
    contextualSuggestion = `${reconstructed}. **Avoid [things to exclude]**`;
    examplePrompt = `${reconstructed}. **Avoid technical jargon and keep it accessible**`;
    quickInsertions = ["Avoid jargon", "Don't include [X]", "Exclude [Y]", "Skip [Z]"];
  }
  else if (ruleNameLower.includes("step") || ruleNameLower.includes("process") || ruleNameLower.includes("break") || ruleNameLower.includes("sequence")) {
    contextualSuggestion = `${reconstructed}. **Step 1: [first]. Step 2: [second]. Step 3: [third]**`;
    examplePrompt = `${reconstructed}. **Step 1: Outline key points. Step 2: Write draft. Step 3: Add examples**`;
    quickInsertions = ["First... Then... Finally...", "Step 1... Step 2...", "Phase 1... Phase 2..."];
  }
  else if (ruleNameLower.includes("think") || ruleNameLower.includes("reason") || ruleNameLower.includes("explain") || ruleNameLower.includes("logic")) {
    contextualSuggestion = `${reconstructed}. **Think step by step before answering**`;
    examplePrompt = `${reconstructed}. **Think step by step and explain your reasoning**`;
    quickInsertions = ["Think through this carefully", "Explain your reasoning", "Show your thought process"];
  }
  else if (ruleNameLower.includes("goal") || ruleNameLower.includes("objective") || ruleNameLower.includes("purpose") || ruleNameLower.includes("outcome")) {
    contextualSuggestion = `${reconstructed} **to achieve [goal/outcome]**`;
    examplePrompt = `${reconstructed} **to achieve a 20% increase in user engagement**`;
    quickInsertions = ["to achieve [goal]", "with the objective of [outcome]", "so that [result]"];
  }
  else if (ruleNameLower.includes("constraint") || ruleNameLower.includes("requirement") || ruleNameLower.includes("must") || ruleNameLower.includes("condition")) {
    contextualSuggestion = `${reconstructed}. **Requirements: [constraint 1], [constraint 2]**`;
    examplePrompt = `${reconstructed}. **Requirements: must be mobile-friendly, load under 3 seconds**`;
    quickInsertions = ["Must include [X]", "Ensure [requirement]", "Within [constraint]"];
  }
  else if (ruleNameLower.includes("terminolog") || ruleNameLower.includes("define") || ruleNameLower.includes("clarif") || ruleNameLower.includes("meaning")) {
    contextualSuggestion = `${reconstructed}. **By "[term]" I mean [definition]**`;
    examplePrompt = `${reconstructed}. **By "performance" I mean response time and throughput**`;
    quickInsertions = ["Define: [term] means [meaning]", "When I say [X], I mean [Y]"];
  }
  else if (ruleNameLower.includes("option") || ruleNameLower.includes("alternative") || ruleNameLower.includes("multiple") || ruleNameLower.includes("variation")) {
    contextualSuggestion = `${baseAction} **3 different versions of** ${coreTask || "this"}`;
    examplePrompt = `${baseAction} **3 different versions of** ${coreTask || "this"} **with varying tones**`;
    quickInsertions = ["Give me 3 options", "Provide 5 alternatives", "List several variations"];
  }
  else if (ruleNameLower.includes("emotion") || ruleNameLower.includes("impact") || ruleNameLower.includes("feel") || ruleNameLower.includes("inspire")) {
    contextualSuggestion = `${reconstructed}. **The reader should feel [emotion]**`;
    examplePrompt = `${reconstructed}. **The reader should feel inspired and motivated to take action**`;
    quickInsertions = ["Feel confident", "Feel excited", "Feel reassured", "Feel curious"];
  }
  else if (ruleNameLower.includes("priorit") || ruleNameLower.includes("important") || ruleNameLower.includes("key") || ruleNameLower.includes("main")) {
    contextualSuggestion = `${reconstructed}. **Prioritize [most important aspect]**`;
    examplePrompt = `${reconstructed}. **Prioritize clarity and actionable takeaways**`;
    quickInsertions = ["Focus on [priority]", "Most importantly [X]", "Key requirement: [Y]"];
  }
  else if (ruleNameLower.includes("language") || ruleNameLower.includes("translat") || ruleNameLower.includes("locali")) {
    contextualSuggestion = `${reconstructed} **in [language]**`;
    examplePrompt = `${reconstructed} **in Spanish, using formal register**`;
    quickInsertions = ["in [language]", "translate to [lang]", "localize for [region]"];
  }
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

  const keywordMatches = (rule.detection_keywords || []).filter((kw) =>
    promptLower.includes(kw.toLowerCase())
  );
  if (keywordMatches.length > 0) {
    score += 0.5;
  }

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

// Estimate score after applying suggestions
function estimateImprovedScore(currentScore: number, failedRulesCount: number, failedRulesWeight: number, totalWeight: number): number {
  if (failedRulesCount === 0 || totalWeight === 0) return currentScore;
  const potentialGain = (failedRulesWeight / totalWeight) * 100;
  // Assume 80% of potential gain is achievable
  return Math.min(100, Math.round(currentScore + potentialGain * 0.8));
}

// Generate combined suggested prompt using Lovable AI Gateway
async function generateCombinedSuggestion(
  originalPrompt: string,
  failedRules: (FrameworkRule & { categoryName: string | null })[],
  extendedComponents: ExtendedPromptComponents
): Promise<{ suggestedPrompt: string | null; improvements: ImprovementApplied[] }> {
  // If no failed rules or very few, return null
  if (failedRules.length === 0) {
    return { suggestedPrompt: null, improvements: [] };
  }

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  
  // Build improvement instructions for the AI
  const improvementInstructions = failedRules
    .slice(0, 5)
    .map(rule => {
      const template = rule.improvement_template || rule.rule_description || rule.rule_name;
      return `- ${rule.categoryName || 'General'}: ${template}`;
    })
    .join('\n');

  // Build context about what was detected
  const contextInfo: string[] = [];
  if (extendedComponents.action) contextInfo.push(`Action: ${extendedComponents.action}`);
  if (extendedComponents.topic) contextInfo.push(`Topic: ${extendedComponents.topic}`);
  if (extendedComponents.format) contextInfo.push(`Format: ${extendedComponents.format}`);
  if (extendedComponents.programmingLanguage) contextInfo.push(`Language: ${extendedComponents.programmingLanguage}`);
  if (extendedComponents.framework) contextInfo.push(`Framework: ${extendedComponents.framework}`);
  if (extendedComponents.platform) contextInfo.push(`Platform: ${extendedComponents.platform}`);
  if (extendedComponents.persona) contextInfo.push(`Persona: ${extendedComponents.persona}`);
  if (extendedComponents.audience) contextInfo.push(`Audience: ${extendedComponents.audience}`);
  if (extendedComponents.tone) contextInfo.push(`Tone: ${extendedComponents.tone}`);
  if (extendedComponents.goal) contextInfo.push(`Goal: ${extendedComponents.goal}`);

  const contextString = contextInfo.length > 0 
    ? `\n\nDetected context:\n${contextInfo.join('\n')}`
    : '';

  // If no API key, use template-based fallback
  if (!LOVABLE_API_KEY) {
    console.log("No LOVABLE_API_KEY, using template-based suggestion");
    return generateTemplateBasedSuggestion(originalPrompt, failedRules);
  }

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        max_tokens: 800,
        messages: [
          {
            role: "system",
            content: `You are a prompt engineering expert. Your task is to improve AI prompts by applying specific suggestions while keeping the original intent intact.

Rules:
1. Return ONLY the improved prompt text - no explanations, no markdown, no quotes around it
2. Keep the core intent and topic of the original prompt
3. Make it natural and readable (not robotic or formulaic)
4. Don't add unnecessary verbosity or filler words
5. Apply improvements naturally woven into the prompt
6. If the prompt is already good for a category, don't force changes
7. Maintain the same language/tone as the original unless tone is being improved`
          },
          {
            role: "user",
            content: `Improve this prompt by applying the following suggestions:

Original prompt: "${originalPrompt}"${contextString}

Improvements to apply:
${improvementInstructions}

Return ONLY the improved prompt, nothing else.`
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      // Check for rate limit or payment errors
      if (response.status === 429 || response.status === 402) {
        console.log("Rate limited or payment required, using template fallback");
      }
      
      return generateTemplateBasedSuggestion(originalPrompt, failedRules);
    }

    const data = await response.json();
    const suggestedPrompt = data.choices?.[0]?.message?.content?.trim();

    if (!suggestedPrompt || suggestedPrompt === originalPrompt) {
      return generateTemplateBasedSuggestion(originalPrompt, failedRules);
    }

    // Build improvements summary
    const improvements: ImprovementApplied[] = failedRules.slice(0, 5).map(rule => ({
      category: rule.categoryName || "General",
      ruleName: rule.rule_name,
      applied: true,
      change: rule.improvement_template || `Applied ${rule.rule_name.toLowerCase()}`
    }));

    return { suggestedPrompt, improvements };
  } catch (error) {
    console.error("AI suggestion error:", error);
    return generateTemplateBasedSuggestion(originalPrompt, failedRules);
  }
}

// Template-based fallback for generating suggestions
function generateTemplateBasedSuggestion(
  originalPrompt: string,
  failedRules: (FrameworkRule & { categoryName: string | null })[]
): { suggestedPrompt: string | null; improvements: ImprovementApplied[] } {
  if (failedRules.length === 0) {
    return { suggestedPrompt: null, improvements: [] };
  }

  const missingCategories = new Set(failedRules.map(r => r.categoryName?.toLowerCase() || ""));
  const improvements: ImprovementApplied[] = [];
  
  let prefix = "";
  let suffix = "";
  const suffixParts: string[] = [];

  // Persona prefix
  if (missingCategories.has("persona") || missingCategories.has("role")) {
    prefix = "As an expert, ";
    improvements.push({
      category: "Persona",
      ruleName: "Assign a role",
      applied: true,
      change: "Added 'As an expert' prefix"
    });
  }

  // Format
  if (missingCategories.has("format") || missingCategories.has("structure") || missingCategories.has("output format")) {
    suffixParts.push("Provide a structured response with clear sections");
    improvements.push({
      category: "Format",
      ruleName: "Specify output format",
      applied: true,
      change: "Added format specification"
    });
  }

  // Constraints
  if (missingCategories.has("constraints") || missingCategories.has("length") || missingCategories.has("scope")) {
    suffixParts.push("Be concise and specific");
    improvements.push({
      category: "Constraints",
      ruleName: "Set constraints",
      applied: true,
      change: "Added conciseness constraint"
    });
  }

  // Context
  if (missingCategories.has("context") || missingCategories.has("background")) {
    suffixParts.push("Consider practical application");
    improvements.push({
      category: "Context",
      ruleName: "Provide context",
      applied: true,
      change: "Added context consideration"
    });
  }

  // Examples
  if (missingCategories.has("examples") || missingCategories.has("sample")) {
    suffixParts.push("Include relevant examples where helpful");
    improvements.push({
      category: "Examples",
      ruleName: "Include examples",
      applied: true,
      change: "Added examples request"
    });
  }

  // Step-by-step / Advanced
  if (missingCategories.has("advanced") || missingCategories.has("reasoning") || missingCategories.has("chain of thought")) {
    suffixParts.push("Think through this step-by-step");
    improvements.push({
      category: "Advanced",
      ruleName: "Request reasoning",
      applied: true,
      change: "Added step-by-step request"
    });
  }

  if (suffixParts.length > 0) {
    suffix = ". " + suffixParts.join(". ") + ".";
  }

  const suggestedPrompt = prefix + originalPrompt.trim() + suffix;

  return { 
    suggestedPrompt: suggestedPrompt !== originalPrompt ? suggestedPrompt : null, 
    improvements 
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Try to get user (OPTIONAL - don't fail if not authenticated)
    let userId: string | null = null;
    let userTier = "free";
    const authHeader = req.headers.get("Authorization");

    if (authHeader && authHeader !== "Bearer null" && authHeader !== "Bearer undefined") {
      const token = authHeader.replace("Bearer ", "");
      if (token && token.length > 10) {
        try {
          const { data: { user }, error: authError } = await supabase.auth.getUser(token);
          if (!authError && user) {
            userId = user.id;

            const rateLimitResult = await checkRateLimit(userId, "score-prompt", supabase);
            if (!rateLimitResult.allowed) {
              return rateLimitResponse(rateLimitResult, corsHeaders);
            }

            const { data: profile } = await supabase
              .from("profiles")
              .select("tier")
              .eq("id", userId)
              .maybeSingle();

            userTier = profile?.tier || "free";
          }
        } catch (authErr) {
          console.log("Auth check failed, continuing as anonymous:", authErr);
        }
      }
    }

    // Rate limit for anonymous users by IP
    if (!userId) {
      const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                       req.headers.get("cf-connecting-ip") || 
                       "anonymous";
      const rateLimitResult = await checkRateLimit(`anon:${clientIP}`, "score-prompt-anon", supabase);
      if (!rateLimitResult.allowed) {
        return rateLimitResponse(rateLimitResult, corsHeaders);
      }
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

    // Determine allowed tiers
    const allowedTiers = ["free"];
    if (userTier === "pro" || userTier === "enterprise") {
      allowedTiers.push("pro");
    }
    if (userTier === "enterprise") {
      allowedTiers.push("enterprise");
    }

    // Fetch ALL active rules from database
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

    // Extract prompt components
    const extendedComponents = extractExtendedComponents(prompt);
    const promptComponents = extractPromptComponents(prompt);

    // Score each rule
    const breakdown: RuleBreakdown[] = [];
    const passed: string[] = [];
    const partial: string[] = [];
    const failed: string[] = [];
    const failedRulesData: (FrameworkRule & { categoryName: string | null })[] = [];
    let maxPossible = 0;
    let actualScore = 0;
    let failedRulesWeight = 0;

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
        failedRulesWeight += weight;
      }
    }

    // Calculate percentage score
    const percentage = maxPossible > 0 ? Math.round((actualScore / maxPossible) * 100) : 0;
    const { grade, label } = getGrade(percentage);

    // Sort failed rules by weight for prioritization
    const sortedFailedRules = failedRulesData.sort((a, b) => b.weight - a.weight);

    // Generate contextual suggestions for backward compatibility
    const topImprovements = sortedFailedRules
      .slice(0, 5)
      .map((rule) => generateContextualSuggestion(rule, promptComponents));

    // Get strengths
    const strengths = breakdown
      .filter((b) => b.score === 1)
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 3)
      .map((b) => b.ruleName);

    // Get unique categories evaluated
    const categoriesEvaluated = [...new Set(
      breakdown
        .map(b => b.category)
        .filter((c): c is string => c !== null)
    )];

    // Generate combined AI-powered suggested prompt (only if score < 90)
    let suggestedPrompt: string | null = null;
    let scoreAfterSuggestion: number | null = null;
    let improvements: ImprovementApplied[] = [];

    if (percentage < 90 && sortedFailedRules.length > 0) {
      const suggestionResult = await generateCombinedSuggestion(
        prompt,
        sortedFailedRules.slice(0, 5),
        extendedComponents
      );
      
      suggestedPrompt = suggestionResult.suggestedPrompt;
      improvements = suggestionResult.improvements;
      
      if (suggestedPrompt) {
        scoreAfterSuggestion = estimateImprovedScore(
          percentage,
          Math.min(sortedFailedRules.length, 5),
          failedRulesWeight,
          maxPossible
        );
      }
    }

    const processingTimeMs = Date.now() - startTime;
    let analysisId: string | null = null;

    // Log to database if authenticated
    if (userId) {
      const failedRulePromises = failed.map((ruleId) =>
        supabase.rpc("increment_weak_rule", {
          p_user_id: userId,
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
          user_id: userId,
          original_prompt: prompt,
          prompt_length: prompt.length,
          score: percentage,
          max_score: 100,
          grade: grade.replace("+", "") as "A" | "B" | "C" | "D" | "F",
          violations,
          analysis_method: "template",
          improved_prompt: suggestedPrompt || "",
          processing_time_ms: processingTimeMs,
        })
        .select("id")
        .single();

      if (logError) {
        console.error("Failed to log analysis:", logError);
      }

      analysisId = logData?.id ?? null;

      Promise.all([
        ...failedRulePromises,
        ...effectivenessPromises,
      ]).catch((err) => console.error("Background operations failed:", err));
    }

    // Build response with new fields
    const response: ScoreResponse = {
      analysisId: analysisId ?? crypto.randomUUID(),
      score: percentage,
      grade,
      gradeLabel: label,
      // New fields
      suggestedPrompt,
      scoreAfterSuggestion,
      improvements,
      categoriesEvaluated,
      rulesPassed: passed.length,
      rulesFailed: failed.length,
      rulesTotal: rules.length,
      // Existing fields for backward compatibility
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
        hasConditional: extendedComponents.hasConditional,
        hasComparison: extendedComponents.hasComparison,
        hasList: extendedComponents.hasList,
        hasQuestion: extendedComponents.hasQuestion,
        questionType: extendedComponents.questionType,
        detectedAudience: extendedComponents.audience,
        detectedTone: extendedComponents.tone,
        detectedLength: extendedComponents.length,
        detectedPersona: extendedComponents.persona,
        detectedGoal: extendedComponents.goal,
        detectedLanguage: extendedComponents.programmingLanguage,
        detectedFramework: extendedComponents.framework,
        detectedPlatform: extendedComponents.platform,
        clauseCount: extendedComponents.clauses.length,
        constraintCount: extendedComponents.constraints.length,
        exampleCount: extendedComponents.examples.length,
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
