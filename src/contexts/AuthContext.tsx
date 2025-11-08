'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { SessionUser } from '@/types/auth'

interface AuthContextType {
  user: SessionUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signup: (email: string, password: string, name: string, organizationId: number) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  refetchUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Fetch current user on mount
  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setUser(data.user)
        } else {
          setUser(null)
        }
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Error fetching user:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include', // Ensure cookies are sent
      })

      const data = await response.json()

      if (data.success) {
        setUser(data.user)
        
        // Check for redirect parameter in URL
        const urlParams = new URLSearchParams(window.location.search)
        const redirectPath = urlParams.get('redirect')
        
        // Redirect to specified path or default based on role
        if (redirectPath && redirectPath.startsWith('/')) {
          router.push(redirectPath)
        } else {
          const homeUrl = getHomeUrl(data.user.role)
          router.push(homeUrl)
        }
        
        return { success: true }
      } else {
        return { success: false, error: data.error || 'Login failed' }
      }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'An error occurred during login' }
    }
  }

  const signup = async (email: string, password: string, name: string, organizationId: number) => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, organizationId }),
        credentials: 'include', // Ensure cookies are sent
      })

      const data = await response.json()

      if (data.success) {
        // Don't auto-login after signup, redirect to login with success message
        return { success: true }
      } else {
        return { success: false, error: data.error || 'Signup failed' }
      }
    } catch (error) {
      console.error('Signup error:', error)
      return { success: false, error: 'An error occurred during signup' }
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include', // Ensure cookies are sent
      })
      setUser(null)
      router.push('/login?message=logged_out')
    } catch (error) {
      console.error('Logout error:', error)
      // Still redirect even if logout API fails
      setUser(null)
      router.push('/login')
    }
  }

  const refetchUser = async () => {
    await fetchUser()
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refetchUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

/**
 * Get the default home URL based on user role
 * - Admin: Admin dashboard with full overview
 * - Manager: Projects page to manage their projects
 * - Finance: Finance dashboard for SO/PO/Invoices/Bills
 * - Member: Tasks page to see assigned tasks
 */
function getHomeUrl(role: string): string {
  switch (role) {
    case 'admin':
      return '/dashboard/admin'
    case 'manager':
      return '/dashboard/manager'
    case 'finance':
      return '/dashboard/finance'
    case 'member':
      return '/dashboard/member'
    default:
      return '/login'
  }
}
