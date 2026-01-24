import { useState, useCallback } from "react";
import { Copy, Check, Sparkles, AlertCircle, TrendingUp, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RewriteButton } from "@/components/subscription/RewriteButton";
import { useAnalyzePrompt } from "@/hooks/useAnalyzePrompt";
import { cn } from "@/lib/utils";

interface PromptAnalyzerProps {
  /** Show in compact mode for sidebar use */
  compact?: boolean;
  /** Initial prompt to analyze */
  initialPrompt?: string;
  /** Called after successful analysis */
  onAnalysisComplete?: (result: ReturnType<typeof useAnalyzePrompt>["analysisResult"]) => void;
  /** Called after successful rewrite */
  onRewriteComplete?: (result: ReturnType<typeof useAnalyzePrompt>["rewriteResult"]) => void;
  /** Show the title header */
  showHeader?: boolean;
  /** Custom class name */
  className?: string;
}

function getGradeColor(grade: string): string {
  switch (grade) {
    case "A":
      return "bg-green-500/10 text-green-600 border-green-500/30";
    case "B+":
    case "B":
      return "bg-blue-500/10 text-blue-600 border-blue-500/30";
    case "C":
      return "bg-yellow-500/10 text-yellow-600 border-yellow-500/30";
    case "D":
      return "bg-orange-500/10 text-orange-600 border-orange-500/30";
    case "F":
      return "bg-red-500/10 text-red-600 border-red-500/30";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function getScoreColor(score: number): string {
  if (score >= 90) return "text-green-600";
  if (score >= 70) return "text-blue-600";
  if (score >= 50) return "text-yellow-600";
  return "text-red-600";
}

export function PromptAnalyzer({
  compact = false,
  initialPrompt = "",
  onAnalysisComplete,
  onRewriteComplete,
  showHeader = true,
  className,
}: PromptAnalyzerProps) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [copied, setCopied] = useState<"original" | "improved" | null>(null);

  const {
    analyzePrompt,
    rewritePrompt,
    reset,
    isAnalyzing,
    isRewriting,
    analysisResult,
    rewriteResult,
    error,
  } = useAnalyzePrompt();

  const handleAnalyze = useCallback(async () => {
    const result = await analyzePrompt(prompt);
    if (result) {
      onAnalysisComplete?.(result);
    }
  }, [prompt, analyzePrompt, onAnalysisComplete]);

  const handleRewrite = useCallback(async () => {
    if (!analysisResult) return;
    const result = await rewritePrompt(prompt, analysisResult);
    if (result) {
      onRewriteComplete?.(result);
    }
  }, [prompt, analysisResult, rewritePrompt, onRewriteComplete]);

  const handleCopy = useCallback(async (text: string, type: "original" | "improved") => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  const handleReset = useCallback(() => {
    setPrompt("");
    reset();
  }, [reset]);

  const charCount = prompt.length;
  const isValidLength = charCount >= 10 && charCount <= 10000;

  return (
    <Card className={cn("overflow-hidden", className)}>
      {showHeader && (
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Prompt Analyzer
          </CardTitle>
        </CardHeader>
      )}

      <CardContent className={cn("space-y-4", !showHeader && "pt-6")}>
        {/* Input Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="prompt-input" className="text-sm font-medium">
              Your Prompt
            </label>
            <span className={cn("text-xs", charCount > 10000 ? "text-destructive" : "text-muted-foreground")}>
              {charCount.toLocaleString()} / 10,000
            </span>
          </div>
          <Textarea
            id="prompt-input"
            placeholder="Paste your AI prompt here to analyze its quality..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className={cn(
              "min-h-[120px] resize-y",
              compact && "min-h-[100px]"
            )}
            disabled={isAnalyzing || isRewriting}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleAnalyze}
            disabled={!isValidLength || isAnalyzing || isRewriting}
            className="flex-1 min-w-[120px]"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Analyze
              </>
            )}
          </Button>

          {analysisResult && (
            <Button variant="outline" onClick={handleReset} disabled={isAnalyzing || isRewriting}>
              Clear
            </Button>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Results Section */}
        {analysisResult && (
          <div className="space-y-4 pt-2">
            <Separator />

            {/* Score Card */}
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Score Display */}
              <div className="rounded-lg border bg-card p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Score</span>
                  <Badge variant="outline" className={cn("text-lg font-bold px-3 py-1", getGradeColor(analysisResult.grade))}>
                    {analysisResult.grade}
                  </Badge>
                </div>
                <div className={cn("text-4xl font-bold mt-2", getScoreColor(analysisResult.score))}>
                  {analysisResult.score}
                  <span className="text-lg text-muted-foreground font-normal">/100</span>
                </div>
                <Progress value={analysisResult.score} className="mt-3 h-2" />
                <p className="text-xs text-muted-foreground mt-2">{analysisResult.gradeLabel}</p>
              </div>

              {/* Stats */}
              <div className="rounded-lg border bg-card p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Rules Passed</span>
                  <span className="font-medium text-green-600">{analysisResult.passed.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Partial Match</span>
                  <span className="font-medium text-yellow-600">{analysisResult.partial.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Rules Failed</span>
                  <span className="font-medium text-red-600">{analysisResult.failed.length}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Rules</span>
                  <span className="font-medium">{analysisResult.breakdown.length}</span>
                </div>
              </div>
            </div>

            {/* Strengths */}
            {analysisResult.strengths.length > 0 && (
              <div className="rounded-lg border bg-green-50/50 dark:bg-green-950/20 p-4">
                <h4 className="text-sm font-medium text-green-700 dark:text-green-400 mb-2">
                  ✓ Strengths
                </h4>
                <ul className="space-y-1">
                  {analysisResult.strengths.map((strength, i) => (
                    <li key={i} className="text-sm text-muted-foreground">
                      • {strength}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Top Improvements - Contextual Suggestions */}
            {analysisResult.topImprovements.length > 0 && (
              <div className="rounded-lg border bg-amber-50/50 dark:bg-amber-950/20 p-4">
                <h4 className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-3">
                  💡 Top Improvements
                </h4>
                <ul className="space-y-4">
                  {analysisResult.topImprovements.map((suggestion, i) => (
                    <li key={suggestion.ruleId} className="space-y-2">
                      <div className="flex items-start gap-2">
                        <span className="text-sm font-medium text-foreground shrink-0">{i + 1}.</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-foreground">{suggestion.ruleName}</span>
                            {suggestion.category && (
                              <Badge variant="outline" className="text-xs">
                                {suggestion.category}
                              </Badge>
                            )}
                          </div>
                          
                          {/* Contextual suggestion with markdown-style bold */}
                          <p 
                            className="text-sm text-muted-foreground mt-1"
                            dangerouslySetInnerHTML={{
                              __html: suggestion.contextualSuggestion
                                .replace(/\*\*(.+?)\*\*/g, '<strong class="text-primary font-semibold">$1</strong>')
                            }}
                          />
                          
                          {/* Example prompt */}
                          {suggestion.examplePrompt && (
                            <p 
                              className="text-xs text-muted-foreground/80 mt-1 italic"
                              dangerouslySetInnerHTML={{
                                __html: `e.g., "${suggestion.examplePrompt
                                  .replace(/\*\*(.+?)\*\*/g, '<strong class="text-primary font-medium">$1</strong>')
                                }"`
                              }}
                            />
                          )}
                          
                          {/* Quick insertions */}
                          {suggestion.quickInsertions.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {suggestion.quickInsertions.slice(0, 4).map((insertion, j) => (
                                <Badge
                                  key={j}
                                  variant="secondary"
                                  className="text-xs cursor-pointer hover:bg-primary/20 transition-colors"
                                  onClick={() => {
                                    // Append the insertion to the current prompt
                                    const cleanInsertion = insertion.replace(/\[.+?\]/g, '___');
                                    setPrompt(prev => `${prev.trim()} ${cleanInsertion}`);
                                  }}
                                >
                                  + {insertion}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Rewrite Section */}
            {analysisResult.score < 90 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">AI-Powered Rewrite</h4>
                  {rewriteResult && (
                    <Badge variant="outline" className="text-green-600 border-green-500/30">
                      <TrendingUp className="mr-1 h-3 w-3" />
                      +{rewriteResult.improvement}%
                    </Badge>
                  )}
                </div>
                
                {!rewriteResult ? (
                  <RewriteButton
                    onRewrite={handleRewrite}
                    isLoading={isRewriting}
                    className="w-full"
                  />
                ) : (
                  <div className="space-y-3">
                    {/* Before/After Score */}
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">
                        Score: <span className="text-red-600">{rewriteResult.scoreBefore}</span>
                        {" → "}
                        <span className="text-green-600 font-medium">{rewriteResult.scoreAfter}</span>
                      </span>
                      {rewriteResult.tokensSaved > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {rewriteResult.tokensSaved} tokens saved
                        </Badge>
                      )}
                    </div>

                    {/* Rewritten Prompt */}
                    <div className="rounded-lg border bg-muted/30 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-muted-foreground">Improved Prompt</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2"
                          onClick={() => handleCopy(rewriteResult.rewrittenPrompt, "improved")}
                        >
                          {copied === "improved" ? (
                            <Check className="h-3.5 w-3.5 text-green-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                      <ScrollArea className="max-h-[200px]">
                        <pre className="text-sm whitespace-pre-wrap font-sans">
                          {rewriteResult.rewrittenPrompt}
                        </pre>
                      </ScrollArea>
                    </div>

                    {/* Meta Info */}
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span>Model: {rewriteResult.modelUsed}</span>
                      <span>•</span>
                      <span>Tokens: {rewriteResult.tokens.input + rewriteResult.tokens.output}</span>
                      {rewriteResult.creditsRemaining !== null && (
                        <>
                          <span>•</span>
                          <span>Credits left: {rewriteResult.creditsRemaining}</span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Detailed Breakdown (collapsible in compact mode) */}
            {!compact && analysisResult.breakdown.length > 0 && (
              <details className="group">
                <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                  View detailed breakdown ({analysisResult.breakdown.length} rules)
                </summary>
                <ScrollArea className="mt-3 max-h-[300px]">
                  <div className="space-y-2">
                    {analysisResult.breakdown.map((rule) => (
                      <div
                        key={rule.ruleId}
                        className={cn(
                          "rounded-md border p-3 text-sm",
                          rule.score === 1 && "border-green-500/30 bg-green-50/30 dark:bg-green-950/10",
                          rule.score === 0.5 && "border-yellow-500/30 bg-yellow-50/30 dark:bg-yellow-950/10",
                          rule.score === 0 && "border-red-500/30 bg-red-50/30 dark:bg-red-950/10"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <span className="font-medium">{rule.ruleName}</span>
                            {rule.category && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                {rule.category}
                              </Badge>
                            )}
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              "shrink-0",
                              rule.score === 1 && "text-green-600 border-green-500/30",
                              rule.score === 0.5 && "text-yellow-600 border-yellow-500/30",
                              rule.score === 0 && "text-red-600 border-red-500/30"
                            )}
                          >
                            {rule.score === 1 ? "Pass" : rule.score === 0.5 ? "Partial" : "Fail"}
                          </Badge>
                        </div>
                        {rule.suggestion && rule.score < 1 && (
                          <p className="mt-1 text-xs text-muted-foreground">{rule.suggestion}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </details>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
