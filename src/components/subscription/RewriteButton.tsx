import { Sparkles, Lock, Loader2 } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useCheckRewriteCredits } from "@/hooks/use-subscription";
import { cn } from "@/lib/utils";

interface RewriteButtonProps extends Omit<ButtonProps, "onClick"> {
  onRewrite: () => void;
  isLoading?: boolean;
}

export function RewriteButton({ 
  onRewrite, 
  isLoading = false, 
  className,
  ...props 
}: RewriteButtonProps) {
  const { user } = useAuth();
  const { data: creditStatus, isLoading: isCheckingCredits } = useCheckRewriteCredits(user?.id);

  const canRewrite = creditStatus?.can_rewrite ?? false;
  const isUnlimited = creditStatus?.is_unlimited ?? false;
  const creditsRemaining = creditStatus?.credits_remaining ?? 0;

  const isDisabled = isLoading || isCheckingCredits || (!canRewrite && !isUnlimited);

  const getButtonContent = () => {
    if (isLoading) {
      return (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Rewriting...
        </>
      );
    }

    if (isCheckingCredits) {
      return (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Checking...
        </>
      );
    }

    if (!canRewrite && !isUnlimited) {
      return (
        <>
          <Lock className="mr-2 h-4 w-4" />
          Upgrade to rewrite
        </>
      );
    }

    if (isUnlimited) {
      return (
        <>
          <Sparkles className="mr-2 h-4 w-4" />
          Rewrite with AI ✨
        </>
      );
    }

    return (
      <>
        <Sparkles className="mr-2 h-4 w-4" />
        Rewrite with AI ✨ ({creditsRemaining} left)
      </>
    );
  };

  return (
    <Button
      variant="hero"
      size="xl"
      disabled={isDisabled}
      onClick={canRewrite || isUnlimited ? onRewrite : undefined}
      className={cn("min-w-[200px]", className)}
      {...props}
    >
      {getButtonContent()}
    </Button>
  );
}
