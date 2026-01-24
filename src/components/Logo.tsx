import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showText?: boolean;
  iconOnly?: boolean;
}

export function Logo({ className = "", showText = true, iconOnly = false }: LogoProps) {
  if (iconOnly) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 48 48"
        className={cn("h-10 w-10", className)}
        aria-label="ZeroRetry"
      >
        <defs>
          <linearGradient id="brandGradientIcon" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: "#4F46E5" }} />
            <stop offset="100%" style={{ stopColor: "#7C3AED" }} />
          </linearGradient>
        </defs>
        <circle cx="24" cy="24" r="22" fill="white" />
        <circle cx="24" cy="24" r="14" fill="none" stroke="url(#brandGradientIcon)" strokeWidth="3" />
        <path d="M24 12 A10 10 0 1 1 14 24" fill="none" stroke="url(#brandGradientIcon)" strokeWidth="2.5" strokeLinecap="round" />
        <polygon points="14,18 14,26 20,22" fill="url(#brandGradientIcon)" />
        <line x1="10" y1="38" x2="38" y2="10" stroke="url(#brandGradientIcon)" strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 48 48"
        className="h-10 w-10"
        aria-label="ZeroRetry logo"
      >
        <defs>
          <linearGradient id="brandGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: "#4F46E5" }} />
            <stop offset="100%" style={{ stopColor: "#7C3AED" }} />
          </linearGradient>
        </defs>
        <circle cx="24" cy="24" r="22" fill="white" />
        <circle cx="24" cy="24" r="14" fill="none" stroke="url(#brandGradient)" strokeWidth="3" />
        <path d="M24 12 A10 10 0 1 1 14 24" fill="none" stroke="url(#brandGradient)" strokeWidth="2.5" strokeLinecap="round" />
        <polygon points="14,18 14,26 20,22" fill="url(#brandGradient)" />
        <line x1="10" y1="38" x2="38" y2="10" stroke="url(#brandGradient)" strokeWidth="3" strokeLinecap="round" />
      </svg>
      {showText && (
        <span className="font-heading text-xl">
          <span className="font-normal">Zero</span>
          <span className="font-bold">Retry</span>
        </span>
      )}
    </div>
  );
}
