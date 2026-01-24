import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RuleBreakdown {
  ruleId: string;
  ruleName: string;
  category: string | null;
  weight: number;
  score: number;
  suggestion: string | null;
}

interface AnalysisResult {
  score: number;
  grade: string;
  gradeLabel: string;
  breakdown: RuleBreakdown[];
  passed: string[];
  partial: string[];
  failed: string[];
  topImprovements: string[];
  strengths: string[];
}

interface RewriteResult {
  rewrittenPrompt: string;
  modelUsed: string;
  scoreBefore: number;
  scoreAfter: number;
  improvement: number;
  creditsRemaining: number | null;
  tokens: { input: number; output: number };
  costCents: number;
  tokensSaved: number;
  moneySavedCents: number;
  retriesAvoided: number;
}

export function useAnalyzePrompt() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRewriting, setIsRewriting] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [rewriteResult, setRewriteResult] = useState<RewriteResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzePrompt = async (prompt: string): Promise<AnalysisResult | null> => {
    if (!prompt.trim() || prompt.length < 10) {
      setError('Prompt too short to analyze (minimum 10 characters)');
      return null;
    }

    if (prompt.length > 10000) {
      setError('Prompt too long (maximum 10,000 characters)');
      return null;
    }
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('score-prompt', {
        body: { prompt }
      });
      
      if (fnError) throw fnError;
      if (data.error) throw new Error(data.error);
      
      setAnalysisResult(data);
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to analyze prompt';
      setError(message);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const rewritePrompt = async (
    prompt: string, 
    scoreResult: AnalysisResult
  ): Promise<RewriteResult | null> => {
    setIsRewriting(true);
    setError(null);
    
    try {
      // Build failed rules from breakdown
      const failedRules = scoreResult.breakdown
        .filter(b => b.score < 1 && b.suggestion)
        .map(b => ({
          ruleName: b.ruleName,
          suggestion: b.suggestion
        }));

      const { data, error: fnError } = await supabase.functions.invoke('rewrite-prompt', {
        body: { 
          prompt, 
          scoreResult: {
            score: scoreResult.score,
            grade: scoreResult.grade,
            breakdown: scoreResult.breakdown,
            failed: scoreResult.failed
          },
          failedRules
        }
      });
      
      if (fnError) throw fnError;
      
      // Handle specific error codes
      if (data.error) {
        if (data.code === 'NO_CREDITS') {
          setError('No rewrite credits remaining. Please upgrade to continue.');
          return null;
        }
        if (data.code === 'RATE_LIMITED') {
          setError('Too many requests. Please wait a moment and try again.');
          return null;
        }
        throw new Error(data.error);
      }
      
      setRewriteResult(data);
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to rewrite prompt';
      setError(message);
      return null;
    } finally {
      setIsRewriting(false);
    }
  };

  const reset = () => {
    setAnalysisResult(null);
    setRewriteResult(null);
    setError(null);
  };

  return {
    analyzePrompt,
    rewritePrompt,
    reset,
    isAnalyzing,
    isRewriting,
    analysisResult,
    rewriteResult,
    error
  };
}
