// src/lib/middleware/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Initialize Redis and Rate Limiter
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

// Different rate limiters for different endpoints
export const rateLimiters = {
  // Auth endpoints: 5 attempts per hour per IP
  auth: new Ratelimit({
    redis,
    prefix: "ratelimit:auth",
    limiter: Ratelimit.slidingWindow(5, "1 h"),
  }),

  // Login failures: 3 per 15 minutes per email (tracked separately)
  loginFailure: new Ratelimit({
    redis,
    prefix: "ratelimit:login_failure",
    limiter: Ratelimit.slidingWindow(3, "15 m"),
  }),

  // Forgot password: 3 per hour per email
  forgotPassword: new Ratelimit({
    redis,
    prefix: "ratelimit:forgot_password",
    limiter: Ratelimit.slidingWindow(3, "1 h"),
  }),

  // Register: 2 per hour per IP
  register: new Ratelimit({
    redis,
    prefix: "ratelimit:register",
    limiter: Ratelimit.slidingWindow(2, "1 h"),
  }),

  // Verify email: 10 per hour per email
  verifyEmail: new Ratelimit({
    redis,
    prefix: "ratelimit:verify_email",
    limiter: Ratelimit.slidingWindow(10, "1 h"),
  }),

  // General API: 100 per minute per user
  api: new Ratelimit({
    redis,
    prefix: "ratelimit:api",
    limiter: Ratelimit.slidingWindow(100, "1 m"),
  }),
};

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
  limit: number;
}

export const checkRateLimit = async (
  key: string,
  limiter: Ratelimit
): Promise<RateLimitResult> => {
  try {
    const result = await limiter.limit(key);

    return {
      success: result.success,
      remaining: result.remaining,
      resetTime: result.resetAfter,
      limit: result.limit,
    };
  } catch (error) {
    console.error("Rate limit check error:", error);
    // On error, allow the request (fail open) but log it
    return {
      success: true,
      remaining: 1,
      resetTime: 0,
      limit: 0,
    };
  }
};

// Track login failures by email
export const trackLoginFailure = async (email: string): Promise<RateLimitResult> => {
  return checkRateLimit(`login_failure:${email.toLowerCase()}`, rateLimiters.loginFailure);
};

// Track login failures by IP
export const trackLoginFailureByIP = async (ip: string): Promise<RateLimitResult> => {
  return checkRateLimit(`login_failure_ip:${ip}`, rateLimiters.loginFailure);
};

// Reset login failures for user
export const resetLoginFailures = async (email: string): Promise<void> => {
  try {
    await redis.del(`login_failure:${email.toLowerCase()}`);
  } catch (error) {
    console.error("Error resetting login failures:", error);
  }
};

// Get current login failure count
export const getLoginFailureCount = async (email: string): Promise<number> => {
  try {
    // Get the current count from Redis
    const key = `login_failure:${email.toLowerCase()}`;
    const data = await redis.get(key);

    // If data exists and is a number, return it
    if (data && typeof data === "number") {
      return data;
    }

    return 0;
  } catch (error) {
    console.error("Error getting login failure count:", error);
    return 0;
  }
};
