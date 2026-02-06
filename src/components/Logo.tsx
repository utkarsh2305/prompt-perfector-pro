import { cn } from "@/lib/utils";
import logoSvg from "@/assets/zeroretry-index-logo.svg";

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
        viewBox="0 0 188 188"
        className={cn("h-10 w-10", className)}
        aria-label="ZeroRetry Index"
      >
        <circle cx="94" cy="94" r="70" fill="#5b3fd9" stroke="#5b3fd9" strokeWidth="4"/>
        <path d="M75 65 L75 123 L115 94 Z" fill="white"/>
        <line x1="45" y1="143" x2="143" y2="45" stroke="white" strokeWidth="8" strokeLinecap="round"/>
      </svg>
    );
  }

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <img 
        src={logoSvg} 
        alt="ZeroRetry Index logo" 
        className="h-12 w-auto"
      />
    </div>
  );
}
