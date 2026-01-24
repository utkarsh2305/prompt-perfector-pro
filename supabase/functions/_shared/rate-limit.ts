// Rate limiting utilities for edge functions

export interface RateLimitConfig {
  maxRequests: number;
  windowMinutes: number;
}

export interface RateLimitResult {
  allowed: boolean;
  currentCount: number;
  resetAt: string;
}

/**
 * Rate limit configurations for different endpoints
 */
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  "auth": { maxRequests: 5, windowMinutes: 1 },
  "admin": { maxRequests: 20, windowMinutes: 1 },
  "score-prompt": { maxRequests: 30, windowMinutes: 1 },
  "rewrite-prompt": { maxRequests: 10, windowMinutes: 1 },
  "default": { maxRequests: 60, windowMinutes: 1 },
};

/**
 * Get client IP from request headers
 */
export function getClientIP(req: Request): string {
  // Try common headers in order of preference
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    // Take the first IP if there are multiple
    return forwarded.split(",")[0].trim();
  }
  
  const realIP = req.headers.get("x-real-ip");
  if (realIP) {
    return realIP.trim();
  }
  
  // Fallback to a hash of user-agent + other headers as identifier
  const userAgent = req.headers.get("user-agent") ?? "unknown";
  return `anonymous-${hashString(userAgent).toString(16)}`;
}

/**
 * Simple string hash function
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Check rate limit for a request using the database function
 * @param identifier - User ID for authenticated requests, IP for anonymous
 * @param endpoint - The endpoint being accessed
 * @param serviceClient - Supabase client with service role
 * @returns Rate limit result
 */
export async function checkRateLimit(
  identifier: string,
  endpoint: string,
  // deno-lint-ignore no-explicit-any
  serviceClient: any
): Promise<RateLimitResult> {
  const config = RATE_LIMITS[endpoint] ?? RATE_LIMITS["default"];
  
  try {
    // Use raw SQL query to avoid TypeScript type issues with the new RPC function
    const { data, error } = await serviceClient.rpc("check_rate_limit", {
      p_identifier: identifier,
      p_endpoint: endpoint,
      p_max_requests: config.maxRequests,
      p_window_minutes: config.windowMinutes,
    });
    
    if (error) {
      // If rate limit check fails, default to allowing the request
      // but log the error for monitoring
      console.error("Rate limit check failed:", error.message);
      return {
        allowed: true,
        currentCount: 0,
        resetAt: new Date(Date.now() + config.windowMinutes * 60000).toISOString(),
      };
    }
    
    // The RPC returns an array with a single row
    const result = Array.isArray(data) ? data[0] : data;
    return {
      allowed: result?.allowed ?? true,
      currentCount: result?.current_count ?? 0,
      resetAt: result?.reset_at ?? new Date().toISOString(),
    };
  } catch (err) {
    console.error("Rate limit error:", err);
    return {
      allowed: true,
      currentCount: 0,
      resetAt: new Date(Date.now() + config.windowMinutes * 60000).toISOString(),
    };
  }
}

/**
 * Create a rate limit exceeded response
 */
export function rateLimitResponse(result: RateLimitResult, corsHeaders: Record<string, string>): Response {
  const config = RATE_LIMITS["default"];
  return new Response(
    JSON.stringify({
      success: false,
      error: "Rate limit exceeded",
      message: `Too many requests. Please try again after ${new Date(result.resetAt).toLocaleTimeString()}`,
      retry_after: result.resetAt,
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "X-RateLimit-Limit": String(config.maxRequests),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": result.resetAt,
        "Retry-After": String(Math.ceil((new Date(result.resetAt).getTime() - Date.now()) / 1000)),
      },
    }
  );
}
