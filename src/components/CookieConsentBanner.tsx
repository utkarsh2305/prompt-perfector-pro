import { useAnalyticsConsent } from "@/contexts/AnalyticsContext";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export function CookieConsentBanner() {
  const { showBanner, grantConsent, denyConsent, dismissBanner } = useAnalyticsConsent();

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium">We use cookies to improve your experience</p>
          <p className="mt-1 text-xs text-muted-foreground">
            We use analytics cookies to understand how you use our product and improve it.
            You can accept or decline these cookies.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="min-h-10"
            onClick={denyConsent}
          >
            Decline
          </Button>
          <Button
            size="sm"
            className="min-h-10"
            onClick={grantConsent}
          >
            Accept Cookies
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            onClick={dismissBanner}
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
