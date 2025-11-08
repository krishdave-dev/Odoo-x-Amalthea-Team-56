/**
 * Rate Limiting Implementation
 * Simple in-memory rate limiter for authentication endpoints
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up old entries every hour
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
}, 60 * 60 * 1000) // 1 hour

export interface RateLimitConfig {
  maxAttempts: number
  windowMs: number
}

/**
 * Check if request is rate limited
 * Returns true if rate limit exceeded
 */
export function isRateLimited(
  identifier: string,
  config: RateLimitConfig = { maxAttempts: 5, windowMs: 15 * 60 * 1000 } // 5 attempts per 15 minutes
): boolean {
  const now = Date.now()
  const entry = rateLimitStore.get(identifier)

  if (!entry || entry.resetTime < now) {
    // No entry or expired, create new one
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + config.windowMs,
    })
    return false
  }

  if (entry.count >= config.maxAttempts) {
    return true
  }

  entry.count++
  return false
}

/**
 * Reset rate limit for identifier (e.g., after successful login)
 */
export function resetRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier)
}

/**
 * Get remaining attempts
 */
export function getRemainingAttempts(
  identifier: string,
  maxAttempts: number = 5
): number {
  const entry = rateLimitStore.get(identifier)
  if (!entry || entry.resetTime < Date.now()) {
    return maxAttempts
  }
  return Math.max(0, maxAttempts - entry.count)
}

/**
 * Get time until reset (in milliseconds)
 */
export function getTimeUntilReset(identifier: string): number {
  const entry = rateLimitStore.get(identifier)
  if (!entry || entry.resetTime < Date.now()) {
    return 0
  }
  return entry.resetTime - Date.now()
}
