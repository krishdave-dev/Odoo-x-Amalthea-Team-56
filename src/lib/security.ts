import { NextRequest } from 'next/server'

/**
 * Security utilities for authentication
 */

/**
 * Get client IP address from request
 * Handles various proxy headers
 */
export function getClientIp(request: NextRequest): string {
  // Try x-forwarded-for first (common with proxies/load balancers)
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  // Try x-real-ip
  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // Fallback to unknown
  return 'unknown'
}

/**
 * Sanitize email input
 */
export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim()
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  // Check for common weak passwords
  const commonPasswords = ['password', '12345678', 'qwerty', 'admin123']
  if (commonPasswords.some(weak => password.toLowerCase().includes(weak))) {
    errors.push('Password is too common or weak')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Generate a secure random token
 */
export function generateSecureToken(length: number = 32): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  
  // Use crypto.getRandomValues for secure randomness
  const randomValues = new Uint8Array(length)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(randomValues)
    for (let i = 0; i < length; i++) {
      token += characters[randomValues[i] % characters.length]
    }
  } else {
    // Fallback for Node.js
    const nodeCrypto = require('crypto')
    const bytes = nodeCrypto.randomBytes(length)
    for (let i = 0; i < length; i++) {
      token += characters[bytes[i] % characters.length]
    }
  }
  
  return token
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }

  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }

  return result === 0
}

/**
 * Check if user agent looks suspicious
 */
export function isSuspiciousUserAgent(userAgent: string | null): boolean {
  if (!userAgent) return true

  const suspicious = [
    'bot',
    'crawler',
    'spider',
    'scraper',
    'curl',
    'wget',
    'python',
  ]

  const lowerUA = userAgent.toLowerCase()
  return suspicious.some(pattern => lowerUA.includes(pattern))
}

/**
 * Detect account enumeration attempts
 * Returns delay in milliseconds to slow down attackers
 */
export function getAntiEnumerationDelay(failedAttempts: number): number {
  // Progressive delay: 0ms, 100ms, 500ms, 1s, 2s, 3s...
  if (failedAttempts === 0) return 0
  if (failedAttempts === 1) return 100
  if (failedAttempts === 2) return 500
  return Math.min(failedAttempts * 1000, 5000) // Cap at 5 seconds
}

/**
 * Sleep for specified milliseconds (for rate limiting)
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
