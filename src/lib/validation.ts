/**
 * Validation utilities
 */

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

export function validateCurrency(currency: string): boolean {
  // ISO 4217 currency codes are 3 letters
  return /^[A-Z]{3}$/.test(currency)
}

export function validateTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone })
    return true
  } catch (error) {
    return false
  }
}

export function validatePositiveNumber(value: number): boolean {
  return typeof value === 'number' && value >= 0 && !isNaN(value)
}

export function validateDateRange(startDate: Date, endDate: Date): boolean {
  return startDate <= endDate
}
