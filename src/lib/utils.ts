import { Bindings } from '../types'

// Hash password using Web Crypto API (Cloudflare compatible)
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password)
  return passwordHash === hash
}

// Generate session token
export function generateToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

// Calculate trial end date
export function calculateTrialEnd(days: number = 3): string {
  const now = new Date()
  now.setDate(now.getDate() + days)
  return now.toISOString()
}

// Check if trial is active
export function isTrialActive(trialEndsAt?: string): boolean {
  if (!trialEndsAt) return false
  return new Date(trialEndsAt) > new Date()
}

// Format date for display
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Get API setting from database
export async function getAPISetting(db: D1Database, key: string): Promise<string | null> {
  const result = await db.prepare(
    'SELECT setting_value FROM api_settings WHERE setting_key = ? AND is_enabled = 1'
  ).bind(key).first()
  
  return result ? (result.setting_value as string) : null
}

// Check if WhatsApp is enabled
export async function isWhatsAppEnabled(db: D1Database): Promise<boolean> {
  const value = await getAPISetting(db, 'whatsapp_enabled')
  return value === 'true'
}

// Simple JWT-like token creation (for session management)
export function createSessionToken(userId: number): string {
  const payload = {
    userId,
    exp: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
  }
  return btoa(JSON.stringify(payload))
}

// Verify and decode session token
export function verifySessionToken(token: string): { userId: number } | null {
  try {
    const payload = JSON.parse(atob(token))
    if (payload.exp && payload.exp < Date.now()) {
      return null // Token expired
    }
    return { userId: payload.userId }
  } catch {
    return null
  }
}

// Get cookie value
export function getCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null
  const cookies = cookieHeader.split(';').map(c => c.trim())
  for (const cookie of cookies) {
    const [key, value] = cookie.split('=')
    if (key === name) return value
  }
  return null
}

// Temperature conversion
export function convertTemp(temp: number, unit: 'C' | 'F'): number {
  if (unit === 'F') {
    return Math.round((temp * 9/5) + 32)
  }
  return Math.round(temp)
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Sanitize input
export function sanitize(input: string): string {
  return input.trim().replace(/[<>]/g, '')
}
