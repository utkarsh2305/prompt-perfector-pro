-- Update framework_rules with proper names and improvement templates
UPDATE framework_rules SET 
  rule_name = 'Define Clear Objective',
  rule_description = 'Every prompt should state what you want the AI to accomplish',
  improvement_template = 'Start with a clear action verb: "Write...", "Analyze...", "Create...", "Explain..."'
WHERE rule_number = 1;

UPDATE framework_rules SET 
  rule_name = 'Specify Output Format',
  rule_description = 'Define the exact format you want the response in (JSON, markdown, table, list, etc.)',
  improvement_template = 'Specify format: "Output as JSON", "Format as a table", "Use bullet points", "In markdown"'
WHERE rule_number = 2;

UPDATE framework_rules SET 
  rule_name = 'Provide Background Context',
  rule_description = 'Include relevant background information for the AI to understand the situation',
  improvement_template = 'Add context with phrases like "Context:", "Background:", or "Given that..."'
WHERE rule_number = 3;

UPDATE framework_rules SET 
  rule_name = 'Specify Target Audience',
  rule_description = 'Define who will read or use the output',
  improvement_template = 'Specify your audience: "for beginners", "targeting enterprise clients", "for technical readers"'
WHERE rule_number = 4;

UPDATE framework_rules SET 
  rule_name = 'Define Length or Scope',
  rule_description = 'Specify the expected length, depth, or scope of the output',
  improvement_template = 'Specify length: "in 200 words", "3 paragraphs", "a brief summary", "5 bullet points"'
WHERE rule_number = 5;

UPDATE framework_rules SET 
  rule_name = 'Include Examples',
  rule_description = 'Provide examples of what you want or don''t want',
  improvement_template = 'Include examples: "For example: ...", "Similar to: ...", "Like this: ..."'
WHERE rule_number = 6;

UPDATE framework_rules SET 
  rule_name = 'Define Tone and Style',
  rule_description = 'Specify the desired tone, voice, or writing style',
  improvement_template = 'Specify tone: "in a professional tone", "casual and friendly style", "technical voice"'
WHERE rule_number = 7;

UPDATE framework_rules SET 
  rule_name = 'Set Clear Constraints',
  rule_description = 'Mention any limitations, requirements, or boundaries',
  improvement_template = 'Add constraints: "must include...", "avoid...", "limit to...", "within X words"'
WHERE rule_number = 8;

UPDATE framework_rules SET 
  rule_name = 'Assign a Role or Persona',
  rule_description = 'Tell the AI to act as a specific expert or role',
  improvement_template = 'Assign a role: "Act as a senior marketing consultant", "You are an expert copywriter"'
WHERE rule_number = 9;

UPDATE framework_rules SET 
  rule_name = 'Use Numbered Steps',
  rule_description = 'Break down complex requests into numbered steps',
  improvement_template = 'Break complex tasks into steps: "1. First... 2. Then... 3. Finally..."'
WHERE rule_number = 10;

UPDATE framework_rules SET 
  rule_name = 'Request Reasoning',
  rule_description = 'Ask the AI to explain its reasoning or show its work',
  improvement_template = 'Request reasoning: "Explain your reasoning", "Show step-by-step logic", "Justify your answer"'
WHERE rule_number = 11;

UPDATE framework_rules SET 
  rule_name = 'Use Delimiters',
  rule_description = 'Separate different parts of your prompt with clear delimiters',
  improvement_template = 'Use delimiters: Triple quotes """, XML tags <section>, or dashes --- to separate sections'
WHERE rule_number = 12;

UPDATE framework_rules SET 
  rule_name = 'Avoid Ambiguous Language',
  rule_description = 'Avoid vague words like "good", "better", "nice" without context',
  improvement_template = 'Replace vague terms with specific criteria. Instead of "good", specify what "good" means.'
WHERE rule_number = 13;

UPDATE framework_rules SET 
  rule_name = 'Be Specific About What to Avoid',
  rule_description = 'Tell the AI what NOT to do or include',
  improvement_template = 'Add exclusions: "Do not include...", "Avoid...", "Skip the...", "Without..."'
WHERE rule_number = 14;

UPDATE framework_rules SET 
  rule_name = 'Use Comparison Requests',
  rule_description = 'Ask for comparisons, pros/cons, or alternatives when appropriate',
  improvement_template = 'Request comparisons: "Compare X vs Y", "List pros and cons", "Show alternatives"'
WHERE rule_number = 15;

UPDATE framework_rules SET 
  rule_name = 'Request Multiple Options',
  rule_description = 'Ask for multiple versions or alternatives',
  improvement_template = 'Request options: "Give me 3 variations", "Provide 5 alternatives", "Show different approaches"'
WHERE rule_number = 16;

UPDATE framework_rules SET 
  rule_name = 'Include Priority Indicators',
  rule_description = 'Indicate what aspects are most important',
  improvement_template = 'Add priorities: "Focus primarily on...", "Most importantly...", "The key requirement is..."'
WHERE rule_number = 17;

UPDATE framework_rules SET 
  rule_name = 'Request References or Sources',
  rule_description = 'Ask for citations, sources, or references when factual accuracy matters',
  improvement_template = 'Request sources: "Cite your sources", "Include references", "Link to documentation"'
WHERE rule_number = 18;

UPDATE framework_rules SET 
  rule_name = 'Set a Deadline or Urgency',
  rule_description = 'Indicate time constraints or urgency level',
  improvement_template = 'Add timeline context: "This is urgent", "For a meeting tomorrow", "Quick draft"'
WHERE rule_number = 19;

UPDATE framework_rules SET 
  rule_name = 'Use Chain-of-Thought Prompting',
  rule_description = 'Ask the AI to think through the problem step by step',
  improvement_template = 'Request step-by-step: "Think through this step by step", "Walk me through your logic"'
WHERE rule_number = 20;