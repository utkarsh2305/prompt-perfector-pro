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
        viewBox="0 0 180 180"
        className={cn("h-10 w-10", className)}
        aria-label="ZeroRetry Index"
      >
        <circle cx="90" cy="90" r="70" fill="none" stroke="#6B3FD9" strokeWidth="16"/>
        <path d="M 90 45 A 45 45 0 0 1 90 135" fill="none" stroke="#6B3FD9" strokeWidth="8" strokeLinecap="round"/>
        <path d="M 70 70 L 70 110 L 105 90 Z" fill="#6B3FD9"/>
        <line x1="35" y1="145" x2="145" y2="35" stroke="#6B3FD9" strokeWidth="16" strokeLinecap="round"/>
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
