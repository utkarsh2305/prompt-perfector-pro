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
    // Extended analysis
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
  // Multi-clause detection
  clauses: string[];
  hasConditional: boolean;
  conditionalParts: { condition: string; then: string } | null;
  hasComparison: boolean;
  comparisonItems: string[];
  hasList: boolean;
  listItems: string[];
  hasQuestion: boolean;
  questionType: string | null;
  
  // Context detection
  audience: string | null;
  constraints: string[];
  examples: string[];
  tone: string | null;
  length: string | null;
  persona: string | null;
  goal: string | null;
  
  // Technical detection
  programmingLanguage: string | null;
  framework: string | null;
  platform: string | null;
}

// Extract components from the user's prompt for contextual suggestions
function extractPromptComponents(prompt: string): PromptComponents {
  const extended = extractExtendedComponents(prompt);
  
  // Return basic components for backward compatibility
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
    
    // Multi-clause
    clauses: [],
    hasConditional: false,
    conditionalParts: null,
    hasComparison: false,
    comparisonItems: [],
    hasList: false,
    listItems: [],
    hasQuestion: false,
    questionType: null,
    
    // Context
    audience: null,
    constraints: [],
    examples: [],
    tone: null,
    length: null,
    persona: null,
    goal: null,
    
    // Technical
    programmingLanguage: null,
    framework: null,
    platform: null,
  };

  const promptLower = prompt.toLowerCase();

  // ===== ACTION VERB EXTRACTION (enhanced) =====
  // Handle imperative verbs, infinitives, and gerunds
  const actionPatterns = [
    // Direct imperatives at start
    /^(write|create|generate|explain|analyze|summarize|make|build|design|draft|compose|develop|find|list|describe|compare|review|check|fix|improve|optimize|refactor|translate|convert|calculate|solve|plan|outline|suggest|recommend|brainstorm|implement|debug|test|deploy|configure|setup|install|migrate|upgrade|downgrade|integrate|validate|verify|format|parse|serialize|deserialize|encode|decode|encrypt|decrypt|compress|extract|merge|split|combine|sort|filter|search|query|fetch|retrieve|update|delete|insert|modify|transform|map|reduce|iterate|loop|traverse|navigate|render|display|show|hide|toggle|enable|disable|animate|style|layout|align|center|justify|wrap|truncate|paginate|cache|memoize|debounce|throttle|batch|queue|schedule|monitor|log|track|measure|benchmark|profile|audit|scan|lint|minify|bundle|compile|transpile|polyfill)\s+/i,
    // "Help me" variants
    /^(help me|help me to|help me with|assist me with|assist me in|guide me through|walk me through|show me how to|teach me to|explain how to)\s+/i,
    // "I want/need to" variants
    /^(?:i want to|i need to|i'd like to|i would like to|can you|could you|would you|please)\s+(write|create|generate|explain|make|build|design|help|show|give|tell|find|list|describe|fix|improve)\s*/i,
    // Question-style actions
    /^(?:how (?:do i|can i|should i|to)|what is the best way to|what's the best way to)\s+/i,
  ];

  for (const pattern of actionPatterns) {
    const match = prompt.match(pattern);
    if (match) {
      // Extract the core action verb
      const fullMatch = match[0];
      const actionVerb = match[1] ? match[1].toLowerCase() : fullMatch.toLowerCase().trim();
      
      // Normalize compound actions
      components.action = normalizeAction(actionVerb);
      components.subject = prompt.slice(fullMatch.length).trim();
      break;
    }
  }

  // Fallback: if no action detected, treat entire prompt as subject
  if (!components.subject) {
    components.subject = prompt;
  }

  // ===== CLAUSE SPLITTING =====
  // Split by sentence boundaries and conjunctions
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
  // Detect enumerated lists, bullet points, or comma-separated items
  const listPatterns = [
    /(?:^|\s)(?:\d+[\.\)]\s*(.+?)(?:,|;|\n|$))+/gm, // numbered lists
    /(?:^|\s)(?:[-•*]\s*(.+?)(?:\n|$))+/gm, // bullet lists
    /(?:including|such as|like|for example|e\.g\.|i\.e\.)\s+(.+?)(?:\.|$)/i, // inline lists
  ];

  // Check for comma-separated items after keywords
  const inlineListMatch = prompt.match(/(?:including|such as|like|for example|namely)\s+(.+?)(?:\.|$)/i);
  if (inlineListMatch) {
    const items = inlineListMatch[1].split(/,\s*(?:and\s+)?|\s+and\s+/);
    if (items.length >= 2) {
      components.hasList = true;
      components.listItems = items.map(i => i.trim()).filter(i => i.length > 0);
    }
  }

  // Check for multiple requests with "and"
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

  // ===== CORE TASK (remove articles and common prefixes) =====
  components.coreTask = (components.subject || prompt)
    .replace(/^(a|an|the|some|any|my|your|our|their|this|that)\s+/i, "")
    .replace(/^(new|simple|basic|complex|advanced|custom|unique|specific)\s+/i, "$1 ");

  // ===== FORMAT EXTRACTION (comprehensive) =====
  const formatPatterns = [
    /\b(blog post|email|article|report|essay|code|function|script|letter|message|summary|list|guide|tutorial|presentation|proposal|story|poem|tweet|post|review|analysis|documentation|readme|api|query|sql|regex|prompt|template|response|reply|comment|feedback|description|headline|title|tagline|slogan|bio|introduction|conclusion|outline|plan|strategy|roadmap|checklist|schedule|agenda|minutes|notes|memo|announcement|newsletter|press release|case study|white paper|ebook|landing page|homepage|product description|faq|help article|knowledge base|sop|policy|contract|terms|privacy policy|job description|resume|cv|cover letter|linkedin|portfolio|pitch|deck|slides|dashboard|chart|graph|table|spreadsheet|formula|macro|test|unit test|spec|requirement|user story|acceptance criteria|bug report|feature request|changelog|commit message|pr description|code review|pull request|issue|ticket|epic|sprint|backlog|kanban|wireframe|mockup|prototype|design|logo|icon|banner|infographic|video script|podcast script|social media post|instagram|tiktok|youtube|marketing copy|ad copy|sales copy|product copy|ux copy|microcopy|error message|notification|alert|modal|form|survey|questionnaire|interview|transcript|meeting notes|action items|follow-up|recap|executive summary|abstract|thesis|dissertation|research paper|literature review|methodology|findings|discussion|bibliography|citation|reference|appendix|glossary|index|table of contents|preface|foreword|acknowledgments|dedication)\b/i,
  ];

  for (const pattern of formatPatterns) {
    const match = (components.subject || prompt).match(pattern);
    if (match) {
      components.format = match[1].toLowerCase();
      break;
    }
  }

  // ===== TOPIC EXTRACTION (enhanced) =====
  const topicPatterns = [
    // Direct topic markers
    /\b(?:about|regarding|concerning|on the topic of|on the subject of|related to|pertaining to)\s+(.+?)(?:\.|$|,|\s+(?:that|which|with|in|using|and|or|but|to|from|by|as|at|into|for\s+(?:a|an|the|my|our|your)))/i,
    // After format types
    /(?:blog post|article|essay|report|guide|tutorial|summary|review|analysis)\s+(?:about|on|regarding|for)\s+(.+?)(?:\.|$|,)/i,
    // Subject-verb patterns
    /(?:explain|describe|discuss|analyze|explore|examine|investigate|review|cover|address)\s+(.+?)(?:\.|$|,|\s+(?:and|in|with|by|for|to))/i,
  ];

  for (const pattern of topicPatterns) {
    const match = prompt.match(pattern);
    if (match) {
      components.topic = match[1].trim();
      break;
    }
  }

  // Fallback topic: use core task if no specific topic found
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

            // Check rate limit for authenticated users (30 requests per minute)
            const rateLimitResult = await checkRateLimit(userId, "score-prompt", supabase);
            if (!rateLimitResult.allowed) {
              return rateLimitResponse(rateLimitResult, corsHeaders);
            }

            // Get user tier for authenticated users
            const { data: profile } = await supabase
              .from("profiles")
              .select("tier")
              .eq("id", userId)
              .maybeSingle();

            userTier = profile?.tier || "free";
          }
        } catch (authErr) {
          // Auth failed, continue as anonymous
          console.log("Auth check failed, continuing as anonymous:", authErr);
        }
      }
    }

    // Rate limit for anonymous users by IP (more restrictive: 10 requests per minute)
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

    // Determine allowed tiers based on user
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

    // Extract prompt components for contextual suggestions (use extended version)
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

    const processingTimeMs = Date.now() - startTime;
    let analysisId: string | null = null;

    // ========== OPTIONAL: Log to database if authenticated ==========
    if (userId) {
      // Update user_weak_rules for failed rules
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
          improved_prompt: "",
          processing_time_ms: processingTimeMs,
        })
        .select("id")
        .single();

      if (logError) {
        console.error("Failed to log analysis:", logError);
      }

      analysisId = logData?.id ?? null;

      // Execute background operations (don't wait)
      Promise.all([
        ...failedRulePromises,
        ...effectivenessPromises,
      ]).catch((err) => console.error("Background operations failed:", err));
    }

    // Build response with enhanced structure
    const response: ScoreResponse = {
      analysisId: analysisId ?? crypto.randomUUID(),
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
        // Extended analysis
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