import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAnalytics } from "@/hooks/useAnalytics";
import { ExternalLink, Loader2 } from "lucide-react";

const UNINSTALL_REASONS = [
  { value: "not_useful", label: "Not useful for my workflow" },
  { value: "too_distracting", label: "Too distracting / annoying" },
  { value: "inaccurate_scores", label: "Scores weren't accurate" },
  { value: "pricing", label: "Too expensive / pricing issues" },
  { value: "better_alternative", label: "Found a better alternative" },
  { value: "performance", label: "Performance issues / slowed down browser" },
  { value: "privacy", label: "Privacy concerns" },
  { value: "temporary", label: "Just testing / temporary removal" },
  { value: "other", label: "Other" },
] as const;

const CHROME_STORE_URL = "https://chrome.google.com/webstore/detail/zeroretry";

export default function UninstallFeedback() {
  const [searchParams] = useSearchParams();
  const { track } = useAnalytics();
  
  const userId = searchParams.get("user_id");
  const tier = searchParams.get("tier");
  const daysUsed = searchParams.get("days_used");
  
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [additionalComments, setAdditionalComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedReason) {
      setError("Please select a reason");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Detect browser
      const browser = detectBrowser();
      
      const { error: insertError } = await supabase
        .from("uninstall_feedback")
        .insert({
          user_id: userId && userId !== "test" ? userId : null,
          reason: selectedReason,
          additional_comments: additionalComments.trim() || null,
          user_tier: tier || null,
          days_used: daysUsed ? parseInt(daysUsed, 10) : null,
          browser,
        });
      
      if (insertError) throw insertError;
      
      // Track in analytics
      track("extension_uninstalled", {
        reason: selectedReason,
        has_comments: !!additionalComments.trim(),
        user_tier: tier,
        days_used: daysUsed ? parseInt(daysUsed, 10) : undefined,
      });
      
      setIsSubmitted(true);
    } catch (err) {
      console.error("Failed to submit feedback:", err);
      setError("Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return <ThankYouState />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-8">
        {/* Logo - slightly faded */}
        <div className="flex justify-center opacity-70">
          <Logo className="h-8" />
        </div>
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-heading font-semibold text-foreground">
            We're sorry to see you go! 😢
          </h1>
          <p className="text-muted-foreground">
            Your feedback helps us improve ZeroRetry
          </p>
        </div>
        
        {/* Feedback Form */}
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <Label className="text-base font-medium">
                  Why did you uninstall ZeroRetry?
                </Label>
                
                <RadioGroup
                  value={selectedReason}
                  onValueChange={(value) => {
                    setSelectedReason(value);
                    setError(null);
                  }}
                  className="space-y-3"
                >
                  {UNINSTALL_REASONS.map((reason) => (
                    <div key={reason.value} className="flex items-center space-x-3">
                      <RadioGroupItem
                        value={reason.value}
                        id={reason.value}
                        className="border-border"
                      />
                      <Label
                        htmlFor={reason.value}
                        className="font-normal cursor-pointer text-foreground/90"
                      >
                        {reason.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="comments" className="text-sm text-muted-foreground">
                  Additional comments (optional)
                </Label>
                <Textarea
                  id="comments"
                  placeholder="Tell us more about your experience..."
                  value={additionalComments}
                  onChange={(e) => setAdditionalComments(e.target.value)}
                  className="min-h-[100px] resize-none"
                />
              </div>
              
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Feedback"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        {/* Reinstall CTA */}
        <ReinstallSection />
      </div>
    </div>
  );
}

function ThankYouState() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-8 text-center">
        {/* Logo */}
        <div className="flex justify-center">
          <Logo className="h-8" />
        </div>
        
        {/* Thank you message */}
        <div className="space-y-3">
          <h1 className="text-2xl font-heading font-semibold text-foreground">
            Thank you for your feedback! 🙏
          </h1>
          <p className="text-muted-foreground">
            We're constantly improving ZeroRetry based on feedback like yours.
          </p>
        </div>
        
        {/* Reinstall CTA */}
        <ReinstallSection />
      </div>
    </div>
  );
}

function ReinstallSection() {
  return (
    <div className="pt-4 border-t border-border/50 text-center space-y-3">
      <p className="text-sm text-muted-foreground">Changed your mind?</p>
      <Button
        variant="outline"
        asChild
        className="gap-2"
      >
        <a href={CHROME_STORE_URL} target="_blank" rel="noopener noreferrer">
          Reinstall ZeroRetry
          <ExternalLink className="h-4 w-4" />
        </a>
      </Button>
    </div>
  );
}

function detectBrowser(): string {
  const userAgent = navigator.userAgent;
  
  if (userAgent.includes("Chrome") && !userAgent.includes("Edg")) {
    return "chrome";
  } else if (userAgent.includes("Firefox")) {
    return "firefox";
  } else if (userAgent.includes("Edg")) {
    return "edge";
  } else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) {
    return "safari";
  } else if (userAgent.includes("Opera") || userAgent.includes("OPR")) {
    return "opera";
  }
  
  return "unknown";
}
