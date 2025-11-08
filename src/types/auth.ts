/**
 * Authentication and Authorization Types
 */

export type UserRole = 'admin' | 'manager' | 'member' | 'finance'

export interface SessionUser {
  id: number
  email: string
  name: string | null
  role: UserRole
  organizationId: number
  organizationName?: string
}

export interface SessionData {
  user?: SessionUser
  isLoggedIn: boolean
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface SignupData {
  email: string
  password: string
  name: string
  organizationId?: number
  role?: UserRole
  invitationToken?: string
  createOrganization?: boolean
  organizationName?: string
}
