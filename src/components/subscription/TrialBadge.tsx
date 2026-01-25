import { Badge } from "@/components/ui/badge";
import { Sparkles, Clock } from "lucide-react";
import { useTrialStatus } from "@/hooks/use-trial";
import { useAuth } from "@/hooks/useAuth";

export function TrialBadge() {
  const { user } = useAuth();
  const { data: trialStatus, isLoading } = useTrialStatus(user?.id);

  if (isLoading || !trialStatus?.is_trial) {
    return null;
  }

  const daysRemaining = trialStatus.days_remaining ?? 0;
  const isExpiringSoon = daysRemaining <= 2;

  return (
    <Badge
      variant={isExpiringSoon ? "destructive" : "secondary"}
      className="gap-1.5"
    >
      {isExpiringSoon ? (
        <Clock className="h-3 w-3" />
      ) : (
        <Sparkles className="h-3 w-3" />
      )}
      {daysRemaining === 0 
        ? "Trial ending today" 
        : daysRemaining === 1 
          ? "1 day left" 
          : `${daysRemaining} days left`}
    </Badge>
  );
}
