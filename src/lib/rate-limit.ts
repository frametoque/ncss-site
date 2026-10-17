import { headers } from "next/headers";

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

class MemoryRateLimiter {
  private store = new Map<string, RateLimitRecord>();
  private windowMs: number;
  private maxRequests: number;

  constructor(options: { windowMs: number; maxRequests: number }) {
    this.windowMs = options.windowMs;
    this.maxRequests = options.maxRequests;

    // Periodically clean expired entries every 5 minutes to prevent memory leaks
    if (typeof setInterval !== "undefined") {
      setInterval(() => this.cleanup(), 5 * 60 * 1000).unref?.();
    }
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, record] of this.store.entries()) {
      if (record.resetAt <= now) {
        this.store.delete(key);
      }
    }
  }

  public check(identifier: string): { success: boolean; limit: number; remaining: number; resetAt: number } {
    const now = Date.now();
    const record = this.store.get(identifier);

    if (!record || record.resetAt <= now) {
      const resetAt = now + this.windowMs;
      this.store.set(identifier, { count: 1, resetAt });
      return {
        success: true,
        limit: this.maxRequests,
        remaining: this.maxRequests - 1,
        resetAt,
      };
    }

    if (record.count >= this.maxRequests) {
      return {
        success: false,
        limit: this.maxRequests,
        remaining: 0,
        resetAt: record.resetAt,
      };
    }

    record.count += 1;
    return {
      success: true,
      limit: this.maxRequests,
      remaining: this.maxRequests - record.count,
      resetAt: record.resetAt,
    };
  }
}

/**
 * Extracts client IP address from request or headers safely.
 */
export async function getClientIp(req?: Request): Promise<string> {
  if (req) {
    const cfIp = req.headers.get("cf-connecting-ip");
    if (cfIp) return cfIp.trim();
    const forwardedFor = req.headers.get("x-forwarded-for");
    if (forwardedFor) {
      const firstIp = forwardedFor.split(",")[0].trim();
      if (firstIp) return firstIp;
    }
    const realIp = req.headers.get("x-real-ip");
    if (realIp) return realIp.trim();
  }
  try {
    const headerList = await headers();
    const cfIp = headerList.get("cf-connecting-ip");
    if (cfIp) return cfIp.trim();
    const forwardedFor = headerList.get("x-forwarded-for");
    if (forwardedFor) {
      const firstIp = forwardedFor.split(",")[0].trim();
      if (firstIp) return firstIp;
    }
    const realIp = headerList.get("x-real-ip");
    if (realIp) return realIp.trim();
  } catch {
    // In environments where headers() is not available
  }
  return "127.0.0.1";
}

// 1. Auth rate limiter: 5 attempts per 15 minutes per IP
export const authRateLimiter = new MemoryRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 5,
});

// 2. Form submission rate limiter: 15 submissions per 10 minutes per IP
export const formSubmitRateLimiter = new MemoryRateLimiter({
  windowMs: 10 * 60 * 1000,
  maxRequests: 15,
});

// 3. File upload rate limiter: 30 uploads per minute per IP
export const uploadRateLimiter = new MemoryRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 30,
});

// 4. Quiz submission rate limiter: 10 submissions per minute per IP
export const quizSubmitRateLimiter = new MemoryRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 10,
});
