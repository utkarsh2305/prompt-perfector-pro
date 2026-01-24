import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PromptAnalyzer } from "@/components/prompt-analyzer";
import { Badge } from "@/components/ui/badge";
import { FlaskConical, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AdminTestAnalyzer() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <FlaskConical className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Test Analyzer</h1>
          <Badge variant="secondary">Admin Tool</Badge>
        </div>
        <p className="mt-1 text-muted-foreground">
          Test the scoring engine with sample prompts to verify rules are working correctly.
        </p>
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          This tool uses the same <code className="px-1 py-0.5 bg-muted rounded text-xs">score-prompt</code> and{" "}
          <code className="px-1 py-0.5 bg-muted rounded text-xs">rewrite-prompt</code> Edge Functions as the user-facing
          analyzer. Use it to verify new rules are being detected correctly.
        </AlertDescription>
      </Alert>

      {/* Main Analyzer */}
      <PromptAnalyzer 
        showHeader={false}
        className="border-2 border-dashed border-primary/20"
      />

      {/* Sample Prompts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sample Test Prompts</CardTitle>
          <CardDescription>Click to copy a sample prompt for testing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <SamplePrompt
              title="Vague Prompt (Low Score)"
              prompt="Help me with my code"
              expectedScore="20-40"
            />
            <SamplePrompt
              title="Missing Context"
              prompt="Write an article about marketing"
              expectedScore="40-60"
            />
            <SamplePrompt
              title="Good Structure"
              prompt="Context: I'm building a SaaS product for project management. Write a 500-word blog post for developers explaining the benefits of agile methodology. Format as: intro paragraph, 3 bullet points with details, conclusion. Use a professional but friendly tone."
              expectedScore="70-85"
            />
            <SamplePrompt
              title="Excellent Prompt (High Score)"
              prompt="Act as a senior software architect. Context: Our e-commerce platform handles 10K orders/day. Task: Design a microservices architecture for our checkout flow. Requirements: 1. Must support 3 payment providers 2. Handle failures gracefully 3. Be horizontally scalable. Output format: Provide a system diagram description, list of services with responsibilities, and communication patterns. Include pros/cons of your approach."
              expectedScore="85-100"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SamplePrompt({ 
  title, 
  prompt, 
  expectedScore 
}: { 
  title: string; 
  prompt: string; 
  expectedScore: string;
}) {
  const handleCopy = async () => {
    await navigator.clipboard.writeText(prompt);
  };

  return (
    <button
      onClick={handleCopy}
      className="group relative rounded-lg border p-4 text-left transition-colors hover:border-primary hover:bg-muted/50"
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-medium text-sm">{title}</h4>
        <Badge variant="outline" className="shrink-0 text-xs">
          {expectedScore}
        </Badge>
      </div>
      <p className="mt-2 text-xs text-muted-foreground line-clamp-3">
        {prompt}
      </p>
      <span className="absolute inset-0 flex items-center justify-center bg-background/80 opacity-0 transition-opacity group-hover:opacity-100 text-xs font-medium text-primary">
        Click to copy
      </span>
    </button>
  );
}
