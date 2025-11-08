'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, CheckCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})
  const { login, user } = useAuth()

  // Check for redirect or success messages
  useEffect(() => {
    const redirect = searchParams.get('redirect')
    const message = searchParams.get('message')
    
    if (message === 'signup_success') {
      setSuccessMessage('Account created successfully! Please log in.')
    } else if (message === 'logged_out') {
      setSuccessMessage('You have been logged out successfully.')
    } else if (message === 'session_expired') {
      setError('Your session has expired. Please log in again.')
    } else if (redirect) {
      setSuccessMessage('Please log in to continue.')
    }
  }, [searchParams])

  // Redirect if already logged in
  useEffect(() => {
    if (user && !loading) {
      const redirect = searchParams.get('redirect')
      if (redirect && redirect.startsWith('/')) {
        router.push(redirect)
      }
    }
  }, [user, loading, router, searchParams])

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email) {
      setFieldErrors(prev => ({ ...prev, email: 'Email is required' }))
      return false
    }
    if (!emailRegex.test(email)) {
      setFieldErrors(prev => ({ ...prev, email: 'Invalid email format' }))
      return false
    }
    setFieldErrors(prev => ({ ...prev, email: undefined }))
    return true
  }

  const validatePassword = (password: string): boolean => {
    if (!password) {
      setFieldErrors(prev => ({ ...prev, password: 'Password is required' }))
      return false
    }
    if (password.length < 6) {
      setFieldErrors(prev => ({ ...prev, password: 'Password must be at least 6 characters' }))
      return false
    }
    setFieldErrors(prev => ({ ...prev, password: undefined }))
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')
    setFieldErrors({})

    // Validate fields
    const isEmailValid = validateEmail(email)
    const isPasswordValid = validatePassword(password)

    if (!isEmailValid || !isPasswordValid) {
      return
    }

    setLoading(true)

    try {
      const result = await login(email, password)
      if (!result.success) {
        setError(result.error || 'Login failed. Please check your credentials.')
        
        // Check for rate limit error
        if (result.error?.includes('Too many')) {
          setError(result.error)
        }
      } else {
        // Success - redirect handled by AuthContext
        setSuccessMessage('Login successful! Redirecting...')
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      console.error('Login error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Welcome back</CardTitle>
          <CardDescription className="text-center">
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm flex items-start gap-2">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {successMessage && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm flex items-start gap-2">
                <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (fieldErrors.email) validateEmail(e.target.value)
                }}
                onBlur={() => validateEmail(email)}
                required
                disabled={loading}
                className={fieldErrors.email ? 'border-red-500' : ''}
                aria-invalid={!!fieldErrors.email}
                aria-describedby={fieldErrors.email ? 'email-error' : undefined}
              />
              {fieldErrors.email && (
                <p id="email-error" className="text-sm text-red-600">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (fieldErrors.password) validatePassword(e.target.value)
                }}
                onBlur={() => validatePassword(password)}
                required
                disabled={loading}
                className={fieldErrors.password ? 'border-red-500' : ''}
                aria-invalid={!!fieldErrors.password}
                aria-describedby={fieldErrors.password ? 'password-error' : undefined}
              />
              {fieldErrors.password && (
                <p id="password-error" className="text-sm text-red-600">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </Button>

            <div className="text-center text-sm text-gray-600">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-blue-600 hover:text-blue-700 font-medium">
                Sign up
              </Link>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">Demo Accounts:</p>
              <div className="mt-2 space-y-1 text-xs text-gray-600">
                <p><strong>Admin:</strong> admin@demo.com / admin123</p>
                <p><strong>Manager:</strong> manager@demo.com / manager123</p>
                <p><strong>Member:</strong> dev@demo.com / dev123</p>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
