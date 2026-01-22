import { createContext, useContext, useEffect, useState } from "react";
import {
  initAnalytics,
  getAnalyticsConsent,
  setAnalyticsConsent,
} from "@/lib/analytics";

interface AnalyticsContextValue {
  consentStatus: "granted" | "denied" | null;
  grantConsent: () => void;
  denyConsent: () => void;
  showBanner: boolean;
  dismissBanner: () => void;
}

const AnalyticsContext = createContext<AnalyticsContextValue | undefined>(undefined);

export function useAnalyticsConsent() {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error("useAnalyticsConsent must be used within AnalyticsProvider");
  }
  return context;
}

interface Props {
  children: React.ReactNode;
}

export function AnalyticsProvider({ children }: Props) {
  const [consentStatus, setConsentStatus] = useState<"granted" | "denied" | null>(
    () => getAnalyticsConsent()
  );
  const [showBanner, setShowBanner] = useState(false);

  // Initialize analytics on mount
  useEffect(() => {
    initAnalytics();

    // Show banner if no consent decision has been made
    if (getAnalyticsConsent() === null) {
      // Delay showing banner for better UX
      const timer = setTimeout(() => setShowBanner(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const grantConsent = () => {
    setAnalyticsConsent(true);
    setConsentStatus("granted");
    setShowBanner(false);
  };

  const denyConsent = () => {
    setAnalyticsConsent(false);
    setConsentStatus("denied");
    setShowBanner(false);
  };

  const dismissBanner = () => {
    setShowBanner(false);
  };

  return (
    <AnalyticsContext.Provider
      value={{
        consentStatus,
        grantConsent,
        denyConsent,
        showBanner,
        dismissBanner,
      }}
    >
      {children}
    </AnalyticsContext.Provider>
  );
}
