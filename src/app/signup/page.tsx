'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AlertCircle, CheckCircle, Info, Building2 } from 'lucide-react'

interface Organization {
  id: number
  name: string
}

interface InvitationDetails {
  id: number
  email: string
  role: string
  organization: {
    id: number
    name: string
  }
}

interface FieldErrors {
  name?: string
  email?: string
  password?: string
  organizationId?: string
  organizationName?: string
  role?: string
}

export default function SignupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const invitationToken = searchParams.get('token')
  const prefilledEmail = searchParams.get('email')

  const [email, setEmail] = useState(prefilledEmail || '')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<string>('member')
  const [organizationId, setOrganizationId] = useState('')
  const [organizationName, setOrganizationName] = useState('')
  const [createNewOrg, setCreateNewOrg] = useState(false)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [passwordStrength, setPasswordStrength] = useState<{
    hasLength: boolean
    hasLower: boolean
    hasUpper: boolean
    hasNumber: boolean
  }>({
    hasLength: false,
    hasLower: false,
    hasUpper: false,
    hasNumber: false,
  })
  const { signup, user } = useAuth()

  // Redirect if already logged in
  useEffect(() => {
    if (user && !loading) {
      router.push('/project')
    }
  }, [user, loading, router])

  // Fetch invitation details if token provided
  useEffect(() => {
    if (invitationToken) {
      fetchInvitationDetails()
    }
  }, [invitationToken])

  const fetchInvitationDetails = async () => {
    try {
      const response = await fetch(`/api/invitations/token/${invitationToken}`)
      const data = await response.json()

      if (response.ok && data.success) {
        setInvitation(data.data)
        setEmail(data.data.email)
        setRole(data.data.role)
        setOrganizationId(data.data.organization.id.toString())
      } else {
        setError('Invalid or expired invitation')
      }
    } catch (error) {
      console.error('Error fetching invitation:', error)
      setError('Failed to load invitation details')
    }
  }

  // Fetch organizations on mount (unless invitation mode)
  useEffect(() => {
    if (!invitationToken) {
      fetchOrganizations()
    }
  }, [invitationToken])

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/organizations')
      if (response.ok) {
        const result = await response.json()
        // Handle paginated response - data is in result.data
        if (result.success && result.data) {
          setOrganizations(result.data)
        }
      } else {
        console.error('Failed to fetch organizations:', response.status)
      }
    } catch (error) {
      console.error('Error fetching organizations:', error)
    }
  }

  // Validate name
  const validateName = (name: string): boolean => {
    if (!name.trim()) {
      setFieldErrors(prev => ({ ...prev, name: 'Name is required' }))
      return false
    }
    if (name.trim().length < 2) {
      setFieldErrors(prev => ({ ...prev, name: 'Name must be at least 2 characters' }))
      return false
    }
    if (name.length > 100) {
      setFieldErrors(prev => ({ ...prev, name: 'Name must be less than 100 characters' }))
      return false
    }
    setFieldErrors(prev => ({ ...prev, name: undefined }))
    return true
  }

  // Validate email
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

  // Validate password with strength check
  const validatePassword = (password: string): boolean => {
    const strength = {
      hasLength: password.length >= 8,
      hasLower: /[a-z]/.test(password),
      hasUpper: /[A-Z]/.test(password),
      hasNumber: /[0-9]/.test(password),
    }
    setPasswordStrength(strength)

    if (!password) {
      setFieldErrors(prev => ({ ...prev, password: 'Password is required' }))
      return false
    }

    const allValid = Object.values(strength).every(v => v)
    if (!allValid) {
      setFieldErrors(prev => ({ ...prev, password: 'Password does not meet all requirements' }))
      return false
    }

    setFieldErrors(prev => ({ ...prev, password: undefined }))
    return true
  }

  // Validate organization
  const validateOrganization = (orgId: string): boolean => {
    // Skip validation if creating new org or using invitation
    if (createNewOrg || invitation) return true
    
    if (!orgId) {
      setFieldErrors(prev => ({ ...prev, organizationId: 'Organization is required' }))
      return false
    }
    setFieldErrors(prev => ({ ...prev, organizationId: undefined }))
    return true
  }

  // Validate organization name (for new org creation)
  const validateOrganizationName = (name: string): boolean => {
    if (!createNewOrg) return true
    
    if (!name.trim()) {
      setFieldErrors(prev => ({ ...prev, organizationName: 'Organization name is required' }))
      return false
    }
    if (name.trim().length < 2) {
      setFieldErrors(prev => ({ ...prev, organizationName: 'Organization name must be at least 2 characters' }))
      return false
    }
    setFieldErrors(prev => ({ ...prev, organizationName: undefined }))
    return true
  }

  // Validate role
  const validateRole = (selectedRole: string): boolean => {
    // Skip validation if using invitation
    if (invitation) return true
    
    if (!selectedRole) {
      setFieldErrors(prev => ({ ...prev, role: 'Role is required' }))
      return false
    }
    
    // Only admin can create new organization
    if (createNewOrg && selectedRole !== 'admin') {
      setFieldErrors(prev => ({ ...prev, role: 'Only admins can create new organizations' }))
      return false
    }
    
    setFieldErrors(prev => ({ ...prev, role: undefined }))
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})

    // Validate all fields
    const isNameValid = validateName(name)
    const isEmailValid = validateEmail(email)
    const isPasswordValid = validatePassword(password)
    const isRoleValid = validateRole(role)
    const isOrgValid = validateOrganization(organizationId)
    const isOrgNameValid = validateOrganizationName(organizationName)

    if (!isNameValid || !isEmailValid || !isPasswordValid || !isRoleValid || !isOrgValid || !isOrgNameValid) {
      return
    }

    setLoading(true)

    try {
      const signupData: any = {
        email,
        password,
        name,
      }

      // Mode 1: Invitation-based signup
      if (invitationToken) {
        signupData.invitationToken = invitationToken
      }
      // Mode 2: Create new organization (admin only)
      else if (createNewOrg) {
        signupData.createOrganization = true
        signupData.organizationName = organizationName
        signupData.role = 'admin' // Force admin role when creating org
      }
      // Mode 3: Regular signup (join existing org)
      else {
        signupData.organizationId = parseInt(organizationId)
        signupData.role = role
      }

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(signupData),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        // Handle specific error messages
        if (result.error?.includes('already exists')) {
          setFieldErrors({ email: 'This email is already registered' })
          setError(result.error)
        } else if (result.error?.includes('Too many')) {
          setError(result.error)
        } else {
          setError(result.error || 'Signup failed. Please try again.')
        }
      } else {
        // Success - redirect to login
        router.push('/login?message=signup_success')
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      console.error('Signup error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {invitation ? 'Complete Your Registration' : 'Create an account'}
          </CardTitle>
          <CardDescription className="text-center">
            {invitation 
              ? `Join ${invitation.organization.name} as ${invitation.role}`
              : 'Enter your information to get started'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Invitation Info Banner */}
            {invitation && (
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md text-sm">
                <div className="flex items-start gap-2">
                  <Info className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">You've been invited!</p>
                    <p className="text-xs mt-1">
                      Complete the form below to join {invitation.organization.name}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm flex items-start gap-2">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (fieldErrors.name) validateName(e.target.value)
                }}
                onBlur={() => validateName(name)}
                required
                disabled={loading}
                className={fieldErrors.name ? 'border-red-500' : ''}
                aria-invalid={!!fieldErrors.name}
                aria-describedby={fieldErrors.name ? 'name-error' : undefined}
              />
              {fieldErrors.name && (
                <p id="name-error" className="text-sm text-red-600">
                  {fieldErrors.name}
                </p>
              )}
            </div>

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
                disabled={loading || !!invitation}
                className={fieldErrors.email ? 'border-red-500' : ''}
                aria-invalid={!!fieldErrors.email}
                aria-describedby={fieldErrors.email ? 'email-error' : undefined}
              />
              {fieldErrors.email && (
                <p id="email-error" className="text-sm text-red-600">
                  {fieldErrors.email}
                </p>
              )}
              {invitation && (
                <p className="text-xs text-gray-500">
                  Email is pre-filled from your invitation
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
                  validatePassword(e.target.value)
                }}
                required
                disabled={loading}
                className={fieldErrors.password ? 'border-red-500' : ''}
                aria-invalid={!!fieldErrors.password}
                aria-describedby="password-requirements"
              />
              <div id="password-requirements" className="text-xs space-y-1 mt-2">
                <p className="text-gray-600 font-medium">Password must contain:</p>
                <ul className="space-y-1">
                  <li className={`flex items-center gap-1.5 ${passwordStrength.hasLength ? 'text-green-600' : 'text-gray-500'}`}>
                    {passwordStrength.hasLength ? <CheckCircle className="h-3.5 w-3.5" /> : <Info className="h-3.5 w-3.5" />}
                    At least 8 characters
                  </li>
                  <li className={`flex items-center gap-1.5 ${passwordStrength.hasUpper ? 'text-green-600' : 'text-gray-500'}`}>
                    {passwordStrength.hasUpper ? <CheckCircle className="h-3.5 w-3.5" /> : <Info className="h-3.5 w-3.5" />}
                    One uppercase letter
                  </li>
                  <li className={`flex items-center gap-1.5 ${passwordStrength.hasLower ? 'text-green-600' : 'text-gray-500'}`}>
                    {passwordStrength.hasLower ? <CheckCircle className="h-3.5 w-3.5" /> : <Info className="h-3.5 w-3.5" />}
                    One lowercase letter
                  </li>
                  <li className={`flex items-center gap-1.5 ${passwordStrength.hasNumber ? 'text-green-600' : 'text-gray-500'}`}>
                    {passwordStrength.hasNumber ? <CheckCircle className="h-3.5 w-3.5" /> : <Info className="h-3.5 w-3.5" />}
                    One number
                  </li>
                </ul>
              </div>
              {fieldErrors.password && (
                <p className="text-sm text-red-600">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Role Selection - only show if not invitation mode */}
            {!invitation && (
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={role}
                  onValueChange={(value) => {
                    setRole(value)
                    if (fieldErrors.role) validateRole(value)
                    // If user selects a non-admin role, disable create new org
                    if (value !== 'admin' && createNewOrg) {
                      setCreateNewOrg(false)
                      setOrganizationName('')
                    }
                  }}
                  disabled={loading || createNewOrg}
                >
                  <SelectTrigger className={fieldErrors.role ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin - Full system access</SelectItem>
                    <SelectItem value="manager">Project Manager - Manage projects and tasks</SelectItem>
                    <SelectItem value="finance">Finance - Manage financial documents</SelectItem>
                    <SelectItem value="member">Team Member - Execute assigned tasks</SelectItem>
                  </SelectContent>
                </Select>
                {fieldErrors.role && (
                  <p className="text-sm text-red-600">
                    {fieldErrors.role}
                  </p>
                )}
                {createNewOrg && (
                  <p className="text-xs text-blue-600">
                    Role automatically set to Admin when creating a new organization
                  </p>
                )}
                {!createNewOrg && (
                  <p className="text-xs text-gray-500">
                    {role === 'admin' && 'Full access to all features and can create organizations'}
                    {role === 'manager' && 'Can manage projects, tasks, and approve expenses'}
                    {role === 'finance' && 'Can manage financial documents and expenses'}
                    {role === 'member' && 'Can view assigned tasks, log hours, and submit expenses'}
                  </p>
                )}
              </div>
            )}

            {/* Organization Selection - only show if not invitation mode */}
            {!invitation && (
              <>
                {/* Create New Organization Checkbox */}
                <div className="flex items-center space-x-2 p-4 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    id="createNewOrg"
                    checked={createNewOrg}
                    onChange={(e) => {
                      const isChecked = e.target.checked
                      setCreateNewOrg(isChecked)
                      if (isChecked) {
                        setOrganizationId('')
                        setRole('admin') // Force admin role when creating org
                      } else {
                        setOrganizationName('')
                      }
                    }}
                    disabled={loading || role !== 'admin'}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="flex-1">
                    <Label htmlFor="createNewOrg" className="font-medium cursor-pointer flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Create a new organization
                    </Label>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {role === 'admin' 
                        ? "You'll become the admin of this organization" 
                        : "Only admins can create new organizations"}
                    </p>
                  </div>
                </div>

                {/* Conditional: Either Organization Name or Organization Select */}
                {createNewOrg ? (
                  <div className="space-y-2">
                    <Label htmlFor="organizationName">Organization Name</Label>
                    <Input
                      id="organizationName"
                      type="text"
                      placeholder="Acme Corporation"
                      value={organizationName}
                      onChange={(e) => {
                        setOrganizationName(e.target.value)
                        if (fieldErrors.organizationName) validateOrganizationName(e.target.value)
                      }}
                      onBlur={() => validateOrganizationName(organizationName)}
                      required={createNewOrg}
                      disabled={loading}
                      className={fieldErrors.organizationName ? 'border-red-500' : ''}
                      aria-invalid={!!fieldErrors.organizationName}
                      aria-describedby={fieldErrors.organizationName ? 'orgname-error' : undefined}
                    />
                    {fieldErrors.organizationName && (
                      <p id="orgname-error" className="text-sm text-red-600">
                        {fieldErrors.organizationName}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="organization">Organization</Label>
                    <Select
                      value={organizationId}
                      onValueChange={(value) => {
                        setOrganizationId(value)
                        if (fieldErrors.organizationId) validateOrganization(value)
                      }}
                      disabled={loading}
                    >
                      <SelectTrigger className={fieldErrors.organizationId ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select an organization" />
                      </SelectTrigger>
                      <SelectContent>
                        {organizations.map((org) => (
                          <SelectItem key={org.id} value={org.id.toString()}>
                            {org.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldErrors.organizationId && (
                      <p className="text-sm text-red-600">
                        {fieldErrors.organizationId}
                      </p>
                    )}
                  </div>
                )}
              </>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </span>
              ) : (
                'Create account'
              )}
            </Button>

            <div className="text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                Sign in
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
